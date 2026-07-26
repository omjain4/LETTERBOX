import { Link } from "react-router-dom";
import { Film, Tv, Music, PlayCircle } from "lucide-react";
import { useAuth } from "../stores/auth-context";

const MEDIA_CATEGORIES = [
    { icon: Film, label: "Movies", type: "MOVIE", color: "#DA291C" },
    { icon: Tv, label: "TV Shows", type: "TV_SHOW", color: "#111111" },
    { icon: PlayCircle, label: "YouTube", type: "YOUTUBE_VIDEO", color: "#DA291C" },
    { icon: Music, label: "Music", type: "SONG", color: "#111111" },
];

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div>
            {/* Hero Section */}
            <section style={{
                minHeight: "75vh",
                background: "var(--color-bg-dark)",
                color: "var(--color-text-invert)",
                display: "flex",
                flexDirection: "column",
                padding: "80px 20px",
                position: "relative",
                borderBottom: "4px solid var(--color-border)",
            }}>
                <div style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    width: "100%",
                }} className="animate-fade-in">
                    <div style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                        letterSpacing: "0.15em",
                        marginBottom: 16,
                        textTransform: "uppercase"
                    }}>
                        Official Media Tracking Portal
                    </div>

                    <h1 style={{
                        fontSize: "clamp(4rem, 10vw, 8rem)",
                        fontWeight: 800,
                        lineHeight: 0.9,
                        letterSpacing: "-0.02em",
                        margin: "0 0 24px -6px", // align with edge
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
                        {user ? (
                            <>
                                <Link to="/search" className="btn btn-primary" style={{ padding: "16px 36px", fontSize: "1.1rem" }}>
                                    EXPLORE MEDIA
                                </Link>
                                <Link to="/diary" className="btn btn-outline" style={{ background: "transparent", color: "white", padding: "16px 36px", fontSize: "1.1rem" }}>
                                    YOUR DIARY
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary" style={{ padding: "16px 36px", fontSize: "1.1rem" }}>
                                    START TRACKING
                                </Link>
                                <Link to="/login" className="btn btn-outline" style={{ background: "transparent", color: "white", padding: "16px 36px", fontSize: "1.1rem" }}>
                                    SIGN IN
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Split Process & Latest Section */}
            <section style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                borderBottom: "4px solid var(--color-border)",
            }}>
                {/* How It Works */}
                <div style={{
                    padding: "60px 40px",
                    background: "var(--color-bg)",
                    borderRight: "4px solid var(--color-border)",
                }}>
                    <div style={{ color: "var(--color-primary)", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.9rem", marginBottom: 8, textTransform: "uppercase" }}>Process</div>
                    <h2 style={{ fontSize: "3rem", marginBottom: 40, lineHeight: 1 }}>HOW IT WORKS</h2>

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
                    padding: "60px 40px",
                    background: "white",
                }}>
                    <div style={{ color: "var(--color-primary)", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.9rem", marginBottom: 8, textTransform: "uppercase" }}>Categories</div>
                    <h2 style={{ fontSize: "3rem", marginBottom: 40, lineHeight: 1 }}>SUPPORTED MEDIA</h2>

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
                <p style={{ color: "#AAAAAA", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.1em" }}>© 2026 Letterbox — The Official Tracker</p>
            </footer>
        </div>
    );
}
