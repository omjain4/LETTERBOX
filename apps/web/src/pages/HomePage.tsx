import { Link } from "react-router-dom";
import { Film, Tv, Music, PlayCircle, Star, Loader2 } from "lucide-react";
import { useAuth } from "../stores/auth-context";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { format } from "date-fns";

const MEDIA_CATEGORIES = [
    { icon: Film, label: "Movies", type: "MOVIE", color: "#DA291C" },
    { icon: Tv, label: "TV Shows", type: "TV_SHOW", color: "#111111" },
    { icon: PlayCircle, label: "YouTube", type: "YOUTUBE_VIDEO", color: "#DA291C" },
    { icon: Music, label: "Music", type: "SONG", color: "#111111" },
];

export default function HomePage() {
    const { user } = useAuth();
    const [feed, setFeed] = useState<any[]>([]);
    const [popularMedia, setPopularMedia] = useState<any[]>([]);
    const [loadingPopular, setLoadingPopular] = useState(false);

    useEffect(() => {
        if (user) {
            api.get("/users/feed")
                .then(res => setFeed(res.data))
                .catch(console.error);

            setLoadingPopular(true);
            api.get("/media?sort=ratingCount&order=desc&limit=5")
                .then(res => setPopularMedia(res.data.data || []))
                .catch(console.error)
                .finally(() => setLoadingPopular(false));
        }
    }, [user]);

    if (user) {
        return (
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
                <h1 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 400, color: "var(--color-text-muted)", marginBottom: 40 }}>
                    Welcome back, <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{user.username}</span>. Here's what your friends have been watching...
                </h1>

                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: 8, marginBottom: 16 }}>
                        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", margin: 0 }}>
                            NEW FROM FRIENDS
                        </h3>
                        <Link to="/activity" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", textDecoration: "none" }}>
                            ⚡ ALL ACTIVITY
                        </Link>
                    </div>

                    {feed.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                            <p>No recent activity from your friends.</p>
                            <Link to="/search" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Find users to follow</Link>
                        </div>
                    ) : (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                            gap: 16
                        }}>
                            {feed.slice(0, 5).map(entry => (
                                <div key={entry.id} style={{ display: "flex", flexDirection: "column" }}>
                                    <Link to={`/media/${entry.media.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                        <div style={{
                                            aspectRatio: "2/3",
                                            background: "var(--color-bg)",
                                            backgroundImage: `url(${entry.media.posterUrl})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            border: "2px solid var(--color-border)",
                                            position: "relative"
                                        }}>
                                            {/* Avatar overlay at the bottom */}
                                            <div style={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                background: "rgba(0,0,0,0.7)",
                                                padding: "6px 8px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                borderTop: "1px solid var(--color-border)"
                                            }}>
                                                <div style={{
                                                    width: 16, height: 16, borderRadius: "50%",
                                                    background: entry.user.avatarUrl ? `url(${entry.user.avatarUrl}) center/cover` : "var(--color-primary)",
                                                    border: "1px solid rgba(255,255,255,0.2)"
                                                }} />
                                                <span style={{ fontSize: "0.75rem", color: "white", fontWeight: 600 }}>{entry.user.username}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 2px" }}>
                                        <div style={{ display: "flex", color: "#00E054" }}>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} size={12} fill={entry.rating && i < entry.rating ? "currentColor" : "none"} strokeWidth={entry.rating && i < entry.rating ? 0 : 1} stroke="currentColor" />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                            {format(new Date(entry.createdAt), "MMM d")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Popular Section (Placeholder for aesthetic) */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: 8, marginBottom: 16 }}>
                        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", margin: 0 }}>
                            POPULAR ON MOSIAC
                        </h3>
                        <Link to="/search" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", textDecoration: "none" }}>
                            MORE
                        </Link>
                    </div>
                    {loadingPopular ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "var(--color-primary)" }}>
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : popularMedia.length === 0 ? (
                        <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                            Check out the <Link to="/search" style={{ color: "var(--color-primary)" }}>Explore</Link> page to find popular items.
                        </div>
                    ) : (
                        <div className="stagger-children" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: 20,
                        }}>
                            {popularMedia.map((media) => (
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
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section */}
            <section style={{
                minHeight: "75vh",
                background: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop') center/cover no-repeat",
                color: "var(--color-text-invert)",
                display: "flex",
                flexDirection: "column",
                padding: "80px 20px",
                position: "relative",
                borderBottom: "4px solid var(--color-border)",
            }}>
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(17, 17, 17, 0.85)", // dark overlay
                    zIndex: 0
                }} />
                <div style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    width: "100%",
                    position: "relative", // Ensures it stays above the overlay
                    zIndex: 1
                }} className="animate-fade-in">
                    <div style={{
                        fontSize: "clamp(0.8rem, 3vw, 1rem)",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                        letterSpacing: "0.15em",
                        marginBottom: 16,
                        textTransform: "uppercase"
                    }}>
                        Official Media Tracking Portal
                    </div>

                    <h1 style={{
                        fontSize: "clamp(2.5rem, 15vw, 8rem)",
                        fontWeight: 800,
                        lineHeight: 0.9,
                        letterSpacing: "-0.02em",
                        margin: "0 0 24px -2px", // align with edge
                        color: "var(--color-text-invert)",
                    }}>
                        TRACK<br />
                        <span style={{ color: "var(--color-primary)" }}>EVERY</span><br />
                        MEDIA
                    </h1>

                    <p style={{
                        fontSize: "clamp(1rem, 2vw, 1.25rem)",
                        color: "#AAAAAA",
                        maxWidth: 600,
                        marginBottom: 48,
                        lineHeight: 1.6,
                        fontWeight: 500,
                        textTransform: "uppercase",
                    }}>
                        Log, rate, and review movies, shows, music, and videos. Share your taste with the world.
                    </p>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", zIndex: 10, position: "relative" }}>
                        <>
                            <Link to="/register" className="btn btn-primary" style={{ padding: "16px 36px", fontSize: "1.1rem" }}>
                                START TRACKING
                            </Link>
                            <Link to="/login" className="btn btn-outline" style={{ background: "transparent", color: "white", padding: "16px 36px", fontSize: "1.1rem" }}>
                                SIGN IN
                            </Link>
                        </>
                    </div>
                </div>
            </section>

            {/* Split Process & Latest Section */}
            <section style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
                borderBottom: "4px solid var(--color-border)",
            }}>
                {/* How It Works */}
                <div style={{
                    padding: "clamp(30px, 5vw, 60px) clamp(20px, 5vw, 40px)",
                    background: "var(--color-bg)",
                    borderRight: "4px solid var(--color-border)",
                }}>
                    <div style={{ color: "var(--color-primary)", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.9rem", marginBottom: 8, textTransform: "uppercase" }}>Process</div>
                    <h2 style={{ fontSize: "clamp(2rem, 8vw, 3rem)", marginBottom: 40, lineHeight: 1 }}>HOW IT WORKS</h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {[
                            { step: "01", title: "FIND MEDIA", desc: "Search across movies, TV, songs, and YouTube." },
                            { step: "02", title: "LOG IT", desc: "Add to your diary with a star rating and review." },
                            { step: "03", title: "BUILD LISTS", desc: "Curate cross-media lists and rank favorites." },
                            { step: "04", title: "SHARE", desc: "Follow friends and see their real-time feed." },
                        ].map((item) => (
                            <div key={item.step} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", lineHeight: 0.9 }}>
                                    {item.step}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.2rem", marginBottom: 4 }}>{item.title}</h3>
                                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", textTransform: "uppercase", fontWeight: 500 }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div style={{
                    padding: "clamp(30px, 5vw, 60px) clamp(20px, 5vw, 40px)",
                    background: "white",
                }}>
                    <div style={{ color: "var(--color-primary)", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.9rem", marginBottom: 8, textTransform: "uppercase" }}>Categories</div>
                    <h2 style={{ fontSize: "clamp(2rem, 8vw, 3rem)", marginBottom: 40, lineHeight: 1 }}>SUPPORTED MEDIA</h2>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 16,
                    }}>
                        {MEDIA_CATEGORIES.map((cat) => (
                            <Link
                                key={cat.type}
                                to={`/search?type=${cat.type}`}
                                style={{
                                    padding: "20px 24px",
                                    border: "2px solid var(--color-border)",
                                    boxShadow: "4px 4px 0px var(--color-border)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    textDecoration: "none",
                                    background: "white",
                                    color: "var(--color-text)",
                                    transition: "transform 0.1s",
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "translate(-2px, -2px)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "translate(0px, 0px)"}
                            >
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: cat.color === "#DA291C" ? "var(--color-primary)" : "var(--color-bg-dark)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    flexShrink: 0,
                                }}>
                                    <cat.icon size={24} />
                                </div>
                                <span style={{
                                    fontWeight: 800,
                                    fontSize: "1.2rem",
                                    fontFamily: "var(--font-display)",
                                    textTransform: "uppercase"
                                }}>
                                    {cat.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Huge Stats Strip */}
            <section style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                background: "white",
                borderBottom: "4px solid var(--color-border)",
            }}>
                {[
                    { label: "MOVIES LOGGED", value: "∞" },
                    { label: "TV EPISODES", value: "∞" },
                    { label: "SONGS TRACKED", value: "∞" },
                    { label: "YOUTUBE VIDEOS", value: "∞" },
                ].map((stat) => (
                    <div key={stat.label} style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        borderRight: "2px solid var(--color-border)",
                    }}>
                        <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--color-primary)", lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{stat.label}</div>
                    </div>
                ))}
            </section>

            {/* Footer */}
            <footer style={{
                background: "var(--color-bg-dark)",
                color: "var(--color-text-invert)",
                padding: "60px 40px",
                textAlign: "center",
            }}>
                <h2 style={{ fontSize: "clamp(3rem, 8vw, 5rem)", letterSpacing: "-0.02em", color: "white", marginBottom: 20 }}>HELP YOUR CULTURE</h2>
                <p style={{ color: "#AAAAAA", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.1em" }}>© 2026 MOSIAC — The Official Tracker</p>
            </footer>
        </div>
    );
}
