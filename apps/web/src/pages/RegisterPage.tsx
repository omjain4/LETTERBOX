import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../stores/auth-context";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(username, email, password, displayName || undefined);
            navigate("/");
        } catch (err: any) {
            const apiErr = err.response?.data?.error;
            const errMsg = typeof apiErr === 'string' ? apiErr : (apiErr?.message || err.message || "Registration failed");
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
        }}>
            <div className="card animate-fade-in" style={{
                width: "100%",
                maxWidth: 420,
                padding: 40,
            }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <Film size={36} style={{ color: "var(--color-primary)", marginBottom: 12 }} />
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        Start tracking all your media in one place
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171",
                        fontSize: "0.85rem",
                        marginBottom: 20,
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: 6, color: "var(--color-text-muted)" }}>
                            Username
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="cinephile42"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: 6, color: "var(--color-text-muted)" }}>
                            Display Name <span style={{ color: "var(--color-text-dim)" }}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: 6, color: "var(--color-text-muted)" }}>
                            Email
                        </label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, marginBottom: 6, color: "var(--color-text-muted)" }}>
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="input"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                style={{ paddingRight: 40 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "var(--color-text-dim)",
                                    cursor: "pointer",
                                    padding: 4,
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary glow"
                        disabled={loading}
                        style={{ width: "100%", padding: "12px", marginTop: 8 }}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
