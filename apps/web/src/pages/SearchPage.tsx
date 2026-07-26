import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, Film, Tv, Music, PlayCircle, Clapperboard, Loader2 } from "lucide-react";
import api from "../lib/api";
import { UserCard } from "../components/UserCard";

const MEDIA_FILTERS = [
    { label: "All", value: "", icon: null },
    { label: "Accounts", value: "USERS", icon: null },
    { label: "Movies", value: "MOVIE", icon: Film },
    { label: "TV Shows", value: "TV_SHOW", icon: Tv },
    { label: "YouTube", value: "YOUTUBE_VIDEO", icon: PlayCircle },
    { label: "Music", value: "SONG", icon: Music },
    { label: "Short Films", value: "SHORT_FILM", icon: Clapperboard },
];


export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [activeType, setActiveType] = useState(searchParams.get("type") || "");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const q = searchParams.get("q");
        const type = searchParams.get("type");
        if (q) setQuery(q);
        if (type) setActiveType(type);
        if (q) performSearch(q, type || "");
    }, [searchParams]);

    const performSearch = async (q: string, type: string) => {
        if (!q.trim()) return;
        setLoading(true);
        try {
            if (type === "USERS") {
                const { data } = await api.get("/users/search", { params: { q: q.trim() } });
                setResults(data);
                setTotal(data.length);
            } else {
                const params: any = { q: q.trim() };
                if (type) params.type = type;
                const { data } = await api.get("/search", { params });
                setResults(data.data);
                setTotal(data.pagination.total);
            }
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            const params: Record<string, string> = { q: query.trim() };
            if (activeType) params.type = activeType;
            setSearchParams(params);
        }
    };

    const handleTypeChange = (type: string) => {
        setActiveType(type);
        if (query.trim()) {
            const params: Record<string, string> = { q: query.trim() };
            if (type) params.type = type;
            setSearchParams(params);
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>
            {/* Search Header */}
            <div className="animate-fade-in">
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: 20 }}>
                    Search <span className="gradient-text">everything</span>
                </h1>

                <form onSubmit={handleSearch} style={{ position: "relative", marginBottom: 20 }}>
                    <SearchIcon size={20} style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text-dim)",
                        pointerEvents: "none",
                    }} />
                    <input
                        type="text"
                        className="input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for movies, shows, songs, videos..."
                        style={{
                            paddingLeft: 48,
                            height: 52,
                            fontSize: "1rem",
                            borderRadius: "var(--radius-lg)",
                            background: "var(--color-bg-card)",
                        }}
                        autoFocus
                    />
                </form>

                {/* Type Filters */}
                <div style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 32,
                    flexWrap: "wrap",
                }}>
                    {MEDIA_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => handleTypeChange(filter.value)}
                            className={`btn ${activeType === filter.value ? "btn-primary" : "btn-outline"}`}
                            style={{ fontSize: "0.8rem", padding: "8px 16px" }}
                        >
                            {filter.icon && <filter.icon size={14} />}
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--color-primary)" }}>
                    <Loader2 className="animate-spin" size={48} />
                </div>
            ) : activeType === "USERS" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {results.map((user) => (
                        <UserCard key={user.id} user={user} />
                    ))}
                    {results.length === 0 && query && (
                        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                            No users found matching "{query}"
                        </div>
                    )}
                </div>
            ) : results.length > 0 ? (
                <>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                        {total} result{total !== 1 ? "s" : ""} found
                    </p>
                    <div className="stagger-children" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 20,
                    }}>
                        {results.map((media) => (
                            <Link
                                key={media.id}
                                to={`/media/${media.id}`}
                                style={{ textDecoration: "none" }}
                            >
                                <div className="card" style={{ overflow: "hidden" }}>
                                    <div style={{
                                        aspectRatio: "2/3",
                                        background: "var(--color-bg-elevated)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                    }}>
                                        {media.posterUrl ? (
                                            <img
                                                src={media.posterUrl}
                                                alt={media.title}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <Film size={40} style={{ color: "var(--color-text-dim)" }} />
                                        )}
                                    </div>
                                    <div style={{ padding: 12 }}>
                                        <span className={`badge badge-${media.mediaType.toLowerCase()}`} style={{ marginBottom: 6 }}>
                                            {media.mediaType.replace("_", " ")}
                                        </span>
                                        <h3 style={{
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            marginTop: 6,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}>
                                            {media.title}
                                        </h3>
                                        {media.releaseYear && (
                                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                                                {media.releaseYear}
                                            </span>
                                        )}
                                        {media.avgRating > 0 && (
                                            <div style={{ marginTop: 4, fontSize: "0.8rem" }}>
                                                <span style={{ color: "var(--color-accent)" }}>★</span>{" "}
                                                <span style={{ fontWeight: 600 }}>{media.avgRating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            ) : query && !loading ? (
                <div style={{
                    textAlign: "center",
                    padding: 80,
                    color: "var(--color-text-muted)",
                }}>
                    <SearchIcon size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>No results found</p>
                    <p style={{ fontSize: "0.85rem", marginTop: 6 }}>
                        Try a different search term or filter
                    </p>
                </div>
            ) : (
                <div style={{
                    textAlign: "center",
                    padding: 80,
                    color: "var(--color-text-muted)",
                }}>
                    <SearchIcon size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Search for anything</p>
                    <p style={{ fontSize: "0.85rem", marginTop: 6 }}>
                        Movies, TV shows, YouTube videos, songs, albums...
                    </p>
                </div>
            )}

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
