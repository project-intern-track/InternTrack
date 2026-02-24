import { apiClient } from "./apiClient";
import type {
    AuthChangeEvent,
    Session,
    User as SupabaseUser,
} from "@supabase/supabase-js";
import type { UserRole } from "../types/database.types";

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
    ojt_type?: "required" | "voluntary";
}

export interface AuthResult {
    user: SupabaseUser | null;
    session: Session | null;
    error: string | null;
}

export interface InternData extends SignUpMetadata {
    email: string;
    password: string;
}

// ========================
// Auth Service Functions (Laravel API)
// ========================
export const authService = {
    async signUp(
        email: string,
        password: string,
        metadata: SignUpMetadata,
    ): Promise<AuthResult> {
        try {
            await apiClient.post("/auth/register", {
                email,
                password,
                ...metadata,
            });

            return {
                user: null, // Since Laravel requires email verification, we return null session just like Supabase did
                session: null,
                error: null,
            };
        } catch (err: any) {
            return {
                user: null,
                session: null,
                error: err.response?.data?.error || err.message,
            };
        }
    },

    async signIn(email: string, password: string): Promise<AuthResult> {
        try {
            const response = await apiClient.post("/auth/login", {
                email,
                password,
            });
            const { user, token } = response.data;

            localStorage.setItem("auth_token", token);

            const fakeSupabaseUser = {
                id: user.id.toString(),
                email: user.email,
                user_metadata: {
                    role: user.role,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                },
            } as any;

            return {
                user: fakeSupabaseUser,
                session: { user: fakeSupabaseUser, access_token: token } as any,
                error: null,
            };
        } catch (err: any) {
            return {
                user: null,
                session: null,
                error: err.response?.data?.error || err.message,
            };
        }
    },

    async signOut(): Promise<{ error: string | null }> {
        try {
            await apiClient.post("/auth/logout");
            localStorage.removeItem("auth_token");
            return { error: null };
        } catch (err: any) {
            localStorage.removeItem("auth_token");
            return { error: err.response?.data?.error || err.message };
        }
    },

    async resetPassword(email: string): Promise<{ error: string | null }> {
        try {
            await apiClient.post("/auth/forgot-password", {
                email,
            });
            return { error: null };
        } catch (err: any) {
            return { error: err.response?.data?.error || err.message };
        }
    },

    async updatePassword(
        newPassword: string,
        token: string,
        email: string,
    ): Promise<{ error: string | null }> {
        try {
            await apiClient.post("/auth/reset-password", {
                email,
                password: newPassword,
                password_confirmation: newPassword,
                token,
            });
            return { error: null };
        } catch (err: any) {
            return { error: err.response?.data?.error || err.message };
        }
    },

    async getSession(): Promise<
        { session: Session | null; error: string | null }
    > {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) return { session: null, error: null };

            const response = await apiClient.get("/auth/user");
            const user = response.data.user;

            const fakeSupabaseUser = {
                id: user.id.toString(),
                email: user.email,
                user_metadata: {
                    role: user.role,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                },
            } as any;

            return {
                session: { user: fakeSupabaseUser, access_token: token } as any,
                error: null,
            };
        } catch (err: any) {
            return {
                session: null,
                error: err.response?.data?.error || err.message,
            };
        }
    },

    async getUserProfile(_userId: string) {
        try {
            const response = await apiClient.get("/auth/user");
            // In the short term, just return the authenticated user's profile from /auth/user
            // since we don't have a /users/:id endpoint exposed yet in Laravel.
            const user = response.data.user;
            return { profile: user, error: null };
        } catch (err: any) {
            return {
                profile: null,
                error: err.response?.data?.error || err.message,
            };
        }
    },

    onAuthStateChange(
        _callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) {
        // Return a dummy unsubscribe function
        return () => {};
    },

    async resendConfirmation(email: string): Promise<{ error: string | null }> {
        try {
            await apiClient.post("/auth/resend-verification", { email });
            return { error: null };
        } catch (err: any) {
            return { error: err.response?.data?.error || err.message };
        }
    },

    async addIntern(
        internData: InternData,
        adminUser: { id: string; role: UserRole } | null,
    ): Promise<AuthResult> {
        if (!adminUser || adminUser.role !== "admin") {
            return {
                user: null,
                session: null,
                error: "Unauthorized: Only admins can add interns",
            };
        }

        try {
            const { email, password, ...metadata } = internData;

            const result = await this.signUp(
                email,
                password,
                metadata as SignUpMetadata,
            );
            return result;
        } catch (err: any) {
            return {
                user: null,
                session: null,
                error: err.message || "An unexpected error occurred",
            };
        }
    },
};
