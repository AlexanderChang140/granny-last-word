import { createContext, useContext } from 'react';

export interface AuthContextType {
    user: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signup: (username: string, password: string) => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    validateSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export default function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
