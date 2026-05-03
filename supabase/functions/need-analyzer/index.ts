// supabase/functions/need-analyzer/index.ts
// NEED-ANALYZER — Phase 2 (vision + outils + features)
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

    const { data: audit, error: auditErr } = await sb
      .from("audits")
      .select("*, agencies(name, agency_branding(*))")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) return errorResponse("Audit not found", 404);
    if (audit.current_phase < 2) return errorResponse("Phase 1 not completed", 400);

    const branding = (audit.agencies as { name: string; agency_branding: { consultant_persona?: string } | null })?.agency_branding;
    const agencyName = (audit.agencies as { name: string })?.name ?? "Clarivi";
    const consultantName = branding?.consultant_persona ?? "Marc";

    const systemPrompt = PROMPTS.NEED_ANALYZER
      .replaceAll("{{CONSULTANT_NAME}}", consultantName)
      .replaceAll("{{AGENCY_NAME}}", agencyName);

    const { data: messages } = await sb
      .from("audit_messages")
      .select("role, content")
      .eq("audit_id", body.audit_id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(30);

    const history = messages
      ?.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n") ?? "";

    const result = await runAgent({
      agent: "NEED-ANALYZER",
      systemPrompt,
      userMessage: body.user_message,
      context: {
        history,
        discovery_data: audit.discovery_data,
        current_phase: audit.current_phase,
      },
      model: "claude-sonnet-4-6",
      temperature: 0.7,
      maxTokens: 1800,
    });

    await sb.from("audit_messages").insert([
      { audit_id: body.audit_id, role: "user", content: body.user_message, phase: 2 },
      {
        audit_id: body.audit_id,
        role: "assistant",
        content: result.message ?? "",
        agent_name: "NEED-ANALYZER",
        phase: 2,
        confidence: result.confidence,
        tokens_in: result.tokens_in,
        tokens_out: result.tokens_out,
      },
    ]);

    const updates: Record<string, unknown> = {
      llm_cost_eur: (Number(audit.llm_cost_eur) || 0) + (result.cost_eur ?? 0),
    };

    if (result.extracted_data) {
      updates.discovery_data = {
        ...(audit.discovery_data as Record<string, unknown> ?? {}),
        phase2: {
          ...((audit.discovery_data as { phase2?: unknown })?.phase2 as Record<string, unknown> ?? {}),
          ...result.extracted_data,
        },
      };
    }

    const agentData = result as unknown as { ready_for_next_phase?: boolean };
    if (agentData.ready_for_next_phase) {
      updates.current_phase = 3;
    }

    await sb.from("audits").update(updates).eq("id", body.audit_id);

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
