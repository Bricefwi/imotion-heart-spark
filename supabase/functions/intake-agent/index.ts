// supabase/functions/intake-agent/index.ts
// INTAKE-AGENT — Phase 1 conversationnelle (accueil + identité + douleur)
import { serve } from "jsr:@std/http/server";
import { runAgent, supabaseAdmin, optionsResponse, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";
import { PROMPTS } from "../_shared/agents/prompts.ts";

interface RequestBody {
  audit_id: string;
  user_message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const body: RequestBody = await req.json();

    if (!body.audit_id || !body.user_message) {
      return errorResponse("audit_id and user_message are required", 400);
    }

    const sb = supabaseAdmin();

    // 1. Charger l'audit + branding agence
    const { data: audit, error: auditErr } = await sb
      .from("audits")
      .select("*, agencies(name, agency_branding(*))")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) {
      return errorResponse("Audit not found", 404);
    }

    // 2. Vérifier que l'audit est bien en phase 1
    if (audit.current_phase > 1) {
      return errorResponse("Audit is past phase 1", 400);
    }

    // 3. Personnaliser le prompt avec le branding agence
    const branding = (audit.agencies as { name: string; agency_branding: { consultant_persona?: string } | null })?.agency_branding;
    const agencyName = (audit.agencies as { name: string })?.name ?? "Clarivi";
    const consultantName = branding?.consultant_persona ?? "Marc";

    const systemPrompt = PROMPTS.INTAKE_AGENT
      .replaceAll("{{CONSULTANT_NAME}}", consultantName)
      .replaceAll("{{AGENCY_NAME}}", agencyName);

    // 4. Charger l'historique conversationnel (20 derniers messages)
    const { data: messages } = await sb
      .from("audit_messages")
      .select("role, content")
      .eq("audit_id", body.audit_id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(20);

    const history = messages
      ?.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n") ?? "";

    // 5. Appeler l'agent
    const result = await runAgent({
      agent: "INTAKE-AGENT",
      systemPrompt,
      userMessage: body.user_message,
      context: {
        history,
        discovery_data: audit.discovery_data,
        current_phase: audit.current_phase,
      },
      model: "claude-sonnet-4-6",
      temperature: 0.7,
      maxTokens: 1500,
    });

    // 6. Persister les messages
    await sb.from("audit_messages").insert([
      {
        audit_id: body.audit_id,
        role: "user",
        content: body.user_message,
        phase: 1,
      },
      {
        audit_id: body.audit_id,
        role: "assistant",
        content: result.message ?? "",
        agent_name: "INTAKE-AGENT",
        phase: 1,
        confidence: result.confidence,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
      },
    ]);

    // 7. Mettre à jour discovery_data + coût LLM
    const updates: Record<string, unknown> = {
      llm_cost_eur: (Number(audit.llm_cost_eur) || 0) + (result.cost_eur ?? 0),
    };

    if (result.extracted_data) {
      updates.discovery_data = {
        ...(audit.discovery_data as Record<string, unknown> ?? {}),
        phase1: {
          ...((audit.discovery_data as { phase1?: unknown })?.phase1 as Record<string, unknown> ?? {}),
          ...result.extracted_data,
        },
      };
    }

    // Passer en phase 2 si phase 1 complète
    const agentData = result as unknown as { ready_for_next_phase?: boolean };
    if (agentData.ready_for_next_phase) {
      updates.current_phase = 2;
    }

    await sb.from("audits").update(updates).eq("id", body.audit_id);

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
