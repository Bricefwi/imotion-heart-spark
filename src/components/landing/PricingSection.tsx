import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const plans = [
  {
    name: "Découverte",
    price: "Gratuit",
    description: "1 projet • Conversation + Synthèse",
    features: ["Conversation IA guidée", "Synthèse de vos besoins", "Recommandations initiales"],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    price: "29€",
    period: "/mois",
    description: "Projets illimités • CDC complet",
    features: ["Tout Découverte +", "Projets illimités", "Cahier des charges complet", "Proposition technique chiffrée", "Consultant dédié"],
    cta: "Choisir Pro",
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    description: "Multi-utilisateurs • Accompagnement",
    features: ["Tout Pro +", "Multi-utilisateurs", "Suivi de projet", "Révisions illimitées", "Support prioritaire", "Signature électronique"],
    cta: "Nous contacter",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Tarifs</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Des offres adaptées à vos besoins
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
            >
              <Card className={`relative h-full border-0 shadow-sm hover:shadow-lg transition-shadow ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary border-0 px-4">Le plus populaire</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="font-display text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="font-display text-4xl font-extrabold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full ${plan.popular ? "gradient-primary border-0" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
