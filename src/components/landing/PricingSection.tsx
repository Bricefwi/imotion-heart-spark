import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionIndex } from "@/components/brand/SectionIndex";
import { Eyebrow } from "@/components/brand/Eyebrow";
import { FlameText } from "@/components/brand/FlameText";
import { Stamp } from "@/components/brand/Stamp";
import { EmberCard } from "@/components/brand/EmberCard";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    code: "01",
    price: 79,
    description: "Pour tester et convertir vos premiers prospects.",
    audits: "20 audits / mois",
    users: "1 utilisateur",
    features: [
      "Logo + couleurs agence",
      "CDC + devis pré-rempli",
      "Dashboard audits",
      "Email de notification",
      "Historique 3 mois",
    ],
    cta: "Démarrer l'essai",
    highlight: false,
    badge: null as string | null,
  },
  {
    name: "Pro",
    code: "02",
    price: 199,
    description: "Le choix des agences qui veulent scaler.",
    audits: "100 audits / mois",
    users: "3 utilisateurs",
    features: [
      "White-label complet (sous-domaine)",
      "CDC + devis pré-rempli",
      "Grille tarifaire personnalisée",
      "Export PDF",
      "Historique illimité",
      "Support prioritaire",
    ],
    cta: "Démarrer l'essai",
    highlight: true,
    badge: "Le plus populaire" as string | null,
  },
  {
    name: "Agency",
    code: "03",
    price: 399,
    description: "Pour les agences qui font du volume.",
    audits: "Audits illimités",
    users: "10 utilisateurs",
    features: [
      "Domaine custom (yourapp.com)",
      "CDC + devis pré-rempli",
      "Grille tarifaire multi-templates",
      "Export PDF",
      "Accès API REST",
      "Account manager dédié",
      "SLA 99,9 %",
    ],
    cta: "Contacter l'équipe",
    highlight: false,
    badge: null as string | null,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "hsl(var(--imo-ink-50))" }}
    >
      {/* Décor : halo coral en haut */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{ background: "var(--imo-glow-coral)" }}
      />

      <div className="container relative">

        {/* Header */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 mb-16 items-end">
          <div>
            <SectionIndex number="04" label="Tarifs agences" className="mb-4" />
            <Eyebrow className="mb-3">HT · Sans engagement</Eyebrow>
          </div>
          <h2
            className="imo-display text-[2.25rem] sm:text-4xl lg:text-5xl"
            style={{ color: "hsl(var(--imo-ink-900))" }}
          >
            Un abonnement, des audits IA{" "}
            <FlameText>pour tous vos prospects</FlameText>.
          </h2>
        </div>

        {/* Free trial banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-12 rounded-full py-2 px-5 text-sm max-w-fit mx-auto font-mono"
          style={{
            border: "1px solid hsl(var(--imo-amber-500) / 0.35)",
            background: "hsl(var(--imo-amber-50))",
            color: "hsl(var(--imo-amber-700))",
          }}
        >
          <Sparkles className="size-3.5 shrink-0" style={{ color: "hsl(var(--imo-amber-500))" }} />
          <span className="text-xs uppercase tracking-[0.14em] font-bold">
            14 jours gratuits · 5 audits · sans CB
          </span>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={cn(plan.highlight && "md:scale-[1.04] z-10")}
            >
              {plan.highlight ? (
                /* PRO — plan signature avec gradient flame */
                <div
                  className="relative rounded-2xl p-8 flex flex-col h-full"
                  style={{
                    background: "var(--imo-gradient-coral)",
                    boxShadow: "var(--imo-shadow-glow-lg), var(--imo-shadow-xl)",
                  }}
                >
                  {/* Decorative ribbon top */}
                  <div
                    aria-hidden
                    className="absolute top-0 left-6 right-6 h-1 rounded-b"
                    style={{ background: "rgba(255,255,255,0.4)" }}
                  />

                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 imo-stamp-wobble">
                      <Stamp tone="ink" className="!bg-white !text-[hsl(var(--imo-coral-700))] !border-white shadow-md">
                        ★ {plan.badge}
                      </Stamp>
                    </div>
                  )}

                  {/* Plan code */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] font-bold tabular-nums uppercase tracking-[0.18em] text-white/70">
                      Plan {plan.code}
                    </span>
                    <span className="font-bold text-base text-white">{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1.5 mb-2">
                      <span className="text-5xl font-bold imo-display text-white tabular-nums">
                        {plan.price}
                      </span>
                      <span className="text-xl font-bold text-white pb-1">€</span>
                      <span className="text-sm text-white/70 pb-1.5 ml-1">/ mois HT</span>
                    </div>
                    <p className="text-sm text-white/85">{plan.description}</p>
                  </div>

                  {/* Quotas */}
                  <div className="text-[11px] font-mono uppercase tracking-[0.14em] mb-5 flex flex-wrap gap-x-2 text-white/80">
                    <span>{plan.audits}</span>
                    <span>·</span>
                    <span>{plan.users}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                        <Check className="size-4 mt-0.5 shrink-0 text-white/85" strokeWidth={3} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    size="lg"
                    className="w-full gap-2 h-12 font-semibold"
                    style={{ background: "white", color: "hsl(var(--imo-coral-700))" }}
                    asChild
                  >
                    <Link to="/inscription">
                      {plan.cta}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                /* STARTER + AGENCY — papier classique */
                <EmberCard variant="paper" className="!p-8 h-full flex flex-col" glowOnHover>
                  {/* Plan code */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="font-mono text-[10px] font-bold tabular-nums uppercase tracking-[0.18em]"
                      style={{ color: "hsl(var(--imo-coral-600))" }}
                    >
                      Plan {plan.code}
                    </span>
                    <span className="font-bold text-base" style={{ color: "hsl(var(--imo-ink-900))" }}>
                      {plan.name}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1.5 mb-2">
                      <span className="text-5xl font-bold imo-display tabular-nums" style={{ color: "hsl(var(--imo-ink-900))" }}>
                        {plan.price}
                      </span>
                      <span className="text-xl font-bold pb-1" style={{ color: "hsl(var(--imo-ink-900))" }}>€</span>
                      <span className="text-sm pb-1.5 ml-1" style={{ color: "hsl(var(--imo-fg-muted))" }}>/ mois HT</span>
                    </div>
                    <p className="text-sm" style={{ color: "hsl(var(--imo-fg-muted))" }}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Quotas */}
                  <div
                    className="text-[11px] font-mono uppercase tracking-[0.14em] mb-5 flex flex-wrap gap-x-2"
                    style={{ color: "hsl(var(--imo-fg-subtle))" }}
                  >
                    <span>{plan.audits}</span>
                    <span>·</span>
                    <span>{plan.users}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "hsl(var(--imo-fg))" }}>
                        <Check className="size-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--imo-coral-600))" }} strokeWidth={3} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button size="lg" variant="outline" className="w-full gap-2 h-12 font-semibold border-2"
                    style={{ borderColor: "hsl(var(--imo-coral-600))", color: "hsl(var(--imo-coral-700))" }}
                    asChild
                  >
                    <Link to={plan.name === "Agency" ? "/contact" : "/inscription"}>
                      {plan.cta}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </EmberCard>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16 space-y-2"
        >
          <p className="text-xs font-mono uppercase tracking-[0.14em]" style={{ color: "hsl(var(--imo-fg-muted))" }}>
            Prix HT · TVA 20 % · Mensuel ou annuel (−20 %) · Résiliation libre
          </p>
        </motion.div>
      </div>
    </section>
  );
}
