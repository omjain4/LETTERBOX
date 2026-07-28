import { config } from '../../config/env.js';
import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// ─── Routes ─────────────────────────────────────────────────

// GET /api/users/feed — Get recent diary entries from followed users
router.get("/feed", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const follows = await prisma.follow.findMany({
            where: { followerId: req.userId },
            select: { followingId: true }
        });
        const followingIds = follows.map(f => f.followingId);

        if (followingIds.length === 0) {
            return res.json([]);
        }

        const recentActivity = await prisma.diaryEntry.findMany({
            where: {
                userId: { in: followingIds }
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
                user: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true }
                },
                media: {
                    select: { id: true, title: true, mediaType: true, posterUrl: true, releaseYear: true }
                }
            }
        });

        res.json(recentActivity);
    } catch (e) {
        console.error("Failed to fetch feed", e);
        res.status(500).json({ error: "Failed to fetch feed" });
    }
});

// GET /api/users/popular — Get popular users
router.get("/popular", async (req: Request, res: Response) => {
    try {
        const popularUsers = await prisma.user.findMany({
            take: 4,
            include: {
                _count: {
                    select: { followers: true, reviews: true }
                }
            },
            orderBy: {
                followers: { _count: 'desc' }
            }
        });

        const formatted = popularUsers.map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            followerCount: u._count.followers,
            reviewCount: u._count.reviews
        }));

        res.json(formatted);
    } catch (e) {
        console.error("Failed to fetch popular users", e);
        res.status(500).json({ error: "Failed to catch popular users" });
    }
});

// GET /api/users/search?q= — Search for users
router.get("/search", async (req: Request, res: Response) => {
    const q = req.query.q || "";
    if (!q) { res.json([]); return; }

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: String(q), mode: 'insensitive' } },
                { displayName: { contains: String(q), mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            _count: { select: { followers: true, following: true } }
        },
        take: 20
    });
    res.json(users);
});

// GET /api/users/:username — Public profile
router.get("/:username", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { username: String(req.params.username) },
        select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            // @ts-ignore - Prisma generate fails to lock on windows dev
            favoritePicks: {
                include: { media: { select: { id: true, title: true, mediaType: true, posterUrl: true } } }
            },
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
    const [mediaStats, recentDiary, reviewsCount, favoriteFilms, activityStats, userReviews] = await Promise.all([
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
        }),
        prisma.diaryEntry.groupBy({
            by: ["watchedDate"],
            where: { userId: user.id },
            _count: { id: true },
        }),
        prisma.diaryEntry.findMany({
            where: { userId: user.id, review: { not: null } },
            orderBy: { watchedDate: "desc" },
            take: 50,
            include: {
                media: {
                    select: { id: true, title: true, mediaType: true, posterUrl: true, releaseYear: true },
                },
            },
        })
    ]);

    // @ts-ignore
    user._count.reviews = reviewsCount;

    // Convert activity array into a dictionary: { "YYYY-MM-DD": count }

    let isFollowing = false;
    if (req.userId) {
        const follow = await prisma.follow.findFirst({
            where: { followerId: req.userId, followingId: user.id }
        });
        isFollowing = !!follow;
    }

    const activityData: Record<string, number> = {};
    for (const stat of activityStats) {
        // watchedDate is a native Date
        const dateStr = stat.watchedDate.toISOString().split("T")[0];
        activityData[dateStr] = stat._count.id;
    }

    res.json({
        ...user,
        stats: {
            totalMediaLogged: mediaStats.length,
        },
        recentDiary,
        favorites: favoriteFilms,
        activityData,
        userReviews,
        isFollowing,
    });
});

// GET /api/users/:username/diary — User's diary entries (public)
router.get("/:username/diary", async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { username: String(req.params.username) },
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


// POST /api/users/:username/follow
router.post("/:username/follow", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const targetUser = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
        if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }
        if (targetUser.id === req.userId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

        await prisma.follow.create({
            data: { followerId: req.userId!, followingId: targetUser.id }
        });
        res.json({ success: true });
    } catch (e: any) {
        if (e.code === 'P2002') res.json({ success: true }); // already following
        else res.status(500).json({ error: "Failed to follow" });
    }
});

// DELETE /api/users/:username/follow
router.delete("/:username/follow", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const targetUser = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
        if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

        await prisma.follow.deleteMany({
            where: { followerId: req.userId!, followingId: targetUser.id }
        });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Failed to unfollow" });
    }
});

// GET /api/users/:username/followers
router.get("/:username/followers", async (req: Request, res: Response) => {
    const targetUser = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
    if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

    const follows = await prisma.follow.findMany({
        where: { followingId: targetUser.id },
        include: { follower: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, _count: { select: { followers: true, following: true } } } } }
    });
    res.json(follows.map(f => f.follower));
});

