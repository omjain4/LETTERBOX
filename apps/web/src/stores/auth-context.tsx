import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import api from "../lib/api";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string,
        displayName?: string
    ) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("letterbox_token");
        if (token) {
            api
                .get("/auth/me")
                .then(({ data }) => setUser(data.user))
                .catch(() => {
                    localStorage.removeItem("letterbox_token");
                    localStorage.removeItem("letterbox_refresh_token");
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("letterbox_token", data.accessToken);
        localStorage.setItem("letterbox_refresh_token", data.refreshToken);
        setUser(data.user);
    };

    const register = async (
        username: string,
        email: string,
        password: string,
        displayName?: string
    ) => {
        const { data } = await api.post("/auth/register", {
            username,
            email,
            password,
            displayName,
        });
        localStorage.setItem("letterbox_token", data.accessToken);
        localStorage.setItem("letterbox_refresh_token", data.refreshToken);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("letterbox_token");
        localStorage.removeItem("letterbox_refresh_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
