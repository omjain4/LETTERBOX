import { Request, Response, NextFunction } from "express";

export interface ApiError {
    status: number;
    message: string;
    details?: unknown;
}

export function errorHandler(
    err: ApiError | Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error("[Error]", err);

    if ("status" in err) {
        res.status(err.status).json({
            error: err.message,
            details: err.details,
        });
        return;
    }

    res.status(500).json({
        error: "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
}

export function createError(
    status: number,
    message: string,
    details?: unknown
): ApiError {
    return { status, message, details };
}
