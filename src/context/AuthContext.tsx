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
const LAST_KNOWN_ROLE_KEY = 'last_known_user_role';

function isUserRole(value: unknown): value is UserRole {
    return value === 'admin' || value === 'supervisor' || value === 'intern';
}


function getLastKnownRole(): UserRole | null {
    try {
        const value = localStorage.getItem(LAST_KNOWN_ROLE_KEY);
        return isUserRole(value) ? value : null;
    } catch {
        return null;
    }
}

function setLastKnownRole(role: UserRole): void {
    try {
        localStorage.setItem(LAST_KNOWN_ROLE_KEY, role);
    } catch {
        // ignore storage write errors
    }
}

function clearLastKnownRole(): void {
    try {
        localStorage.removeItem(LAST_KNOWN_ROLE_KEY);
    } catch {
        // ignore storage remove errors
    }
}

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

// Helper to safely infer role from path
function getRoleFromPath(pathname: string): UserRole | null {
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/supervisor')) return 'supervisor';
    if (pathname.startsWith('/intern')) return 'intern';
    return null;
}

function mapSessionToFallbackUser(sessionUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
}): User {
    const roleFromUserMetadata = sessionUser.user_metadata?.role;
    const roleFromAppMetadata = sessionUser.app_metadata?.role;
    const lastKnownRole = getLastKnownRole();

    // Only use path role if we have absolutely no other info
    const roleFromPath = getRoleFromPath(window.location.pathname);

    const role: UserRole =
        (isUserRole(roleFromUserMetadata) && roleFromUserMetadata) ||
        (isUserRole(roleFromAppMetadata) && roleFromAppMetadata) ||
        lastKnownRole ||
        (isUserRole(roleFromPath) ? roleFromPath : 'intern');

    return {
        id: sessionUser.id,
        name: (sessionUser.user_metadata?.full_name as string) || (sessionUser.email?.split('@')[0] ?? 'User'),
        email: sessionUser.email || '',
        role,
        avatarUrl: (sessionUser.user_metadata?.avatar_url as string) || undefined,
    };
}

