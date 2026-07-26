import { Link } from "react-router-dom";
import { Film, Tv, Music, PlayCircle, Star, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "../stores/auth-context";

const MEDIA_CATEGORIES = [
    { icon: Film, label: "Movies", type: "MOVIE", color: "#6366f1" },
    { icon: Tv, label: "TV Shows", type: "TV_SHOW", color: "#8b5cf6" },
    { icon: PlayCircle, label: "YouTube", type: "YOUTUBE_VIDEO", color: "#ef4444" },
    { icon: Music, label: "Music", type: "SONG", color: "#10b981" },
];

const FEATURED_STATS = [
    { label: "Media Types", value: "7", icon: Sparkles },
    { label: "Track Everything", value: "∞", icon: TrendingUp },
    { label: "Rating System", value: "★", icon: Star },
];

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div>
            {/* Hero Section */}
            <section style={{
                minHeight: "70vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "60px 20px",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Background gradient orbs */}
                <div style={{
                    position: "absolute",
                    top: -200,
                    left: "25%",
                    width: 500,
                    height: 500,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute",
                    bottom: -150,
                    right: "20%",
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <div className="animate-fade-in" style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 16px",
                        borderRadius: 30,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        background: "var(--color-primary-glow)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        marginBottom: 24,
                    }}>
                        <Sparkles size={14} />
                        Track Every Media Type in One Place
                    </div>

                    <h1 style={{
                        fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: "-0.03em",
                        maxWidth: 800,
                        margin: "0 auto 20px",
                    }}>
                        Your Universal{" "}
                        <span className="gradient-text">Media Diary</span>
                    </h1>

                    <p style={{
                        fontSize: "clamp(1rem, 2vw, 1.2rem)",
                        color: "var(--color-text-muted)",
                        maxWidth: 600,
                        margin: "0 auto 36px",
                        lineHeight: 1.6,
                    }}>
                        Track, rate, and review movies, TV shows, music, YouTube videos, and more.
                        Build lists, follow friends, and discover what to experience next.
                    </p>

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        {user ? (
                            <>
                                <Link to="/search" className="btn btn-primary glow" style={{ fontSize: "1rem", padding: "14px 32px" }}>
                                    Explore Media
                                </Link>
                                <Link to="/diary" className="btn btn-outline" style={{ fontSize: "1rem", padding: "14px 32px" }}>
                                    Your Diary
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary glow" style={{ fontSize: "1rem", padding: "14px 32px" }}>
                                    Get Started Free
                                </Link>
                                <Link to="/login" className="btn btn-outline" style={{ fontSize: "1rem", padding: "14px 32px" }}>
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Strip */}
            <section style={{
                display: "flex",
                justifyContent: "center",
                gap: 48,
                padding: "40px 20px",
                flexWrap: "wrap",
            }}>
                {FEATURED_STATS.map((stat) => (
                    <div key={stat.label} className="animate-slide-up" style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                    }}>
                        <stat.icon size={28} style={{ color: "var(--color-primary)" }} />
                        <span style={{ fontSize: "2rem", fontWeight: 800 }}>{stat.value}</span>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{stat.label}</span>
                    </div>
                ))}
            </section>

            {/* Media Categories */}
            <section style={{
                maxWidth: 1000,
                margin: "0 auto",
                padding: "60px 20px",
            }}>
                <h2 style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    textAlign: "center",
                    marginBottom: 40,
                    letterSpacing: "-0.02em",
                }}>
                    One platform for <span className="gradient-text">all your media</span>
                </h2>

                <div className="stagger-children" style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                }}>
                    {MEDIA_CATEGORIES.map((cat) => (
                        <Link
                            key={cat.type}
                            to={`/search?type=${cat.type}`}
                            className="card glass-hover"
                            style={{
                                padding: 28,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 14,
                                textDecoration: "none",
                                cursor: "pointer",
                            }}
                        >
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: `${cat.color}18`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid ${cat.color}30`,
                            }}>
                                <cat.icon size={24} style={{ color: cat.color }} />
                            </div>
                            <span style={{
                                fontWeight: 600,
                                fontSize: "1rem",
                                color: "var(--color-text)",
                            }}>
                                {cat.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{
                maxWidth: 1000,
                margin: "0 auto",
                padding: "60px 20px 80px",
            }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 24,
                }}>
                    {[
                        {
                            title: "📔 Diary Logging",
                            desc: "Log any media on a specific date with ratings, reviews, and tags. Track your entire media journey.",
                        },
                        {
                            title: "📋 Mixed Lists",
                            desc: "Create ranked lists mixing movies, songs, videos, and shows. Share your best-of lists with friends.",
                        },
                        {
                            title: "👥 Social Feed",
                            desc: "See what friends are watching, listening to, and reviewing in real-time.",
                        },
                    ].map((feat) => (
                        <div key={feat.title} className="card" style={{ padding: 28 }}>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 10 }}>{feat.title}</h3>
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: "1px solid var(--color-border)",
                padding: "30px 20px",
                textAlign: "center",
                color: "var(--color-text-dim)",
                fontSize: "0.8rem",
            }}>
                © 2026 Letterbox — Track Everything You Experience
            </footer>
        </div>
    );
}
