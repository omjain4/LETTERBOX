import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// GET /api/users/:username — Public profile
router.get("/:username", async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { username: req.params.username },
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            _count: {
                select: {
                    diaryEntries: true,
                    reviews: true,
                    lists: true,
                    followers: true,
                    following: true,
                },
            },
        },
    });

    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    // Fetch stats
    const [mediaStats, recentDiary, reviewsCount, favoriteFilms] = await Promise.all([
        prisma.diaryEntry.groupBy({
            by: ["mediaId"],
            where: { userId: user.id },
            _count: true,
        }),
        prisma.diaryEntry.findMany({
            where: { userId: user.id },
            orderBy: { watchedDate: "desc" },
            take: 5,
            include: {
                media: {
                    select: {
                        id: true,
                        title: true,
                        mediaType: true,
                        posterUrl: true,
                    },
                },
            },
        }),
        prisma.diaryEntry.count({
            where: {
                userId: user.id,
                review: { not: null }
            }
        }),
        prisma.diaryEntry.findMany({
            where: { userId: user.id, liked: true },
            orderBy: [{ rating: "desc" }, { watchedDate: "desc" }],
            distinct: ["mediaId"],
            take: 4,
            include: {
                media: {
                    select: {
                        id: true,
                        title: true,
                        mediaType: true,
                        posterUrl: true,
                    },
                }
            }
        })
    ]);

    user._count.reviews = reviewsCount;

    res.json({
        ...user,
        stats: {
            totalMediaLogged: mediaStats.length,
        },
        recentDiary,
        favorites: favoriteFilms,
    });
});

// GET /api/users/:username/diary — User's diary entries (public)
router.get("/:username/diary", async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { username: req.params.username },
        select: { id: true },
    });

    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }

    const { page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = Math.min(parseInt(limit as string, 10), 50);

    const [entries, total] = await Promise.all([
        prisma.diaryEntry.findMany({
            where: { userId: user.id },
            orderBy: { watchedDate: "desc" },
            skip,
            take,
            include: {
                media: {
                    select: {
                        id: true,
                        title: true,
                        mediaType: true,
                        posterUrl: true,
                        releaseYear: true,
                    },
                },
            },
        }),
        prisma.diaryEntry.count({ where: { userId: user.id } }),
    ]);

    res.json({
        data: entries,
        pagination: {
            page: parseInt(page as string, 10),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        },
    });
});

export default router;
