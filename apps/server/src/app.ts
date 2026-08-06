import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./modules/auth/routes.js";
import mediaRoutes from "./modules/media/routes.js";
import searchRoutes from "./modules/search/routes.js";
import diaryRoutes from "./modules/diary/routes.js";
import listsRoutes from "./modules/lists/routes.js";
import usersRoutes from "./modules/users/routes.js";
import commentsRoutes from "./modules/comments/routes.js";

const app = express();

// ─── Global Middleware ──────────────────────────────────────
app.use(helmet()); // Protect against known vulnerabilities by setting security HTTP headers

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1500, // limit each IP to 1500 requests per windowMs
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter); // Apply rate limiting to all requests

app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:5173', 'https://letterbox-web.vercel.app'];
    const origin = req.headers.origin;

    // Allow dynamic Vercel branches as well
    if (origin && (allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // If it's a preflight request, immediately return a 200 OK
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
});
app.use(express.json({ limit: "10mb" }));

// ─── Health Check ───────────────────────────────────────────

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

// ─── API Routes ─────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/comments", commentsRoutes);

// ─── Error Handler ──────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────

app.listen(config.port, "0.0.0.0", () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   📦 MOSIAC API Server                  ║
  ║   🌐 Port: ${String(config.port).padEnd(28)}║
  ║   🔧 Env:  ${config.nodeEnv.padEnd(28)}║
  ║   ✅ Status: Running                    ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
