import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './hooks/useAuth';
import { socket } from '../../socket';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        validateSession();
    }, []);

    async function readFetchError(res: Response): Promise<string> {
        try {
            const data = (await res.json()) as {
                error?: string;
                message?: string;
            };
            const msg =
                (typeof data.error === 'string' && data.error) ||
                (typeof data.message === 'string' && data.message);
            if (msg) return msg;
        } catch {
            /* ignore malformed body */
        }
        if (res.status === 401) return 'Invalid credentials';
        if (res.status === 409) return 'That username is already taken';
        if (res.status === 400) return 'Invalid username or password';
        return `Something went wrong (${res.status})`;
    }

    async function signup(username: string, password: string) {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error(await readFetchError(res));
        }
        const data = await res.json();
        setUser(data.username);
        if (socket.connected) {
            socket.disconnect();
        }
        socket.connect();
    }

    async function login(username: string, password: string) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error(await readFetchError(res));
        }
        const data = await res.json();
        setUser(data.username);
        if (socket.connected) {
            socket.disconnect();
        }
        socket.connect();
    }

    async function logout() {
        socket.disconnect();
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
                if (!socket.connected) {
                    socket.connect();
                }
            } else {
                setUser(null);
                socket.disconnect();
            }
        } catch {
            setUser(null);
            socket.disconnect();
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
