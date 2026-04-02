import { supabase } from "@/integrations/supabase/client";

// Maps project statuses to email templates
const STATUS_EMAIL_MAP: Record<string, string> = {
  discovery_complete: "discovery_complete",
  discovery_completed: "discovery_complete",
  cdc_ready: "cdc_ready",
  proposal_sent: "proposal_sent",
  signed: "contract_signed",
  in_development: "development_started",
  delivered: "project_delivered",
};

interface MilestoneEmailData {
  projectId: string;
  projectName: string;
  projectCode?: string;
  clientId: string;
  newStatus: string;
  extraData?: Record<string, unknown>;
}

/**
 * Sends a milestone notification email when a project changes status.
 * Also creates an in-app notification.
 */
export async function sendMilestoneEmail({
  projectId,
  projectName,
  projectCode,
  clientId,
  newStatus,
  extraData = {},
}: MilestoneEmailData): Promise<void> {
  const template = STATUS_EMAIL_MAP[newStatus];
  if (!template) return;

  try {
    // Get client profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, company_name")
      .eq("id", clientId)
      .single();

    if (!profile?.email) return;

    const appUrl = window.location.origin;
    const dashboardUrl = `${appUrl}/client/dashboard`;

    // Notification titles per status
    const notifTitles: Record<string, { title: string; body: string }> = {
      discovery_complete: {
        title: "Phase Discovery terminée ! 🏆",
        body: `La découverte pour "${projectName}" est terminée. Votre CDC va être généré.`,
      },
      discovery_completed: {
        title: "Phase Discovery terminée ! 🏆",
        body: `La découverte pour "${projectName}" est terminée. Votre CDC va être généré.`,
      },
      cdc_ready: {
        title: "Votre Cahier des Charges est prêt ! 📝",
        body: `Le CDC pour "${projectName}" est disponible dans vos documents.`,
      },
      proposal_sent: {
        title: "Votre devis est disponible ! 📋",
        body: `Le devis pour "${projectName}" vous a été envoyé. Consultez-le dans votre espace.`,
      },
      signed: {
        title: "Contrat signé, c'est parti ! 🤝",
        body: `Le contrat pour "${projectName}" est signé. Le développement va démarrer.`,
      },
      in_development: {
        title: "Développement lancé ! 🚀",
        body: `Le développement de "${projectName}" a officiellement démarré.`,
      },
      delivered: {
        title: "Projet livré ! 🎉",
        body: `"${projectName}" a été livré avec succès. Félicitations !`,
      },
    };

    const notif = notifTitles[newStatus];

    // Send in-app notification + email in parallel
    const emailPayload = {
      template,
      to: profile.email,
      data: {
        clientName: profile.full_name?.split(" ")[0] || profile.full_name || "Client",
        projectName,
        projectCode: projectCode || "",
        companyName: profile.company_name || "",
        dashboardUrl,
        documentUrl: dashboardUrl,
        proposalUrl: dashboardUrl,
        ...extraData,
      },
    };

    const promises: Promise<unknown>[] = [
      supabase.functions.invoke("send-transactional-email", { body: emailPayload }),
    ];

    if (notif) {
      promises.push(
        supabase.from("notifications").insert({
          user_id: clientId,
          type: "milestone_update",
          title: notif.title,
          body: notif.body,
          project_id: projectId,
          link: "/client/dashboard",
        }) as unknown as Promise<unknown>
      );
    }

    await Promise.allSettled(promises);
  } catch (err) {
    console.error("[sendMilestoneEmail] Error:", err);
  }
}
