// @ts-nocheck
import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { config } from "../../config/env.js";
import { getCache, setCache } from "../../config/cache.js";

const router = Router();

// ─── YouTube API Search ─────────────────────────────────────

async function searchYouTube(query: string, maxResults = 20) {
    const apiKey = config.youtube.apiKey;
    if (!apiKey) return [];

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(50));
    url.searchParams.set("videoDuration", "long");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
        console.error("YouTube API error:", res.status, await res.text());
        return [];
    }

    const data = (await res.json()) as any;
    if (!data.items || data.items.length === 0) return [];

    // Secondary fetch to enforce exact strict duration > 1 hour
    const videoIds = data.items.map((item: any) => item.id.videoId).join(",");
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.set("part", "contentDetails");
    detailsUrl.searchParams.set("id", videoIds);
    detailsUrl.searchParams.set("key", apiKey);

    const detailsRes = await fetch(detailsUrl.toString());
    const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };
    const durationMap = new Map();

    for (const item of (detailsData.items || [])) {
        let durationSeconds = 0;
        const durationStr = item.contentDetails?.duration || "";
        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
            const hours = parseInt(match[1] || "0", 10);
            const mins = parseInt(match[2] || "0", 10);
            const secs = parseInt(match[3] || "0", 10);
            durationSeconds = hours * 3600 + mins * 60 + secs;
        }
        durationMap.set(item.id, durationSeconds);
    }

    const validItems = data.items
        .filter((item: any) => (durationMap.get(item.id.videoId) || 0) >= 3600)
        .slice(0, maxResults);

    return validItems.map((item: any) => ({
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


async function searchTMDB(query: string, type: "MOVIE" | "TV_SHOW", maxResults = 20) {
    const apiKey = config.tmdb.apiKey;
    if (!apiKey) return [];

    const endpoint = type === "MOVIE" ? "/search/movie" : "/search/tv";
    const url = new URL(`${config.tmdb.baseUrl}${endpoint}`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    if (!data.results) return [];

    return data.results.slice(0, maxResults).map((item: any) => ({
        id: `tmdb-${item.id}`,
        externalId: String(item.id),
        mediaType: type,
        title: type === "MOVIE" ? item.title : item.name,
        description: item.overview || null,
        posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        releaseYear: item.release_date ? parseInt(item.release_date.split("-")[0]) : (item.first_air_date ? parseInt(item.first_air_date.split("-")[0]) : null),
        avgRating: 0,
        ratingCount: 0,
        _external: true
    }));
}



// ─── Last.fm API Search ─────────────────────────────────────

async function searchLastfm(query: string, maxResults = 20) {
    const apiKey = config.lastfm.apiKey;
    if (!apiKey) return [];

    const url = new URL("http://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "track.search");
    url.searchParams.set("track", query);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(maxResults));

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    if (!data.results || !data.results.trackmatches || !data.results.trackmatches.track) return [];

    return data.results.trackmatches.track.map((item: any) => {
        // Base64 encode the Artist::Track string identifier for safe internal ID storage
        const safeId = Buffer.from(`${item.artist}::${item.name}`).toString("base64url");
        const poster = item.image?.find((i: any) => i.size === "extralarge")?.["#text"] ||
            item.image?.find((i: any) => i.size === "large")?.["#text"] || null;

        return {
            id: `lastfm-${safeId}`,
            externalId: safeId,
            mediaType: "SONG",
            title: item.name,
            description: `By ${item.artist}`,
            posterUrl: poster,
            releaseYear: null,
            avgRating: 0,
            ratingCount: 0,
            _external: true
        };
    });
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

        const cacheKey = `search_${typeStr || "ALL"}_${queryStr.toLowerCase()}_page${pageNum}_limit${take}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            res.json(cachedData);
            return;
        }

        let finalResults: any[] = [];
        let totalResults = 0;

        if (typeStr === "YOUTUBE_VIDEO") {
            finalResults = await searchYouTube(queryStr, take);
            totalResults = finalResults.length;
        } else if (typeStr === "MOVIE" || typeStr === "TV_SHOW") {
            const externalPromise = searchTMDB(queryStr, typeStr, take);
            const { results } = await searchLocal(queryStr, typeStr, skip, take);
            const external = await externalPromise;
            // merge intelligently favoring local
            const localIds = new Set(results.map((r: any) => r.externalId));
            const filteredExternal = external.filter((e: any) => !localIds.has(e.externalId));
            finalResults = [...results, ...filteredExternal];
            totalResults = finalResults.length;
        } else if (typeStr === "SONG") {
            const externalPromise = searchLastfm(queryStr, take);
            const { results } = await searchLocal(queryStr, typeStr, skip, take);
            const external = await externalPromise;
            const localIds = new Set(results.map((r: any) => r.externalId));
            const filteredExternal = external.filter((e: any) => !localIds.has(e.externalId));
            finalResults = [...results, ...filteredExternal];
            totalResults = finalResults.length;
        } else if (!typeStr || typeStr === "ALL") {
            // Aggregated general search
            const pYT = searchYouTube(queryStr, 5);
            const pTMDB1 = searchTMDB(queryStr, "MOVIE", 5);
            const pTMDB2 = searchTMDB(queryStr, "TV_SHOW", 5);
            const pLastfm = searchLastfm(queryStr, 5);
            const { results } = await searchLocal(queryStr, undefined, skip, take);

            const [yt, t1, t2, lastfmRes] = await Promise.all([pYT, pTMDB1, pTMDB2, pLastfm]);
            const external = [...yt, ...t1, ...t2, ...lastfmRes];
            const localIds = new Set(results.map((r: any) => r.externalId));
            const filteredExternal = external.filter((e: any) => !localIds.has(e.externalId) && e.externalId);
            finalResults = [...results, ...filteredExternal];
            totalResults = finalResults.length;
        } else {
            const { results, total } = await searchLocal(queryStr, typeStr, skip, take);
            finalResults = results;
            totalResults = total;
        }

        const responsePayload = {
            data: finalResults,
            query: queryStr,
            pagination: {
                page: pageNum,
                limit: take,
                total: totalResults,
                totalPages: Math.ceil(totalResults / take) || 1,
            },
        };

        // Cache results for 15 minutes (900 seconds)
        await setCache(cacheKey, responsePayload, 900);

        res.json(responsePayload);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

export default router;


