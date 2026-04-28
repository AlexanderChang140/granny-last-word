import { Navigate, Outlet } from 'react-router';
import useAuth from '../hooks/useAuth';

export default function AutenticationRoutes() {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) return <div>Loading...</div>;

    if (isAuthenticated) {
        return <Navigate to="/menu" replace />;
    }
    return <Outlet />;
}
