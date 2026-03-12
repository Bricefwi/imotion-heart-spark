import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AppRole = Database["public"]["Enums"]["app_role"];

const APP_ROLES: AppRole[] = ["client", "consultant", "admin", "super_admin"];

const isAppRole = (value: unknown): value is AppRole =>
  typeof value === "string" && APP_ROLES.includes(value as AppRole);

const extractRolesFromMetadata = (currentUser: User): AppRole[] => {
  const metadata = currentUser.app_metadata as Record<string, unknown>;

  const rolesFromArray = Array.isArray(metadata.roles)
    ? metadata.roles.filter(isAppRole)
    : [];

  const roleFromSingle = isAppRole(metadata.role) ? [metadata.role] : [];

  return Array.from(new Set([...rolesFromArray, ...roleFromSingle]));
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isActive = true;

    const loadUserContext = async (currentUser: User) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        // Step 1: Fetch profile and roles from DB in parallel (2 queries only)
        const [profileResult, rolesResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", currentUser.id),
        ]);

        if (!isActive || requestId !== requestIdRef.current) return;

        if (profileResult.error) {
          console.warn("[useAuth] Profile fetch failed:", profileResult.error.message);
        }
        setProfile(profileResult.data ?? null);

        // Step 2: Resolve roles from DB result
        const directRoles: AppRole[] =
          !rolesResult.error && rolesResult.data && rolesResult.data.length > 0
            ? rolesResult.data.map(({ role }) => role)
            : [];

        if (rolesResult.error) {
          console.warn("[useAuth] Roles fetch failed:", rolesResult.error.message);
        }

        // Step 3: If DB returned roles, use them. Otherwise try fallbacks.
        let resolvedRoles = directRoles;

        if (resolvedRoles.length === 0) {
          // Fallback A: Extract from JWT metadata (no network call needed)
          resolvedRoles = extractRolesFromMetadata(currentUser);
        }

        if (resolvedRoles.length === 0) {
          // Fallback B: Single targeted RPC check for admin role
          // (uses SECURITY DEFINER, bypasses RLS)
          try {
            const { data, error } = await supabase.rpc("has_role", {
              _user_id: currentUser.id,
              _role: "admin" as AppRole,
            });
            if (!isActive || requestId !== requestIdRef.current) return;
            if (!error && data === true) {
              resolvedRoles = ["admin"];
            }
          } catch {
            // RPC unavailable, continue
          }
        }

        if (!isActive || requestId !== requestIdRef.current) return;

        const finalRoles = resolvedRoles.length > 0 ? resolvedRoles : ["client" as AppRole];
        console.info("[useAuth] Roles resolved:", finalRoles, "for user:", currentUser.id);
        setRoles(finalRoles);
      } catch (error) {
        if (!isActive || requestId !== requestIdRef.current) return;
        console.error("[useAuth] Unexpected error:", error);
        setProfile(null);
        const metadataRoles = extractRolesFromMetadata(currentUser);
        setRoles(metadataRoles.length > 0 ? metadataRoles : ["client"]);
      } finally {
        if (isActive && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    const applySession = async (nextSession: Session | null) => {
      if (!isActive) return;

      setSession(nextSession);
      const currentUser = nextSession?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        requestIdRef.current += 1;
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      await loadUserContext(currentUser);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void applySession(initialSession);
    });

    return () => {
      isActive = false;
      requestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    requestIdRef.current += 1;
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
