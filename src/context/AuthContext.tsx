import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, AuthState } from '../types';
import { authService } from '../services/authService';
import type { SignUpMetadata, LaravelUser } from '../services/authService';

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
    try { localStorage.setItem(LAST_KNOWN_ROLE_KEY, role); } catch { /* ignore */ }
}

function clearLastKnownRole(): void {
    try { localStorage.removeItem(LAST_KNOWN_ROLE_KEY); } catch { /* ignore */ }
}

function mapLaravelUserToUser(laravelUser: LaravelUser): User {
    return {
        id: String(laravelUser.id),
        name: laravelUser.full_name || laravelUser.email.split('@')[0],
        email: laravelUser.email,
        role: laravelUser.role as UserRole,
        avatarUrl: laravelUser.avatar_url ?? undefined,
    };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
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

    // ── Auth Actions ─────────────────────────────────────────────────────

    const signIn = async (email: string, password: string) => {
        try {
            const result = await authService.signIn(email, password);

            if (result.error) return { error: result.error };

            if (!result.user) return { error: 'Sign in succeeded but no user was returned.' };

            if (result.user.status === 'archived') {
                await authService.signOut();
                return { error: 'Your account has been deactivated. Please contact an administrator.' };
            }

            const user = mapLaravelUserToUser(result.user);
            setLastKnownRole(user.role);
            setState({ user, isAuthenticated: true, isLoading: false, isPasswordRecovery: false });

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    };

    const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
        try {
            const result = await authService.signUp(email, password, metadata);

            if (result.error) return { error: result.error };

            if (result.user) {
                const user = mapLaravelUserToUser(result.user);
                setLastKnownRole(user.role);
                setState({ user, isAuthenticated: true, isLoading: false, isPasswordRecovery: false });
            }

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        }
    };

    const signOut = async () => {
        clearLastKnownRole();
        setState({ user: null, isAuthenticated: false, isLoading: false, isPasswordRecovery: false });
        try {
            await authService.signOut();
        } catch (err) {
            console.error('Sign out error (ignored):', err);
        }
    };

    const resetPassword = async (email: string) => {
        return await authService.resetPassword(email);
    };

    const updatePassword = async (newPassword: string) => {
        return await authService.updatePassword(newPassword);
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
