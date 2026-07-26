// ─── Media Type Enum ────────────────────────────────────────

export enum MediaType {
    MOVIE = "MOVIE",
    TV_SHOW = "TV_SHOW",
    SHORT_FILM = "SHORT_FILM",
    YOUTUBE_VIDEO = "YOUTUBE_VIDEO",
    YOUTUBE_STREAM = "YOUTUBE_STREAM",
    SONG = "SONG",
    ALBUM = "ALBUM",
}

export enum ExternalSource {
    TMDB = "TMDB",
    YOUTUBE = "YOUTUBE",
    SPOTIFY = "SPOTIFY",
    MUSICBRAINZ = "MUSICBRAINZ",
    MANUAL = "MANUAL",
}

export enum ActivityType {
    DIARY_ENTRY = "DIARY_ENTRY",
    REVIEW = "REVIEW",
    LIST_CREATED = "LIST_CREATED",
    LIST_UPDATED = "LIST_UPDATED",
    FOLLOW = "FOLLOW",
    LIKE = "LIKE",
}

// ─── Response Types ─────────────────────────────────────────

export interface MediaResponse {
    id: string;
    mediaType: MediaType;
    externalId: string;
    externalSource: ExternalSource;
    title: string;
    description: string | null;
    posterUrl: string | null;
    backdropUrl: string | null;
    releaseYear: number | null;
    genres: string[];
    runtimeMinutes: number | null;
    avgRating: number;
    ratingCount: number;
    metadata: MovieMetadataResponse | TVShowMetadataResponse | YouTubeMetadataResponse | SongMetadataResponse | null;
}

export interface MovieMetadataResponse {
    type: "movie";
    director: string | null;
    cast: string[];
    studio: string | null;
    tmdbId: string | null;
    imdbId: string | null;
    tagline: string | null;
}

export interface TVShowMetadataResponse {
    type: "tvshow";
    seasonCount: number | null;
    episodeCount: number | null;
    status: string | null;
    network: string | null;
}

export interface YouTubeMetadataResponse {
    type: "youtube";
    channelId: string | null;
    channelName: string | null;
    videoId: string;
    isLiveStream: boolean;
    viewCount: number | null;
    durationSeconds: number | null;
}

export interface SongMetadataResponse {
    type: "song";
    artist: string | null;
    albumName: string | null;
    spotifyId: string | null;
    durationMs: number | null;
    previewUrl: string | null;
}

export interface UserResponse {
    id: string;
    username: string;
    email?: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
}

export interface DiaryEntryResponse {
    id: string;
    userId: string;
    mediaId: string;
    watchedDate: string;
    rating: number | null;
    review: string | null;
    tags: string[];
    liked: boolean;
    media: Pick<MediaResponse, "id" | "title" | "mediaType" | "posterUrl">;
}

export interface ListResponse {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    isRanked: boolean;
    items: ListItemResponse[];
}

export interface ListItemResponse {
    id: string;
    mediaId: string;
    position: number;
    notes: string | null;
    media: Pick<MediaResponse, "id" | "title" | "mediaType" | "posterUrl">;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AuthResponse {
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
}

// ─── API Routes ─────────────────────────────────────────────

export const API_ROUTES = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        REFRESH: "/api/auth/refresh",
        ME: "/api/auth/me",
    },
    MEDIA: {
        LIST: "/api/media",
        DETAIL: (id: string) => `/api/media/${id}`,
    },
    SEARCH: {
        QUERY: "/api/search",
    },
    DIARY: {
        LIST: "/api/diary",
        CREATE: "/api/diary",
        DETAIL: (id: string) => `/api/diary/${id}`,
        UPDATE: (id: string) => `/api/diary/${id}`,
        DELETE: (id: string) => `/api/diary/${id}`,
    },
    LISTS: {
        LIST: "/api/lists",
        CREATE: "/api/lists",
        DETAIL: (id: string) => `/api/lists/${id}`,
        ADD_ITEM: (id: string) => `/api/lists/${id}/items`,
        REORDER: (id: string) => `/api/lists/${id}/reorder`,
        DELETE: (id: string) => `/api/lists/${id}`,
        REMOVE_ITEM: (listId: string, itemId: string) => `/api/lists/${listId}/items/${itemId}`,
    },
    USERS: {
        PROFILE: (username: string) => `/api/users/${username}`,
        DIARY: (username: string) => `/api/users/${username}/diary`,
    },
} as const;

// ─── Media Type Labels ─────────────────────────────────────

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
    [MediaType.MOVIE]: "Movie",
    [MediaType.TV_SHOW]: "TV Show",
    [MediaType.SHORT_FILM]: "Short Film",
    [MediaType.YOUTUBE_VIDEO]: "YouTube Video",
    [MediaType.YOUTUBE_STREAM]: "YouTube Stream",
    [MediaType.SONG]: "Song",
    [MediaType.ALBUM]: "Album",
};

export const MEDIA_TYPE_ICONS: Record<MediaType, string> = {
    [MediaType.MOVIE]: "🎬",
    [MediaType.TV_SHOW]: "📺",
    [MediaType.SHORT_FILM]: "🎞️",
    [MediaType.YOUTUBE_VIDEO]: "▶️",
    [MediaType.YOUTUBE_STREAM]: "🔴",
    [MediaType.SONG]: "🎵",
    [MediaType.ALBUM]: "💿",
};
