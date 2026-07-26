const fs = require('fs');
let code = fs.readFileSync('apps/server/src/modules/diary/routes.ts', 'utf8');

const patchRoute = `
// PATCH /api/diary/:id — Update specific fields (e.g., liked status)
router.patch("/:id", async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id;
        const existing = await prisma.diaryEntry.findFirst({
            where: { id: id, userId: req.userId }
        });
        
        if (!existing) {
            res.status(404).json({ error: "Diary entry not found" });
            return;
        }

        const validFields: any = {};
        if (req.body.liked !== undefined) validFields.liked = req.body.liked;
        // Optionally allow rating and review patches here too
        if (req.body.rating !== undefined) validFields.rating = req.body.rating;
        if (req.body.review !== undefined) validFields.review = req.body.review;

        const updated = await prisma.diaryEntry.update({
            where: { id },
            data: validFields,
            include: {
                media: { select: { id: true, title: true, mediaType: true, posterUrl: true } }
            }
        });

        // If rating was patched, recalculate avg
        if (req.body.rating !== undefined) {
             const agg = await prisma.diaryEntry.aggregate({
                 where: { mediaId: existing.mediaId, rating: { not: null } },
                 _avg: { rating: true },
                 _count: { rating: true },
             });
             await prisma.media.update({
                 where: { id: existing.mediaId },
                 data: {
                     avgRating: agg._avg.rating || 0,
                     ratingCount: agg._count.rating,
                 },
             });
        }

        res.json(updated);
    } catch(e) {
        res.status(500).json({ error: "Failed to update diary entry" });
    }
});
`;

code = code.replace('// DELETE /api/diary/:id', patchRoute + '\n\n// DELETE /api/diary/:id');
fs.writeFileSync('apps/server/src/modules/diary/routes.ts', code);
