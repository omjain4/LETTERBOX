import axios from "axios";

let API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://letterbox-production-2483.up.railway.app/api" : "/api");
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
    const token = localStorage.getItem("letterbox_token");
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

            const refreshToken = localStorage.getItem("letterbox_refresh_token");
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
                        refreshToken,
                    });
                    localStorage.setItem("letterbox_token", data.accessToken);
                    localStorage.setItem("letterbox_refresh_token", data.refreshToken);
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(original);
                } catch {
                    localStorage.removeItem("letterbox_token");
                    localStorage.removeItem("letterbox_refresh_token");
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(err);
    }
);

export default api;
