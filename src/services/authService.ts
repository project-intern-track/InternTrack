// ============================
// Auth Service - Supabase Auth
// ============================
import { supabase } from './supabaseClient';
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { UserRole } from '../types/database.types';
import { announcementSchema } from './validation';
import { announcementService } from './announcementService';

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

export interface InternData{
    full_name: string;
    email: string;
    password: string;
    role: 'intern';
    avatar_url?: string;
    ojt_role?: string;
    start_date?: string;
    required_hours?: number;
    ojt_type?: 'required' | 'voluntary';
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

            // Create announcement for intern sign up even if the account is not verified: Record still created
            if (data.user) {

                try {
                    await announcementService.createAnnouncement({
                        title: `New Intern Registration: ${data.user?.email}`,
                        content: `New Intern, ${metadata.full_name}, has registered with the email ${data.user.email}. Please verify their account and welcome them to the team!`,
                        created_by: data.user.id,
                        visibility: 'admin' // Only Admins Can see and verify new intern registrations

                    });

                } catch (announcementError) {
                    console.error('Error creating announcement for new intern:', announcementError instanceof Error ? announcementError.message : announcementError);
                }

            }

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
     * Parameters - InternData, Admin User Object
     * Additional function to add an intern with specific metadata
     * @param intern - User's Data: InternData 
     * @param adminUser - Current User: Admin User Privileges
     */ 
    async addIntern(intern: InternData, adminUser: { id: string, role: UserRole } | null): Promise<AuthResult> {

        if (adminUser?.role !== 'admin') {
            return { user: null, session: null, error: 'Unauthorized: Only admins can add interns' };
        }

        try {

            // Check if E-mail is recorded as an existing intern user in DB
            const { email, password, ...metadata } = intern;

            // Wait for the sign up data process
            const result = await this.signUp(email, password, metadata);

            if (result.error) return result;    

            /**
             * Announcement Creation For Add Intern
             */
            if (result.user) {
                await announcementService.createAnnouncement({
                            title: "Official Onboarding",
                            content: `${intern.full_name} has been added by ${adminUser.id}`,
                            created_by: adminUser.id,
                            visibility: 'all' 
                        });
            }


            return result;

        } catch (error) {
            return { user: null, session: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
        }

    }

};

