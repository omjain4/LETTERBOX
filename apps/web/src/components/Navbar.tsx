import { Link, useNavigate } from "react-router-dom";
import { Search, Film, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../stores/auth-context";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    return (
        <nav className="glass" style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            borderBottom: "1px solid var(--color-border)",
        }}>
            <div style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "0 20px",
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
            }}>
                {/* Logo */}
                <Link to="/" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    flexShrink: 0,
                }}>
                    <Film size={26} strokeWidth={2.5} style={{ color: "var(--color-primary)" }} />
                    <span style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                    }} className="gradient-text">
                        Letterbox
                    </span>
                </Link>

                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{
                    flex: 1,
                    maxWidth: 480,
                    position: "relative",
                    display: "flex",
                }}>
                    <Search size={16} style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text-dim)",
                        pointerEvents: "none",
                    }} />
                    <input
                        type="text"
                        placeholder="Search movies, shows, songs, videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input"
                        style={{
                            paddingLeft: 36,
                            background: "var(--color-bg-elevated)",
                            borderRadius: 30,
                            fontSize: "0.85rem",
                            height: 40,
                        }}
                    />
                </form>

                {/* Desktop Nav */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }} className="hidden-mobile">
                    {user ? (
                        <>
                            <Link to="/diary" className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
                                Diary
                            </Link>
                            <Link to="/lists" className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
                                Lists
                            </Link>
                            <Link to={`/profile/${user.username}`} className="btn btn-ghost" style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: "0.85rem",
                            }}>
                                <User size={16} />
                                {user.username}
                            </Link>
                            <button onClick={logout} className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
                                Sign In
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="btn btn-ghost mobile-only"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ padding: 8 }}
                >
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
                <div style={{
                    padding: "12px 20px 20px",
                    borderTop: "1px solid var(--color-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}>
                    {user ? (
                        <>
                            <Link to="/diary" className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>Diary</Link>
                            <Link to="/lists" className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>Lists</Link>
                            <Link to={`/profile/${user.username}`} className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost" style={{ justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                            <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
