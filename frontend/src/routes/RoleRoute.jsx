import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/ui/Loading';

/**
 * Portal route wrapper without automatic database role checks.
 * Simple authentication state check.
 */
export function RoleRoute({ fallbackPath = '/farmer/login', children }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <Loading 
        message="Resolving session..." 
        submessage="Checking credentials" 
      />
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children ? children : <Outlet />;
}

export function FarmerRoute({ children }) {
  return <RoleRoute fallbackPath="/farmer/login">{children}</RoleRoute>;
}

export function InspectorRoute({ children }) {
  return <RoleRoute fallbackPath="/inspector/login">{children}</RoleRoute>;
}

export function AdminRoute({ children }) {
  return <RoleRoute fallbackPath="/farmer/login">{children}</RoleRoute>;
}

export default RoleRoute;
