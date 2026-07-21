import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper component for guest-only pages.
 * Redirects authenticated users to their portal dashboard.
 */
export function GuestRoute({ children, redirectTo = '/farmer/dashboard' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Loading 
        message="Authenticating session..." 
        submessage="Verifying credentials" 
      />
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? children : <Outlet />;
}

export default GuestRoute;
