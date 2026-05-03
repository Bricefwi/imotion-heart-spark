// supabase/functions/audit-link-create/index.ts
// Crée un lien d'audit tokenisé + envoie un email au prospect (JWT agence requis)
import { serve } from "jsr:@std/http/server";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin, optionsResponse, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";

interface RequestBody {
  prospect_email?: string;
  prospect_name?: string;
  expires_in_days?: number;
}

function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }

    // Vérifier l'utilisateur agence
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) return errorResponse("Unauthorized", 401);

    const sb = supabaseAdmin();

    // Récupérer l'agence de l'utilisateur
    const { data: agencyUser } = await sb
      .from("agency_users")
      .select("agency_id, role")
      .eq("user_id", user.id)
      .single();

    if (!agencyUser) return errorResponse("Agency not found for this user", 404);

    // Vérifier le quota d'audits
    const { data: sub } = await sb
      .from("agency_subscriptions")
      .select("plan, status, audits_quota, audits_used, trial_ends_at")
      .eq("agency_id", agencyUser.agency_id)
      .single();

    if (!sub) return errorResponse("No subscription found", 403);

    const isTrialExpired = sub.status === "trialing" &&
      sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date();

    if (isTrialExpired || sub.status === "cancelled") {
      return errorResponse("Subscription expired or cancelled. Please upgrade.", 402);
    }

    if (sub.plan !== "agency" && sub.audits_used >= sub.audits_quota) {
      return errorResponse(`Audit quota reached (${sub.audits_quota}/${sub.audits_quota}). Please upgrade your plan.`, 402);
    }

    const body: RequestBody = await req.json().catch(() => ({}));
    const expiresInDays = Math.min(body.expires_in_days ?? 30, 90);

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data: link, error: linkErr } = await sb
      .from("audit_links")
      .insert({
        agency_id: agencyUser.agency_id,
        token,
        prospect_email: body.prospect_email ?? null,
        prospect_name: body.prospect_name ?? null,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (linkErr || !link) {
      return errorResponse("Failed to create audit link", 500);
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://app.clarivi.io";
    const auditUrl = `${appUrl}/audit/${token}`;

    // Envoyer l'email au prospect si email fourni
    if (body.prospect_email) {
      const { data: agency } = await sb
        .from("agencies")
        .select("name, agency_branding(consultant_persona, welcome_message)")
        .eq("id", agencyUser.agency_id)
        .single();

      const agencyData = agency as {
        name: string;
        agency_branding: { consultant_persona?: string; welcome_message?: string } | null;
      } | null;

      const consultantName = agencyData?.agency_branding?.consultant_persona ?? "Marc";
      const welcomeMsg = agencyData?.agency_branding?.welcome_message
        ?? `Je suis ${consultantName}, votre consultant dédié. Cet audit conversationnel prend environ 6 minutes et vous permettra d'obtenir un cahier des charges et un devis personnalisés.`;

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${agencyData?.name ?? "Clarivi"} <notifications@clarivi.io>`,
            to: body.prospect_email,
            subject: `Votre audit projet — ${agencyData?.name ?? "Clarivi"}`,
            html: `
              <p>Bonjour${body.prospect_name ? ` ${body.prospect_name}` : ""},</p>
              <p>${welcomeMsg}</p>
              <p><a href="${auditUrl}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                Démarrer mon audit (6 min)
              </a></p>
              <p style="color:#666;font-size:12px;">Ce lien est valide ${expiresInDays} jours.</p>
            `,
          }),
        }).catch(console.error);
      }
    }

    return jsonResponse({
      link_id: link.id,
      token,
      audit_url: auditUrl,
      expires_at: expiresAt.toISOString(),
      prospect_email: body.prospect_email ?? null,
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
