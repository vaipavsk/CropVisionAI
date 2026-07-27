import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import Loading from '../components/ui/Loading';
import CompleteProfile from '../pages/Auth/CompleteProfile';

/**
 * Route protection wrapper component.
 * Redirects unauthenticated users to the portal login page,
 * and handles missing database profile records via inline setup completion.
 */
export function ProtectedRoute({ children, fallbackPath = '/farmer/login' }) {
  const { user, loading: authLoading } = useAuth();
  const { roleUser, loadingRole } = useRole();

  console.log("====================================");
  console.log("ProtectedRoute Rendered");
  console.log("Auth Loading:", authLoading);
  console.log("Role Loading:", loadingRole);
  console.log("Firebase User:", user);
  console.log("MySQL User Profile:", roleUser);

  // If credentials are still being resolved, show loader
  if (authLoading || loadingRole) {
    console.log("Authentication or role resolution loading...");
    return (
      <Loading
        message="Authenticating session..."
        submessage="Verifying credentials and profile mappings"
      />
    );
  }

  // Redirect if completely unauthenticated in Firebase
  if (!user) {
    console.warn("No authenticated user found.");
    console.warn(`Redirecting to ${fallbackPath}`);
    return <Navigate to={fallbackPath} replace />;
  }

  // If authenticated in Firebase but profile is missing from MySQL, enforce self-healing completion
  if (!roleUser) {
    console.warn("User is logged in on Firebase but lacks MySQL record.");
    console.warn("Rendering inline profile completion Wizard.");
    return <CompleteProfile />;
  }

  console.log("Access granted for role:", roleUser.role);
  console.log("====================================");

  return children ? children : <Outlet />;
}

export default ProtectedRoute;