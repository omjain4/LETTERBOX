import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut, Menu, X } from "lucide-react";
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
        <nav style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "var(--color-bg-dark)",
            color: "var(--color-text-invert)",
            borderBottom: "4px solid var(--color-border)",
            boxShadow: "0px 4px 0px var(--color-border)"
        }}>
            <div style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: "0 clamp(10px, 3vw, 20px)",
                height: 72, // taller for brutalist feel
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "clamp(8px, 2vw, 24px)",
            }}>
                {/* Logo */}
                <Link to="/" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(6px, 1.5vw, 12px)",
                    textDecoration: "none",
                    flexShrink: 0,
                    color: "var(--color-text-invert)",
                }}>
                    <img
                        src="/mosiac-logo.png"
                        alt="MOSIAC Logo"
                        style={{
                            width: 32,
                            height: 32,
                            objectFit: 'contain',
                            display: 'block'
                        }}
                    />
                    <span style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(1.1rem, 4vw, 1.75rem)",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                    }}>
                        MOSIAC
                    </span>
                </Link>

                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{
                    flex: 1,
                    maxWidth: 300,
                    minWidth: 0,
                    position: "relative",
                    display: "flex",
                }}>
                    <Search size={18} style={{
                        position: "absolute",
                        left: "clamp(8px, 2vw, 16px)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text)",
                        pointerEvents: "none",
                    }} />
                    <input
                        type="text"
                        placeholder="SEARCH..." // Shorter for mobile
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input"
                        style={{
                            paddingLeft: "clamp(32px, 8vw, 44px)",
                            paddingRight: 8,
                            background: "var(--color-bg)",
                            borderRadius: 0,
                            border: "2px solid var(--color-border)",
                            boxShadow: "4px 4px 0px var(--color-border)",
                            fontWeight: 600,
                            height: 44,
                            width: "100%",
                            minWidth: 0,
                            fontSize: "1rem"
                        }}
                    />
                </form>

                {/* Desktop Nav */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }} className="hidden-mobile">
                    {user ? (
                        <>
                            <Link to="/" className="btn btn-outline" style={{ background: "var(--color-bg-card)", border: "none" }}>
                                ACTIVITY
                            </Link>
                            <Link to="/explore" className="btn btn-outline" style={{ background: "var(--color-bg-card)", border: "none" }}>
                                EXPLORE
                            </Link>
                            <Link to="/diary" className="btn btn-primary">
                                DIARY
                            </Link>
                            <Link to="/lists" className="btn btn-outline" style={{ background: "var(--color-bg-card)" }}>
                                LISTS
                            </Link>
                            <Link to={`/profile/${user.username}`} className="btn btn-ghost" style={{
                                color: "var(--color-text-invert)"
                            }}>
                                <User size={18} />
                                {user.username}
                            </Link>
                            <button onClick={logout} className="btn btn-ghost" style={{ color: "var(--color-primary)" }}>
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost" style={{ color: "var(--color-text-invert)", textShadow: "none" }}>
                                SIGN IN
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{ boxShadow: "4px 4px 0px var(--color-primary-hover)" }}>
                                SIGN UP
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="btn btn-primary mobile-only"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ padding: "8px 12px" }}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    padding: "20px",
                    borderTop: "4px solid var(--color-border)",
                    borderBottom: "4px solid var(--color-border)",
                    background: "var(--color-bg-dark)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    zIndex: 45,
                }}>
                    {user ? (
                        <>
                            <Link to="/" className="btn btn-outline" style={{ background: "white", justifyContent: "flex-start", border: "none" }} onClick={() => setMobileMenuOpen(false)}>ACTIVITY</Link>
                            <Link to="/explore" className="btn btn-outline" style={{ background: "white", justifyContent: "flex-start", border: "none" }} onClick={() => setMobileMenuOpen(false)}>EXPLORE</Link>
                            <Link to="/diary" className="btn btn-primary" style={{ justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>DIARY</Link>
                            <Link to="/lists" className="btn btn-outline" style={{ background: "white", justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>LISTS</Link>
                            <Link to={`/profile/${user.username}`} className="btn btn-ghost" style={{ color: "white", justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>PROFILE</Link>
                            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-ghost" style={{ color: "var(--color-primary)", justifyContent: "flex-start" }}>LOGOUT</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-outline" style={{ background: "white", justifyContent: "flex-start" }} onClick={() => setMobileMenuOpen(false)}>SIGN IN</Link>
                            <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>SIGN UP</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
