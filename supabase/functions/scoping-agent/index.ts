// supabase/functions/scoping-agent/index.ts
// SCOPING-AGENT — Phase 3 (budget + délai + décideurs)
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
    if (audit.current_phase < 3) return errorResponse("Phase 2 not completed", 400);

    const branding = (audit.agencies as { name: string; agency_branding: { consultant_persona?: string } | null })?.agency_branding;
    const agencyName = (audit.agencies as { name: string })?.name ?? "Clarivi";
    const consultantName = branding?.consultant_persona ?? "Marc";

    const systemPrompt = PROMPTS.SCOPING_AGENT
      .replaceAll("{{CONSULTANT_NAME}}", consultantName)
      .replaceAll("{{AGENCY_NAME}}", agencyName);

    const { data: messages } = await sb
      .from("audit_messages")
      .select("role, content")
      .eq("audit_id", body.audit_id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(40);

    const history = messages
      ?.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n") ?? "";

    const result = await runAgent({
      agent: "SCOPING-AGENT",
      systemPrompt,
      userMessage: body.user_message,
      context: {
        history,
        discovery_data: audit.discovery_data,
        current_phase: audit.current_phase,
      },
      model: "claude-sonnet-4-6",
      temperature: 0.6,
      maxTokens: 1500,
    });

    await sb.from("audit_messages").insert([
      { audit_id: body.audit_id, role: "user", content: body.user_message, phase: 3 },
      {
        audit_id: body.audit_id,
        role: "assistant",
        content: result.message ?? "",
        agent_name: "SCOPING-AGENT",
        phase: 3,
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
        phase3: {
          ...((audit.discovery_data as { phase3?: unknown })?.phase3 as Record<string, unknown> ?? {}),
          ...result.extracted_data,
        },
      };
    }

    const agentData = result as unknown as { ready_for_next_phase?: boolean };
    if (agentData.ready_for_next_phase) {
      updates.current_phase = 4;
    }

    await sb.from("audits").update(updates).eq("id", body.audit_id);

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
