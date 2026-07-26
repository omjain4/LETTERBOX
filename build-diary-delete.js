const fs = require('fs');
let code = fs.readFileSync('apps/server/src/modules/diary/routes.ts', 'utf8');

const deleteRoute = `
// DELETE /api/diary/:id — Delete a diary entry
router.delete("/:id", async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id;
        
        // Find existing to ensure they own it
        const entry = await prisma.diaryEntry.findUnique({
            where: { id }
        });
        
        if (!entry) {
            res.status(404).json({ error: "Diary entry not found" });
            return;
        }
        
        if (entry.userId !== req.userId) {
            res.status(403).json({ error: "Unauthorized" });
            return;
        }

        await prisma.diaryEntry.delete({
            where: { id }
        });

        // Recalculate average rating if it had a rating
        if (entry.rating) {
            const agg = await prisma.diaryEntry.aggregate({
                where: { mediaId: entry.mediaId, rating: { not: null } },
                _avg: { rating: true },
                _count: { rating: true },
            });
            await prisma.media.update({
                where: { id: entry.mediaId },
                data: {
                    avgRating: agg._avg.rating || 0,
                    ratingCount: agg._count.rating,
                },
            });
        }
        
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ error: "Failed to delete diary entry" });
    }
});
`;

code += '\n' + deleteRoute;
fs.writeFileSync('apps/server/src/modules/diary/routes.ts', code);
