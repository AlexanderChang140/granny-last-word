import { Navigate, Outlet } from 'react-router';
import useAuth from '../modules/auth/hooks/useAuth';

export default function AutenticatedRoute() {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    if (isAuthenticated) {
        return <Navigate to="/game" replace />;
    }
    return <Outlet />;
}
