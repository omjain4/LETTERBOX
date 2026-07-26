import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { config } from "../../config/env.js";

const router = Router();

// ─── YouTube API Search ─────────────────────────────────────

async function searchYouTube(query: string, maxResults = 20) {
    const apiKey = config.youtube.apiKey;
    if (!apiKey) return [];

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
        console.error("YouTube API error:", res.status, await res.text());
        return [];
    }

    const data = (await res.json()) as any;
    if (!data.items) return [];

    return data.items.map((item: any) => ({
        id: `yt-${item.id.videoId}`,
        externalId: item.id.videoId,
        mediaType: "YOUTUBE_VIDEO",
        title: item.snippet.title,
        description: item.snippet.description,
        posterUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
        releaseYear: new Date(item.snippet.publishedAt).getFullYear(),
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        avgRating: null,
        ratingCount: 0,
        _external: true, // flag: not in our DB yet
    }));
}

// ─── Local DB Search ────────────────────────────────────────

async function searchLocal(query: string, type?: string, skip = 0, take = 20) {
    const where: any = {
        title: { contains: query.trim(), mode: "insensitive" },
    };
    if (type) where.mediaType = type;

    const [results, total] = await Promise.all([
        prisma.media.findMany({
            where,
            orderBy: [{ ratingCount: "desc" }, { avgRating: "desc" }],
            skip,
            take,
            select: {
                id: true,
                mediaType: true,
                title: true,
                description: true,
                posterUrl: true,
                releaseYear: true,
                genres: true,
                avgRating: true,
                ratingCount: true,
            },
        }),
        prisma.media.count({ where }),
    ]);

    return { results, total };
}

// GET /api/search?q=&type=
router.get("/", async (req: Request, res: Response) => {
    try {
        const { q, type, page = "1", limit = "20" } = req.query;

        if (!q || typeof q !== "string" || q.trim().length < 2) {
            res.status(400).json({ error: "Search query must be at least 2 characters" });
            return;
        }

        const pageNum = parseInt(page as string, 10);
        const take = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * take;
        const queryStr = q.trim();
        const typeStr = type as string | undefined;

        let finalResults: any[] = [];
        let totalResults = 0;

        if (typeStr === "YOUTUBE_VIDEO") {
            // Only YouTube
            finalResults = await searchYouTube(queryStr, take);
            totalResults = finalResults.length;
        } else if (!typeStr || typeStr === "ALL") {
            // Combine Local and YouTube
            // Half limit for each to roughly maintain the `take` size, or just fetch `take` for both
            const youtubeResultsPromise = searchYouTube(queryStr, take);
            const localResultsPromise = searchLocal(queryStr, undefined, skip, take);

            const [youtubeResults, { results: localResults, total }] = await Promise.all([
                youtubeResultsPromise,
                localResultsPromise,
            ]);

            // Combine them
            finalResults = [...youtubeResults, ...localResults];
            totalResults = total + youtubeResults.length;
        } else {
            // Specific local type
            const { results, total } = await searchLocal(queryStr, typeStr, skip, take);
            finalResults = results;
            totalResults = total;
        }

        res.json({
            data: finalResults,
            query: queryStr,
            pagination: {
                page: pageNum,
                limit: take,
                total: totalResults,
                totalPages: Math.ceil(totalResults / take) || 1,
            },
        });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

export default router;
