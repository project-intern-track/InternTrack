import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, AuthState } from '../types';
import { authService } from '../services/authService';
import type { SignUpMetadata } from '../services/authService';

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
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

    // ========================
    // Auth Actions
    // ========================

    const signIn = async (email: string, password: string) => {
        isHandlingAuth.current = true;

        try {
            const result = await authService.signIn(email, password);

            if (result.error) {
                return { error: result.error };
            }

            if (!result.user) {
                return { error: 'Sign in succeeded but no user was returned.' };
            }

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

            return { error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            return { error: message };
        } finally {
            isHandlingAuth.current = false;
        }
    };

    const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
        isHandlingAuth.current = true;

        try {
            const result = await authService.signUp(email, password, metadata);

            if (result.error) {
                return { error: result.error };
            }

            // Laravel requires email verification, so we don't auto-login after register.
            setState({
                user: null,
                isAuthenticated: false,
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
        clearLastKnownRole();
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