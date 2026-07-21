import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper component.
 * Redirects unauthenticated users to the Login page and displays a themed loading
 * screen while verifying the user's authentication state.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { status, loadingRole } = useRole();

  if (loading || (user && loadingRole)) {
    return (
      <Loading 
        message="Authenticating session..." 
        submessage="Verifying secure credentials" 
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'INACTIVE') {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
