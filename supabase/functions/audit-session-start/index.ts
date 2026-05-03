// supabase/functions/audit-session-start/index.ts
// Initialise une session d'audit depuis un token (sans auth prospect)
import { serve } from "jsr:@std/http/server";
import { supabaseAdmin, optionsResponse, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";

interface RequestBody {
  token: string;
  prospect_email?: string;
  prospect_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const body: RequestBody = await req.json();
    if (!body.token) return errorResponse("token is required", 400);

    const sb = supabaseAdmin();

    // Valider le token
    const { data: link, error: linkErr } = await sb
      .from("audit_links")
      .select("*, agencies(name, agency_branding(*))")
      .eq("token", body.token)
      .single();

    if (linkErr || !link) return errorResponse("Invalid or expired token", 404);
    if (link.is_used) return errorResponse("This audit link has already been used", 410);
    if (new Date(link.expires_at) < new Date()) return errorResponse("This audit link has expired", 410);

    // Vérifier le quota de l'agence
    const { data: sub } = await sb
      .from("agency_subscriptions")
      .select("plan, status, audits_quota, audits_used, trial_ends_at")
      .eq("agency_id", link.agency_id)
      .single();

    if (!sub) return errorResponse("Agency subscription not found", 403);

    const isTrialExpired = sub.status === "trialing" &&
      sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date();

    if (isTrialExpired || sub.status === "cancelled") {
      return errorResponse("Agency subscription is not active", 403);
    }

    if (sub.plan !== "agency" && sub.audits_used >= sub.audits_quota) {
      return errorResponse("Agency audit quota reached", 403);
    }

    // Créer la session d'audit
    const prospectEmail = body.prospect_email ?? link.prospect_email ?? null;
    const prospectName = body.prospect_name ?? link.prospect_name ?? null;

    const { data: audit, error: auditErr } = await sb
      .from("audits")
      .insert({
        agency_id: link.agency_id,
        audit_link_id: link.id,
        prospect_email: prospectEmail,
        prospect_name: prospectName,
        current_phase: 1,
        status: "in_progress",
      })
      .select()
      .single();

    if (auditErr || !audit) {
      return errorResponse("Failed to create audit session", 500);
    }

    // Incrémenter audits_used + marquer le lien comme utilisé
    await Promise.all([
      sb.from("audit_links").update({ is_used: true }).eq("id", link.id),
      sb.from("agency_subscriptions")
        .update({ audits_used: (sub.audits_used ?? 0) + 1 })
        .eq("agency_id", link.agency_id),
    ]);

    // Retourner le branding pour personnaliser l'UI prospect
    const agencies = link.agencies as {
      name: string;
      agency_branding: {
        primary_color?: string;
        accent_color?: string;
        logo_url?: string;
        consultant_persona?: string;
        welcome_message?: string;
      } | null;
    };

    return jsonResponse({
      audit_id: audit.id,
      agency_name: agencies?.name,
      branding: {
        primary_color: agencies?.agency_branding?.primary_color ?? "#0A0A0A",
        accent_color: agencies?.agency_branding?.accent_color ?? "#3B82F6",
        logo_url: agencies?.agency_branding?.logo_url ?? null,
        consultant_persona: agencies?.agency_branding?.consultant_persona ?? "Marc",
        welcome_message: agencies?.agency_branding?.welcome_message ?? null,
      },
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
