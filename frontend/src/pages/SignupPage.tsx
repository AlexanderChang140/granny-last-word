import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import useAuth from '../modules/auth/hooks/useAuth';

export default function SignupPage() {
    const navigate = useNavigate();

    const { signup } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            await signup(username, password);
            setSuccessMessage('Account created successfully.');
            navigate('/login');
        } catch (err) {
            setErrorMessage((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Granny&apos;s Last Word</h1>
                <h2>Sign Up</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="signup-username">Username</label>
                    <input
                        id="signup-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                    />

                    <label htmlFor="signup-password">Password</label>
                    <input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                    />

                    <label htmlFor="signup-confirm-password">
                        Confirm Password
                    </label>
                    <input
                        id="signup-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                    />

                    {errorMessage && (
                        <p className="error-text">{errorMessage}</p>
                    )}
                    {successMessage && (
                        <p className="success-text">{successMessage}</p>
                    )}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/">Log in</Link>
                </p>
            </div>
        </div>
    );
}
