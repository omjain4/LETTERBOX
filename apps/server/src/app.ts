import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./modules/auth/routes.js";
import mediaRoutes from "./modules/media/routes.js";
import searchRoutes from "./modules/search/routes.js";
import diaryRoutes from "./modules/diary/routes.js";
import listsRoutes from "./modules/lists/routes.js";
import usersRoutes from "./modules/users/routes.js";

const app = express();

// ─── Global Middleware ──────────────────────────────────────

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://letterbox-web.vercel.app",
        /^https:\/\/.*\.vercel\.app$/
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('/(.*)', cors(corsOptions));
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

// ─── Error Handler ──────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────

app.listen(config.port, "0.0.0.0", () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   📦 Letterbox API Server               ║
  ║   🌐 Port: ${String(config.port).padEnd(28)}║
  ║   🔧 Env:  ${config.nodeEnv.padEnd(28)}║
  ║   ✅ Status: Running                    ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
