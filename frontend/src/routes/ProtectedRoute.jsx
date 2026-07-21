import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper component.
 * Redirects unauthenticated users to the portal login page.
 */
export function ProtectedRoute({ children, fallbackPath = '/farmer/login' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Loading 
        message="Authenticating session..." 
        submessage="Verifying credentials" 
      />
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
