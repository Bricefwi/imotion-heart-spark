// supabase/functions/job-processor/index.ts
// Processeur de jobs — reçoit un job_id, exécute la phase agent courante,
// met à jour le statut et enregistre les événements.

import { supabaseAdmin, jsonResponse, errorResponse, optionsResponse, corsHeaders } from "../_shared/agent-runner.ts";
import { callLLM } from "../_shared/llm-gateway.ts";
import { AGENT_PROMPTS } from "../_shared/agents/prompts.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { job_id } = await req.json();
    if (!job_id) return errorResponse("job_id required", 400);

    const db = supabaseAdmin();

    // 1. Charger le job
    const { data: job, error: jobErr } = await db
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) return errorResponse("Job not found", 404);
    if (job.status === "failed" || job.status === "cancelled") {
      return jsonResponse({ ok: false, reason: "Job already terminal" });
    }

    // 2. Passer en processing
    await db.from("jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", job_id);
    await logEvent(db, job_id, "status_change", "system", job.agent_phase, { from: job.status, to: "processing" });

    // 3. Construire le contexte
    const payload = job.payload ?? {};
    const discovery = payload.discovery_data ?? {};
    const history: { role: string; content: string }[] = payload.history ?? [];

    // 4. Résoudre l'agent et le prompt
    const phase = job.agent_phase as string;
    const agentKey = PHASE_TO_AGENT[phase];
    if (!agentKey) {
      await failJob(db, job_id, `Unknown phase: ${phase}`);
      return errorResponse(`Unknown phase: ${phase}`, 400);
    }

    const systemPrompt = (AGENT_PROMPTS as Record<string, string>)[agentKey] ?? "";
    const userMessage = buildUserMessage(phase, discovery, history);
    const tier = PHASE_TIER[phase] ?? "conversational";

    await logEvent(db, job_id, "phase_start", "agent", phase as AgentPhase, { agent: agentKey });

    // 5. Appeler le LLM
    const llmResult = await callLLM({ tier, systemPrompt, userMessage, maxTokens: 2000 });

    // 6. Parser la réponse
    let parsed: Record<string, unknown> = {};
    try {
      const match = llmResult.content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch (_) {
      // réponse non-JSON, on stocke le raw
    }

    // 7. Mettre à jour le job avec les résultats
    const nextPhase = NEXT_PHASE[phase] ?? "done";
    const isComplete = nextPhase === "done";
    const newStatus = isComplete ? "ready" : "waiting_validation";

    // Accumuler les tokens et coûts
    const newCost = (job.cost_eur ?? 0) + llmResult.cost_eur;
    const newTokensIn = (job.tokens_in ?? 0) + llmResult.tokens_in;
    const newTokensOut = (job.tokens_out ?? 0) + llmResult.tokens_out;

    // Fusionner le discovery_data
    const updatedDiscovery = mergeDiscovery(discovery, phase, parsed);

    await db.from("jobs").update({
      status: newStatus,
      agent_phase: nextPhase,
      cost_eur: newCost,
      tokens_in: newTokensIn,
      tokens_out: newTokensOut,
      providers_used: [...new Set([...(job.providers_used ?? []), llmResult.provider])],
      result: parsed,
      payload: { ...payload, discovery_data: updatedDiscovery },
      lead_grade: (parsed.lead_grade as string) ?? job.lead_grade,
      quality_score: (parsed.quality_score as number) ?? job.quality_score,
      ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
    }).eq("id", job_id);

    await logEvent(db, job_id, "phase_end", "agent", phase as AgentPhase, {
      next_phase: nextPhase,
      provider: llmResult.provider,
      model: llmResult.model,
      tokens_in: llmResult.tokens_in,
      tokens_out: llmResult.tokens_out,
      cost_eur: llmResult.cost_eur,
    }, llmResult.provider, llmResult.model, llmResult.tokens_in, llmResult.tokens_out, llmResult.cost_eur);

    return jsonResponse({
      ok: true,
      job_id,
      phase_completed: phase,
      next_phase: nextPhase,
      status: newStatus,
      cost_eur: newCost,
      provider: llmResult.provider,
      model: llmResult.model,
    });

  } catch (err) {
    console.error("[job-processor]", err);
    return errorResponse(err instanceof Error ? err.message : "Internal error", 500);
  }
});

// ── Types locaux ─────────────────────────────────────────────────────────────
type AgentPhase = "intake" | "need" | "scoping" | "critic" | "output" | "done";
type LLMTier = "routing" | "conversational" | "strategic";

const PHASE_TO_AGENT: Record<string, string> = {
  intake:   "INTAKE_AGENT",
  need:     "NEED_ANALYZER",
  scoping:  "SCOPING_AGENT",
  critic:   "CRITIC_AGENT",
  output:   "DOC_GENERATOR",
};

const PHASE_TIER: Record<string, LLMTier> = {
  intake:   "conversational",
  need:     "conversational",
  scoping:  "conversational",
  critic:   "strategic",
  output:   "strategic",
};

const NEXT_PHASE: Record<string, AgentPhase> = {
  intake:   "need",
  need:     "scoping",
  scoping:  "critic",
  critic:   "output",
  output:   "done",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserMessage(phase: string, discovery: Record<string, unknown>, history: { role: string; content: string }[]): string {
  const recent = history.slice(-8).map((m) => `${m.role}: ${m.content}`).join("\n");
  return `HISTORIQUE RÉCENT:\n${recent || "Aucun"}\n\nDISCOVERY ACTUEL:\n${JSON.stringify(discovery, null, 2)}\n\nPhase courante: ${phase}`;
}

function mergeDiscovery(
  current: Record<string, unknown>,
  phase: string,
  parsed: Record<string, unknown>,
): Record<string, unknown> {
  const phaseKey = { intake: "phase1", need: "phase2", scoping: "phase3" }[phase];
  if (!phaseKey) return current;
  return {
    ...current,
    [phaseKey]: { ...(current[phaseKey] as Record<string, unknown> ?? {}), ...parsed },
  };
}

async function logEvent(
  db: ReturnType<typeof supabaseAdmin>,
  jobId: string,
  eventType: string,
  actor: string,
  phase: AgentPhase | string,
  payload: Record<string, unknown>,
  provider?: string,
  model?: string,
  tokensIn = 0,
  tokensOut = 0,
  costEur = 0,
) {
  await db.from("job_events").insert({
    job_id: jobId,
    event_type: eventType,
    actor,
    phase,
    provider,
    model,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_eur: costEur,
    payload,
  });
}

async function failJob(db: ReturnType<typeof supabaseAdmin>, jobId: string, reason: string) {
  await db.from("jobs").update({ status: "failed", error_message: reason, failed_at: new Date().toISOString() }).eq("id", jobId);
  await logEvent(db, jobId, "error", "system", "intake", { reason });
}
