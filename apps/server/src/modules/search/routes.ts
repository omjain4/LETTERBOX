// @ts-nocheck
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



let spotifyAccessToken = "";
let spotifyTokenExpiresAt = 0;

async function getSpotifyToken() {
    if (Date.now() < spotifyTokenExpiresAt && spotifyAccessToken) {
        return spotifyAccessToken;
    }
    const { clientId, clientSecret } = config.spotify;
    if (!clientId || !clientSecret) return null;

    const credentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return spotifyAccessToken;
}

async function searchSpotify(query: string, maxResults = 20) {
    const token = await getSpotifyToken();
    if (!token) return [];

    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", String(maxResults));

    const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    if (!data.tracks || !data.tracks.items) return [];

    return data.tracks.items.map((item: any) => ({
        id: `spotify-${item.id}`,
        externalId: String(item.id),
        mediaType: "SONG",
        title: item.name,
        description: `By ${item.artists.map((a: any) => a.name).join(", ")} on ${item.album.name}`,
        posterUrl: item.album.images.length > 0 ? item.album.images[0].url : null,
        releaseYear: parseInt(item.album.release_date.split("-")[0]),
        avgRating: 0,
        ratingCount: 0,
        _external: true
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
            const externalPromise = searchSpotify(queryStr, take);
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
            const pSpot = searchSpotify(queryStr, 5);
            const { results } = await searchLocal(queryStr, undefined, skip, take);

            const [yt, t1, t2, spot] = await Promise.all([pYT, pTMDB1, pTMDB2, pSpot]);
            const external = [...yt, ...t1, ...t2, ...spot];
            const localIds = new Set(results.map((r: any) => r.externalId));
            const filteredExternal = external.filter((e: any) => !localIds.has(e.externalId) && e.externalId);
            finalResults = [...results, ...filteredExternal];
            totalResults = finalResults.length;
        } else {
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
