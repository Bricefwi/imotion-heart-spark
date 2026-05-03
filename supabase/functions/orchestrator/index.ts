// supabase/functions/orchestrator/index.ts
// ORCHESTRATOR — DAG dispatcher, route vers l'agent suivant (Opus)
import { serve } from "jsr:@std/http/server";
import { runAgent, supabaseAdmin, optionsResponse, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";
import { PROMPTS } from "../_shared/agents/prompts.ts";

interface RequestBody {
  audit_id: string;
  user_message: string;
}

const SUPABASE_URL_SELF = Deno.env.get("SUPABASE_URL") + "/functions/v1";

async function callAgent(fnName: string, payload: Record<string, unknown>, serviceKey: string): Promise<unknown> {
  const resp = await fetch(`${SUPABASE_URL_SELF}/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });
  return resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const body: RequestBody = await req.json();
    if (!body.audit_id || !body.user_message) {
      return errorResponse("audit_id and user_message are required", 400);
    }

    const sb = supabaseAdmin();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Charger l'état de l'audit
    const { data: audit, error: auditErr } = await sb
      .from("audits")
      .select("id, current_phase, status, discovery_data, agency_id")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) return errorResponse("Audit not found", 404);
    if (audit.status === "completed") return jsonResponse({ message: "Audit already completed" });

    // Décision de routage via Opus
    const orchestResult = await runAgent({
      agent: "ORCHESTRATOR",
      systemPrompt: PROMPTS.ORCHESTRATOR,
      userMessage: "Décide quel agent doit traiter ce tour.",
      context: {
        current_phase: audit.current_phase,
        discovery_data: audit.discovery_data,
        last_user_message: body.user_message,
      },
      model: "claude-opus-4-7",
      temperature: 0.3,
      maxTokens: 1500,
    });

    const routing = orchestResult as unknown as {
      next_agent?: string;
      execution_mode?: string;
    };

    const nextAgent = routing.next_agent ?? "";

    // Router vers le bon agent
    let agentResult: unknown;

    if (nextAgent.includes("INTAKE")) {
      agentResult = await callAgent("intake-agent", { audit_id: body.audit_id, user_message: body.user_message }, serviceKey);
    } else if (nextAgent.includes("NEED")) {
      agentResult = await callAgent("need-analyzer", { audit_id: body.audit_id, user_message: body.user_message }, serviceKey);
    } else if (nextAgent.includes("SCOPING")) {
      agentResult = await callAgent("scoping-agent", { audit_id: body.audit_id, user_message: body.user_message }, serviceKey);
    } else if (nextAgent.includes("CRITIC")) {
      agentResult = await callAgent("critic-agent", { audit_id: body.audit_id }, serviceKey);
      // Après le critic, si OK → déclencher doc-generator + quote-builder en parallèle
      const criticResult = agentResult as { ready_for_documents?: boolean };
      if (criticResult?.ready_for_documents) {
        const [docResult, quoteResult] = await Promise.all([
          callAgent("doc-generator", { audit_id: body.audit_id }, serviceKey),
          callAgent("quote-builder", { audit_id: body.audit_id }, serviceKey),
        ]);
        // Notifier l'agence de façon async (fire-and-forget)
        callAgent("notifier", { audit_id: body.audit_id }, serviceKey).catch(console.error);
        agentResult = { critic: agentResult, doc_generator: docResult, quote_builder: quoteResult };
      }
    } else {
      // Phase 1 par défaut si aucun routage clair
      agentResult = await callAgent("intake-agent", { audit_id: body.audit_id, user_message: body.user_message }, serviceKey);
    }

    return jsonResponse({
      orchestrator: orchestResult,
      routed_to: nextAgent,
      result: agentResult,
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
