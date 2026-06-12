// supabase/functions/_shared/agent-functions.ts
// Data broker des agents C-suite — exécute les fonctions custom déclarées dans
// Mistral Studio (get_projects_financial_summary, get_crm_pipeline, etc.).
//
// Chaque fonction lit la base avec le service role et retourne un JSON compact
// (les agents paient chaque token : on agrège, on ne dump jamais de tables).
// Toute erreur retourne { error } — jamais d'exception, l'agent doit pouvoir
// continuer son analyse avec les données partielles.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let _db: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!_db) {
    _db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _db;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

type Json = Record<string, unknown>;

// ─── DAF ──────────────────────────────────────────────────────────────────────

async function getProjectsFinancialSummary(args: Json): Promise<Json> {
  const days = typeof args.days === "number" && args.days > 0 ? Math.min(args.days, 365) : 90;
  let query = db()
    .from("projects")
    .select("name, code, status, priority, qualification_score, estimated_budget_min, estimated_budget_max, proposal_amount, created_at, updated_at")
    .gte("created_at", daysAgo(days))
    .order("created_at", { ascending: false })
    .limit(50);
  if (typeof args.status_filter === "string" && args.status_filter) {
    query = query.eq("status", args.status_filter);
  }
  const { data, error } = await query;
  if (error) return { error: error.message };

  const projects = data || [];
  const totalBudgetMin = projects.reduce((s, p) => s + (p.estimated_budget_min || 0), 0);
  const totalBudgetMax = projects.reduce((s, p) => s + (p.estimated_budget_max || 0), 0);
  const totalProposed = projects.reduce((s, p) => s + (p.proposal_amount || 0), 0);
  const byStatus: Record<string, number> = {};
  projects.forEach((p) => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });

  return {
    period_days: days,
    projects_count: projects.length,
    by_status: byStatus,
    total_budget_min_eur: totalBudgetMin,
    total_budget_max_eur: totalBudgetMax,
    total_proposed_eur: totalProposed,
    projects: projects.map((p) => ({
      name: p.name, code: p.code, status: p.status, priority: p.priority,
      score: p.qualification_score,
      budget: `${p.estimated_budget_min ?? "?"}-${p.estimated_budget_max ?? "?"}€`,
      proposal_eur: p.proposal_amount,
      created_at: p.created_at,
    })),
  };
}

async function getAiMissionsCosts(args: Json): Promise<Json> {
  const days = typeof args.days === "number" && args.days > 0 ? Math.min(args.days, 365) : 30;
  let query = db()
    .from("agent_missions")
    .select("mission_type, status, cost_eur, tokens_in, tokens_out, agents_used, created_at")
    .gte("created_at", daysAgo(days))
    .order("created_at", { ascending: false })
    .limit(200);
  if (typeof args.mission_type === "string" && args.mission_type) {
    query = query.eq("mission_type", args.mission_type);
  }
  const { data, error } = await query;
  if (error) return { error: error.message };

  const missions = data || [];
  const totalCost = missions.reduce((s, m) => s + Number(m.cost_eur || 0), 0);
  const byType: Record<string, { count: number; cost_eur: number }> = {};
  missions.forEach((m) => {
    if (!byType[m.mission_type]) byType[m.mission_type] = { count: 0, cost_eur: 0 };
    byType[m.mission_type].count++;
    byType[m.mission_type].cost_eur += Number(m.cost_eur || 0);
  });
  const topCostly = [...missions]
    .sort((a, b) => Number(b.cost_eur || 0) - Number(a.cost_eur || 0))
    .slice(0, 5)
    .map((m) => ({ type: m.mission_type, status: m.status, cost_eur: Number(m.cost_eur || 0), date: m.created_at }));

  return {
    period_days: days,
    missions_count: missions.length,
    total_cost_eur: Number(totalCost.toFixed(4)),
    avg_cost_eur: missions.length ? Number((totalCost / missions.length).toFixed(4)) : 0,
    by_type: byType,
    top_5_costly: topCostly,
  };
}

