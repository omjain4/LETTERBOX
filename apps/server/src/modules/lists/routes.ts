import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

// ─── Validation ─────────────────────────────────────────────

const createListSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    isPublic: z.boolean().optional(),
    isRanked: z.boolean().optional(),
});

const addItemSchema = z.object({
    mediaId: z.string().uuid(),
    position: z.number().int().min(0).optional(),
    notes: z.string().max(1000).optional(),
});

const reorderSchema = z.object({
    items: z.array(
        z.object({
            id: z.string().uuid(),
            position: z.number().int().min(0),
        })
    ),
});

// ─── Routes ─────────────────────────────────────────────────

// POST /api/lists — Create list
router.post("/", async (req: AuthRequest, res: Response) => {
    try {
        const data = createListSchema.parse(req.body);

        const list = await prisma.list.create({
            data: {
                userId: req.userId!,
                name: data.name,
                description: data.description,
                isPublic: data.isPublic ?? true,
                isRanked: data.isRanked ?? false,
            },
        });

        res.status(201).json(list);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        throw err;
    }
});

// GET /api/lists — Get user's lists
router.get("/", async (req: AuthRequest, res: Response) => {
    const { userId, page = "1", limit = "20" } = req.query;
    const targetUserId = (userId as string) || req.userId!;

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = Math.min(parseInt(limit as string, 10), 50);

    const where: any = { userId: targetUserId };
    // Only show public lists for other users
    if (targetUserId !== req.userId) {
        where.isPublic = true;
    }

    const [lists, total] = await Promise.all([
        prisma.list.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            skip,
            take,
            include: {
                _count: { select: { items: true } },
                items: {
                    take: 4,
                    orderBy: { position: "asc" },
                    include: {
                        media: {
                            select: { id: true, title: true, posterUrl: true, mediaType: true },
                        },
                    },
                },
            },
        }),
        prisma.list.count({ where }),
    ]);

    res.json({
        data: lists,
        pagination: {
            page: parseInt(page as string, 10),
            limit: take,
            total,
            totalPages: Math.ceil(total / take),
        },
    });
});

// GET /api/lists/:id — Get list with items
router.get("/:id", async (req: AuthRequest, res: Response) => {
    const list = await prisma.list.findUnique({
        where: { id: req.params.id },
        include: {
            user: {
                select: { id: true, username: true, avatarUrl: true },
            },
            items: {
                orderBy: { position: "asc" },
                include: {
                    media: {
                        include: {
                            movieMetadata: true,
                            tvShowMetadata: true,
                            youtubeMetadata: true,
                            songMetadata: true,
                        },
                    },
                },
            },
        },
    });

    if (!list) {
        res.status(404).json({ error: "List not found" });
        return;
    }

    if (!list.isPublic && list.userId !== req.userId) {
        res.status(403).json({ error: "This list is private" });
        return;
    }

    res.json(list);
});

// POST /api/lists/:id/items — Add item to list
router.post("/:id/items", async (req: AuthRequest, res: Response) => {
    try {
        const data = addItemSchema.parse(req.body);

        const list = await prisma.list.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!list) {
            res.status(404).json({ error: "List not found" });
            return;
        }

        // Auto-assign position if not provided
        let position = data.position;
        if (position === undefined) {
            const lastItem = await prisma.listItem.findFirst({
                where: { listId: req.params.id },
                orderBy: { position: "desc" },
            });
            position = lastItem ? lastItem.position + 1 : 0;
        }

        const item = await prisma.listItem.create({
            data: {
                listId: req.params.id,
                mediaId: data.mediaId,
                position,
                notes: data.notes,
            },
            include: {
                media: {
                    select: { id: true, title: true, posterUrl: true, mediaType: true },
                },
            },
        });

        res.status(201).json(item);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        throw err;
    }
});

// PUT /api/lists/:id/reorder — Reorder list items
router.put("/:id/reorder", async (req: AuthRequest, res: Response) => {
    try {
        const data = reorderSchema.parse(req.body);

        const list = await prisma.list.findFirst({
            where: { id: req.params.id, userId: req.userId },
        });
        if (!list) {
            res.status(404).json({ error: "List not found" });
            return;
        }

        await prisma.$transaction(
            data.items.map((item) =>
                prisma.listItem.update({
                    where: { id: item.id },
                    data: { position: item.position },
                })
            )
        );

        res.json({ message: "List reordered" });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        throw err;
    }
});

// DELETE /api/lists/:id — Delete list
router.delete("/:id", async (req: AuthRequest, res: Response) => {
    const list = await prisma.list.findFirst({
        where: { id: req.params.id, userId: req.userId },
    });
    if (!list) {
        res.status(404).json({ error: "List not found" });
        return;
    }

    await prisma.list.delete({ where: { id: req.params.id } });
    res.status(204).send();
});

// DELETE /api/lists/:listId/items/:itemId — Remove item from list
router.delete("/:listId/items/:itemId", async (req: AuthRequest, res: Response) => {
    const list = await prisma.list.findFirst({
        where: { id: req.params.listId, userId: req.userId },
    });
    if (!list) {
        res.status(404).json({ error: "List not found" });
        return;
    }

    await prisma.listItem.delete({ where: { id: req.params.itemId } });
    res.status(204).send();
});

export default router;
