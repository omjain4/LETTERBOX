import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export interface AuthRequest extends Request {
    userId?: string;
}

export interface JwtPayload {
    userId: string;
    email: string;
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

export function optionalAuthMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next();
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        req.userId = decoded.userId;
    } catch {
        // ignore
    }

    next();
}
