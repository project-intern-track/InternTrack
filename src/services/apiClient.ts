import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const csrfClient = axios.create({
    baseURL: API_ORIGIN,
    withCredentials: true,
});

let csrfReady = false;
let csrfPromise: Promise<void> | null = null;

async function ensureCsrfCookie(force = false): Promise<void> {
    if (csrfReady && !force) return;
    if (csrfPromise && !force) return csrfPromise;

    csrfPromise = csrfClient.get("/sanctum/csrf-cookie").then(() => {
        csrfReady = true;
    }).finally(() => {
        csrfPromise = null;
    });

    return csrfPromise;
}

/**
 * Enhanced Axios Client for Laravel API
 * Uses Sanctum stateful session cookies instead of localStorage bearer tokens.
 */
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});

apiClient.interceptors.request.use(
    async (config) => {
        const method = (config.method || "get").toLowerCase();
        if (!["get", "head", "options"].includes(method)) {
            await ensureCsrfCookie();
        }

        return config;
    },
    (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        if (status === 419) {
            try {
                await ensureCsrfCookie(true);
            } catch {
                // Let the original 419 propagate if CSRF refresh fails.
            }
        }

        if (
            status === 403 &&
            error.response?.data?.error === "ACCOUNT_DEACTIVATED"
        ) {
            sessionStorage.setItem("account_deactivated", "1");
        }

        return Promise.reject(error);
    },
);

export { ensureCsrfCookie, API_ORIGIN };
