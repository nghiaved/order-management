import { Navigate } from 'react-router-dom';
import { useAuth, useAuthorization } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/rbacHelper';

/**
 * Route guard — redirects to /login when unauthenticated.
 * Optionally checks a required permission string.
 */
export default function ProtectedRoute({ children, permission }) {
    const { user, loading } = useAuth();
    const { hasPermission } = useAuthorization();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0a0e1a]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (permission && permission === PERMISSIONS.DASHBOARD_READ && !hasPermission(permission))
        return <Navigate to="/orders" replace />;

    if (permission && !hasPermission(permission)) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold mb-1 text-white">Không có quyền truy cập</h2>
                <p className="text-gray-400">Bạn không có quyền truy cập trang này.</p>
            </div>
        );
    }

    return children;
}
