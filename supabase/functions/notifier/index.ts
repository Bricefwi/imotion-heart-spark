// supabase/functions/notifier/index.ts
// NOTIFIER — Email de livraison vers l'agence après audit complet (Haiku)
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

    // Charger l'audit + agence + documents générés
    const { data: audit, error: auditErr } = await sb
      .from("audits")
      .select("*, agencies(name, contact_email, agency_branding(*))")
      .eq("id", body.audit_id)
      .single();

    if (auditErr || !audit) return errorResponse("Audit not found", 404);

    const { data: docs } = await sb
      .from("audit_documents")
      .select("doc_type, content_pdf_url")
      .eq("audit_id", body.audit_id);

    const agencies = audit.agencies as {
      name: string;
      contact_email: string;
      agency_branding: { consultant_persona?: string } | null;
    };

    const appUrl = Deno.env.get("APP_URL") ?? "https://app.clarivi.io";
    const cdcUrl = docs?.find((d: { doc_type: string; content_pdf_url: string | null }) => d.doc_type === "cdc")?.content_pdf_url
      ?? `${appUrl}/app/audits/${body.audit_id}?tab=cdc`;
    const quoteUrl = docs?.find((d: { doc_type: string; content_pdf_url: string | null }) => d.doc_type === "quote")?.content_pdf_url
      ?? `${appUrl}/app/audits/${body.audit_id}?tab=quote`;

    const result = await runAgent({
      agent: "NOTIFIER",
      systemPrompt: PROMPTS.NOTIFIER,
      userMessage: "Rédige l'email de notification pour l'agence.",
      context: {
        agency_name: agencies?.name,
        agency_email: agencies?.contact_email,
        prospect_name: audit.prospect_name,
        prospect_email: audit.prospect_email,
        discovery_data: audit.discovery_data,
        lead_grade: audit.lead_grade,
        quality_score: audit.quality_score,
        cdc_url: cdcUrl,
        quote_url: quoteUrl,
        audit_url: `${appUrl}/app/audits/${body.audit_id}`,
      },
      model: "claude-haiku-4-5-20251001",
      temperature: 0.4,
      maxTokens: 800,
    });

    const emailData = result as unknown as {
      email_subject?: string;
      email_body_html?: string;
      email_body_text?: string;
      to?: string;
    };

    // Envoyer l'email via Resend si la clé est disponible
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && emailData.email_subject && emailData.email_body_html) {
      const emailPayload = {
        from: "Clarivi <notifications@clarivi.io>",
        to: emailData.to ?? agencies?.contact_email,
        subject: emailData.email_subject,
        html: emailData.email_body_html,
        text: emailData.email_body_text,
      };

      const emailResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!emailResp.ok) {
        console.error("[NOTIFIER] Resend error:", await emailResp.text());
        result.warnings.push("Email delivery failed via Resend");
      }
    }

    // Marquer l'audit comme complété
    await sb
      .from("audits")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        llm_cost_eur: (Number(audit.llm_cost_eur) || 0) + (result.cost_eur ?? 0),
      })
      .eq("id", body.audit_id);

    // Incrémenter les métriques d'usage
    const periodMonth = new Date().toISOString().slice(0, 7) + "-01";
    await sb.rpc("increment_usage_metrics", {
      p_agency_id: audit.agency_id,
      p_period_month: periodMonth,
      p_audits_completed: 1,
      p_llm_cost: audit.llm_cost_eur,
    }).catch(() => {
      // La function RPC peut ne pas exister encore — non bloquant
    });

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
