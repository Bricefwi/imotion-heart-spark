import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  // ── Effect 1: Track auth state only (NO DB queries here) ──
  // Supabase requires that we don't make data queries inside onAuthStateChange
  // because the client's internal auth headers may not be updated yet.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    // Also get initial session (in case onAuthStateChange doesn't fire INITIAL_SESSION)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (!initialSession?.user) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Effect 2: Load profile & roles when user changes ──
  // This runs in a separate React render cycle, after the Supabase client
  // has fully updated its internal auth state, so DB queries work correctly.
  useEffect(() => {
    if (!user) return;

    let isActive = true;
    setLoading(true);

    const loadContext = async () => {
      try {
        // Step 1: Fetch profile and roles from DB in parallel
        const [profileResult, rolesResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
        ]);

        if (!isActive) return;

        if (profileResult.error) {
          console.warn("[useAuth] Profile fetch error:", profileResult.error.message);
        }
        setProfile(profileResult.data ?? null);

        // Step 2: Resolve roles from DB
        let resolvedRoles: AppRole[] =
          !rolesResult.error && rolesResult.data && rolesResult.data.length > 0
            ? rolesResult.data.map(({ role }) => role)
            : [];

        if (rolesResult.error) {
          console.warn("[useAuth] Roles fetch error:", rolesResult.error.message);
        } else if (rolesResult.data && rolesResult.data.length === 0) {
          console.warn("[useAuth] user_roles returned empty for user:", user.id);
        }

        // Step 3: Fallback A - JWT metadata (no network call)
        if (resolvedRoles.length === 0) {
          resolvedRoles = extractRolesFromMetadata(user);
          if (resolvedRoles.length > 0) {
            console.info("[useAuth] Roles from metadata:", resolvedRoles);
          }
        }

        // Step 4: Fallback B - Single RPC check (SECURITY DEFINER, bypasses RLS)
        if (resolvedRoles.length === 0) {
          try {
            const { data, error } = await supabase.rpc("has_role", {
              _user_id: user.id,
              _role: "admin" as AppRole,
            });
            if (!isActive) return;
            if (!error && data === true) {
              resolvedRoles = ["admin"];
              console.info("[useAuth] Admin role confirmed via RPC");
            }
          } catch {
            console.warn("[useAuth] has_role RPC unavailable");
          }
        }

        if (!isActive) return;

        const finalRoles = resolvedRoles.length > 0 ? resolvedRoles : ["client" as AppRole];
        console.info("[useAuth] Final roles:", finalRoles, "for user:", user.id);
        setRoles(finalRoles);
      } catch (error) {
        if (!isActive) return;
        console.error("[useAuth] Unexpected error loading context:", error);
        setProfile(null);
        const metadataRoles = extractRolesFromMetadata(user);
        setRoles(metadataRoles.length > 0 ? metadataRoles : ["client"]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
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
