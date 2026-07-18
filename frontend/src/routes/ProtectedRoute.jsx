import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper component.
 * Redirects unauthenticated users to the Login page and displays a themed loading
 * screen while verifying the user's authentication state.
 * 
 * Supports both children pattern and Outlet pattern:
 * - <ProtectedRoute><Dashboard /></ProtectedRoute>
 * - <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<Dashboard />} /></Route>
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
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

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
