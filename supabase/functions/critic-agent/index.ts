// supabase/functions/critic-agent/index.ts
// CRITIC-AGENT — Validation finale + scoring qualité + anti-hallucination (Opus)
import { serve } from "jsr:@std/http/server";
import { runAgent, supabaseAdmin, optionsResponse, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";
import { PROMPTS } from "../_shared/agents/prompts.ts";

interface RequestBody {
  audit_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const body: RequestBody = await req.json();
    if (!body.audit_id) return errorResponse("audit_id is required", 400);

    const sb = supabaseAdmin();

    const { data: audit, error: auditErr } = await sb
      .from("audits")
      .select("*")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) return errorResponse("Audit not found", 404);
    if (audit.current_phase < 4) return errorResponse("Phases 1-3 not completed", 400);

    // Charger tout l'historique pour l'anti-hallucination
    const { data: messages } = await sb
      .from("audit_messages")
      .select("role, content, phase")
      .eq("audit_id", body.audit_id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true });

    const history = messages
      ?.map((m: { role: string; content: string; phase: number }) => `[P${m.phase}] ${m.role.toUpperCase()}: ${m.content}`)
      .join("\n") ?? "";

    const result = await runAgent({
      agent: "CRITIC-AGENT",
      systemPrompt: PROMPTS.CRITIC_AGENT,
      userMessage: "Valide le discovery_data complet et produis le scoring final.",
      context: {
        discovery_data: audit.discovery_data,
        conversation_history: history,
      },
      model: "claude-opus-4-7",
      temperature: 0.2,
      maxTokens: 2000,
    });

    // Parser le résultat spécifique du Critic
    const criticData = result as unknown as {
      is_valid?: boolean;
      quality_score?: number;
      lead_score?: number;
      lead_grade?: string;
      ready_for_documents?: boolean;
      hallucination_risk?: string;
    };

    // Mettre à jour l'audit avec le score et le grade
    const updates: Record<string, unknown> = {
      llm_cost_eur: (Number(audit.llm_cost_eur) || 0) + (result.cost_eur ?? 0),
    };

    if (criticData.quality_score !== undefined) {
      updates.quality_score = criticData.quality_score;
    }
    if (criticData.lead_grade) {
      updates.lead_grade = criticData.lead_grade;
    }

    await sb.from("audits").update(updates).eq("id", body.audit_id);

    // Log le résultat du critic
    await sb.from("audit_messages").insert({
      audit_id: body.audit_id,
      role: "system",
      content: JSON.stringify({
        quality_score: criticData.quality_score,
        lead_grade: criticData.lead_grade,
        hallucination_risk: criticData.hallucination_risk,
        ready_for_documents: criticData.ready_for_documents,
      }),
      agent_name: "CRITIC-AGENT",
      phase: 4,
      confidence: result.confidence,
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
    });

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
