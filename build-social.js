const fs = require('fs');

let code = fs.readFileSync('apps/server/src/modules/users/routes.ts', 'utf8');

// 1. the imports
code = code.replace(/import \{ authMiddleware, AuthRequest \} from "\.\.\/\.\.\/middleware\/auth\.js";/, 'import { authMiddleware, optionalAuthMiddleware, AuthRequest } from "../../middleware/auth.js";');

// 2. Add search BEFORE /:username
const searchApi = `
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
`;
code = code.replace('// GET /api/users/:username — Public profile', searchApi + '\n// GET /api/users/:username — Public profile');

// 3. Update public profile to use optionalAuthMiddleware and return isFollowing
code = code.replace('router.get("/:username", async (req: Request, res: Response) => {', 'router.get("/:username", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {');

const isFollowingBlock = `
    let isFollowing = false;
    if (req.userId) {
        const follow = await prisma.follow.findFirst({
            where: { followerId: req.userId, followingId: user.id }
        });
        isFollowing = !!follow;
    }
`;

code = code.replace('userReviews,\n    });', 'userReviews,\n        isFollowing,\n    });');
code = code.replace('const activityData', isFollowingBlock + '\n    const activityData');

// 4. Add follow/unfollow and followers/following routes at the end
const socialApis = `
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

`;

code = code.replace('export default router;', socialApis + '\nexport default router;');

code = code.replace(/String\(String\(req\.params\.([a-zA-Z]+)\)\)/g, 'String(req.params.$1)');

fs.writeFileSync('apps/server/src/modules/users/routes.ts', code);
