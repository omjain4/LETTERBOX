import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { config } from "../../config/env.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

const router = Router();

// GET /api/media/:id — Get media by ID with metadata
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        let media = await prisma.media.findUnique({
            where: { id: id },
            include: {
                movieMetadata: true,
                tvShowMetadata: true,
                youtubeMetadata: true,
                songMetadata: true,
                _count: {
                    select: {
                        diaryEntries: true,
                        reviews: true,
                        listItems: true,
                    },
                },
            },
        });

        // Lazy-load YouTube video if it's an external yt- ID and not in DB yet
        if (!media && id.startsWith("yt-")) {
            const videoId = id.replace("yt-", "");
            const apiKey = config.youtube.apiKey;

            if (apiKey) {
                const url = new URL("https://www.googleapis.com/youtube/v3/videos");
                url.searchParams.set("part", "snippet,contentDetails,statistics");
                url.searchParams.set("id", videoId);
                url.searchParams.set("key", apiKey);

                const res = await fetch(url.toString());
                if (res.ok) {
                    const data = (await res.json()) as any;
                    if (data.items && data.items.length > 0) {
                        const item = data.items[0];

                        // Parse ISO 8601 duration to seconds roughly
                        let durationSeconds = 0;
                        const durationStr = item.contentDetails?.duration || "";
                        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        if (match) {
                            const hours = parseInt(match[1] || "0", 10);
                            const mins = parseInt(match[2] || "0", 10);
                            const secs = parseInt(match[3] || "0", 10);
                            durationSeconds = hours * 3600 + mins * 60 + secs;
                        }

                        // Create in DB
                        media = await prisma.media.create({
                            data: {
                                id: id,
                                externalId: videoId,
                                externalSource: "YOUTUBE",
                                mediaType: "YOUTUBE_VIDEO",
                                title: item.snippet.title,
                                description: item.snippet.description,
                                posterUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
                                releaseYear: new Date(item.snippet.publishedAt).getFullYear(),
                                runtimeMinutes: Math.floor(durationSeconds / 60) || null,
                                youtubeMetadata: {
                                    create: {
                                        channelId: item.snippet.channelId,
                                        channelName: item.snippet.channelTitle,
                                        videoId: videoId,
                                        isLiveStream: item.snippet.liveBroadcastContent !== "none",
                                        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
                                        likeCount: parseInt(item.statistics?.likeCount || "0", 10),
                                        durationSeconds,
                                        thumbnailUrl: item.snippet.thumbnails?.high?.url || null,
                                    }
                                }
                            },
                        }) as any; // Cast as any because the initial create doesn't include the counts

                        // Refetch to get the includes and counts
                        if (media) {
                            media = await prisma.media.findUnique({
                                where: { id: id },
                                include: {
                                    movieMetadata: true,
                                    tvShowMetadata: true,
                                    youtubeMetadata: true,
                                    songMetadata: true,
                                    _count: {
                                        select: { diaryEntries: true, reviews: true, listItems: true },
                                    },
                                },
                            });
                        }
                    }
                }
            }
        }


        // Lazy-load TMDB media
        if (!media && id.startsWith("tmdb-")) {
            const tmdbId = id.replace("tmdb-", "");
            const apiKey = config.tmdb.apiKey;
            if (apiKey) {
                // Try movie first
                let url = new URL(`${config.tmdb.baseUrl}/movie/${tmdbId}`);
                url.searchParams.set("api_key", apiKey);
                url.searchParams.set("append_to_response", "credits");
                let res = await fetch(url.toString());
                let data = await (res.ok ? res.json() : null);
                let type: "MOVIE" | "TV_SHOW" = "MOVIE";

                if (!res.ok || !data || data.status_code === 34) {
                    url = new URL(`${config.tmdb.baseUrl}/tv/${tmdbId}`);
                    url.searchParams.set("api_key", apiKey);
                    url.searchParams.set("append_to_response", "credits");
                    res = await fetch(url.toString());
                    data = await (res.ok ? res.json() : null);
                    type = "TV_SHOW";
                }

                if (data && res.ok) {
                    try {
                        media = await prisma.media.create({
                            data: {
                                id: id,
                                externalId: String(data.id),
                                externalSource: "TMDB",
                                mediaType: type,
                                title: type === "MOVIE" ? data.title : data.name,
                                description: data.overview || null,
                                posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                                releaseYear: data.release_date ? parseInt(data.release_date.split("-")[0]) : (data.first_air_date ? parseInt(data.first_air_date.split("-")[0]) : null),
                                runtimeMinutes: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || null,
                                genres: data.genres ? data.genres.map((g: any) => g.name) : [],
                                avgRating: 0.0,
                                ratingCount: 0,
                                movieMetadata: type === "MOVIE" ? {
                                    create: {
                                        tmdbId: String(data.id),
                                        director: data.credits?.crew?.find((c: any) => c.job === "Director")?.name || null,
                                        cast: data.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [],
                                        studio: data.production_companies?.[0]?.name || null,
                                        imdbId: data.imdb_id || null,
                                        tagline: data.tagline || null
                                    }
                                } : undefined,
                                tvShowMetadata: type === "TV_SHOW" ? {
                                    create: {
                                        tmdbId: String(data.id),
                                        seasonCount: data.number_of_seasons || 1,
                                        episodeCount: data.number_of_episodes || null,
                                        status: data.status || null,
                                        network: data.networks?.[0]?.name || null
                                    }
                                } : undefined
                            },
                            include: { movieMetadata: true, tvShowMetadata: true, _count: { select: { diaryEntries: true, reviews: true, listItems: true } } }
                        }) as any;
                    } catch (e) {
                        return res.status(500).json({ error: String(e) });
                    }
                } else {
                    console.error("TMDB API Error:", res.status, url.toString());
                }
            }
        }

        // Lazy-load Spotify media
        if (!media && id.startsWith("spotify-")) {
            const trackId = id.replace("spotify-", "");
            const { clientId, clientSecret } = config.spotify;
            if (clientId && clientSecret) {
                const creds = Buffer.from(clientId + ":" + clientSecret).toString("base64");
                let tokenRes = await fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
                    body: "grant_type=client_credentials"
                });

                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    let res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                        headers: { "Authorization": `Bearer ${tokenData.access_token}` }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        try {
                            media = await prisma.media.create({
                                data: {
                                    id: id,
                                    externalId: String(data.id),
                                    externalSource: "SPOTIFY",
                                    mediaType: "SONG",
                                    title: data.name,
                                    description: `By ${data.artists.map((a: any) => a.name).join(", ")} on ${data.album.name}`,
                                    posterUrl: data.album.images.length > 0 ? data.album.images[0].url : null,
                                    releaseYear: parseInt(data.album.release_date.split("-")[0]),
                                    runtimeMinutes: Math.round(data.duration_ms / 60000),
                                    avgRating: 0.0,
                                    ratingCount: 0,
                                    songMetadata: {
                                        create: {
                                            spotifyId: String(data.id),
                                            artist: data.artists.map((a: any) => a.name).join(", "),
                                            albumName: data.album.name
                                        }
                                    }
                                },
                                include: { songMetadata: true, _count: { select: { diaryEntries: true, reviews: true, listItems: true } } }
                            }) as any;
                        } catch (e) {
                            return res.status(500).json({ error: String(e) });
                        }
                    } else {
                        console.error("Spotify API error fetching track:", res.status);
                    }
                }
            }
        }

        if (!media) {
            res.status(404).json({ error: "Media not found" });
            return;
        }

        // Build normalized response
        const metadata =
            media.movieMetadata ||
            media.tvShowMetadata ||
            media.youtubeMetadata ||
            media.songMetadata ||
            null;

        res.json({
            ...media,
            movieMetadata: undefined,
            tvShowMetadata: undefined,
            youtubeMetadata: undefined,
            songMetadata: undefined,
            metadata,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

// GET /api/media — List media with filters
router.get("/", async (req: Request, res: Response) => {
    try {
        const {
            type,
            genre,
            year,
            sort = "createdAt",
            order = "desc",
            page = "1",
            limit = "20",
        } = req.query;

        const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
        const take = Math.min(parseInt(limit as string, 10), 50);

        const where: any = {};
        if (type) where.mediaType = type;
        if (genre) where.genres = { has: genre as string };
        if (year) where.releaseYear = parseInt(year as string, 10);

        const [media, total] = await Promise.all([
            prisma.media.findMany({
                where,
                orderBy: { [sort as string]: order } as any,
                skip,
                take,
                include: {
                    movieMetadata: true,
                    tvShowMetadata: true,
                    youtubeMetadata: true,
                    songMetadata: true,
                },
            }),
            prisma.media.count({ where }),
        ]);

        res.json({
            data: media,
            pagination: {
                page: parseInt(page as string, 10),
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch media" });
    }
});

export default router;
