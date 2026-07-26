import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { config } from "../../config/env.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// GET /api/media/:id — Get media by ID with metadata
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        let media = await prisma.media.findUnique({
            where: { id: id },
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

        // Lazy-load YouTube video if it's an external yt- ID and not in DB yet
        if (!media && id.startsWith("yt-")) {
            const videoId = id.replace("yt-", "");
            const apiKey = config.youtube.apiKey;

            if (apiKey) {
                const url = new URL("https://www.googleapis.com/youtube/v3/videos");
                url.searchParams.set("part", "snippet,contentDetails,statistics");
                url.searchParams.set("id", videoId);
                url.searchParams.set("key", apiKey);

                const res = await fetch(url.toString());
                if (res.ok) {
                    const data = (await res.json()) as any;
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0];

                        // Parse ISO 8601 duration to seconds roughly
                        let durationSeconds = 0;
                        const durationStr = item.contentDetails?.duration || "";
                        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        if (match) {
                            const hours = parseInt(match[1] || "0", 10);
                            const mins = parseInt(match[2] || "0", 10);
                            const secs = parseInt(match[3] || "0", 10);
                            durationSeconds = hours * 3600 + mins * 60 + secs;
                        }

                        // Create in DB
                        media = await prisma.media.create({
                            data: {
                                id: id,
                                externalId: videoId,
                                externalSource: "YOUTUBE",
                                mediaType: "YOUTUBE_VIDEO",
                                title: item.snippet.title,
                                description: item.snippet.description,
                                posterUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
                                releaseYear: new Date(item.snippet.publishedAt).getFullYear(),
                                runtimeMinutes: Math.floor(durationSeconds / 60) || null,
                                youtubeMetadata: {
                                    create: {
                                        channelId: item.snippet.channelId,
                                        channelName: item.snippet.channelTitle,
                                        videoId: videoId,
                                        isLiveStream: item.snippet.liveBroadcastContent !== "none",
                                        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
                                        likeCount: parseInt(item.statistics?.likeCount || "0", 10),
                                        durationSeconds,
                                        thumbnailUrl: item.snippet.thumbnails?.high?.url || null,
                                    }
                                }
                            },
                        }) as any; // Cast as any because the initial create doesn't include the counts

                        // Refetch to get the includes and counts
                        if (media) {
                            media = await prisma.media.findUnique({
                                where: { id: id },
                                include: {
                                    movieMetadata: true,
                                    tvShowMetadata: true,
                                    youtubeMetadata: true,
                                    songMetadata: true,
                                    _count: {
                                        select: { diaryEntries: true, reviews: true, listItems: true },
                                    },
                                },
                            });
                        }
                    }
                }
            }
        }

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
