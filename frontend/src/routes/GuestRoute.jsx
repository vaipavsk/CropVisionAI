import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper component for guest-only pages.
 * Redirects authenticated users to their role dashboard and displays a themed loading
 * screen while verifying authentication and role clearances.
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const { role, loadingRole } = useRole();

  if (loading || (user && loadingRole)) {
    return (
      <Loading 
        message="Authenticating session..." 
        submessage="Verifying secure credentials" 
      />
    );
  }

  if (user) {
    if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'INSPECTOR') {
      return <Navigate to="/inspector" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
}

export default GuestRoute;
