/**
 * CrossAppFooterBridge — bandeau pied de page commun aux deux apps.
 * Présente l'app sœur (BUILD ↔ MARKETING) avec une vraie proposition
 * de valeur : pourquoi y aller, ce qu'on y fait, et un parcours clair
 * (audit gratuit → restructuration → accompagnement).
 */
import { Link } from "react-router-dom";
import {
  Rocket,
  Target,
  ArrowRight,
  ExternalLink,
  Search,
  Layers,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketingHandoffUrl } from "@/lib/marketing-url";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  /** L'app courante. Détermine quel bloc "sœur" est affiché. */
  current?: "build" | "marketing";
}

const MARKETING_STEPS = [
  {
    icon: Search,
    title: "1. Audit marketing offert",
    desc: "Diagnostic 360° de votre acquisition, conversion et rétention. Livré sous 48h, sans engagement.",
  },
  {
    icon: Layers,
    title: "2. Restructuration stratégique",
    desc: "On remet à plat positionnement, offres, funnel et outils pour une machine commerciale lisible.",
  },
  {
    icon: TrendingUp,
    title: "3. Accompagnement opérationnel",
    desc: "Pilotage mensuel, contenus IA, campagnes et reporting Power BI — vous gardez le cap.",
  },
] as const;

const BUILD_STEPS = [
  {
    icon: Sparkles,
    title: "1. Cadrage IA en 45 min",
    desc: "Marc, votre consultant IA, structure votre besoin et génère un cahier des charges pro.",
  },
  {
    icon: Layers,
    title: "2. Devis & contrat intelligents",
    desc: "Options chiffrées, planning et contrat prêts à signer. Plus de devis flous.",
  },
  {
    icon: TrendingUp,
    title: "3. Livraison pilotée",
    desc: "Suivi par phases, livrables versionnés, consultant humain en filigrane.",
  },
] as const;

export function CrossAppFooterBridge({ current = "build" }: Props) {
  const { user } = useAuth();
  const marketingHref = getMarketingHandoffUrl("/", { userId: user?.id });

  const isBuild = current === "build";
  const Icon = isBuild ? Target : Rocket;

  const sisterTag = isBuild
    ? "IMOTION Marketing — la suite stratégique"
    : "IMOTION Creator Studio — la suite projet";
  const sisterTitle = isBuild
    ? "Vos projets digitaux méritent une stratégie marketing solide"
    : "Une fois votre marketing structuré, passez à l'exécution digitale";
  const sisterPitch = isBuild
    ? "Avant (ou en parallèle) de construire, structurez votre acquisition. On audit votre marketing gratuitement, on restructure ce qui freine, puis on accompagne la croissance — mois après mois."
    : "Cadrage assisté par IA, devis intelligent et livraison projet : transformez votre stratégie en plateforme, site, outil ou produit digital concret.";

  const ctaLabel = isBuild
    ? "Demander mon audit marketing offert"
    : "Démarrer un projet BUILD";
  const secondaryLabel = isBuild
    ? "Voir l'offre d'accompagnement"
    : "Voir les services BUILD";
  const ctaHref = isBuild ? marketingHref : "/";
  const isExternal = isBuild;
  const steps = isBuild ? MARKETING_STEPS : BUILD_STEPS;

  return (
    <section
      aria-label="Suite IMOTION"
      className="relative overflow-hidden border-t border-border/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
    >
      {/* Halo décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)",
        }}
      />

      <div className="container relative py-12 md:py-16">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="h-12 w-12 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {sisterTag}
              </p>
              <h3 className="text-xl md:text-2xl font-bold mt-1 leading-tight">
                {sisterTitle}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                {sisterPitch}
              </p>
            </div>
          </div>

          {isBuild && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium self-start md:self-end shrink-0">
              <Gift className="h-3.5 w-3.5" />
              Audit 100 % offert · sans engagement
            </div>
          )}
        </div>

        {/* Parcours en 3 étapes */}
        <ol className="grid gap-4 md:grid-cols-3 mb-8">
          {steps.map((s) => (
            <li
              key={s.title}
              className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center text-primary">
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-semibold text-sm md:text-base text-foreground">
                  {s.title}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>

        {/* Preuves rapides */}
        {isBuild && (
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground mb-6">
            {[
              "Diagnostic livré en 48h",
              "Plan d'action priorisé",
              "Sans engagement",
              "Restructuration sur-mesure",
              "Accompagnement mensuel",
            ].map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {p}
              </li>
            ))}
          </ul>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {isExternal ? (
            <>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 gap-2 shadow-md"
              >
                <a href={ctaHref}>
                  {ctaLabel} <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a href={marketingHref}>
                  {secondaryLabel} <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 gap-2 shadow-md"
            >
              <Link to={ctaHref}>
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground sm:ml-2">
            {isBuild
              ? "Réponse d'un consultant sous 24h ouvrées."
              : "Démarrez votre cadrage IA en quelques minutes."}
          </p>
        </div>
      </div>
    </section>
  );
}
