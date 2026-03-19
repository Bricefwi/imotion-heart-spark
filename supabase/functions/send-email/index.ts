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

type EmailType = "account_confirmation" | "conversation_summary" | "cdc_final" | "document_ready" | "phase_completed";

interface EmailPayload {
  type: EmailType;
  recipientId?: string;
  recipientEmail?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

// Email templates
function getEmailTemplate(type: EmailType, data: Record<string, unknown>): { subject: string; html: string } {
  const brandColor = "#d32f2f";
  const accentColor = "#f57c00";

  const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${brandColor},${accentColor});padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">IMOTION Creator Studio</h1>
    </div>
    <!-- Body -->
    <div style="background:white;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:16px;color:#999;font-size:12px;">
      <p>IMOTION Creator Studio — Document confidentiel</p>
      <p style="color:#ccc;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
    </div>
  </div>
</body>
</html>`;

  switch (type) {
    case "account_confirmation":
      return {
        subject: "Bienvenue sur IMOTION Creator Studio !",
        html: wrapper(`
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Bienvenue ${data.name || ""} !</h2>
          <p style="color:#555;line-height:1.6;">Votre compte a bien été créé sur IMOTION Creator Studio. Vous pouvez maintenant accéder à votre espace client sécurisé.</p>
          <p style="color:#555;line-height:1.6;">Pour démarrer, créez votre premier projet et échangez avec <strong>Marc</strong>, notre consultant IA, qui vous guidera dans la définition de votre cahier des charges.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.appUrl || ""}/client/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${brandColor},${accentColor});color:white;text-decoration:none;border-radius:8px;font-weight:600;">Accéder à mon espace</a>
          </div>
          <p style="color:#999;font-size:13px;">Vos données sont protégées et strictement isolées. Aucun autre utilisateur ne peut accéder à vos informations.</p>
        `),
      };

    case "conversation_summary":
      return {
        subject: `Compte-rendu de votre échange avec Marc — ${data.projectName || "Projet"}`,
        html: wrapper(`
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Compte-rendu de conversation</h2>
          <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin-bottom:16px;">
            <p style="margin:0;color:#666;font-size:13px;"><strong>Projet :</strong> ${data.projectName || ""} (${data.projectCode || ""})</p>
            <p style="margin:4px 0 0;color:#666;font-size:13px;"><strong>Phase :</strong> ${data.phaseName || ""}</p>
            <p style="margin:4px 0 0;color:#666;font-size:13px;"><strong>Date :</strong> ${data.date || ""}</p>
            <p style="margin:4px 0 0;color:#666;font-size:13px;"><strong>Messages échangés :</strong> ${data.messageCount || 0}</p>
          </div>
          ${data.summary ? `
          <h3 style="color:#333;margin:16px 0 8px;">Résumé</h3>
          <p style="color:#555;line-height:1.6;">${data.summary}</p>` : ""}
          ${data.keyInsights ? `
          <h3 style="color:#333;margin:16px 0 8px;">Points clés identifiés</h3>
          <ul style="color:#555;line-height:1.8;padding-left:20px;">
            ${(data.keyInsights as string[]).map((i: string) => `<li>${i}</li>`).join("")}
          </ul>` : ""}
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.appUrl || ""}/client/projects/${data.projectId}/conversation" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${brandColor},${accentColor});color:white;text-decoration:none;border-radius:8px;font-weight:600;">Reprendre la conversation</a>
          </div>
        `),
      };

    case "cdc_final":
      return {
        subject: `Votre Cahier des Charges est prêt — ${data.projectName || "Projet"}`,
        html: wrapper(`
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Votre CDC est prêt !</h2>
          <p style="color:#555;line-height:1.6;">Le Cahier des Charges de votre projet <strong>${data.projectName || ""}</strong> a été généré avec succès.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#166534;font-weight:600;">Document : ${data.documentName || "CDC"}</p>
            <p style="margin:4px 0 0;color:#15803d;font-size:13px;">Version ${data.version || 1} — Prêt pour révision</p>
          </div>
          <p style="color:#555;line-height:1.6;">Vous pouvez consulter, télécharger en PDF et signer le document directement depuis votre espace client.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.appUrl || ""}/client/documents/${data.documentId}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${brandColor},${accentColor});color:white;text-decoration:none;border-radius:8px;font-weight:600;">Consulter le CDC</a>
          </div>
        `),
      };

    case "document_ready":
      return {
        subject: `Nouveau document disponible — ${data.documentName || "Document"}`,
        html: wrapper(`
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Un nouveau document est disponible</h2>
          <p style="color:#555;line-height:1.6;">Un nouveau document a été ajouté à votre projet <strong>${data.projectName || ""}</strong>.</p>
          <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#333;font-weight:600;">${data.documentName || ""}</p>
            <p style="margin:4px 0 0;color:#666;font-size:13px;">Type : ${data.documentType || ""} — Version ${data.version || 1}</p>
          </div>
          ${data.requiresSignature ? `
          <div style="background:#fef3c7;border:1px solid #fde68a;padding:12px 16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#92400e;font-weight:600;">Action requise : Ce document nécessite votre signature</p>
          </div>` : ""}
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.appUrl || ""}/client/documents/${data.documentId}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${brandColor},${accentColor});color:white;text-decoration:none;border-radius:8px;font-weight:600;">Voir le document</a>
          </div>
        `),
      };

    case "phase_completed":
      return {
        subject: `Phase terminée — ${data.phaseName || ""}`,
        html: wrapper(`
          <h2 style="color:#1a1a1a;margin:0 0 16px;">Phase terminée !</h2>
          <p style="color:#555;line-height:1.6;">La phase <strong>${data.phaseName || ""}</strong> de votre projet <strong>${data.projectName || ""}</strong> est terminée.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:32px;">✅</p>
            <p style="margin:8px 0 0;color:#166534;font-weight:600;">Phase ${data.phaseNumber || ""}/7 complétée</p>
            <p style="margin:4px 0 0;color:#15803d;font-size:13px;">Progression globale : ${data.overallProgress || 0}%</p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.appUrl || ""}/client/projects/${data.projectId}/conversation" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${brandColor},${accentColor});color:white;text-decoration:none;border-radius:8px;font-weight:600;">Continuer le projet</a>
          </div>
        `),
      };

    default:
      return { subject: "Notification IMOTION", html: wrapper(`<p>${JSON.stringify(data)}</p>`) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const body: EmailPayload = await req.json();
    const { type, recipientId, recipientEmail, projectId, metadata = {} } = body;

    if (!type) {
      return new Response(JSON.stringify({ error: "Missing email type" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Auth check - must be authenticated or called by service role (internal trigger)
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let callerUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await anonClient.auth.getUser();
      callerUserId = userData?.user?.id || null;
    }

    // Role check: only admins, consultants, or service_role can send emails
    const isServiceRole = authHeader?.includes(supabaseServiceKey);
    if (!isServiceRole && callerUserId) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUserId);
      const userRoles = (roles || []).map((r: Record<string, unknown>) => String(r.role));
      const hasPermission = userRoles.some((role) =>
        ["admin", "super_admin", "consultant"].includes(role)
      );
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: "Forbidden: insufficient role" }), {
          status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    } else if (!isServiceRole && !callerUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Resolve recipient email
    let toEmail = recipientEmail;
    let recipientName = metadata.name || "";

    if (!toEmail && recipientId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", recipientId)
        .single();
      if (profile) {
        toEmail = profile.email;
        recipientName = recipientName || profile.full_name || "";
      }
    }

    if (!toEmail) {
      return new Response(JSON.stringify({ error: "No recipient email found" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(toEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch project info if needed
    let projectData: Record<string, unknown> | null = null;
    if (projectId) {
      const { data } = await supabase.from("projects").select("*").eq("id", projectId).single();
      projectData = data;
    }

    // Build app URL
    const appUrl = Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://imotion-heart-spark.lovable.app";

    // Build template data
    const templateData = {
      name: recipientName,
      appUrl,
      projectName: projectData?.name,
      projectCode: projectData?.code,
      projectId,
      ...metadata,
    };

    const { subject, html } = getEmailTemplate(type, templateData);

    // Send via Brevo (ex-Sendinblue) API
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      console.warn("BREVO_API_KEY not set — logging email instead of sending");
      await supabase.from("email_send_log").insert({
        recipient_email: toEmail,
        recipient_id: recipientId || null,
        email_type: type,
        subject,
        status: "logged",
        metadata: { ...templateData, html_preview: html.substring(0, 500) },
      });
      return new Response(JSON.stringify({ success: true, mode: "logged" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const fromDomain = Deno.env.get("EMAIL_FROM_DOMAIN") || "imotion-conseils.fr";
    const fromEmail = `noreply@${fromDomain}`;
    const fromName = "IMOTION Creator Studio";

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail, name: recipientName || undefined }],
        subject,
        htmlContent: html,
      }),
    });

    const emailResult = await emailResponse.json();

    // Log the email
    await supabase.from("email_logs").insert({
      recipient_email: toEmail,
      recipient_id: recipientId || null,
      email_type: type,
      subject,
      status: emailResponse.ok ? "sent" : "failed",
      external_id: emailResult.messageId || null,
      metadata: { brevo_response: emailResult },
    });

    if (!emailResponse.ok) {
      console.error("Brevo error:", emailResult);
      return new Response(JSON.stringify({ error: "Email sending failed", details: emailResult }), {
        status: 502, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: emailResult.messageId }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-email error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
