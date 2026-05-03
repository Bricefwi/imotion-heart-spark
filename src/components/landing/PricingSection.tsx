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
    <section id="pricing" className="py-20 md:py-32 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Building2 className="size-3" />
            Tarifs agences — HT · Sans engagement
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Un abonnement, des audits IA pour tous vos prospects
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Votre agence paie un abonnement mensuel. Vos prospects accèdent à l'audit gratuitement via votre lien personnalisé.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 mb-12 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-3 px-6 text-sm text-emerald-700 dark:text-emerald-400 max-w-lg mx-auto"
        >
          <Sparkles className="size-4 shrink-0" />
          <span>
            <strong>14 jours d'essai gratuit</strong> · 5 audits inclus · Sans carte bancaire
          </span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-8 flex flex-col",
                plan.highlight
                  ? "border-primary bg-primary text-primary-foreground shadow-2xl scale-[1.03]"
                  : "border-border bg-card"
              )}
            >
              {plan.badge && (
                <Badge
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 text-xs",
                    plan.highlight
                      ? "bg-background text-primary"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {plan.badge}
                </Badge>
              )}

              <div className="mb-6">
                <div className="text-sm font-medium opacity-70 mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price} €</span>
                  <span className="text-sm opacity-60 pb-1">/ mois HT</span>
                </div>
                <p className={cn("text-sm", plan.highlight ? "opacity-80" : "text-muted-foreground")}>
                  {plan.description}
                </p>
              </div>

              <div className={cn(
                "text-xs font-semibold mb-4 flex gap-3",
                plan.highlight ? "opacity-90" : "text-muted-foreground"
              )}>
                <span>{plan.audits}</span>
                <span>·</span>
                <span>{plan.users}</span>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={cn(
                      "size-4 mt-0.5 shrink-0",
                      plan.highlight ? "text-primary-foreground/80" : "text-emerald-500"
                    )} />
                    <span className={plan.highlight ? "opacity-90" : ""}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={plan.highlight ? "secondary" : "default"}
                className="w-full gap-2"
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

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground mt-10"
        >
          Prix HT · TVA 20 % · Facturation mensuelle ou annuelle (−20 %) · Résiliation à tout moment
        </motion.p>
      </div>
    </section>
  );
}
