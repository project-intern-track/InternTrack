import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, AuthState } from '../types';
import { authService } from '../services/authService';
import type { SignUpMetadata } from '../services/authService';
import { supabase } from '../services/supabaseClient';

/* eslint-disable react-refresh/only-export-components */

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true, // Start as true — we're checking the session
    });

    // Track whether signIn/signUp is actively handling profile loading,
    // so onAuthStateChange doesn't double-load
    const isHandlingAuth = useRef(false);

    /**
     * Fetches the user profile from the `users` table and builds the User object.
     * Returns the User or null (does NOT set state — callers handle that).
     */
    const fetchUserProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
        const { profile, error } = await authService.getUserProfile(userId);

        if (error || !profile) {
            console.error('Failed to load user profile:', error);
            return null;
        }

        return {
            id: profile.id,
            name: profile.full_name,
            email: email,
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url || undefined,
        };
    }, []);

    /**
     * Tries to ensure a profile exists. If the profile doesn't exist in the
     * `users` table (e.g. RLS blocked the INSERT during signup), attempt to
     * create it from the auth user's metadata.
     */
    const ensureUserProfile = useCallback(async (userId: string, email: string, userMetadata?: Record<string, unknown>): Promise<User | null> => {
        // First try to load the existing profile
        let user = await fetchUserProfile(userId, email);
        if (user) return user;

        // Profile doesn't exist — try to create it from auth metadata
        console.warn('User profile not found, attempting to create from auth metadata...');
        const fullName = (userMetadata?.full_name as string) || email.split('@')[0] || 'User';
        const role = (userMetadata?.role as UserRole) || 'intern';
        const avatarUrl = (userMetadata?.avatar_url as string) || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

        try {
            const { error: insertError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email: email,
                    full_name: fullName,
                    role: role,
                    avatar_url: avatarUrl,
                }, { onConflict: 'id' });

            if (insertError) {
                console.error('Failed to create user profile:', insertError.message);
                return null;
            }

            // Try loading again
            user = await fetchUserProfile(userId, email);
            return user;
        } catch (err) {
            console.error('Error creating user profile:', err);
            return null;
        }
    }, [fetchUserProfile]);

    /**
     * On mount: check for existing session + listen for auth state changes.
     */
    useEffect(() => {
        // 1. Check the current session
        const initSession = async () => {
            const { session } = await authService.getSession();

            if (session?.user) {
                const user = await ensureUserProfile(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata
                );

                setState({
                    user: user,
                    isAuthenticated: !!user,
                    isLoading: false,
                });
            } else {
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        };

        initSession();

        // 2. Subscribe to auth changes (login, logout, token refresh)
        const unsubscribe = authService.onAuthStateChange(async (event, session) => {
            // Skip if signIn/signUp is actively handling this
            if (isHandlingAuth.current) return;

            if (event === 'SIGNED_IN' && session?.user) {
                const user = await ensureUserProfile(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata
                );
                setState({
                    user: user,
                    isAuthenticated: !!user,
                    isLoading: false,
                });
            } else if (event === 'SIGNED_OUT') {
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                const user = await ensureUserProfile(
                    session.user.id,
                    session.user.email || '',
                    session.user.user_metadata
                );
                if (user) {
                    setState({
                        user: user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [ensureUserProfile]);

    // ========================
    // Auth Actions
    // ========================

    const signIn = async (email: string, password: string) => {
        setState((prev) => ({ ...prev, isLoading: true }));
        isHandlingAuth.current = true;

        try {
            const result = await authService.signIn(email, password);

            if (result.error) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return { error: result.error };
            }

            if (!result.user) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return { error: 'Sign in succeeded but no user was returned.' };
            }

            // Directly load the profile — don't rely on onAuthStateChange timing
            const user = await ensureUserProfile(
                result.user.id,
                result.user.email || email,
                result.user.user_metadata
            );

            if (!user) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return { error: 'Could not load your user profile. Please contact an administrator.' };
            }

            setState({
                user: user,
                isAuthenticated: true,
                isLoading: false,
            });

            return { error: null };
        } finally {
            isHandlingAuth.current = false;
        }
    };

    const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
        setState((prev) => ({ ...prev, isLoading: true }));
        isHandlingAuth.current = true;

        try {
            const result = await authService.signUp(email, password, metadata);

            if (result.error) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return { error: result.error };
            }

            // If Supabase requires email confirmation, session will be null
            if (!result.session || !result.user) {
                setState((prev) => ({ ...prev, isLoading: false }));
                return { error: null }; // Success — but user needs to confirm email
            }

            // If auto-confirmed, load the profile directly
            const user = await ensureUserProfile(
                result.user.id,
                result.user.email || email,
                result.user.user_metadata
            );

            setState({
                user: user,
                isAuthenticated: !!user,
                isLoading: false,
            });

            return { error: null };
        } finally {
            isHandlingAuth.current = false;
        }
    };

    const signOut = async () => {
        setState((prev) => ({ ...prev, isLoading: true }));
        await authService.signOut();
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    const resetPassword = async (email: string) => {
        return await authService.resetPassword(email);
    };

    const updatePassword = async (newPassword: string) => {
        return await authService.updatePassword(newPassword);
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signIn,
                signUp,
                signOut,
                resetPassword,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
