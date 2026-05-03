import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ContextualCTA } from "./ContextualCTA";
import { getMarketingAuditUrl } from "@/lib/marketing-url";

type DeliveredProject = {
  id: string;
  name: string;
  completed_at: string | null;
};

const DAYS_AFTER_DELIVERY = 15;
const DISMISS_KEY_PREFIX = "post_delivery_cta_dismissed:";

/**
 * Affiche un CTA contextuel quand un projet est livré depuis ≥ 15 jours
 * et qu'aucun audit marketing récent n'existe → suggère de relancer un
 * audit lovelib gratuit pour identifier les prochains leviers.
 */
export function PostDeliveryAuditCTA() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["post-delivery-cta", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Projets livrés depuis ≥ 15 jours
      const cutoff = new Date(Date.now() - DAYS_AFTER_DELIVERY * 86_400_000).toISOString();
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, completed_at, status")
        .eq("client_id", user!.id)
        .in("status", ["delivered", "archived"])
        .lte("completed_at", cutoff)
        .order("completed_at", { ascending: false })
        .limit(1);

      const project = (projects?.[0] as DeliveredProject | undefined) ?? null;
      if (!project) return { project: null, hasRecentAudit: false };

      // Vérifie qu'aucun audit récent (< 90j) n'existe déjà
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString();
      const { count } = await supabase
        .from("marketing_audits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("completed_at", ninetyDaysAgo);

      return { project, hasRecentAudit: (count ?? 0) > 0 };
    },
  });

  const dismissed = useMemo(() => {
    if (!data?.project) return false;
    return localStorage.getItem(DISMISS_KEY_PREFIX + data.project.id) === "1";
  }, [data?.project]);

  if (!data?.project || data.hasRecentAudit || dismissed) return null;

  const project = data.project;
  const auditUrl = getMarketingAuditUrl({
    projectId: project.id,
    userId: user?.id,
    reason: "post_delivery_growth",
  });

  return (
    <ContextualCTA
      icon={TrendingUp}
      tone="marketing"
      title="Votre site est livré — passons à la phase croissance"
      description={`${project.name} est en ligne depuis plus de ${DAYS_AFTER_DELIVERY} jours. Un audit marketing gratuit (15 min) identifiera les prochains leviers : SEO, acquisition, conversion.`}
      primaryAction={{
        label: "Lancer mon audit gratuit",
        href: auditUrl,
        external: true,
      }}
      secondaryAction={{
        label: "Plus tard",
        href: "#",
        variant: "outline",
      }}
      onDismiss={() => {
        localStorage.setItem(DISMISS_KEY_PREFIX + project.id, "1");
        // force re-render
        window.dispatchEvent(new Event("post-delivery-cta-dismissed"));
      }}
    />
  );
}
