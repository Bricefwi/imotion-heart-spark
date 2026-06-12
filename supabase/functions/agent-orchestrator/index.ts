// agent-orchestrator — lance une mission multi-agents parallèle.
//
// POST { mission_type: "project_analysis"|"marketing_plan"|"contract_review",
//        project_id?, objective, context?, max_cost_eur? }
// → exécute les vagues d'agents en parallèle, synthèse + passe critique,
//   trace tout dans agent_missions (coût, tokens, agents utilisés).
//
// POST { mode: "presets" } → liste les missions disponibles et leur coût plafond.
//
// Réservé admin/consultant. Budget plafonné à HARD_COST_CAP (5 €) quoi qu'il arrive.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MISSION_PRESETS, runMission, HARD_COST_CAP } from "../_shared/orchestrator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await anonClient.auth.getUser();
    if (authError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: userRoles } = await db.from("user_roles").select("role").eq("user_id", userData.user.id);
    const roles = (userRoles || []).map((r: { role: string }) => r.role);
    if (!roles.some((r: string) => ["admin", "super_admin", "consultant"].includes(r))) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json();

    // ─── Liste des presets ───
    if (body.mode === "presets") {
      return json({
        success: true,
        hard_cost_cap_eur: HARD_COST_CAP,
        presets: Object.values(MISSION_PRESETS).map((p) => ({
          type: p.type,
          description: p.description,
          default_max_cost_eur: p.defaultMaxCostEur,
          steps: p.waves.flat().map((s) => ({ id: s.id, agent: s.mistralAgent ?? `tier:${s.fallbackTier}`, optional: !!s.optional })),
        })),
      });
    }

    // ─── Lancement de mission ───
    const preset = MISSION_PRESETS[body.mission_type];
    if (!preset) {
      return json({ error: `mission_type invalide. Disponibles : ${Object.keys(MISSION_PRESETS).join(", ")}` }, 400);
    }
    const objective = typeof body.objective === "string" ? body.objective.trim().slice(0, 2000) : "";
    if (!objective) return json({ error: "Le champ 'objective' est requis" }, 400);

    const maxCostEur = Math.min(
      typeof body.max_cost_eur === "number" && body.max_cost_eur > 0 ? body.max_cost_eur : preset.defaultMaxCostEur,
      HARD_COST_CAP,
    );

    // Contexte : fourni directement et/ou construit depuis le projet
    let context = typeof body.context === "string" ? body.context.slice(0, 10_000) : "";
    if (body.project_id) {
      const { data: project } = await db
        .from("projects")
        .select("*, client:profiles!projects_client_id_fkey(full_name, company_name, industry, company_size)")
        .eq("id", body.project_id)
        .single();
      if (project) {
        const { data: msgs } = await db
          .from("messages")
          .select("role, content")
          .eq("project_id", body.project_id)
          .order("created_at", { ascending: true })
          .limit(100);
        const conv = (msgs || []).map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");
        context += `
## PROJET
- Nom : ${project.name} (${project.code})
- Client : ${project.client?.full_name || "N/A"} — ${project.client?.company_name || "N/A"} (${project.client?.industry || "secteur non spécifié"})
- Budget : ${project.estimated_budget_min || "?"} - ${project.estimated_budget_max || "?"}€
- Statut : ${project.status}
## DONNÉES DE DÉCOUVERTE
${JSON.stringify(project.discovery_data || {}).slice(0, 3000)}
## ÉCHANGES CLIENT
${conv.slice(0, 5000)}`;
      }
    }
    if (!context.trim()) {
      return json({ error: "Contexte vide : fournissez 'context' ou un 'project_id' valide" }, 400);
    }

    // Créer l'enregistrement mission
    const { data: mission, error: missionErr } = await db
      .from("agent_missions")
      .insert({
        project_id: body.project_id ?? null,
        mission_type: preset.type,
        objective,
        status: "running",
        max_cost_eur: maxCostEur,
        created_by: userData.user.id,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (missionErr) throw missionErr;

    // Exécution (vagues parallèles + synthèse + critique)
    const result = await runMission({
      preset,
      objective,
      context,
      maxCostEur,
      onProgress: async (steps, costEur) => {
        await db.from("agent_missions").update({
          steps: steps.map((s) => ({ step: s.step, agent: s.agent, status: s.status, cost_eur: s.cost_eur })),
          cost_eur: costEur,
        }).eq("id", mission.id);
      },
    });

    await db.from("agent_missions").update({
      status: result.status === "completed" ? "completed" : result.status,
      steps: result.steps.map((s) => ({ step: s.step, agent: s.agent, status: s.status, cost_eur: s.cost_eur })),
      result: {
        synthesis_markdown: result.synthesis_markdown,
        critic_verdict: result.critic_verdict,
        quality_score: result.quality_score,
      },
      cost_eur: result.cost_eur,
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
      agents_used: result.agents_used,
      completed_at: new Date().toISOString(),
    }).eq("id", mission.id);

    return json({
      success: true,
      mission_id: mission.id,
      status: result.status,
      synthesis_markdown: result.synthesis_markdown,
      critic_verdict: result.critic_verdict,
      quality_score: result.quality_score,
      cost_eur: Number(result.cost_eur.toFixed(5)),
      budget_eur: maxCostEur,
      agents_used: result.agents_used,
      steps: result.steps.map((s) => ({ step: s.step, agent: s.agent, status: s.status })),
    });
  } catch (e) {
    console.error("agent-orchestrator error:", e);
    return json({ error: "Erreur interne lors de l'exécution de la mission" }, 500);
  }
});
