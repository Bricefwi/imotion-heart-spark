import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, FileText, Phone, Calculator, Shield, Sparkles, MessageSquare, ArrowDown, ArrowRight, Zap } from "lucide-react";
import pricingDeco from "@/assets/pricing-decoration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const funnelSteps = [
  {
    icon: Sparkles,
    label: "Landing Page",
    description: "Découvrez notre solution",
    free: true,
  },
  {
    icon: MessageSquare,
    label: "Chat IA",
    description: "7 phases de découverte guidée",
    free: true,
  },
  {
    icon: FileText,
    label: "CDC Gratuit",
    description: "Cahier des charges complet généré",
    free: true,
  },
  {
    icon: Phone,
    label: "Appel Qualification",
    description: "30 min avec un expert, gratuit",
    free: true,
  },
];

const paidOffers = [
  {
    icon: Zap,
    title: "BUILD",
    subtitle: "Réalisation sur mesure",
    price: "5 000€ – 50 000€+",
    description: "Développement complet de votre projet digital : design, développement, tests, déploiement.",
    features: [
      "Équipe dédiée (design + dev)",
      "Sprints agiles avec suivi temps réel",
      "Livraison clé en main",
      "Garantie 3 mois post-livraison",
    ],
  },
  {
    icon: Shield,
    title: "RUN",
    subtitle: "Maintenance & évolution",
    price: "399€/mois",
    description: "Hébergement, maintenance, support et évolutions continues de votre application.",
    features: [
      "Hébergement haute disponibilité",
      "Mises à jour de sécurité",
      "Support réactif sous 24h",
      "Évolutions mensuelles incluses",
    ],
  },
];

const guarantees = [
  "CDC 100% gratuit — aucune carte bancaire",
  "Vos données restent confidentielles",
  "Aucun engagement — vous gardez votre CDC",
  "Coût par CDC : ~0.50€ pour nous, valeur inestimable pour vous",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative overflow-hidden">
      <img src={pricingDeco} alt="" className="absolute -top-16 -right-16 w-48 h-48 opacity-10 pointer-events-none" />
      <img src={pricingDeco} alt="" className="absolute -bottom-16 -left-16 w-48 h-48 opacity-10 pointer-events-none rotate-180" />

      <div className="container relative">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Notre modèle</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Le CDC est <span className="gradient-text">gratuit</span>, la valeur est dans la réalisation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Nous investissons dans votre cadrage parce que nous croyons en votre projet. 
            La rédaction du cahier des charges est offerte — vous ne payez que si vous choisissez de construire avec nous.
          </p>
        </div>

        {/* ── FUNNEL GRATUIT ── */}
        <div className="mb-20">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-primary/30" />
            <Badge className="gradient-primary border-0 text-sm px-5 py-1.5">Gratuit</Badge>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-primary/30" />
          </div>

          <div className="max-w-3xl mx-auto">
            {funnelSteps.map((step, i) => (
              <motion.div
                key={step.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <div className="flex items-center gap-4 md:gap-6 py-4">
                  <div className="shrink-0 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                    <step.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-display font-bold text-lg">{step.label}</h4>
                      <Badge variant="secondary" className="text-xs">Gratuit</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <span className="hidden md:block shrink-0 font-display text-2xl font-black text-muted-foreground/20">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="flex justify-start ml-7">
                    <ArrowDown className="h-5 w-5 text-primary/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── TRANSITION ── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted/60 border">
            <span className="text-sm text-muted-foreground">Vous êtes convaincu ?</span>
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Passez à la réalisation</span>
          </div>
        </motion.div>

        {/* ── OFFRES PAYANTES ── */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-secondary/30" />
            <Badge variant="outline" className="text-sm px-5 py-1.5 border-secondary/50 text-secondary">Accompagnement</Badge>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-secondary/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {paidOffers.map((offer, i) => (
              <motion.div
                key={offer.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className="relative h-full border-0 shadow-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <offer.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-black">{offer.title}</h3>
                        <p className="text-xs text-muted-foreground">{offer.subtitle}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="font-display text-2xl font-extrabold gradient-text">{offer.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{offer.description}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {offer.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/contact">Demander un devis</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── CTA + GUARANTEES ── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="gradient-primary p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-primary-foreground mb-3">
                Commencez par votre CDC gratuit
              </h3>
              <p className="text-primary-foreground/80 mb-6 text-sm">
                Aucun risque, aucun engagement. Définissez votre projet, recevez votre cahier des charges.
              </p>
              <Button asChild size="lg" variant="secondary" className="text-base px-8 h-12 shadow-lg">
                <Link to="/register">Créer mon CDC gratuitement</Link>
              </Button>
            </div>
            <CardContent className="p-6 bg-muted/30">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guarantees.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
