import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper component for guest-only pages.
 * Redirects authenticated users to the Dashboard and displays a themed loading
 * screen while verifying the user's authentication state.
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Loading 
        message="Authenticating session..." 
        submessage="Verifying secure credentials" 
      />
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

export default GuestRoute;
