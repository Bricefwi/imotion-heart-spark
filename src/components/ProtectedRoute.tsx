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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Redirect to onboarding if not completed (only for client routes)
  if (
    profile &&
    !profile.onboarding_completed &&
    !requiredRole &&
    location.pathname !== "/client/onboarding"
  ) {
    return <Navigate to="/client/onboarding" replace />;
  }

  return <>{children}</>;
}
