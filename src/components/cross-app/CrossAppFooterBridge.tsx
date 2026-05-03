/**
 * CrossAppFooterBridge — bandeau pied de page commun aux deux apps.
 * Présente l'app sœur (BUILD ↔ MARKETING) avec un CTA gradient.
 * Design identique des deux côtés (patch lovelib jumeau fourni).
 */
import { Link } from "react-router-dom";
import { Rocket, Target, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketingHandoffUrl } from "@/lib/marketing-url";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  /** L'app courante. Détermine quel bloc "sœur" est affiché. */
  current?: "build" | "marketing";
}

export function CrossAppFooterBridge({ current = "build" }: Props) {
  const { user } = useAuth();
  const marketingHref = getMarketingHandoffUrl("/", { userId: user?.id });

  const isBuild = current === "build";
  const Icon = isBuild ? Target : Rocket;
  const sisterTitle = isBuild ? "IMOTION Marketing" : "IMOTION Creator Studio";
  const sisterTag = isBuild ? "Marketing & acquisition" : "Build & projets digitaux";
  const sisterPitch = isBuild
    ? "Audit gratuit, stratégie d'acquisition, plans de croissance — tout votre marketing dans un espace dédié."
    : "Cadrage IA, devis intelligent, livraison de projets digitaux — la suite logique de votre stratégie.";
  const ctaLabel = isBuild ? "Découvrir IMOTION Marketing" : "Démarrer un projet BUILD";
  const ctaHref = isBuild ? marketingHref : "/";
  const isExternal = isBuild;

  return (
    <section
      aria-label="Suite IMOTION"
      className="border-t border-border/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
    >
      <div className="container py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {sisterTag}
              </p>
              <h3 className="text-lg md:text-xl font-bold mt-1">{sisterTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">{sisterPitch}</p>
            </div>
          </div>
          <div className="shrink-0">
            {isExternal ? (
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 gap-2">
                <a href={ctaHref}>
                  {ctaLabel} <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 gap-2">
                <Link to={ctaHref}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
