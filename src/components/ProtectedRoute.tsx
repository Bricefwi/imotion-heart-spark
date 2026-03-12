import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, roles, loading } = useAuth();
  const location = useLocation();

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isConsultant = roles.includes("consultant") || isAdmin;

  const hasRequiredRole =
    !requiredRole
      ? true
      : requiredRole === "admin"
        ? isAdmin
        : requiredRole === "consultant"
          ? isConsultant
          : roles.includes(requiredRole as never);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && !hasRequiredRole) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Redirect to onboarding if not completed (only for client routes, skip for admin/consultant)
  if (
    profile &&
    !profile.onboarding_completed &&
    !requiredRole &&
    !isAdmin &&
    !isConsultant &&
    location.pathname !== "/client/onboarding"
  ) {
    return <Navigate to="/client/onboarding" replace />;
  }

  return <>{children}</>;
}

