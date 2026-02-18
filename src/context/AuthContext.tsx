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
    clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Key used in localStorage to track pending password recovery. */
const RECOVERY_FLAG_KEY = 'pending_password_recovery';

/**
 * Checks url hash, query params, and localStorage for Supabase recovery indicators.
 * Works for both implicit (`#type=recovery`) and PKCE (`?code=...`) flows,
 * and also handles the case where Supabase redirects to "/" instead of
 * "/reset-password" (e.g. when the redirect URL isn't in the allow-list).
 */
function detectRecoveryFromUrl(): boolean {
    try {
        // 1. Implicit flow: hash contains type=recovery
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        if (hashParams.get('type') === 'recovery') return true;

        // 2. PKCE flow: /reset-password?code=<code>
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.has('code') && window.location.pathname.includes('reset-password')) return true;

        // 3. Fallback: the user requested a password reset from this browser.
        //    When Supabase redirects to "/" (because redirect URL isn't allow-listed),
        //    we detect the recovery via the localStorage flag + a code/token in the URL.
        const hasPendingRecovery = localStorage.getItem(RECOVERY_FLAG_KEY) === 'true';
        if (hasPendingRecovery) {
            // Has a Supabase auth code or access token in the URL?
            const hasCode = queryParams.has('code');
            const hasAccessToken = hashParams.has('access_token');
            if (hasCode || hasAccessToken) return true;
        }
    } catch {
        // Ignore URL parsing / localStorage errors
    }
    return false;
}

