import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRole from '../hooks/useRole';
import Loading from '../components/ui/Loading';

/**
 * Route protection wrapper based on user roles.
 * Verifies both authentication and role clearances.
 */
export function RoleRoute({ roles = [], children }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loadingRole } = useRole();

  if (authLoading || loadingRole) {
    return (
      <Loading 
        message="Resolving role clearances..." 
        submessage="Checking secure credential permissions" 
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    // Redirect unauthorized user to their respective default home dashboard
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

export function FarmerRoute({ children }) {
  return <RoleRoute roles={['FARMER']}>{children}</RoleRoute>;
}

export function InspectorRoute({ children }) {
  return <RoleRoute roles={['INSPECTOR']}>{children}</RoleRoute>;
}

export function AdminRoute({ children }) {
  return <RoleRoute roles={['ADMIN']}>{children}</RoleRoute>;
}

export default RoleRoute;
