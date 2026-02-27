import axios from "axios";

// ========================
// Environmental Variables
// ========================
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Enhanced Axios Client for Laravel API
 * Automatically handles CSRF and Authorization Tokens
 */
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    withCredentials: true, // Required for Sanctum CSRF cookies if tracking stateful sessions
});

// Interceptor to attach Authorization Bearer token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Optional: Interceptor to handle global 401 Unauthorized errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Option to trigger logout or redirect here globally
            // localStorage.removeItem('auth_token');
            // window.location.href = '/login';
        }

        // Handle archived/deactivated users — backend returns 403 with ACCOUNT_DEACTIVATED
        if (
            error.response?.status === 403 &&
            error.response?.data?.error === 'ACCOUNT_DEACTIVATED'
        ) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('last_known_user_role');
            // Redirect to login with a deactivated notice
            window.location.href = '/?deactivated=1';
        }

        return Promise.reject(error);
    },
);
