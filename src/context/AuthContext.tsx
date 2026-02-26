import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, AuthState } from '../types';
import { authService } from '../services/authService';
<<<<<<< HEAD
import type { SignUpMetadata, LaravelUser } from '../services/authService';
=======
import type { SignUpMetadata } from '../services/authService';
>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600

/* eslint-disable react-refresh/only-export-components */

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (newPassword: string, token: string, email: string) => Promise<{ error: string | null }>;
    clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LAST_KNOWN_ROLE_KEY = 'last_known_user_role';

<<<<<<< HEAD
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

=======
>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600
function setLastKnownRole(role: UserRole): void {
    try { localStorage.setItem(LAST_KNOWN_ROLE_KEY, role); } catch { /* ignore */ }
}

function clearLastKnownRole(): void {
    try { localStorage.removeItem(LAST_KNOWN_ROLE_KEY); } catch { /* ignore */ }
}

<<<<<<< HEAD
function mapLaravelUserToUser(laravelUser: LaravelUser): User {
    return {
        id: String(laravelUser.id),
        name: laravelUser.full_name || laravelUser.email.split('@')[0],
        email: laravelUser.email,
        role: laravelUser.role as UserRole,
        avatarUrl: laravelUser.avatar_url ?? undefined,
    };
}

=======
>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
<<<<<<< HEAD
        isPasswordRecovery: false,
    });

    const isMounted = useRef(true);

    // ── Initial session restore ──────────────────────────────────────────
    useEffect(() => {
        isMounted.current = true;

        const restoreSession = async () => {
            try {
                const { user: laravelUser, error } = await authService.getSession();

                if (!isMounted.current) return;

                if (error || !laravelUser) {
                    setState({ user: null, isAuthenticated: false, isLoading: false, isPasswordRecovery: false });
                    return;
                }

                if (laravelUser.status === 'archived') {
                    await authService.signOut();
                    setState({ user: null, isAuthenticated: false, isLoading: false, isPasswordRecovery: false });
                    return;
                }

                const user = mapLaravelUserToUser(laravelUser);
                setLastKnownRole(user.role);
                setState({ user, isAuthenticated: true, isLoading: false, isPasswordRecovery: false });
            } catch {
                if (isMounted.current) {
                    setState({ user: null, isAuthenticated: false, isLoading: false, isPasswordRecovery: false });
                }
            }
        };

        // Safety timeout
        const timeout = setTimeout(() => {
            if (isMounted.current) {
                setState((prev) =>
                    prev.isLoading ? { ...prev, isLoading: false } : prev
                );
            }
        }, 5000);

        restoreSession().finally(() => clearTimeout(timeout));

        return () => {
            isMounted.current = false;
            clearTimeout(timeout);
        };
    }, []);

    // ── Archived-user polling (replaces Supabase Realtime channel) ───────
    useEffect(() => {
        if (!state.isAuthenticated || !state.user) return;

        const userId = state.user.id;

        const checkArchived = async () => {
            try {
                const { profile } = await authService.getUserProfile(userId);
                if (profile?.status === 'archived' && isMounted.current) {
                    clearLastKnownRole();
                    setState({ user: null, isAuthenticated: false, isLoading: false, isPasswordRecovery: false });
                    await authService.signOut();
                }
            } catch {
                // silent — network hiccups are fine
            }
        };

        const intervalId = setInterval(checkArchived, 300_000); // every 5 minutes
        return () => clearInterval(intervalId);
    }, [state.isAuthenticated, state.user?.id]);
