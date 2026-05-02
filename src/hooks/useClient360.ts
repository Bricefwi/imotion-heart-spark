/**
 * useClient360
 * ------------
 * Aggregates "Client 360°" data from two distinct sources WITHOUT merging
 * the SQL schemas:
 *
 *  - Clarivi (this app)  -> tables `projects`, `documents`, `messages`,
 *                            `project_estimates`
 *  - lovelib (marketing) -> table `marketing_audits` (shared backend, kept
 *                            as a separate, prefixable namespace) + an
 *                            optional REST endpoint exposed by lovelib for
 *                            real-time KPIs (campaigns, traffic, leads).
 *
 * Each source is fetched in parallel; failures are isolated so one missing
 * source never breaks the dashboard.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMarketingBaseUrl } from "@/lib/marketing-url";

export interface ClariviSnapshot {
  projects: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
    current_phase: number | null;
    overall_progress: number | null;
    last_activity_at: string | null;
    created_at: string | null;
  }>;
  documentsCount: number;
  messagesCount: number;
  activeProjectsCount: number;
  totalEstimatedBudget: number;
}

export interface LovelibAudit {
  id: string;
  source: string;
  status: string;
  score: number | null;
  summary: string | null;
  website_url: string | null;
  company_name: string | null;
  recommendations: unknown[];
  completed_at: string | null;
  created_at: string;
}

export interface LovelibLiveKpis {
  campaigns_active: number;
  monthly_visitors: number;
  leads_30d: number;
  conversion_rate: number;
  last_sync_at: string;
}

export interface Client360Data {
  clarivi: ClariviSnapshot | null;
  lovelibAudits: LovelibAudit[];
  lovelibLive: LovelibLiveKpis | null;
  sources: {
    clarivi: "ok" | "error" | "loading";
    lovelibAudits: "ok" | "error" | "loading";
    lovelibLive: "ok" | "error" | "loading" | "unavailable";
  };
  errors: Record<string, string>;
}

const EMPTY: Client360Data = {
  clarivi: null,
  lovelibAudits: [],
  lovelibLive: null,
  sources: { clarivi: "loading", lovelibAudits: "loading", lovelibLive: "loading" },
  errors: {},
};

async function fetchClarivi(userId: string): Promise<ClariviSnapshot> {
  const [{ data: projects, error: pErr }, { count: docCount }, { count: msgCount }, { data: estimates }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id,name,code,status,current_phase,overall_progress,last_activity_at,created_at,estimated_budget_max")
        .eq("client_id", userId)
        .order("last_activity_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId)
        .or(`uploaded_by.eq.${userId}`),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("project_estimates")
        .select("final_price,project_id,is_current")
        .eq("is_current", true),
    ]);

  if (pErr) throw pErr;

  const projectsList = projects ?? [];
  const activeProjectsCount = projectsList.filter(
    (p) => !["completed", "archived", "cancelled"].includes(p.status),
  ).length;
  const totalEstimatedBudget = (estimates ?? [])
    .filter((e) => projectsList.some((p) => p.id === e.project_id))
    .reduce((sum, e) => sum + (e.final_price ?? 0), 0);

  return {
    projects: projectsList.map(({ estimated_budget_max: _omit, ...rest }: any) => rest),
    documentsCount: docCount ?? 0,
    messagesCount: msgCount ?? 0,
    activeProjectsCount,
    totalEstimatedBudget,
  };
}

async function fetchLovelibAudits(userId: string): Promise<LovelibAudit[]> {
  const { data, error } = await supabase
    .from("marketing_audits")
    .select("id,source,status,score,summary,website_url,company_name,recommendations,completed_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as LovelibAudit[];
}

/**
 * Optional: hits a public REST endpoint on lovelib for live marketing KPIs.
 * The endpoint is expected to authenticate the user via the same Supabase
 * JWT (shared backend SSO). If it doesn't exist yet, we degrade gracefully.
 */
async function fetchLovelibLive(): Promise<LovelibLiveKpis | null> {
  const base = getMarketingBaseUrl();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  try {
    const res = await fetch(`${base}/api/client-360/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
      // Avoid CORS preflight failures hanging the dashboard
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as LovelibLiveKpis;
  } catch {
    return null;
  }
}

export function useClient360(userId: string | undefined) {
  const [data, setData] = useState<Client360Data>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setData((d) => ({
      ...d,
      sources: { clarivi: "loading", lovelibAudits: "loading", lovelibLive: "loading" },
    }));

    const [clariviRes, auditsRes, liveRes] = await Promise.allSettled([
      fetchClarivi(userId),
      fetchLovelibAudits(userId),
      fetchLovelibLive(),
    ]);

    const errors: Record<string, string> = {};
    const clarivi = clariviRes.status === "fulfilled" ? clariviRes.value : null;
    if (clariviRes.status === "rejected") errors.clarivi = String(clariviRes.reason?.message ?? clariviRes.reason);

    const lovelibAudits = auditsRes.status === "fulfilled" ? auditsRes.value : [];
    if (auditsRes.status === "rejected") errors.lovelibAudits = String(auditsRes.reason?.message ?? auditsRes.reason);

    const lovelibLive = liveRes.status === "fulfilled" ? liveRes.value : null;

    setData({
      clarivi,
      lovelibAudits,
      lovelibLive,
      sources: {
        clarivi: clariviRes.status === "fulfilled" ? "ok" : "error",
        lovelibAudits: auditsRes.status === "fulfilled" ? "ok" : "error",
        lovelibLive:
          liveRes.status === "fulfilled" && liveRes.value !== null
            ? "ok"
            : "unavailable",
      },
      errors,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, refresh: load };
}
