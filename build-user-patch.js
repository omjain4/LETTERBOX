const fs = require('fs');
let code = fs.readFileSync('apps/server/src/modules/users/routes.ts', 'utf8');

const patchRoute = `
// PATCH /api/users/me — Update the current user profile
router.patch("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { displayName, bio, avatarUrl } = req.body;
        const validFields: any = {};
        
        if (typeof displayName === "string") validFields.displayName = displayName;
        if (typeof bio === "string") validFields.bio = bio;
        if (typeof avatarUrl === "string") validFields.avatarUrl = avatarUrl;
        
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: validFields,
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                createdAt: true,
            }
        });
        
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});
`;

code = code.replace('// ─── Connection Routes ──────────────────────────────────────', patchRoute + '\n\n// ─── Connection Routes ──────────────────────────────────────');
fs.writeFileSync('apps/server/src/modules/users/routes.ts', code);
