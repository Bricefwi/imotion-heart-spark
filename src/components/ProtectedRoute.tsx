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

/**
 * Maps a required role to all roles that satisfy it (role hierarchy).
 */
const toRoleTargets = (requiredRole: string): AppRoleLiteral[] => {
  if (requiredRole === "admin") return ["admin", "super_admin"];
  if (requiredRole === "consultant") return ["consultant", "admin", "super_admin"];
  if (requiredRole === "client") return ["client", "consultant", "admin", "super_admin"];
  return [];
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, roles, loading } = useAuth();
  const location = useLocation();

  // Derive role flags from context
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isConsultant = roles.includes("consultant") || isAdmin;
  const isStaff = isAdmin || isConsultant;

  const hasRequiredRole =
    !requiredRole
      ? true
      : requiredRole === "admin"
        ? isAdmin
        : requiredRole === "consultant"
          ? isConsultant
          : roles.includes(requiredRole as AppRoleLiteral);

  // Server-side fallback: only runs when local role check fails
  const [serverCheck, setServerCheck] = useState<{
    checked: boolean;
    allowed: boolean;
  }>({ checked: false, allowed: false });

  useEffect(() => {
    let active = true;

    // If no required role or no user, skip server check
    if (!user || !requiredRole) {
      setServerCheck({ checked: true, allowed: false });
      return;
    }

    // Reset and perform server-side verification
    setServerCheck({ checked: false, allowed: false });

    const verify = async () => {
      const roleTargets = toRoleTargets(requiredRole);
      if (roleTargets.length === 0) {
        if (active) setServerCheck({ checked: true, allowed: false });
        return;
      }

      try {
        const results = await Promise.all(
          roleTargets.map((role) =>
            supabase.rpc("has_role", { _user_id: user.id, _role: role }),
          ),
        );
        if (!active) return;
        const allowed = results.some((r) => !r.error && r.data === true);
        setServerCheck({ checked: true, allowed });
      } catch {
        if (active) setServerCheck({ checked: true, allowed: false });
      }
    };

    void verify();
    return () => { active = false; };
  }, [user?.id, requiredRole, hasRequiredRole]);

  // 1. Wait for auth context to finish loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Not authenticated -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. If a role is required and local check failed, wait for server check
  if (requiredRole && !hasRequiredRole && !serverCheck.checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Check effective role (local OR server-side)
  const hasAccess = hasRequiredRole || serverCheck.allowed;
  if (requiredRole && !hasAccess) {
    return <Navigate to="/client/dashboard" replace />;
  }

  // 5. Onboarding redirect: ONLY for pure client users on unprotected routes
  //    Staff users (admin/consultant) NEVER get redirected to onboarding.
  const effectiveStaff = isStaff || serverCheck.allowed;
  if (
    !requiredRole &&
    profile &&
    !profile.onboarding_completed &&
    !effectiveStaff &&
    location.pathname !== "/client/onboarding"
  ) {
    return <Navigate to="/client/onboarding" replace />;
  }

  return <>{children}</>;
}
