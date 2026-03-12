import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AppRole = Database["public"]["Enums"]["app_role"];

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
        const [profileResult, rolesResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", currentUser.id),
        ]);

        if (!isActive || requestId !== requestIdRef.current) return;

        if (profileResult.error) {
          console.error("Error fetching profile:", profileResult.error);
        }
        setProfile(profileResult.data ?? null);

        if (rolesResult.error) {
          console.error("Error fetching roles:", rolesResult.error);
          setRoles([]);
          return;
        }

        const fetchedRoles = rolesResult.data.map(({ role }) => role);
        setRoles(fetchedRoles.length > 0 ? fetchedRoles : ["client"]);
      } catch (error) {
        if (!isActive || requestId !== requestIdRef.current) return;
        console.error("Error fetching auth context:", error);
        setProfile(null);
        setRoles([]);
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

