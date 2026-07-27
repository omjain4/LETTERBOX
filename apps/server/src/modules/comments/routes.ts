// @ts-nocheck
import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// GET /api/comments/media/:mediaId — List comments for a media item
router.get("/media/:mediaId", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { mediaId } = req.params;
        const page = parseInt(req.query.page as string || "1", 10);
        const limit = Math.min(parseInt(req.query.limit as string || "20", 10), 50);
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: { mediaId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                    votes: req.userId
                        ? { where: { userId: req.userId }, select: { voteType: true } }
                        : false,
                },
            }),
            prisma.comment.count({ where: { mediaId } }),
        ]);

        // Flatten the user's vote into a simple field
        const data = comments.map((c: any) => ({
            ...c,
            userVote: c.votes?.[0]?.voteType || null,
            votes: undefined,
        }));

        res.json({
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error("Failed to fetch comments:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

// POST /api/comments/media/:mediaId — Post a comment on a media item
router.post("/media/:mediaId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { mediaId } = req.params;
        const { body } = req.body;

        if (!body || !body.trim()) {
            res.status(400).json({ error: "Comment body is required" });
            return;
        }

        // Verify media exists
        const media = await prisma.media.findUnique({ where: { id: mediaId } });
        if (!media) {
            res.status(404).json({ error: "Media not found" });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                userId: req.userId!,
                mediaId,
                body: body.trim(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        res.status(201).json({ ...comment, userVote: null });
    } catch (err) {
        console.error("Failed to post comment:", err);
        res.status(500).json({ error: "Failed to post comment" });
    }
});

// DELETE /api/comments/:commentId — Delete own comment
router.delete("/:commentId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) {
            res.status(404).json({ error: "Comment not found" });
            return;
        }
        if (comment.userId !== req.userId) {
            res.status(403).json({ error: "Not authorized to delete this comment" });
            return;
        }

        await prisma.comment.delete({ where: { id: commentId } });
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to delete comment:", err);
        res.status(500).json({ error: "Failed to delete comment" });
    }
});

// POST /api/comments/:commentId/vote — Like or dislike a comment (toggle)
router.post("/:commentId/vote", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        const { voteType } = req.body; // "LIKE" | "DISLIKE"

        if (!["LIKE", "DISLIKE"].includes(voteType)) {
            res.status(400).json({ error: "voteType must be LIKE or DISLIKE" });
            return;
        }

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) {
            res.status(404).json({ error: "Comment not found" });
            return;
        }

        const existingVote = await prisma.commentVote.findUnique({
            where: { userId_commentId: { userId: req.userId!, commentId } },
        });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                // Same vote → remove it (toggle off)
                await prisma.$transaction([
                    prisma.commentVote.delete({ where: { id: existingVote.id } }),
                    prisma.comment.update({
                        where: { id: commentId },
                        data: voteType === "LIKE"
                            ? { likeCount: { decrement: 1 } }
                            : { dislikeCount: { decrement: 1 } },
                    }),
                ]);
                res.json({ userVote: null });
                return;
            } else {
                // Switching vote (LIKE → DISLIKE or vice versa)
                await prisma.$transaction([
                    prisma.commentVote.update({
                        where: { id: existingVote.id },
                        data: { voteType },
                    }),
                    prisma.comment.update({
                        where: { id: commentId },
                        data: voteType === "LIKE"
                            ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
                            : { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } },
                    }),
                ]);
                res.json({ userVote: voteType });
                return;
            }
        }

        // New vote
        await prisma.$transaction([
            prisma.commentVote.create({
                data: { userId: req.userId!, commentId, voteType },
            }),
            prisma.comment.update({
                where: { id: commentId },
                data: voteType === "LIKE"
                    ? { likeCount: { increment: 1 } }
                    : { dislikeCount: { increment: 1 } },
            }),
        ]);

        res.json({ userVote: voteType });
    } catch (err) {
        console.error("Failed to vote on comment:", err);
        res.status(500).json({ error: "Failed to vote" });
    }
});

export default router;
