import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing/Landing';
import MissionControlLayout from '../layouts/MissionControlLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import DashboardShowcase from '../pages/DashboardShowcase';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Guest/Auth routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Protected Mission Control Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <MissionControlLayout>
              <Dashboard />
            </MissionControlLayout>
          }
        />

        <Route
          path="/showcase"
          element={
            <MissionControlLayout>
              <DashboardShowcase />
            </MissionControlLayout>
          }
        />

        <Route
          path="/analysis"
          element={
            <MissionControlLayout>
              <div className="space-y-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  Crop Analysis Engine
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Run YOLOv8 leaf detection and EfficientNet disease classification models with Grad-CAM heatmaps.
                </p>
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center text-slate-400 dark:text-slate-500">
                  Drag and drop crop specimen images here to initialize scan...
                </div>
              </div>
            </MissionControlLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <MissionControlLayout>
              <div className="space-y-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  Diagnostic Reports
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Access past agricultural scans, disease predictions, and Grad-CAM saliency output logs.
                </p>
                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 p-6 text-center text-slate-400 dark:text-slate-500">
                  No archived diagnostic reports found.
                </div>
              </div>
            </MissionControlLayout>
          }
        />

        <Route
          path="/profile"
          element={
            <MissionControlLayout>
              <div className="space-y-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  Scholar Profile Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Manage your credentials, research parameters, and notification alerts.
                </p>
                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 p-6 text-slate-400 dark:text-slate-500">
                  Profile details synced with Firebase Authentication.
                </div>
              </div>
            </MissionControlLayout>
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
