import dotenv from "dotenv";
import path from "path";

// Load .env (looks in current working directory, e.g. apps/server)
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",

    jwt: {
        secret: process.env.JWT_SECRET || "fallback-secret",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
        expiresIn: process.env.JWT_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },

    tmdb: {
        apiKey: process.env.TMDB_API_KEY || "",
        baseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
    },

    youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || "",
    },

    lastfm: {
        apiKey: process.env.LASTFM_API_KEY || "",
        sharedSecret: process.env.LASTFM_SHARED_SECRET || "",
    },

    redis: {
        url: process.env.REDIS_URL || "redis://localhost:6379",
    },
} as const;