// GET /api/users/:username/following
router.get("/:username/following", async (req: Request, res: Response) => {
    const targetUser = await prisma.user.findUnique({ where: { username: String(req.params.username) } });
    if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

    const follows = await prisma.follow.findMany({
        where: { followerId: targetUser.id },
        include: { following: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, _count: { select: { followers: true, following: true } } } } }
    });
    res.json(follows.map(f => f.following));
});


// POST /api/users/favorites — Set a favorite media pick
router.post("/favorites", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { mediaId, slotInt } = req.body;

        if (![1, 2, 3, 4].includes(slotInt)) {
            return res.status(400).json({ error: "Invalid slot number" });
        }

        if (!mediaId) {
            // Delete if mediaId is null
            // @ts-ignore
            await prisma.favoritePick.deleteMany({
                where: { userId: req.userId!, slotInt }
            });
            return res.json({ success: true });
        }

        // Auto-ingest TMDB selections that haven't been tracked locally yet
        let media = await prisma.media.findUnique({ where: { id: mediaId } });
        if (!media && mediaId.startsWith("tmdb-")) {
            const tmdbId = mediaId.replace("tmdb-", "");
            const apiKey = config.tmdb.apiKey;
            if (apiKey) {
                let url = new URL(`${config.tmdb.baseUrl}/movie/${tmdbId}`);
                url.searchParams.set("api_key", apiKey);
                url.searchParams.set("append_to_response", "credits");
                let tmdbRes = await fetch(url.toString());
                let data: any = await (tmdbRes.ok ? tmdbRes.json() : null);
                let type: "MOVIE" | "TV_SHOW" = "MOVIE";

                if (!tmdbRes.ok || !data || data.status_code === 34) {
                    url = new URL(`${config.tmdb.baseUrl}/tv/${tmdbId}`);
                    url.searchParams.set("api_key", apiKey);
                    url.searchParams.set("append_to_response", "credits");
                    tmdbRes = await fetch(url.toString());
                    data = (await (tmdbRes.ok ? tmdbRes.json() : null)) as any;
                    type = "TV_SHOW";
                }

                if (data && tmdbRes.ok) {
                    await prisma.media.create({
                        data: {
                            id: mediaId,
                            externalId: String(data.id),
                            externalSource: "TMDB",
                            mediaType: type,
                            title: type === "MOVIE" ? data.title : data.name,
                            description: data.overview || null,
                            posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                            releaseYear: data.release_date ? parseInt(data.release_date.split("-")[0]) : (data.first_air_date ? parseInt(data.first_air_date.split("-")[0]) : null),
                            runtimeMinutes: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || null,
                            genres: data.genres ? data.genres.map((g: any) => g.name) : [],
                            avgRating: 0.0,
                            ratingCount: 0,
                            movieMetadata: type === "MOVIE" ? {
                                create: {
                                    tmdbId: String(data.id),
                                    director: data.credits?.crew?.find((c: any) => c.job === "Director")?.name || null,
                                    cast: data.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [],
                                    studio: data.production_companies?.[0]?.name || null,
                                    imdbId: data.imdb_id || null,
                                    tagline: data.tagline || null
                                }
                            } : undefined,
                            tvShowMetadata: type === "TV_SHOW" ? {
                                create: {
                                    tmdbId: String(data.id),
                                    seasonCount: data.number_of_seasons || 1,
                                    episodeCount: data.number_of_episodes || null,
                                    status: data.status || null,
                                    network: data.networks?.[0]?.name || null
                                }
                            } : undefined
                        }
                    });
                }
            }
        }

        // Auto-ingest YouTube selections
        if (!media && mediaId.startsWith("yt-")) {
            const videoId = mediaId.replace("yt-", "");
            const apiKey = config.youtube.apiKey;
            if (apiKey) {
                const url = new URL("https://www.googleapis.com/youtube/v3/videos");
                url.searchParams.set("part", "snippet,contentDetails,statistics");
                url.searchParams.set("id", videoId);
                url.searchParams.set("key", apiKey);
                const ytRes = await fetch(url.toString());
                if (ytRes.ok) {
                    const data: any = (await ytRes.json()) as any;
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0];
                        let durationSeconds = 0;
                        const durationStr = item.contentDetails?.duration || "";
                        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        if (match) {
                            durationSeconds = (parseInt(match[1] || "0", 10) * 3600) + (parseInt(match[2] || "0", 10) * 60) + parseInt(match[3] || "0", 10);
                        }
                        await prisma.media.create({
                            data: {
                                id: mediaId,
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
                            }
                        });
                    }
                }
            }
        }

        // Upsert the favorite pick
        // @ts-ignore
        const pick = await prisma.favoritePick.upsert({
            where: {
                userId_slotInt: {
                    userId: req.userId!,
                    slotInt
                }
            },
            update: { mediaId },
            create: {
                userId: req.userId!,
                mediaId,
                slotInt
            },
            include: { media: true }
        });

        res.json(pick);
    } catch (e) {
        console.error("Failed to set favorite pick", e);
        res.status(500).json({ error: "Failed to set favorite" });
    }
});

export default router;



