import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: 79,
    description: "Pour tester et convertir vos premiers prospects.",
    audits: "20 audits / mois",
    users: "1 utilisateur",
    features: [
      "Logo + couleurs de l'agence",
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
    <section id="pricing" className="py-20 md:py-32" style={{ background: "var(--imo-gradient-paper)" }}>
      <div className="container">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{
              border: "1px solid hsl(var(--imo-coral-600) / 0.25)",
              background: "hsl(var(--imo-coral-600) / 0.06)",
              color: "hsl(var(--imo-coral-600))",
            }}
          >
            <Building2 className="size-3" />
            Tarifs agences — HT · Sans engagement
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(var(--imo-ink-900))" }}>
            Un abonnement, des audits IA{" "}
            <span style={{ backgroundImage: "var(--imo-gradient-text)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              pour tous vos prospects
            </span>
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "hsl(var(--imo-fg-muted))" }}>
            Votre agence paie un abonnement mensuel. Vos prospects accèdent à l'audit gratuitement via votre lien personnalisé.
          </p>
        </motion.div>

        {/* Free trial banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-12 rounded-xl py-3 px-6 text-sm max-w-lg mx-auto"
          style={{
            border: "1px solid hsl(var(--imo-amber-500) / 0.25)",
            background: "hsl(var(--imo-amber-50))",
            color: "hsl(var(--imo-amber-700))",
          }}
        >
          <Sparkles className="size-4 shrink-0" style={{ color: "hsl(var(--imo-amber-500))" }} />
          <span>
            <strong>14 jours d'essai gratuit</strong> · 5 audits inclus · Sans carte bancaire
          </span>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn("relative rounded-2xl p-8 flex flex-col", plan.highlight && "scale-[1.03]")}
              style={
                plan.highlight
                  ? {
                      background: "var(--imo-gradient-coral)",
                      boxShadow: "var(--imo-shadow-glow-lg)",
                      border: "none",
                    }
                  : {
                      background: "hsl(var(--imo-bg-elevated))",
                      border: "1px solid hsl(var(--imo-border))",
                      boxShadow: "var(--imo-shadow-md)",
                    }
              }
            >
              {plan.badge && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs"
                  style={
                    plan.highlight
                      ? { background: "white", color: "hsl(var(--imo-coral-700))" }
                      : { background: "hsl(var(--imo-coral-600))", color: "white" }
                  }
                >
                  {plan.badge}
                </Badge>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div
                  className="text-sm font-medium mb-1"
                  style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : "hsl(var(--imo-fg-muted))" }}
                >
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: plan.highlight ? "white" : "hsl(var(--imo-ink-900))" }}
                  >
                    {plan.price} €
                  </span>
                  <span
                    className="text-sm pb-1"
                    style={{ color: plan.highlight ? "rgba(255,255,255,0.65)" : "hsl(var(--imo-fg-muted))" }}
                  >
                    / mois HT
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : "hsl(var(--imo-fg-muted))" }}
                >
                  {plan.description}
                </p>
              </div>

              {/* Quotas */}
              <div
                className="text-xs font-semibold mb-4 flex gap-3"
                style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "hsl(var(--imo-fg-subtle))" }}
              >
                <span>{plan.audits}</span>
                <span>·</span>
                <span>{plan.users}</span>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className="size-4 mt-0.5 shrink-0"
                      style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : "hsl(var(--imo-coral-500))" }}
                    />
                    <span style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : "hsl(var(--imo-fg))" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full gap-2"
                style={
                  plan.highlight
                    ? { background: "white", color: "hsl(var(--imo-coral-700))", fontWeight: 600 }
                    : {}
                }
                variant={plan.highlight ? "secondary" : "default"}
                asChild
              >
                <Link to={plan.name === "Agency" ? "/contact" : "/inscription"}>
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs mt-10"
          style={{ color: "hsl(var(--imo-fg-muted))" }}
        >
          Prix HT · TVA 20 % · Facturation mensuelle ou annuelle (−20 %) · Résiliation à tout moment
        </motion.p>
      </div>
    </section>
  );
}
