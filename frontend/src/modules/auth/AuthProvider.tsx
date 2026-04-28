import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './hooks/useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        validateSession();
    }, []);

    async function signup(username: string, password: string) {
        setLoading(true);
        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error('Username is taken');
            }
            const data = await res.json();
            setUser(data.username);
        } finally {
            setLoading(false);
        }
    }

    async function login(username: string, password: string) {
        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error('Invalid credentials');
            }
            const data = await res.json();
            setUser(data.username);
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        setUser(null);
    }

    async function validateSession() {
        setLoading(true);
        try {
            const res = await fetch('/api/validate', {
                credentials: 'include',
                cache: 'no-store',
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.username);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                signup,
                login,
                logout,
                validateSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
