import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing/Landing';
import FarmerLogin from '../pages/Auth/FarmerLogin';
import InspectorLogin from '../pages/Auth/InspectorLogin';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import FarmerDashboard from '../pages/Farmer/FarmerDashboard';
import InspectorDashboard from '../pages/Inspector/InspectorDashboard';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Guest Farmer Auth routes */}
      <Route element={<GuestRoute redirectTo="/farmer/dashboard" />}>
        <Route path="/farmer/login" element={<FarmerLogin />} />
        <Route path="/farmer/register" element={<Register />} />
        <Route path="/farmer/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Guest Inspector Auth routes */}
      <Route element={<GuestRoute redirectTo="/inspector/dashboard" />}>
        <Route path="/inspector/login" element={<InspectorLogin />} />
      </Route>

      {/* Protected Farmer Routes */}
      <Route element={<ProtectedRoute fallbackPath="/farmer/login" />}>
        <Route path="/farmer/dashboard" element={<FarmerDashboard initialTab="dashboard" />} />
        <Route path="/farmer/upload" element={<FarmerDashboard initialTab="upload" />} />
        <Route path="/farmer/analysis" element={<FarmerDashboard initialTab="upload" />} />
        <Route path="/farmer/history" element={<FarmerDashboard initialTab="history" />} />
        <Route path="/farmer/claims" element={<FarmerDashboard initialTab="claims" />} />
        <Route path="/farmer/claims/:claimId" element={<FarmerDashboard initialTab="claims" />} />
        <Route path="/farmer/profile" element={<FarmerDashboard initialTab="profile" />} />
      </Route>

      {/* Protected Inspector Routes */}
      <Route element={<ProtectedRoute fallbackPath="/inspector/login" />}>
        <Route path="/inspector/dashboard" element={<InspectorDashboard initialTab="dashboard" />} />
        <Route path="/inspector/pending" element={<InspectorDashboard initialTab="pending" />} />
        <Route path="/inspector/approved" element={<InspectorDashboard initialTab="approved" />} />
        <Route path="/inspector/rejected" element={<InspectorDashboard initialTab="rejected" />} />
        <Route path="/inspector/reports" element={<InspectorDashboard initialTab="reports" />} />
        <Route path="/inspector/profile" element={<InspectorDashboard initialTab="profile" />} />
        <Route path="/inspector/claims/:claimId" element={<InspectorDashboard initialTab="investigate" />} />
        <Route path="/inspector/investigate/:claimId" element={<InspectorDashboard initialTab="investigate" />} />
      </Route>

      {/* Legacy & Shortcut Route Aliases */}
      <Route path="/login" element={<Navigate to="/farmer/login" replace />} />
      <Route path="/register" element={<Navigate to="/farmer/register" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/farmer/forgot-password" replace />} />
      <Route path="/dashboard" element={<Navigate to="/farmer/dashboard" replace />} />
      <Route path="/upload" element={<Navigate to="/farmer/upload" replace />} />
      <Route path="/analysis" element={<Navigate to="/farmer/upload" replace />} />
      <Route path="/history" element={<Navigate to="/farmer/history" replace />} />
      <Route path="/claims" element={<Navigate to="/farmer/claims" replace />} />
      <Route path="/inspector" element={<Navigate to="/inspector/dashboard" replace />} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
