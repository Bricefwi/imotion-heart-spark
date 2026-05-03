import { motion } from "framer-motion";
import { Search, Layers, Rocket, Gift, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMarketingAuditUrl } from "@/lib/marketing-url";

const STEPS = [
  {
    icon: Search,
    title: "1. Audit marketing offert",
    desc: "Diagnostic stratégique en 48 h — positionnement, audience, parcours, concurrents. 100% gratuit.",
    badge: "Gratuit",
    accent: "from-imo-amber-400 to-imo-amber-500",
  },
  {
    icon: Layers,
    title: "2. Restructuration stratégique",
    desc: "Plan d'action priorisé : message, offres, tunnels, contenus. Un cadre clair avant d'investir.",
    accent: "from-imo-coral-500 to-imo-amber-400",
  },
  {
    icon: Rocket,
    title: "3. Cadrage & build digital",
    desc: "On enchaîne sur le cahier des charges IA et la production. Une seule équipe, une seule facturation.",
    accent: "from-imo-coral-600 to-imo-coral-500",
  },
];

const PROOFS = [
  "Diagnostic livré sous 48 h",
  "Sans engagement",
  "Aucun upsell forcé",
  "Marc, consultant senior, vous suit de bout en bout",
];

export function MarketingTrackSection() {
  const auditUrl = getMarketingAuditUrl({ reason: "home_marketing_track" });

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{ background: "var(--imo-gradient-paper)" }}
    >
      {/* Halo signature */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[480px] opacity-70"
        style={{ background: "var(--imo-glow-amber)" }}
      />

      <div className="container relative mx-auto max-w-6xl px-4">
        {/* Eyebrow + title */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-imo-coral-200 bg-imo-coral-50 text-imo-coral-700"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Avant le BUILD, le MARKETING
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Vous n'avez pas qu'un projet digital.{" "}
            <span className="bg-gradient-to-r from-imo-coral-600 to-imo-amber-500 bg-clip-text text-transparent">
              Vous avez une stratégie à clarifier.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            IMOTION ne s'arrête pas au cahier des charges. Avant d'écrire la moindre
            ligne de code, notre cellule marketing audite gratuitement votre
            positionnement et restructure votre offre — pour que le digital qu'on
            construit ensuite serve une vraie traction commerciale.
          </p>
        </div>

        {/* 3 étapes */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-imo-coral-200 hover:shadow-xl"
              >
                {step.badge && (
                  <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-imo-amber-400 to-imo-coral-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-md">
                    <Gift className="h-3 w-3" /> {step.badge}
                  </span>
                )}
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-md`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA bloc */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mt-14 overflow-hidden rounded-3xl border border-imo-coral-200/60 p-8 md:p-12"
          style={{ background: "var(--imo-gradient-card)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-40"
            style={{ background: "var(--imo-glow-coral)" }}
          />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                Démarrez par votre{" "}
                <span className="bg-gradient-to-r from-imo-coral-600 to-imo-amber-500 bg-clip-text text-transparent">
                  audit marketing offert
                </span>
              </h3>
              <p className="mt-4 text-base text-muted-foreground">
                Vous repartez avec un diagnostic actionnable et des recommandations
                priorisées — même si vous ne lancez jamais le build avec nous.
                C'est notre façon de prouver notre valeur avant de vous facturer
                quoi que ce soit.
              </p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {PROOFS.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-imo-coral-600" />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="flame" className="gap-2">
                  <a href={auditUrl} target="_blank" rel="noopener">
                    <Gift className="h-4 w-4" />
                    Recevoir mon audit gratuit
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={auditUrl} target="_blank" rel="noopener">
                    Découvrir la suite marketing
                  </a>
                </Button>
              </div>
            </div>

            {/* Side card */}
            <div className="relative hidden md:block">
              <div className="rounded-2xl border border-border/70 bg-background p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                  <span className="h-2 w-2 rounded-full bg-imo-coral-500" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Audit marketing — exemple de livrable
                  </span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Positionnement</span>
                    <span className="font-medium text-foreground">Reformulé</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Persona prioritaire</span>
                    <span className="font-medium text-foreground">Identifié</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Tunnel d'acquisition</span>
                    <span className="font-medium text-foreground">Cartographié</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Plan d'action 90 j</span>
                    <span className="font-semibold text-imo-coral-700">Priorisé</span>
                  </li>
                </ul>
                <div className="mt-5 rounded-lg bg-imo-coral-50 px-3 py-2 text-xs text-imo-coral-800">
                  Livré sous 48 h après votre demande.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
