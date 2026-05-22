import axios from "axios";
import {
    clearAuth,
    getAccessToken,
    getRefreshToken,
    updateStoredTokens
} from "../utils/authStorage";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 15000
});

let refreshPromise = null;

const redirectToLogin = () => {
    const currentPath = window.location.pathname;

    if (!currentPath.startsWith("/login") && !currentPath.startsWith("/register")) {
        window.location.href = "/login";
    }
};

const refreshTokens = async () => {
    if (!refreshPromise) {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
            return null;
        }

        refreshPromise = axios
            .post(`${API.defaults.baseURL}/api/auth/refresh`, { refreshToken }, {
                headers: { "Content-Type": "application/json" },
                timeout: API.defaults.timeout
            })
            .then((response) => {
                updateStoredTokens(response.data.data);
                return response.data.data.accessToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

API.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();

        if (accessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isUnauthorized = error.response?.status === 401;
        const isPublicAuthRequest =
            originalRequest?.url?.includes("/api/auth/login") ||
            originalRequest?.url?.includes("/api/auth/register");

        if (
            isUnauthorized &&
            originalRequest &&
            !originalRequest._retry &&
            !isPublicAuthRequest
        ) {
            originalRequest._retry = true;

            try {
                const accessToken = await refreshTokens();

                if (accessToken) {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return API(originalRequest);
                }
            } catch {
                // Refresh failure falls through to shared cleanup below.
            }

            clearAuth();
            redirectToLogin();
        }

        return Promise.reject(error);
    }
);

export default API;