/** Removes the localStorage recovery flag. */
function clearRecoveryFlag(): void {
    try { localStorage.removeItem(RECOVERY_FLAG_KEY); } catch { /* ignore */ }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Detect recovery from URL synchronously on first render —
    // before any async auth events have a chance to redirect.
    const recoveryFromUrl = useRef(detectRecoveryFromUrl());

    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isPasswordRecovery: recoveryFromUrl.current,
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
     *
     * IMPORTANT: Uses INSERT (not UPSERT) so existing profiles are never
     * overwritten — this prevents an admin's role being reset to 'intern'.
     */
    const ensureUserProfile = useCallback(async (userId: string, email: string, userMetadata?: Record<string, unknown>): Promise<User | null> => {
        // First try to load the existing profile
        let user = await fetchUserProfile(userId, email);
        if (user) return user;

        // Small delay to handle race conditions with the trigger
        await new Promise(resolve => setTimeout(resolve, 500));

        // Retry once — the trigger may not have finished yet
        user = await fetchUserProfile(userId, email);
        if (user) return user;

        // Profile truly doesn't exist — INSERT (never upsert) from auth metadata
        console.warn('User profile not found, attempting to create from auth metadata...');
        const fullName = (userMetadata?.full_name as string) || email.split('@')[0] || 'User';
        const role = (userMetadata?.role as UserRole) || 'intern';
        const avatarUrl = (userMetadata?.avatar_url as string) || undefined;

        try {
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    email: email,
                    full_name: fullName,
                    role: role,
                    avatar_url: avatarUrl,
                });

            if (insertError) {
                // If it's a duplicate key error, the profile was created by the trigger
                // between our check and the insert — just load it
                if (insertError.code === '23505') {
                    user = await fetchUserProfile(userId, email);
                    return user;
                }
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
     * Helper: loads a profile and sets authenticated state.
     * Always sets isLoading to false, even on failure.
     */
    const loadProfileAndSetState = useCallback(async (
        sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
        passwordRecovery: boolean
    ) => {
        try {
            const user = await ensureUserProfile(
                sessionUser.id,
                sessionUser.email || '',
                sessionUser.user_metadata
            );
            setState({
                user: user,
                isAuthenticated: !!user,
                isLoading: false,
                isPasswordRecovery: passwordRecovery,
            });
        } catch (err) {
            console.error('Failed to load user profile:', err);
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isPasswordRecovery: false,
            });
        }
    }, [ensureUserProfile]);

    // ========================
    // Session Init + Auth Listener
    // ========================
    useEffect(() => {
        let initialLoadResolved = false;

        const setUnauthenticated = () => {
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isPasswordRecovery: false,
            });
        };

        // 1. Check active session immediately (robust check for new tabs)
        authService.getSession().then(({ session }) => {
            if (initialLoadResolved) return;

            if (session?.user) {
                // Determine recovery: either we already detected it from the URL,
                // or the hash type indicates recovery.
                loadProfileAndSetState(session.user, recoveryFromUrl.current).then(() => {
                    initialLoadResolved = true;
                });
            } else {
                // If no session found via getSession, we still wait for onAuthStateChange
                // in case it's an initial sign-in flow or token exchange.
                // But if it's just a new tab, onAuthStateChange usually confirms "null" session too.
            }
        });

        // 2. Subscribe to auth changes
        const unsubscribe = authService.onAuthStateChange(async (event, session) => {
            // Skip if signIn/signUp is actively handling this
            if (isHandlingAuth.current) return;

            if (event === 'INITIAL_SESSION') {
                if (initialLoadResolved) return;

                // If getSession already handled it, good. If not:
                if (session?.user) {
                    initialLoadResolved = true;
                    await loadProfileAndSetState(session.user, recoveryFromUrl.current);
                } else {
                    // No session yet.
                    if (recoveryFromUrl.current) {
                        setState({
                            user: null,
                            isAuthenticated: false,
                            isLoading: true, // stay loading — recovery code exchange in progress
                            isPasswordRecovery: true,
                        });
                    } else {
                        // Only resolve to unauthenticated if getSession also failed/finished
                        // But strictly speaking, INITIAL_SESSION with null means "no session".
                        initialLoadResolved = true;
                        setUnauthenticated();
                    }
                }

            } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
                initialLoadResolved = true;
                await loadProfileAndSetState(session.user, true);

            } else if (event === 'SIGNED_IN' && session?.user) {
                if (!initialLoadResolved) {
                    initialLoadResolved = true;
                    const isRecovery = recoveryFromUrl.current;
                    await loadProfileAndSetState(session.user, isRecovery);
                    return;
                }
                await loadProfileAndSetState(session.user, false);

            } else if (event === 'SIGNED_OUT') {
                setUnauthenticated();

            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                try {
                    const user = await ensureUserProfile(
                        session.user.id,
                        session.user.email || '',
                        session.user.user_metadata
                    );
                    if (user) {
                        setState((prev) => ({
                            ...prev,
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        }));
                    } else {
                        setState((prev) => ({ ...prev, isLoading: false }));
                    }
                } catch {
                    setState((prev) => ({ ...prev, isLoading: false }));
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [ensureUserProfile, loadProfileAndSetState]);

    // ========================
    // Auth Actions
    // ========================

    const signIn = async (email: string, password: string) => {
        clearRecoveryFlag(); // Normal login — clear any stale recovery flag
        // Note: we do NOT set isLoading here. The form component manages its
        // own `isSubmitting` state. Setting global isLoading would unmount
        // the form (PublicRoute swaps it for LoadingScreen), losing all state.
        isHandlingAuth.current = true;

        try {
            const result = await authService.signIn(email, password);

            if (result.error) {
                return { error: result.error };
            }

            if (!result.user) {
                return { error: 'Sign in succeeded but no user was returned.' };
            }

            const user = await ensureUserProfile(
                result.user.id,
                result.user.email || email,
                result.user.user_metadata
            );

            if (!user) {
                return { error: 'Could not load your user profile. Please contact an administrator.' };
            }

            // Only set global state on success — this triggers the
            // PublicRoute redirect to the dashboard.
            setState({
                user: user,
                isAuthenticated: true,
                isLoading: false,
                isPasswordRecovery: false,
            });

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        } finally {
            isHandlingAuth.current = false;
        }
    };

    const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
        // Note: we do NOT set isLoading here (same reason as signIn above).
        isHandlingAuth.current = true;

        try {
            const result = await authService.signUp(email, password, metadata);

            if (result.error) {
                return { error: result.error };
            }

            if (!result.session || !result.user) {
                // Email confirmation required — no session yet
                return { error: null };
            }

            // Auto-confirmed: load profile and transition to dashboard
            const user = await ensureUserProfile(
                result.user.id,
                result.user.email || email,
                result.user.user_metadata
            );

            setState({
                user: user,
                isAuthenticated: !!user,
                isLoading: false,
                isPasswordRecovery: false,
            });

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        } finally {
            isHandlingAuth.current = false;
        }
    };

    const signOut = async () => {
        setState((prev) => ({ ...prev, isLoading: true }));
        try {
            await authService.signOut();
        } catch (err) {
            console.error('Sign out error:', err);
        } finally {
            // Always clear auth state, regardless of whether Supabase errored.
            clearRecoveryFlag();
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isPasswordRecovery: false,
            });
        }
    };

    const resetPassword = async (email: string) => {
        return await authService.resetPassword(email);
    };

    const updatePassword = async (newPassword: string) => {
        return await authService.updatePassword(newPassword);
    };

    // Wrapped in useCallback so the reference is stable and doesn't cause
    // infinite re-renders when used as a useEffect dependency.
    const clearPasswordRecovery = useCallback(() => {
        recoveryFromUrl.current = false;
        clearRecoveryFlag();
        setState((prev) => {
            if (!prev.isPasswordRecovery) return prev; // no-op, avoid re-render
            return { ...prev, isPasswordRecovery: false };
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signIn,
                signUp,
                signOut,
                resetPassword,
                updatePassword,
                clearPasswordRecovery,
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