function getCachedSessionUserFromStorage(): {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
} | null {
    try {
        const authTokenKey = Object.keys(localStorage).find((key) => /^sb-.*-auth-token$/.test(key));
        if (!authTokenKey) return null;

        const rawValue = localStorage.getItem(authTokenKey);
        if (!rawValue) return null;

        const parsedValue = JSON.parse(rawValue) as unknown;
        const valueRecord = (parsedValue ?? {}) as Record<string, unknown>;
        const currentSession = (valueRecord.currentSession ?? valueRecord.session) as Record<string, unknown> | undefined;
        const user = (currentSession?.user ?? valueRecord.user) as Record<string, unknown> | undefined;

        const id = typeof user?.id === 'string' ? user.id : null;
        if (!id) return null;

        return {
            id,
            email: typeof user?.email === 'string' ? user.email : null,
            user_metadata: (user?.user_metadata as Record<string, unknown>) || {},
            app_metadata: (user?.app_metadata as Record<string, unknown>) || {},
        };
    } catch {
        return null;
    }
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
        sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> },
        passwordRecovery: boolean
    ) => {
        const fallbackUser = mapSessionToFallbackUser(sessionUser);

        // We used to optimistically set state here to prevent "Loading...", but that caused
        // a flash of the "stale" role (intern) before the "new" role (admin) loaded.
        // It also caused the app to sometimes "stick" on the old role if the profile fetch timed out.
        // Now we WAIT for the profile source of truth.

        try {
            const profileResult = await Promise.race([
                ensureUserProfile(
                    sessionUser.id,
                    sessionUser.email || '',
                    sessionUser.user_metadata
                ),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)), // 8s timeout
            ]);

            if (profileResult) {
                setLastKnownRole(profileResult.role);

                // Sync JWT metadata if it's out of date with the DB role.
                // This fixes the "intern turned admin" bug: the DB says 'admin'
                // but the JWT still says 'intern', which causes stale fallbacks
                // on TOKEN_REFRESHED events.
                const jwtRole = sessionUser.user_metadata?.role;
                if (jwtRole && jwtRole !== profileResult.role) {
                    console.info(
                        `[AuthContext] Role mismatch detected: JWT='${jwtRole}', DB='${profileResult.role}'. Syncing auth metadata...`
                    );
                    supabase.auth.updateUser({
                        data: { role: profileResult.role },
                    }).catch((err) => {
                        console.warn('[AuthContext] Failed to sync auth metadata:', err);
                    });
                }

                setState({
                    user: profileResult,
                    isAuthenticated: true,
                    isLoading: false,
                    isPasswordRecovery: passwordRecovery,
                });
            } else {
                console.warn('Profile load timed out - falling back to session metadata');
                setLastKnownRole(fallbackUser.role);
                setState({
                    user: fallbackUser,
                    isAuthenticated: true,
                    isLoading: false,
                    isPasswordRecovery: passwordRecovery,
                });
            }
        } catch (err) {
            console.error('Failed to load user profile:', err);
            // Fallback to session user
            setState({
                user: fallbackUser,
                isAuthenticated: true,
                isLoading: false,
                isPasswordRecovery: passwordRecovery,
            });
        }
    }, [ensureUserProfile]);

    // ========================
    // Session Init + Auth Listener
    // ========================
    useEffect(() => {
        let initialLoadResolved = false;
        let isMounted = true;

        const resolveAsUnauthenticated = () => {
            initialLoadResolved = true;
            setUnauthenticated();
        };

        const setUnauthenticated = () => {
            if (!isMounted) return;
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isPasswordRecovery: false,
            });
        };

        const resolveInitialLoad = async () => {
            if (initialLoadResolved) return;

            try {
                const sessionResult = await Promise.race([
                    authService.getSession(),
                    new Promise<{ session: null; error: string }>((resolve) => {
                        setTimeout(() => resolve({ session: null, error: 'Session initialization timed out' }), 5000);
                    }),
                ]);

                if (!isMounted) return;

                if (sessionResult.error) {
                    console.warn('Session initialization failed:', sessionResult.error);
                    const cachedSessionUser = getCachedSessionUserFromStorage();
                    if (cachedSessionUser) {
                        initialLoadResolved = true;
                        await loadProfileAndSetState(cachedSessionUser, recoveryFromUrl.current);
                        return;
                    }
                    resolveAsUnauthenticated();
                    return;
                }

                if (sessionResult.session?.user) {
                    initialLoadResolved = true;
                    await loadProfileAndSetState(sessionResult.session.user, recoveryFromUrl.current);
                } else {
                    // No active session
                    if (recoveryFromUrl.current) {
                        // Wait for recovery token exchange
                        initialLoadResolved = true;
                        setState({
                            user: null,
                            isAuthenticated: false,
                            isLoading: true,
                            isPasswordRecovery: true,
                        });
                    } else {
                        resolveAsUnauthenticated();
                    }
                }
            } catch (error) {
                console.error('Error loading session:', error);
                if (isMounted) {
                    const cachedSessionUser = getCachedSessionUserFromStorage();
                    if (cachedSessionUser) {
                        initialLoadResolved = true;
                        await loadProfileAndSetState(cachedSessionUser, recoveryFromUrl.current);
                        return;
                    }
                    resolveAsUnauthenticated();
                }
            }
        };

        // Start initial load immediately
        resolveInitialLoad();

        // Set a safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (!initialLoadResolved && isMounted) {
                console.warn('Session load timeout - setting unauthenticated');
                resolveAsUnauthenticated();
            }
        }, 5000);

        // Subscribe to auth changes
        const unsubscribe = authService.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            // Skip if signIn/signUp is actively handling this
            if (isHandlingAuth.current) return;

            if (event === 'INITIAL_SESSION') {
                if (initialLoadResolved) return;

                if (session?.user) {
                    await loadProfileAndSetState(session.user, recoveryFromUrl.current);
                    initialLoadResolved = true;
                } else {
                    resolveAsUnauthenticated();
                }

            } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
                await loadProfileAndSetState(session.user, true);
                initialLoadResolved = true;

            } else if (event === 'SIGNED_IN' && session?.user) {
                const isRecovery = recoveryFromUrl.current;
                await loadProfileAndSetState(session.user, isRecovery);
                initialLoadResolved = true;

            } else if (event === 'SIGNED_OUT') {
                initialLoadResolved = true;
                setUnauthenticated();

            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                try {
                    const user = await ensureUserProfile(
                        session.user.id,
                        session.user.email || '',
                        session.user.user_metadata
                    );
                    if (user && isMounted) {
                        setLastKnownRole(user.role);
                        setState((prev) => ({
                            ...prev,
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        }));
                    } else if (isMounted) {
                        // Profile fetch failed/timed out during token refresh.
                        // IMPORTANT: Do NOT fall back to session metadata here —
                        // the JWT may have stale role info (e.g. 'intern' for a
                        // user who is now 'admin' in the DB). Just keep the
                        // current state as-is; it was already set from a
                        // successful DB fetch during signin/initial load.
                        console.warn('[AuthContext] TOKEN_REFRESHED: profile fetch returned null, keeping current state');
                        setState((prev) => ({ ...prev, isLoading: false }));
                    }
                } catch {
                    if (isMounted) {
                        // Same reasoning: keep current role, don't downgrade
                        console.warn('[AuthContext] TOKEN_REFRESHED: profile fetch failed, keeping current state');
                        setState((prev) => ({ ...prev, isLoading: false }));
                    }
                }
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(safetyTimeout);
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

            // Sync JWT metadata if the DB role differs from the JWT role.
            // This permanently fixes the desync so future token refreshes
            // carry the correct role in user_metadata.
            const jwtRole = result.user.user_metadata?.role;
            if (jwtRole && jwtRole !== user.role) {
                console.info(
                    `[AuthContext] signIn: JWT role='${jwtRole}' ≠ DB role='${user.role}'. Patching auth metadata...`
                );
                try {
                    await supabase.auth.updateUser({
                        data: { role: user.role },
                    });
                } catch (syncErr) {
                    console.warn('[AuthContext] signIn: Failed to sync auth metadata:', syncErr);
                }
            }

            // Only set global state on success — this triggers the
            // PublicRoute redirect to the dashboard.
            setState({
                user: user,
                isAuthenticated: true,
                isLoading: false,
                isPasswordRecovery: false,
            });
            setLastKnownRole(user.role);

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
            if (user) setLastKnownRole(user.role);

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        } finally {
            isHandlingAuth.current = false;
        }
    };

    const signOut = async () => {
        // Optimistic, instant logout.
        // We set state immediately so the UI transitions to Login screen without waiting on network.
        clearRecoveryFlag();
        clearLastKnownRole();
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isPasswordRecovery: false,
        });

        // Fire-and-forget the backend sign-out
        try {
            await authService.signOut();
        } catch (err) {
            console.error('Sign out error (ignored, UI already logged out):', err);
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