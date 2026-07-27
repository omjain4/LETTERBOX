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