// ─── Marketing ────────────────────────────────────────────────────────────────

async function getLeadsPipelineStats(args: Json): Promise<Json> {
  const days = typeof args.days === "number" && args.days > 0 ? Math.min(args.days, 365) : 30;
  // Leads marketing = audits gratuits + projets en phase discovery
  const [audits, discoveryProjects] = await Promise.all([
    db().from("marketing_audits").select("id, created_at").gte("created_at", daysAgo(days)).limit(200),
    db().from("projects")
      .select("name, status, qualification_score, priority, created_at")
      .in("status", ["discovery", "qualification", "active"])
      .gte("created_at", daysAgo(days))
      .limit(100),
  ]);

  const projects = discoveryProjects.data || [];
  const byScore: Record<string, number> = {};
  projects.forEach((p) => {
    const k = p.qualification_score ? `score_${p.qualification_score}` : "non_scoré";
    byScore[k] = (byScore[k] || 0) + 1;
  });

  return {
    period_days: days,
    marketing_audits_count: audits.error ? `[indisponible: ${audits.error.message}]` : (audits.data || []).length,
    discovery_projects_count: projects.length,
    by_qualification_score: byScore,
    recent_leads: projects.slice(0, 10).map((p) => ({
      name: p.name, status: p.status, score: p.qualification_score, priority: p.priority, date: p.created_at,
    })),
  };
}

