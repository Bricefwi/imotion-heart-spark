import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://imotion-conseils.fr",
  "https://www.imotion-conseils.fr",
  "https://imotion-heart-spark.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SENDER_EMAIL = "contact@imotion-conseils.fr";
const SENDER_NAME = "IMOTION Creator Studio";

interface CDCEmailPayload {
  projectId: string;
  userId: string;
}

function parseJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — only service_role or authenticated users
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.slice("Bearer ".length).trim();
    const claims = parseJwtClaims(token);

    if (!claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId, userId } = (await req.json()) as CDCEmailPayload;

    if (!projectId || !userId) {
      return new Response(JSON.stringify({ error: "projectId and userId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to fetch data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch project and user info
    const [{ data: project }, { data: profile }] = await Promise.all([
      supabase.from("projects").select("name, code, status").eq("id", projectId).single(),
      supabase.from("profiles").select("full_name, email, company_name").eq("id", userId).single(),
    ]);

    if (!project || !profile) {
      return new Response(JSON.stringify({ error: "Project or profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if CDC document exists
    const { data: cdcDoc } = await supabase
      .from("documents")
      .select("id, name")
      .eq("project_id", projectId)
      .eq("doc_type", "cdc")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const appUrl = "https://imotion-heart-spark.lovable.app";
    const dashboardUrl = `${appUrl}/client/dashboard`;
    const projectUrl = cdcDoc
      ? `${appUrl}/client/documents/${cdcDoc.id}`
      : dashboardUrl;

    // Build email HTML
    const brandColor = "#d32f2f";
    const accentColor = "#f57c00";
    const firstName = profile.full_name?.split(" ")[0] || "Bonjour";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,${brandColor},${accentColor});padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">IMOTION Creator Studio</h1>
    </div>
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">
        ${firstName}, votre Cahier des Charges est pr&ecirc;t !
      </h2>
      <p style="color:#555;line-height:1.7;margin:0 0 16px;">
        Votre cahier des charges pour le projet <strong>${project.name}</strong>
        (r&eacute;f. ${project.code}) a &eacute;t&eacute; g&eacute;n&eacute;r&eacute; avec succ&egrave;s.
      </p>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#666;">
          <strong style="color:#333;">Projet :</strong> ${project.name}<br>
          <strong style="color:#333;">R&eacute;f&eacute;rence :</strong> ${project.code}<br>
          <strong style="color:#333;">Entreprise :</strong> ${profile.company_name || "Non renseign&eacute;e"}
        </p>
      </div>
      <p style="color:#555;line-height:1.7;margin:0 0 24px;">
        Vous pouvez consulter, t&eacute;l&eacute;charger et partager votre CDC depuis votre espace client.
      </p>
      <div style="text-align:center;">
        <a href="${projectUrl}" style="display:inline-block;background:linear-gradient(135deg,${brandColor},${accentColor});color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
          Voir mon Cahier des Charges
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#999;font-size:13px;line-height:1.6;margin:0;">
        <strong>Prochaine &eacute;tape :</strong> Notre &eacute;quipe va &eacute;tudier votre CDC et vous proposer
        un devis d&eacute;taill&eacute; sous 48h ouvr&eacute;es. Pour toute question :
        <a href="mailto:contact@imotion-conseils.fr" style="color:${brandColor};">contact@imotion-conseils.fr</a>
      </p>
    </div>
    <div style="text-align:center;padding:16px;color:#999;font-size:12px;">
      <p>IMOTION Creator Studio &mdash; Transformez vos id&eacute;es en projets digitaux</p>
      <p style="color:#ccc;">contact@imotion-conseils.fr</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Brevo API
    if (BREVO_API_KEY) {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: profile.email, name: profile.full_name || profile.email }],
          subject: `Votre Cahier des Charges est prêt — ${project.name}`,
          htmlContent: html,
        }),
      });

      if (!brevoRes.ok) {
        const errText = await brevoRes.text();
        console.error("[send-cdc-email] Brevo error:", errText);
        return new Response(JSON.stringify({ error: "Email delivery failed", details: errText }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("[send-cdc-email] No BREVO_API_KEY — email not sent (dev mode)");
    }

    // Log email in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("email_logs" as any).insert({
      recipient_email: profile.email,
      recipient_id: userId,
      subject: `Votre Cahier des Charges est prêt — ${project.name}`,
      email_type: "cdc_delivery",
      status: BREVO_API_KEY ? "sent" : "skipped_dev",
      metadata: { projectId, projectName: project.name, projectCode: project.code },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-cdc-email] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
