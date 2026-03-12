import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

type AppRoleLiteral = "client" | "consultant" | "admin" | "super_admin";

const toRoleTargets = (requiredRole: string): AppRoleLiteral[] => {
  if (requiredRole === "admin") return ["admin", "super_admin"];
  if (requiredRole === "consultant") return ["consultant", "admin", "super_admin"];
  if (requiredRole === "client") return ["client", "consultant", "admin", "super_admin"];
  return [];
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, roles, loading } = useAuth();
  const location = useLocation();
  const [serverRoleCheck, setServerRoleCheck] = useState({ checked: false, allowed: false });

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

  useEffect(() => {
    let active = true;

    const verifyRoleServerSide = async () => {
      if (!user || !requiredRole || hasRequiredRole) {
        if (active) {
          setServerRoleCheck({ checked: true, allowed: false });
        }
        return;
      }

      const roleTargets = toRoleTargets(requiredRole);
      if (roleTargets.length === 0) {
        if (active) {
          setServerRoleCheck({ checked: true, allowed: false });
        }
        return;
      }

      if (active) {
        setServerRoleCheck({ checked: false, allowed: false });
      }

      const checks = await Promise.all(
        roleTargets.map((role) =>
          supabase.rpc("has_role", {
            _user_id: user.id,
            _role: role,
          }),
        ),
      );

      if (!active) return;

      const allowed = checks.some((result) => !result.error && result.data === true);
      setServerRoleCheck({ checked: true, allowed });
    };

    void verifyRoleServerSide();

    return () => {
      active = false;
    };
  }, [user, requiredRole, hasRequiredRole]);

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

  const waitingServerRoleCheck = Boolean(requiredRole && !hasRequiredRole && !serverRoleCheck.checked);
  if (waitingServerRoleCheck) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasEffectiveRequiredRole = hasRequiredRole || serverRoleCheck.allowed;

  if (requiredRole && !hasEffectiveRequiredRole) {
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


