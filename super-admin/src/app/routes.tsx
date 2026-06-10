import { createBrowserRouter, Navigate } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { Dashboard } from "./components/pages/Dashboard";
import { ClinicManagement } from "./components/pages/ClinicManagement";
import { UserManagement } from "./components/pages/UserManagement";
import { RolesPermissions } from "./components/pages/RolesPermissions";
import { AuditTrail } from "./components/pages/AuditTrail";
import { Settings } from "./components/pages/Settings";
import { ClinicDetails } from "./components/pages/ClinicDetails";
import { Login } from "./components/pages/Login";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('vetintel_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "clinics", Component: ClinicManagement },
      { path: "clinics/:id", Component: ClinicDetails },
      { path: "users", Component: UserManagement },
      { path: "roles", Component: RolesPermissions },
      { path: "audit", Component: AuditTrail },
      { path: "settings", Component: Settings },
    ],
  },
]);
