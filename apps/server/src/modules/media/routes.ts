import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// GET /api/media/:id — Get media by ID with metadata
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id },
            include: {
                movieMetadata: true,
                tvShowMetadata: true,
                youtubeMetadata: true,
                songMetadata: true,
                _count: {
                    select: {
                        diaryEntries: true,
                        reviews: true,
                        listItems: true,
                    },
                },
            },
        });

        if (!media) {
            res.status(404).json({ error: "Media not found" });
            return;
        }

        // Build normalized response
        const metadata =
            media.movieMetadata ||
            media.tvShowMetadata ||
            media.youtubeMetadata ||
            media.songMetadata ||
            null;

        res.json({
            ...media,
            movieMetadata: undefined,
            tvShowMetadata: undefined,
            youtubeMetadata: undefined,
            songMetadata: undefined,
            metadata,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

// GET /api/media — List media with filters
router.get("/", async (req: Request, res: Response) => {
    try {
        const {
            type,
            genre,
            year,
            sort = "createdAt",
            order = "desc",
            page = "1",
            limit = "20",
        } = req.query;

        const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
        const take = Math.min(parseInt(limit as string, 10), 50);

        const where: any = {};
        if (type) where.mediaType = type;
        if (genre) where.genres = { has: genre as string };
        if (year) where.releaseYear = parseInt(year as string, 10);

        const [media, total] = await Promise.all([
            prisma.media.findMany({
                where,
                orderBy: { [sort as string]: order } as any,
                skip,
                take,
                include: {
                    movieMetadata: true,
                    tvShowMetadata: true,
                    youtubeMetadata: true,
                    songMetadata: true,
                },
            }),
            prisma.media.count({ where }),
        ]);

        res.json({
            data: media,
            pagination: {
                page: parseInt(page as string, 10),
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

export default router;
