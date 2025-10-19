import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import type { Permission } from '../types/user';

export function ProtectedRoute({ requiredPermission }: { requiredPermission?: Permission }) {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return <div className="p-6 text-center text-slate-300">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
