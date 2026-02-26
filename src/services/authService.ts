// ============================
// Auth Service - Laravel API
// ============================
import type { UserRole } from '../types/database.types';
import { announcementService } from './announcementService';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

// ========================
// Types
// ========================
export interface SignUpMetadata {
    full_name: string;
    role: UserRole;
    avatar_url?: string;
    ojt_role?: string;
    start_date?: string;
    required_hours?: number;
    ojt_type?: 'required' | 'voluntary';
}

export interface LaravelUser {
    id: number;
    email: string;
    full_name: string;
    role: UserRole;
    avatar_url: string | null;
    ojt_role: string | null;
    ojt_id: number | null;
    start_date: string | null;
    required_hours: number | null;
    ojt_type: 'required' | 'voluntary';
    status: 'active' | 'archived';
    supervisor_id: number | null;
    department: string | null;
    created_at: string;
}

export interface AuthResult {
    user: LaravelUser | null;
    token: string | null;
    error: string | null;
}

export interface InternData extends SignUpMetadata {
    email: string;
    password: string;
}

// ── Token storage ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'interntrack_token';

export function getStoredToken(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setStoredToken(token: string): void {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}

function clearStoredToken(): void {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// ── HTTP helpers ───────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: Record<string, unknown>, withAuth = false): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (withAuth) {
        const token = getStoredToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    return res.json() as Promise<T>;
}

async function apiGet<T>(path: string): Promise<T> {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
    });
    return res.json() as Promise<T>;
}

// ========================
// Auth Service Functions
// ========================
export const authService = {

    async signUp(email: string, password: string, metadata: SignUpMetadata): Promise<AuthResult> {
        try {
            const data = await apiPost<{
                user?: LaravelUser;
                token?: string;
                error?: string;
                message?: string;
                requires_verification?: boolean;
                email?: string;
                errors?: Record<string, string[]>;
            }>('/auth/register', {
                email,
                password,
                full_name: metadata.full_name,
                role: metadata.role,
                avatar_url: metadata.avatar_url ?? null,
                ojt_role: metadata.ojt_role ?? null,
                start_date: metadata.start_date ?? null,
                required_hours: metadata.required_hours ?? null,
                ojt_type: metadata.ojt_type ?? 'required',
            });

            if (data.error) {
                return { user: null, token: null, error: data.error };
            }

            if (data.errors) {
                // Laravel validation errors — surface first message
                const firstField = Object.values(data.errors)[0];
                const msg = firstField?.[0] ?? 'Validation error.';
                // Friendly duplicate-email message
                if (msg.toLowerCase().includes('already been taken') || msg.toLowerCase().includes('unique')) {
                    return { user: null, token: null, error: 'Email already exists. Please use another email account.' };
                }
                return { user: null, token: null, error: msg };
            }

            // Email verification required — success but no token yet
            if (data.requires_verification) {
                return { user: null, token: null, error: null };
            }

            if (data.token && data.user) {
                setStoredToken(data.token);
                return { user: data.user, token: data.token, error: null };
            }

            return { user: null, token: null, error: 'Registration failed. Please try again.' };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign up';
            return { user: null, token: null, error: message };
        }
    },

    async signIn(email: string, password: string): Promise<AuthResult> {
        try {
            const data = await apiPost<{
                user?: LaravelUser;
                token?: string;
                error?: string;
            }>('/auth/login', { email, password });

            if (data.error) {
                return { user: null, token: null, error: data.error };
            }

            if (data.token && data.user) {
                setStoredToken(data.token);
                return { user: data.user, token: data.token, error: null };
            }

            return { user: null, token: null, error: 'Sign in failed. Please try again.' };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign in';
            return { user: null, token: null, error: message };
        }
    },

    async signOut(): Promise<{ error: string | null }> {
        try {
            await apiPost('/auth/logout', {}, true);
            clearStoredToken();
            return { error: null };
        } catch (err) {
            clearStoredToken(); // Clear token even on network error
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign out';
            return { error: message };
        }
    },

    async resetPassword(email: string): Promise<{ error: string | null }> {
        try {
            // Check if email exists first
            const checkData = await apiPost<{ exists: boolean }>('/auth/check-email', { email });
            if (!checkData.exists) {
                return { error: 'This email is not registered.' };
            }

            try { localStorage.setItem('pending_password_recovery', 'true'); } catch { /* ignore */ }

            const data = await apiPost<{ message?: string; error?: string }>('/auth/forgot-password', { email });

            if (data.error) return { error: data.error };
            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    },

    async updatePassword(_newPassword: string): Promise<{ error: string | null }> {
        console.warn('updatePassword: use resetPasswordWithToken for token-based reset flow.');
        return { error: null };
    },

    async resetPasswordWithToken(
        token: string,
        email: string,
        password: string
    ): Promise<{ error: string | null }> {
        try {
            const data = await apiPost<{ message?: string; error?: string }>('/auth/reset-password', {
                token,
                email,
                password,
                password_confirmation: password,
            });
            if (data.error) return { error: data.error };
            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    },

    async getSession(): Promise<{ user: LaravelUser | null; error: string | null }> {
        try {
            const token = getStoredToken();
            if (!token) return { user: null, error: null };

            const data = await apiGet<{ user?: LaravelUser; error?: string }>('/auth/user');

            if (data.error || !data.user) {
                clearStoredToken();
                return { user: null, error: data.error ?? null };
            }

            return { user: data.user, error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { user: null, error: message };
        }
    },

    async getUserProfile(userId: number | string): Promise<{ profile: LaravelUser | null; error: string | null }> {
        try {
            const data = await apiGet<{ user?: LaravelUser; error?: string }>(`/users/${userId}`);
            if (data.error || !data.user) {
                return { profile: null, error: data.error ?? 'Profile not found.' };
            }
            return { profile: data.user, error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { profile: null, error: message };
        }
    },

    // No-op — Supabase-specific; replaced by token polling
    onAuthStateChange(_callback: unknown) {
        return () => {};
    },

    async resendConfirmation(email: string): Promise<{ error: string | null }> {
        try {
            const data = await apiPost<{ message?: string; error?: string }>('/auth/resend-verification', { email });
            if (data.error) return { error: data.error };
            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    },

    async addIntern(
        internData: InternData,
        adminUser: { id: number | string; role: UserRole } | null
    ): Promise<AuthResult> {
        if (!adminUser || adminUser.role !== 'admin') {
            return { user: null, token: null, error: 'Unauthorized: Only admins can add interns' };
        }

        const { email, password, ...metadata } = internData;

        if (!email || !password) {
            return { user: null, token: null, error: 'Email and password are required' };
        }
        if (!metadata.full_name) {
            return { user: null, token: null, error: 'full_name is required' };
        }

        const result = await this.signUp(email, password, metadata as SignUpMetadata);

        if (result.error || !result.user) {
            return { user: null, token: null, error: result.error ?? 'Signup failed' };
        }

        announcementService
            .createAnnouncement({
                title: `Welcome ${metadata.full_name}!`,
                content: 'We are excited to have you join us as an intern. Please check your email for login details and next steps.',
                created_by: String(adminUser.id),
                priority: 'medium',
                visibility: 'intern',
            })
            .catch((err) => {
                console.error('Error creating welcome announcement:', err);
            });

        return result;
    },
};
