import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// All diary routes require auth
router.use(authMiddleware);

// ─── Validation ─────────────────────────────────────────────

const createEntrySchema = z.object({
    mediaId: z.string().min(1),
    watchedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    rating: z.number().min(0.5).max(5).step(0.5).optional(),
    review: z.string().max(10000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    liked: z.boolean().optional(),
});

const updateEntrySchema = createEntrySchema.partial();

// ─── Routes ─────────────────────────────────────────────────

// POST /api/diary — Create diary entry
router.post("/", async (req: AuthRequest, res: Response) => {
    try {
        const data = createEntrySchema.parse(req.body);

        // Verify media exists
        const media = await prisma.media.findUnique({
            where: { id: data.mediaId },
        });
        if (!media) {
            res.status(404).json({ error: "Media not found" });
            return;
        }

        const watchedDate = new Date(data.watchedDate);

        // Check if user already logged this media on this date
        const existingEntry = await prisma.diaryEntry.findFirst({
            where: {
                userId: req.userId!,
                mediaId: data.mediaId,
                watchedDate,
            }
        });

        let entry;
        if (existingEntry) {
            entry = await prisma.diaryEntry.update({
                where: { id: existingEntry.id },
                data: {
                    rating: data.rating !== undefined ? data.rating : existingEntry.rating,
                    review: data.review !== undefined ? data.review : existingEntry.review,
                    tags: data.tags !== undefined ? data.tags : existingEntry.tags,
                    liked: data.liked !== undefined ? data.liked : existingEntry.liked,
                },
                include: {
                    media: {
                        select: { id: true, title: true, mediaType: true, posterUrl: true },
                    },
                },
            });
        } else {
            entry = await prisma.diaryEntry.create({
                data: {
                    userId: req.userId!,
                    mediaId: data.mediaId,
                    watchedDate,
                    rating: data.rating,
                    review: data.review,
                    tags: data.tags || [],
                    liked: data.liked || false,
                },
                include: {
                    media: {
                        select: { id: true, title: true, mediaType: true, posterUrl: true },
                    },
                },
            });
        }

        // Update media average rating if rating provided
        if (data.rating) {
            const agg = await prisma.diaryEntry.aggregate({
                where: { mediaId: data.mediaId, rating: { not: null } },
                _avg: { rating: true },
                _count: { rating: true },
            });
            await prisma.media.update({
                where: { id: data.mediaId },
                data: {
                    avgRating: agg._avg.rating || 0,
                    ratingCount: agg._count.rating,
                },
            });
        }

        res.status(201).json(entry);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        throw err;
    }
});

// GET /api/diary — Get user's diary entries
router.get("/", async (req: AuthRequest, res: Response) => {
    const {
        month,
        year,
        page = "1",
        limit = "30",
    } = req.query;

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = Math.min(parseInt(limit as string, 10), 50);

    const where: any = { userId: req.userId };

    if (month && year) {
        const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
        const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
        where.watchedDate = { gte: startDate, lte: endDate };
    }

    const [entries, total] = await Promise.all([
        prisma.diaryEntry.findMany({
            where,
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
        prisma.diaryEntry.count({ where }),
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

// GET /api/diary/:id — Get single diary entry
router.get("/:id", async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const entry = await prisma.diaryEntry.findFirst({
        where: { id, userId: req.userId },
        include: {
            media: true,
        },
    });

    if (!entry) {
        res.status(404).json({ error: "Diary entry not found" });
        return;
    }

    res.json(entry);
});

// PUT /api/diary/:id — Update diary entry
router.put("/:id", async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const data = updateEntrySchema.parse(req.body);

        const existing = await prisma.diaryEntry.findFirst({
            where: { id, userId: req.userId },
        });

        if (!existing) {
            res.status(404).json({ error: "Diary entry not found" });
            return;
        }

        const entry = await prisma.diaryEntry.update({
            where: { id },
            data: {
                ...(data.watchedDate && { watchedDate: new Date(data.watchedDate) }),
                ...(data.rating !== undefined && { rating: data.rating }),
                ...(data.review !== undefined && { review: data.review }),
                ...(data.tags && { tags: data.tags }),
                ...(data.liked !== undefined && { liked: data.liked }),
            },
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
        });

        res.json(entry);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        throw err;
    }
});

// DELETE /api/diary/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const existing = await prisma.diaryEntry.findFirst({
        where: { id, userId: req.userId },
    });

    if (!existing) {
        res.status(404).json({ error: "Diary entry not found" });
        return;
    }

    await prisma.diaryEntry.delete({ where: { id } });
    res.status(204).send();
});

export default router;