=======
        isPasswordRecovery: false, // We no longer use implicit URL token fragment flows for recovery
    });

    const isHandlingAuth = useRef(false);

    /**
     * Fetches the user profile from the Laravel API.
     */
    const fetchUserProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
        const { profile, error } = await authService.getUserProfile(userId);

        if (error || !profile) {
            console.error('Failed to load user profile:', error);
            return null;
        }

        if (profile.status === 'archived') {
            console.warn('[AuthContext] User account is archived. Denying access.');
            return null;
        }

        return {
            id: profile.id.toString(),
            name: profile.full_name,
            email: email,
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url || undefined,
        };
    }, []);

    const loadProfileAndSetState = useCallback(async (
        userId: string,
        email: string
    ) => {
        try {
            const profile = await fetchUserProfile(userId, email);

            if (profile) {
                setLastKnownRole(profile.role);
                setState({
                    user: profile,
                    isAuthenticated: true,
                    isLoading: false,
                    isPasswordRecovery: false,
                });
            } else {
                // If profile fails to load (e.g., archived or network error), sign out
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isPasswordRecovery: false,
                });
                await authService.signOut();
            }
        } catch (err) {
             console.error('[AuthContext] Failed to load user profile:', err);
             setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isPasswordRecovery: false,
            });
        }
    }, [fetchUserProfile]);

    // ========================
    // Session Init
    // ========================
    useEffect(() => {
        let isMounted = true;

        const initSession = async () => {
             try {
                const { session, error } = await authService.getSession();
                
                if (!isMounted) return;

                if (error || !session?.user) {
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isPasswordRecovery: false,
                    });
                    return;
                }

                await loadProfileAndSetState(session.user.id, session.user.email || '');
             } catch (err) {
                 if (isMounted) {
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isPasswordRecovery: false,
                    });
                 }
             }
        };

        initSession();

        return () => {
            isMounted = false;
        };
    }, [loadProfileAndSetState]);
>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600

    // ── Auth Actions ─────────────────────────────────────────────────────

    const signIn = async (email: string, password: string) => {
<<<<<<< HEAD
=======
        isHandlingAuth.current = true;

>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600
        try {
            const result = await authService.signIn(email, password);

            if (result.error) return { error: result.error };

            if (!result.user) return { error: 'Sign in succeeded but no user was returned.' };

<<<<<<< HEAD
            if (result.user.status === 'archived') {
                await authService.signOut();
                return { error: 'Your account has been deactivated. Please contact an administrator.' };
            }

            const user = mapLaravelUserToUser(result.user);
            setLastKnownRole(user.role);
            setState({ user, isAuthenticated: true, isLoading: false, isPasswordRecovery: false });
=======
            const profile = await fetchUserProfile(result.user.id, result.user.email || email);

            if (!profile) {
                 // The fetchUserProfile checks for 'archived' and returns null if so.
                 await authService.signOut();
                 return { error: 'Your account has been deactivated or could not be loaded.' };
            }

            setState({
                user: profile,
                isAuthenticated: true,
                isLoading: false,
                isPasswordRecovery: false,
            });
            setLastKnownRole(profile.role);
>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    };

    const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
<<<<<<< HEAD
=======
        isHandlingAuth.current = true;

>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600
        try {
            const result = await authService.signUp(email, password, metadata);

            if (result.error) return { error: result.error };

            if (result.user) {
                const user = mapLaravelUserToUser(result.user);
                setLastKnownRole(user.role);
                setState({ user, isAuthenticated: true, isLoading: false, isPasswordRecovery: false });
            }

<<<<<<< HEAD
=======
            // Laravel requires email verification, so we don't auto-login after register.
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isPasswordRecovery: false,
            });

>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600
            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    };

    const signOut = async () => {
        clearLastKnownRole();
<<<<<<< HEAD
        setState({ user: null, isAuthenticated: false, isLoading: false, isPasswordRecovery: false });
        try {
            await authService.signOut();
        } catch (err) {
            console.error('Sign out error (ignored):', err);
=======
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isPasswordRecovery: false,
        });

        try {
            await authService.signOut();
        } catch (err) {
            console.error('Sign out error:', err);
>>>>>>> ade7d1a2ea6afacc0a7e769410d7f8c704d95600
        }
    };

    const resetPassword = async (email: string) => {
        return await authService.resetPassword(email);
    };

    const updatePassword = async (newPassword: string, token: string, email: string) => {
        return await authService.updatePassword(newPassword, token, email);
    };

    const clearPasswordRecovery = useCallback(() => {
        setState((prev) => {
            if (!prev.isPasswordRecovery) return prev;
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
