import axios from "axios";

let API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://letterbox-production-5ec3.up.railway.app/api" : "/api");
if (API_BASE && !API_BASE.startsWith("http") && !API_BASE.startsWith("/")) {
    API_BASE = "https://" + API_BASE;
}
if (API_BASE && !API_BASE.endsWith("/api") && API_BASE !== "/api") {
    API_BASE = API_BASE.replace(/\/+$/, "") + "/api";
}

console.log("Using API Base:", API_BASE);

const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("mosiac_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
//ok hai


// Response interceptor — handle 401
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;

        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;

            const refreshToken = localStorage.getItem("mosiac_refresh_token");
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
                        refreshToken,
                    });
                    localStorage.setItem("mosiac_token", data.accessToken);
                    localStorage.setItem("mosiac_refresh_token", data.refreshToken);
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(original);
                } catch {
                    localStorage.removeItem("mosiac_token");
                    localStorage.removeItem("mosiac_refresh_token");
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(err);
    }
);

// --- Lightweight Client-Side GET Caching ---
// Prevents tab-flickering and unnecessary re-fetches when navigating back to recently loaded pages.
const originalGet = api.get;
const requestCache = new Map<string, { data: any, expiresAt: number, promise?: Promise<any> }>();

api.get = async function (url: string, config?: any) {
    // Generate a deterministic cache key based on URL and query params
    const key = url + JSON.stringify(config?.params || {});
    const cached = requestCache.get(key);

    // If we have a valid cache hit, instantly resolve to eliminate React's loading state flicker
    if (cached && Date.now() < cached.expiresAt) {
        if (cached.promise) {
            return cached.promise;
        }
        return Promise.resolve({ data: JSON.parse(JSON.stringify(cached.data)) }); // Deep clone to prevent state mutation bugs
    }

    // Capture the inflight promise to prevent simultaneous double-fetches
    const fetchPromise = originalGet.call(this, url, config).then(res => {
        requestCache.set(key, {
            data: JSON.parse(JSON.stringify(res.data)),
            expiresAt: Date.now() + (5 * 60 * 1000) // 5-minute TTL
        });
        return res;
    });

    requestCache.set(key, { data: null, expiresAt: Date.now() + (5 * 60 * 1000), promise: fetchPromise });

    return fetchPromise;
};

export default api;
