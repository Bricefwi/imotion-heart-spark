// supabase/functions/doc-generator/index.ts
// DOC-GENERATOR — Génère le CDC markdown (Sonnet)
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
      .select("*, agencies(name, agency_branding(*))")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) return errorResponse("Audit not found", 404);

    const agencies = audit.agencies as { name: string; agency_branding: { consultant_persona?: string } | null };
    const agencyName = agencies?.name ?? "Clarivi";
    const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const result = await runAgent({
      agent: "DOC-GENERATOR",
      systemPrompt: PROMPTS.DOC_GENERATOR,
      userMessage: "Génère le cahier des charges complet à partir du discovery_data.",
      context: {
        discovery_data: audit.discovery_data,
        agency_name: agencyName,
        date: today,
      },
      model: "claude-sonnet-4-6",
      temperature: 0.5,
      maxTokens: 4000,
    });

    // Parser le content_md depuis le résultat
    const docData = result as unknown as { doc_type?: string; content_md?: string; content_json?: unknown };

    // Persister le document généré
    if (result.status === "success" && docData.content_md) {
      await sb.from("audit_documents").insert({
        audit_id: body.audit_id,
        doc_type: "cdc",
        content_md: docData.content_md,
        content_json: docData.content_json ?? {},
        generated_by_agent: "DOC-GENERATOR",
        quality_score: Math.round(result.confidence * 100),
      });
    }

    // Mettre à jour le coût LLM
    await sb
      .from("audits")
      .update({ llm_cost_eur: (Number(audit.llm_cost_eur) || 0) + (result.cost_eur ?? 0) })
      .eq("id", body.audit_id);

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
