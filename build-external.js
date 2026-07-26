const fs = require('fs');
let code = fs.readFileSync('apps/server/src/modules/search/routes.ts', 'utf8');

const tmdbApi = `
async function searchTMDB(query: string, type: "MOVIE" | "TV_SHOW", maxResults = 20) {
    const apiKey = config.tmdb.apiKey;
    if (!apiKey) return [];

    const endpoint = type === "MOVIE" ? "/search/movie" : "/search/tv";
    const url = new URL(\`\${config.tmdb.baseUrl}\${endpoint}\`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    if (!data.results) return [];

    return data.results.slice(0, maxResults).map((item: any) => ({
        id: \`tmdb-\${item.id}\`,
        externalId: String(item.id),
        mediaType: type,
        title: type === "MOVIE" ? item.title : item.name,
        description: item.overview || null,
        posterUrl: item.poster_path ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\` : null,
        releaseYear: item.release_date ? parseInt(item.release_date.split("-")[0]) : (item.first_air_date ? parseInt(item.first_air_date.split("-")[0]) : null),
        avgRating: 0,
        ratingCount: 0,
        _external: true
    }));
}
`;

const spotifyApi = `
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
            "Authorization": \`Basic \${credentials}\`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });
    
    if (!res.ok) return null;
    const data = await res.json();
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
        headers: { "Authorization": \`Bearer \${token}\` }
    });
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    if (!data.tracks || !data.tracks.items) return [];

    return data.tracks.items.map((item: any) => ({
        id: \`spotify-\${item.id}\`,
        externalId: String(item.id),
        mediaType: "SONG",
        title: item.name,
        description: \`By \${item.artists.map((a: any) => a.name).join(", ")} on \${item.album.name}\`,
        posterUrl: item.album.images.length > 0 ? item.album.images[0].url : null,
        releaseYear: parseInt(item.album.release_date.split("-")[0]),
        avgRating: 0,
        ratingCount: 0,
        _external: true
    }));
}
`;

// Insert the functions
code = code.replace('// ─── Local DB Search ────────────────────────────────────────', tmdbApi + '\n\n' + spotifyApi + '\n\n// ─── Local DB Search ────────────────────────────────────────');

// Overhaul route logic
const routerLogic = `
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
`;

code = code.replace(/if \(typeStr === "YOUTUBE_VIDEO"\) \{[\s\S]*\} else \{[\s\S]*?\n        \}/, routerLogic.trim());

fs.writeFileSync('apps/server/src/modules/search/routes.ts', code);
