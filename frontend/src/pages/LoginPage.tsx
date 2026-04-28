import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import useAuth from '../modules/auth/hooks/useAuth';

export default function LoginPage() {
    const navigate = useNavigate();

    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        try {
            await login(username, password);
            navigate("/menu");
        } catch (err) {
            setErrorMessage((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="game-title">Granny&apos;s Last Word</h1>
                <h2>Log In</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="login-username">Username</label>
                    <input
                        id="login-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                    />

                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                    />

                    {errorMessage && (
                        <p className="error-text">{errorMessage}</p>
                    )}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account?{' '}
                    <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
