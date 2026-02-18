import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";
import VerifyEmail from "./pages/public/VerifyEmail";
import DashboardLayout from "./layouts/DashboardLayout";

// Student/Intern Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentDailyLogs from "./pages/student/DailyLogs";
import StudentSchedule from "./pages/student/Schedule";
import StudentReports from "./pages/student/Reports";
import StudentSettings from "./pages/student/Settings";
import StudentAnnouncements from "./pages/student/Announcements";

// Supervisor Pages
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorManageInterns from "./pages/supervisor/ManageInterns";
import SupervisorManageTasks from "./pages/supervisor/ManageTasks";
import SupervisorMonitorAttendance from "./pages/supervisor/MonitorAttendance";
import SupervisorReports from "./pages/supervisor/Reports";
import SupervisorSettings from "./pages/supervisor/Settings";
import SupervisorAnnouncements from "./pages/supervisor/Announcements";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManageInterns from "./pages/admin/ManageInterns";
import AdminManageTasks from "./pages/admin/ManageTasks";
import AdminMonitorAttendance from "./pages/admin/MonitorAttendance";
import AdminManageSupervisors from "./pages/admin/ManageSupervisors";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminAnnouncements from "./pages/admin/Announcements";

import { Briefcase } from "lucide-react";
import "./styles/auth.css";

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
    case "intern":
      return "/intern/dashboard";
    case "supervisor":
      return "/supervisor/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/";
  }
};

// ========================
// Public Route Wrapper
// Redirects authenticated users to their dashboard
// ========================
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading, isPasswordRecovery } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If the user arrived via a password recovery link, send them to
  // the reset-password page instead of the dashboard.
  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

// ========================
// Protected Route Wrapper
// ========================
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
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

// ========================
// Redirect on PASSWORD_RECOVERY event
//   Supabase may land the user on "/" after processing the recovery
//   token. This component watches for the recovery flag and navigates
//   to "/reset-password" regardless of where the redirect landed.
// ========================
const PasswordRecoveryRedirect = () => {
  const { isPasswordRecovery } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isPasswordRecovery && location.pathname !== "/reset-password") {
      navigate("/reset-password", { replace: true });
    }
  }, [isPasswordRecovery, location.pathname, navigate]);

  return null;
};

function AppRoutes() {
  return (
    <>
      <PasswordRecoveryRedirect />
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordWrapper />} />

        {/* Intern Routes */}
        <Route
          path="/intern"
          element={
            <ProtectedRoute allowedRoles={["intern"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="logs" element={<StudentDailyLogs />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="reports" element={<StudentReports />} />
          <Route path="announcements/:type" element={<StudentAnnouncements />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Supervisor Routes */}
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={["supervisor"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SupervisorDashboard />} />
          <Route path="interns" element={<SupervisorManageInterns />} />
          <Route path="tasks" element={<SupervisorManageTasks />} />
          <Route path="attendance" element={<SupervisorMonitorAttendance />} />
          <Route path="reports" element={<SupervisorReports />} />
          <Route
            path="announcements/:type"
            element={<SupervisorAnnouncements />}
          />
          <Route path="settings" element={<SupervisorSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="interns" element={<AdminManageInterns />} />
          <Route path="tasks" element={<AdminManageTasks />} />
          <Route path="attendance" element={<AdminMonitorAttendance />} />
          <Route path="manage-supervisors" element={<AdminManageSupervisors />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Wrapper that clears the recovery flag once the user leaves /reset-password.
// Also shows a loading screen while the recovery session is being established.
const ResetPasswordWrapper = () => {
  const { clearPasswordRecovery, isLoading } = useAuth();

  useEffect(() => {
    // Clear the flag when the component unmounts (user navigates away
    // after resetting their password).
    return () => {
      clearPasswordRecovery();
    };
  }, [clearPasswordRecovery]);

  // While Supabase is still exchanging the recovery code, show the
  // loading screen instead of the form (which would fail without a session).
  if (isLoading) {
    return <LoadingScreen />;
  }

  return <ResetPassword />;
};

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
