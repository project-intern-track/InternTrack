import React, { createContext, useContext, useState } from 'react';
import type { User, UserRole, AuthState } from '../types';

interface AuthContextType extends AuthState {
    login: (role: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: false,
    });

    const login = (role: UserRole) => {
        setState({ isLoading: true, user: null, isAuthenticated: false });

        // Simulate API call
        setTimeout(() => {
            const mockUser: User = {
                id: '1',
                name: role === 'intern' ? 'Alice Intern' : role === 'supervisor' ? 'Bob Supervisor' : 'Charlie Admin',
                email: `${role}@interntrack.com`,
                role: role,
                avatarUrl: `https://ui-avatars.com/api/?name=${role}&background=random`,
            };

            setState({
                user: mockUser,
                isAuthenticated: true,
                isLoading: false,
            });
        }, 800);
    };

    const logout = () => {
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
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
