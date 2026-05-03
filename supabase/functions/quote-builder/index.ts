// supabase/functions/quote-builder/index.ts
// QUOTE-BUILDER — Génère le devis chiffré avec les tarifs agence (Sonnet)
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
      .select("*, agencies(name, agency_pricing_templates(*))")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) return errorResponse("Audit not found", 404);

    // Récupérer le template tarifaire par défaut
    const agencies = audit.agencies as {
      name: string;
      agency_pricing_templates: Array<{
        daily_rate_eur: number;
        hourly_rate_eur: number;
        package_pricing: unknown[];
        default_margin_pct: number;
        is_default: boolean;
      }>;
    };

    const templates = agencies?.agency_pricing_templates ?? [];
    const defaultTemplate = templates.find((t) => t.is_default) ?? templates[0] ?? {
      daily_rate_eur: 600,
      hourly_rate_eur: 90,
      package_pricing: [],
      default_margin_pct: 20,
    };

    const result = await runAgent({
      agent: "QUOTE-BUILDER",
      systemPrompt: PROMPTS.QUOTE_BUILDER,
      userMessage: "Génère le devis pré-rempli à partir du discovery_data et des tarifs agence.",
      context: {
        discovery_data: audit.discovery_data,
        agency_name: agencies?.name ?? "Clarivi",
        pricing_template: defaultTemplate,
      },
      model: "claude-sonnet-4-6",
      temperature: 0.3,
      maxTokens: 2500,
    });

    const docData = result as unknown as { content_md?: string; content_json?: unknown };

    if (result.status === "success" && docData.content_md) {
      await sb.from("audit_documents").insert({
        audit_id: body.audit_id,
        doc_type: "quote",
        content_md: docData.content_md,
        content_json: docData.content_json ?? {},
        generated_by_agent: "QUOTE-BUILDER",
        quality_score: Math.round(result.confidence * 100),
      });
    }

    await sb
      .from("audits")
      .update({ llm_cost_eur: (Number(audit.llm_cost_eur) || 0) + (result.cost_eur ?? 0) })
      .eq("id", body.audit_id);

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
