import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AgencyBranding {
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  consultant_persona: string;
  welcome_message: string | null;
  custom_subdomain: string | null;
  custom_domain: string | null;
}

interface Agency {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
}

interface Subscription {
  plan: string;
  status: string;
  audits_quota: number;
  audits_used: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

interface AgencyContextValue {
  agency: Agency | null;
  branding: AgencyBranding | null;
  subscription: Subscription | null;
  role: string | null;
  isLoading: boolean;
  refetch: () => void;
}

const AgencyContext = createContext<AgencyContextValue>({
  agency: null,
  branding: null,
  subscription: null,
  role: null,
  isLoading: true,
  refetch: () => {},
});

export function AgencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [branding, setBranding] = useState<AgencyBranding | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) {
      setAgency(null);
      setBranding(null);
      setSubscription(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    async function load() {
      setIsLoading(true);
      try {
        const sb = supabase as any;
        const { data: agencyUser } = await sb
          .from("agency_users")
          .select("agency_id, role")
          .eq("user_id", user!.id)
          .single();

        if (!agencyUser) {
          setIsLoading(false);
          return;
        }

        setRole(agencyUser.role);

        const [agencyRes, brandingRes, subRes] = await Promise.all([
          sb.from("agencies").select("*").eq("id", agencyUser.agency_id).single(),
          sb.from("agency_branding").select("*").eq("agency_id", agencyUser.agency_id).single(),
          sb.from("agency_subscriptions").select("*").eq("agency_id", agencyUser.agency_id).single(),
        ]);

        if (agencyRes.data) setAgency(agencyRes.data as Agency);
        if (brandingRes.data) setBranding(brandingRes.data as AgencyBranding);
        if (subRes.data) setSubscription(subRes.data as Subscription);
      } catch (e) {
        console.error("[AgencyContext] load error:", e);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, tick]);

  return (
    <AgencyContext.Provider
      value={{ agency, branding, subscription, role, isLoading, refetch: () => setTick((t) => t + 1) }}
    >
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  return useContext(AgencyContext);
}
