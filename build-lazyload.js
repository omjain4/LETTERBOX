const fs = require('fs');
let code = fs.readFileSync('apps/server/src/modules/media/routes.ts', 'utf8');

const additionalLazyLoad = `
        // Lazy-load TMDB media
        if (!media && id.startsWith("tmdb-")) {
            const tmdbId = id.replace("tmdb-", "");
            const apiKey = config.tmdb.apiKey;
            if (apiKey) {
                // Try movie first
                let url = new URL(\`\${config.tmdb.baseUrl}/movie/\${tmdbId}\`);
                url.searchParams.set("api_key", apiKey);
                let res = await fetch(url.toString());
                let data = await (res.ok ? res.json() : null);
                let type: "MOVIE" | "TV_SHOW" = "MOVIE";

                if (!res.ok || !data || data.status_code === 34) {
                    // Try TV
                    url = new URL(\`\${config.tmdb.baseUrl}/tv/\${tmdbId}\`);
                    url.searchParams.set("api_key", apiKey);
                    res = await fetch(url.toString());
                    data = await (res.ok ? res.json() : null);
                    type = "TV_SHOW";
                }

                if (data && res.ok) {
                    media = await prisma.media.create({
                        data: {
                            id: id,
                            mediaType: type,
                            title: type === "MOVIE" ? data.title : data.name,
                            description: data.overview || null,
                            posterUrl: data.poster_path ? \`https://image.tmdb.org/t/p/w500\${data.poster_path}\` : null,
                            releaseYear: data.release_date ? parseInt(data.release_date.split("-")[0]) : (data.first_air_date ? parseInt(data.first_air_date.split("-")[0]) : null),
                            runtimeMinutes: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || null,
                            genres: data.genres ? data.genres.map((g: any) => g.name) : [],
                            avgRating: 0.0,
                            ratingCount: 0,
                            movieMetadata: type === "MOVIE" ? {
                                create: {
                                    tmdbId: String(data.id),
                                    director: null // We could fetch credits but keep it simple
                                }
                            } : undefined,
                            tvShowMetadata: type === "TV_SHOW" ? {
                                create: {
                                    tmdbId: String(data.id),
                                    seasons: data.number_of_seasons || 1
                                }
                            } : undefined
                        },
                        include: { movieMetadata: true, tvShowMetadata: true, _count: { select: { diaryEntries: true, reviews: true, listItems: true } } }
                    }) as any;
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
                    headers: { "Authorization": \`Basic \${creds}\`, "Content-Type": "application/x-www-form-urlencoded" },
                    body: "grant_type=client_credentials"
                });
                
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    let res = await fetch(\`https://api.spotify.com/v1/tracks/\${trackId}\`, {
                        headers: { "Authorization": \`Bearer \${tokenData.access_token}\` }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        media = await prisma.media.create({
                            data: {
                                id: id,
                                mediaType: "SONG",
                                title: data.name,
                                description: \`By \${data.artists.map((a: any) => a.name).join(", ")} on \${data.album.name}\`,
                                posterUrl: data.album.images.length > 0 ? data.album.images[0].url : null,
                                releaseYear: parseInt(data.album.release_date.split("-")[0]),
                                runtimeMinutes: Math.round(data.duration_ms / 60000),
                                avgRating: 0.0,
                                ratingCount: 0,
                                songMetadata: {
                                    create: {
                                        spotifyId: String(data.id),
                                        artist: data.artists.map((a: any) => a.name).join(", "),
                                        album: data.album.name
                                    }
                                }
                            },
                            include: { songMetadata: true, _count: { select: { diaryEntries: true, reviews: true, listItems: true } } }
                        }) as any;
                    }
                }
            }
        }
`;

code = code.replace('if (!media) {', additionalLazyLoad + '\n        if (!media) {');
fs.writeFileSync('apps/server/src/modules/media/routes.ts', code);
