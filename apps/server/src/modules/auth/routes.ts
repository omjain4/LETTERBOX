import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { config } from "../../config/env.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";
import { createError } from "../../middleware/errorHandler.js";

const router = Router();

// ─── Validation Schemas ─────────────────────────────────────

const registerSchema = z.object({
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    displayName: z.string().max(100).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// ─── Helpers ────────────────────────────────────────────────

function generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, config.jwt.secret as string, {
        expiresIn: config.jwt.expiresIn,
    } as any);
    const refreshToken = jwt.sign({ userId, email }, config.jwt.refreshSecret as string, {
        expiresIn: config.jwt.refreshExpiresIn,
    } as any);
    return { accessToken, refreshToken };
}

// ─── Routes ─────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check existing user
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: data.email }, { username: data.username }],
            },
        });

        if (existing) {
            const field = existing.email === data.email ? "email" : "username";
            throw createError(409, `User with this ${field} already exists`);
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash,
                displayName: data.displayName,
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        const tokens = generateTokens(user.id, user.email);

        res.status(201).json({ user, ...tokens });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        if (err.status) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        throw err;
    }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw createError(401, "Invalid email or password");
        }

        const valid = await bcrypt.compare(data.password, user.passwordHash);
        if (!valid) {
            throw createError(401, "Invalid email or password");
        }

        const tokens = generateTokens(user.id, user.email);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
            },
            ...tokens,
        });
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: "Validation failed", details: err.errors });
            return;
        }
        if (err.status) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        throw err;
    }
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw createError(400, "Refresh token is required");
        }

        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
            userId: string;
            email: string;
        };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            throw createError(401, "User not found");
        }

        const tokens = generateTokens(user.id, user.email);
        res.json(tokens);
    } catch (err: any) {
        if (err.status) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        res.status(401).json({ error: "Invalid refresh token" });
    }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
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

    res.json({ user });
});

export default router;
