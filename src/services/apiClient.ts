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
        // Handle revoked tokens — when a user is archived, their tokens are deleted
        // from the database, so subsequent API calls return 401.
        // We clear the token and set a sessionStorage flag; AuthContext's polling
        // will detect the invalid session and redirect via React Router.
        if (error.response?.status === 401) {
            const token = localStorage.getItem('auth_token');
            if (token) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('last_known_user_role');
                sessionStorage.setItem('account_deactivated', '1');
            }
        }

        // Handle archived/deactivated users — backend returns 403 with ACCOUNT_DEACTIVATED
        if (
            error.response?.status === 403 &&
            error.response?.data?.error === 'ACCOUNT_DEACTIVATED'
        ) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('last_known_user_role');
            sessionStorage.setItem('account_deactivated', '1');
        }

        return Promise.reject(error);
    },
);
