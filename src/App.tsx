import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import DashboardLayout from './layouts/DashboardLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Briefcase } from 'lucide-react';
import './styles/auth.css';

// ========================
// Loading Screen
// ========================
const LoadingScreen = () => (
  <div className="auth-loading-screen">
    <div className="auth-loading-logo">
      <Briefcase size={28} />
    </div>
    <div className="auth-loading-text">Loading InternTrack...</div>
  </div>
);

// ========================
// Role-based redirect helper
// ========================
const getRoleDashboard = (role: string) => {
  switch (role) {
    case 'intern': return '/intern/dashboard';
    case 'supervisor': return '/supervisor/dashboard';
    case 'admin': return '/admin/dashboard';
    default: return '/';
  }
};

// ========================
// Public Route Wrapper
// Redirects authenticated users to their dashboard
// ========================
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

// ========================
// Protected Route Wrapper
// ========================
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Intern Routes */}
      <Route path="/intern" element={
        <ProtectedRoute allowedRoles={['intern']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="logs" element={<div>Logs Page Placeholder</div>} />
        <Route path="schedule" element={<div>Schedule Page Placeholder</div>} />
      </Route>

      {/* Supervisor Routes */}
      <Route path="/supervisor" element={
        <ProtectedRoute allowedRoles={['supervisor']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="interns" element={<div>Interns Page Placeholder</div>} />
        <Route path="approvals" element={<div>Approvals Page Placeholder</div>} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<div>Users Page Placeholder</div>} />
        <Route path="settings" element={<div>Settings Page Placeholder</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