async function getContentStats(args: Json): Promise<Json> {
  const includeDrafts = args.include_drafts !== false;
  const { data, error } = await db()
    .from("blog_posts")
    .select("title, status, created_at, published_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { error: error.message };

  const posts = (data || []).filter((p) => includeDrafts || p.status === "published");
  const byStatus: Record<string, number> = {};
  posts.forEach((p) => { byStatus[p.status || "inconnu"] = (byStatus[p.status || "inconnu"] || 0) + 1; });
  const published = posts.filter((p) => p.published_at);
  const lastPublished = published[0]?.published_at ?? null;

  return {
    total_posts: posts.length,
    by_status: byStatus,
    last_published_at: lastPublished,
    recent_titles: posts.slice(0, 10).map((p) => ({ title: p.title, status: p.status, date: p.created_at })),
  };
}

// ─── Commercial ───────────────────────────────────────────────────────────────

async function getCrmPipeline(args: Json): Promise<Json> {
  const staleDays = typeof args.stale_days === "number" && args.stale_days > 0 ? args.stale_days : 14;
  const includeBudget = args.include_budget !== false;
  const { data, error } = await db()
    .from("projects")
    .select("name, code, status, priority, qualification_score, estimated_budget_min, estimated_budget_max, proposal_amount, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return { error: error.message };

  const projects = data || [];
  const staleCutoff = Date.now() - staleDays * 24 * 3600 * 1000;
  const byStatus: Record<string, { count: number; budget_max_eur: number }> = {};
  projects.forEach((p) => {
    if (!byStatus[p.status]) byStatus[p.status] = { count: 0, budget_max_eur: 0 };
    byStatus[p.status].count++;
    byStatus[p.status].budget_max_eur += p.estimated_budget_max || 0;
  });
  const stale = projects.filter((p) =>
    new Date(p.updated_at).getTime() < staleCutoff &&
    !["delivered", "cancelled", "closed"].includes(p.status));

  return {
    pipeline_count: projects.length,
    by_status: byStatus,
    stale_threshold_days: staleDays,
    stale_deals: stale.slice(0, 10).map((p) => ({
      name: p.name, code: p.code, status: p.status,
      score: p.qualification_score,
      ...(includeBudget ? { budget: `${p.estimated_budget_min ?? "?"}-${p.estimated_budget_max ?? "?"}€` } : {}),
      last_activity: p.updated_at,
    })),
  };
}

async function getPendingDocuments(args: Json): Promise<Json> {
  const docTypes = Array.isArray(args.doc_types) && args.doc_types.length
    ? args.doc_types.filter((t): t is string => typeof t === "string").slice(0, 6)
    : ["proposal", "pricing"];
  const { data, error } = await db()
    .from("documents")
    .select("name, type, status, project_id, created_at, requires_signature")
    .in("type", docTypes)
    .in("status", ["draft", "sent", "review"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { error: error.message };

  const docs = data || [];
  return {
    pending_count: docs.length,
    documents: docs.map((d) => ({
      name: d.name, type: d.type, status: d.status,
      requires_signature: d.requires_signature,
      age_days: Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86_400_000),
    })),
  };
}

// ─── RH ───────────────────────────────────────────────────────────────────────

async function getAgentMissionsPerformance(args: Json): Promise<Json> {
  const days = typeof args.days === "number" && args.days > 0 ? Math.min(args.days, 365) : 60;
  const includeFailed = args.include_failed !== false;
  const { data, error } = await db()
    .from("agent_missions")
    .select("mission_type, status, steps, agents_used, cost_eur, created_at")
    .gte("created_at", daysAgo(days))
    .limit(200);
  if (error) return { error: error.message };

  const missions = data || [];
  const agentUsage: Record<string, number> = {};
  const failedSteps: Record<string, number> = {};
  missions.forEach((m) => {
    (m.agents_used || []).forEach((a: string) => { agentUsage[a] = (agentUsage[a] || 0) + 1; });
    if (includeFailed && Array.isArray(m.steps)) {
      m.steps.forEach((s: { step?: string; status?: string }) => {
        if (s.status === "failed") failedSteps[s.step || "?"] = (failedSteps[s.step || "?"] || 0) + 1;
      });
    }
  });
  const byMissionStatus: Record<string, number> = {};
  missions.forEach((m) => { byMissionStatus[m.status] = (byMissionStatus[m.status] || 0) + 1; });

  return {
    period_days: days,
    missions_count: missions.length,
    by_mission_status: byMissionStatus,
    success_rate_pct: missions.length
      ? Math.round(100 * missions.filter((m) => m.status === "completed").length / missions.length)
      : null,
    agent_usage: agentUsage,
    failed_steps: failedSteps,
  };
}

async function getControlTowerBuildRequests(args: Json): Promise<Json> {
  const days = typeof args.days === "number" && args.days > 0 ? Math.min(args.days, 365) : 30;
  const { data, error } = await db()
    .from("control_tower_messages")
    .select("specialist, category, title, priority, created_at")
    .gte("created_at", daysAgo(days))
    .in("category", ["recommendation", "alert"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { error: error.message };
  return {
    period_days: days,
    requests_count: (data || []).length,
    requests: (data || []).map((m) => ({
      from: m.specialist, category: m.category, title: m.title, priority: m.priority, date: m.created_at,
    })),
  };
}

// ─── DG ───────────────────────────────────────────────────────────────────────

async function getSpecialistLatestReports(args: Json): Promise<Json> {
  const daysMax = typeof args.days_max === "number" && args.days_max > 0 ? Math.min(args.days_max, 90) : 30;
  const wanted = Array.isArray(args.specialists) && args.specialists.length
    ? args.specialists.filter((s): s is string => typeof s === "string")
    : ["daf", "marketing_dir", "commercial_dir", "rh", "juridix"];

  const { data, error } = await db()
    .from("control_tower_messages")
    .select("specialist, category, title, content_markdown, priority, created_at")
    .in("specialist", wanted)
    .eq("direction", "to_dg")
    .gte("created_at", daysAgo(daysMax))
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { error: error.message };

  // Dernier rapport par spécialiste uniquement (les agents paient chaque token)
  const latest: Record<string, unknown> = {};
  for (const m of data || []) {
    if (!latest[m.specialist]) {
      latest[m.specialist] = {
        title: m.title, category: m.category, priority: m.priority, date: m.created_at,
        content: (m.content_markdown || "").slice(0, 4000),
      };
    }
  }
  const missing = wanted.filter((s) => !latest[s]);
  return { reports: latest, missing_reports: missing, window_days: daysMax };
}

async function getCompanyKpis(): Promise<Json> {
  const [projects, missions, leads, docs] = await Promise.all([
    db().from("projects").select("status, estimated_budget_max, proposal_amount").limit(200),
    db().from("agent_missions").select("cost_eur, status").gte("created_at", daysAgo(30)).limit(200),
    db().from("projects").select("id").in("status", ["discovery", "qualification"]).gte("created_at", daysAgo(30)).limit(200),
    db().from("documents").select("type, status").in("type", ["proposal", "pricing", "contract", "contract_fr"]).in("status", ["draft", "sent", "review"]).limit(100),
  ]);

  const projectList = projects.data || [];
  const byStatus: Record<string, number> = {};
  projectList.forEach((p) => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
  const pipelineEur = projectList
    .filter((p) => !["delivered", "cancelled", "closed"].includes(p.status))
    .reduce((s, p) => s + (p.proposal_amount || p.estimated_budget_max || 0), 0);
  const aiCost30d = (missions.data || []).reduce((s, m) => s + Number(m.cost_eur || 0), 0);

  return {
    projects_by_status: byStatus,
    pipeline_potential_eur: pipelineEur,
    new_leads_30d: (leads.data || []).length,
    ai_costs_30d_eur: Number(aiCost30d.toFixed(4)),
    ai_missions_30d: (missions.data || []).length,
    pending_commercial_docs: (docs.data || []).length,
  };
}

async function logDgDecision(args: Json): Promise<Json> {
  const title = typeof args.title === "string" ? args.title.trim().slice(0, 100) : "";
  const content = typeof args.content_markdown === "string" ? args.content_markdown.trim().slice(0, 8000) : "";
  const responsable = typeof args.specialist_responsable === "string" ? args.specialist_responsable : "";
  const urgency = typeof args.urgency === "string" ? args.urgency : "30j";
  const validSpecialists = ["daf", "marketing_dir", "commercial_dir", "rh", "juridix"];
  if (!title || !content || !validSpecialists.includes(responsable)) {
    return { error: "title, content_markdown et specialist_responsable (valide) sont requis" };
  }
  const { error } = await db().from("control_tower_messages").insert({
    specialist: responsable,
    direction: "from_dg",
    category: "decision",
    title: `[Décision DG — ${urgency}] ${title}`,
    content_markdown: content,
    priority: urgency === "immediate" ? "critical" : urgency === "7j" ? "high" : "normal",
  });
  if (error) return { error: error.message };
  return { logged: true, title, responsable, urgency };
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const FUNCTIONS: Record<string, (args: Json) => Promise<Json>> = {
  get_projects_financial_summary: getProjectsFinancialSummary,
  get_ai_missions_costs: getAiMissionsCosts,
  get_leads_pipeline_stats: getLeadsPipelineStats,
  get_content_stats: getContentStats,
  get_crm_pipeline: getCrmPipeline,
  get_pending_documents: getPendingDocuments,
  get_agent_missions_performance: getAgentMissionsPerformance,
  get_control_tower_build_requests: getControlTowerBuildRequests,
  get_specialist_latest_reports: getSpecialistLatestReports,
  get_company_kpis: () => getCompanyKpis(),
  log_dg_decision: logDgDecision,
};

export const AGENT_FUNCTION_NAMES = Object.keys(FUNCTIONS);

/** Exécute une fonction d'agent. Retourne toujours un objet (jamais d'exception). */
export async function executeAgentFunction(name: string, args: Json): Promise<Json> {
  const fn = FUNCTIONS[name];
  if (!fn) return { error: `Fonction inconnue : ${name}. Disponibles : ${AGENT_FUNCTION_NAMES.join(", ")}` };
  try {
    return await fn(args || {});
  } catch (err) {
    console.error(`[agent-functions] ${name} failed:`, err);
    return { error: `Exécution de ${name} échouée : ${err instanceof Error ? err.message : "erreur interne"}` };
  }
}
