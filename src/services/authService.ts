// ============================
// Auth Service - Supabase Auth
// ============================
import { supabase } from './supabaseClient';
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { UserRole } from '../types/database.types';
import { announcementService } from './announcementService'; // For creating announcements inside AuthService

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

export interface AuthResult {
    user: SupabaseUser | null;
    session: Session | null;
    error: string | null;
}


export interface InternData extends SignUpMetadata{
    email: string;
    password: string;
}

// ========================
// Auth Service Functions
// ========================
export const authService = {

    /**
     * Register a new user with Supabase Auth and create a profile in the `users` table.
     * @param email - User email address
     * @param password - User password (min 6 characters)
     * @param metadata - Additional user metadata (full_name, role)
     */
    async signUp(email: string, password: string, metadata: SignUpMetadata): Promise<AuthResult> {
        try {
            // 1. Create the auth user in Supabase Auth
            // The trigger function will automatically create the profile in the users table
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: metadata.full_name,
                        role: metadata.role,
                        avatar_url: metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.full_name)}&background=random`,
                        ojt_role: metadata.ojt_role || '',
                        start_date: metadata.start_date || '',
                        required_hours: metadata.required_hours || 0,
                        ojt_type: metadata.ojt_type || 'required',
                    },
                },
            });

            if (error) {
                return { user: null, session: null, error: error.message };
            }

            // The profile is created automatically by the database trigger
            // No need to manually insert into the users table

            return {
                user: data.user,
                session: data.session,
                error: null,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign up';
            return { user: null, session: null, error: message };
        }
    },

    /**
     * Sign in an existing user with email and password.
     * @param email - User email address
     * @param password - User password
     */
    async signIn(email: string, password: string): Promise<AuthResult> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { user: null, session: null, error: error.message };
            }

            return {
                user: data.user,
                session: data.session,
                error: null,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign in';
            return { user: null, session: null, error: message };
        }
    },

    /**
     * Sign out the current user.
     */
    async signOut(): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred during sign out';
            return { error: message };
        }
    },

    /**
     * Send a password reset email to the user.
     * @param email - User email address
     */
    async resetPassword(email: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    },

    /**
     * Update the current user's password.
     * @param newPassword - The new password (min 6 characters)
     */
    async updatePassword(newPassword: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    },

    /**
     * Get the current authenticated user session.
     */
    async getSession(): Promise<{ session: Session | null; error: string | null }> {
        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                return { session: null, error: error.message };
            }

            return { session: data.session, error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { session: null, error: message };
        }
    },

    /**
     * Fetch the user's profile from the public `users` table.
     * @param userId - The user's UUID from auth
     */
    async getUserProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                return { profile: null, error: error.message };
            }

            return { profile: data, error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { profile: null, error: message };
        }
    },

    /**
     * Subscribe to auth state changes (login, logout, token refresh).
     * @param callback - Function to call on auth state change
     * @returns Unsubscribe function
     */
    onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
        const { data } = supabase.auth.onAuthStateChange(callback);
        return data.subscription.unsubscribe;
    },

    /**
     * Resend the email confirmation link to a user.
     * @param email - The user's email address
     */
    async resendConfirmation(email: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    },


    /**
     * Add an intern (admin-only)
     * @param internData - The data for the new intern (full_name, email, role, etc.)
     * @param adminUser - The admin context (must be verified server-side)
     */
    async addIntern(
    internData: InternData,
    adminUser: { id: string; role: UserRole } | null
    ): Promise<AuthResult> {
    // Authorization gate
    if (!adminUser || adminUser.role !== "admin") {
        return { user: null, session: null, error: "Unauthorized: Only admins can add interns" };
    }

    try {
        const { email, password, ...metadata } = internData;

        // Basic validation (optional but good)
        if (!email || !password) {
        return { user: null, session: null, error: "Email and password are required" };
        }
        if (!metadata.full_name) {
        return { user: null, session: null, error: "full_name is required" };
        }

        // Supabase Auth already enforces unique email; just surface cleanly
        const result = await this.signUp(email, password, metadata as SignUpMetadata);

        if (result.error || !result.user) {
        return {
            user: null,
            session: null,
            error: result.error ?? "Signup failed (no user returned)",
        };
        }

        // Create welcome announcement (non-blocking)
        announcementService
        .createAnnouncement({
            title: `Welcome ${metadata.full_name}!`,
            content: "We are excited to have you join us as an intern. Please check your email for login details and next steps.",
            created_by: adminUser.id,
            priority: "medium",
            visibility: "intern",
        })
        .catch((announcementError) => {
            console.error("Error creating welcome announcement:", announcementError);
        });

        return result;
    } catch (err) {
        return {
        user: null,
        session: null,
        error: err instanceof Error ? err.message : "An unexpected error occurred",
        };
    }
    }
};
