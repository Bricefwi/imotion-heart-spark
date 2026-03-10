import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, FileText, Phone, Calculator, Shield, Sparkles, Users } from "lucide-react";
import pricingDeco from "@/assets/pricing-decoration.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const steps = [
  {
    icon: Shield,
    title: "Vérifiez votre email",
    description: "Créez votre compte avec un email professionnel vérifié.",
  },
  {
    icon: Sparkles,
    title: "Complétez les 7 phases",
    description: "Notre IA vous guide à travers 7 phases de découverte pour comprendre votre besoin.",
  },
  {
    icon: FileText,
    title: "Téléchargez votre CDC",
    description: "Votre cahier des charges complet est généré, prêt à être téléchargé gratuitement.",
  },
];

const nextSteps = [
  {
    icon: FileText,
    title: "Télécharger le CDC",
    description: "Document complet au format PDF, prêt à être partagé avec vos équipes ou prestataires.",
    cta: "Commencer gratuitement",
    to: "/register",
    highlight: true,
  },
  {
    icon: Phone,
    title: "Réserver un appel consultant",
    description: "30 minutes gratuites avec un expert pour discuter de votre projet et affiner votre besoin.",
    cta: "Réserver un appel",
    to: "/contact",
    highlight: false,
  },
  {
    icon: Calculator,
    title: "Demander un devis de réalisation",
    description: "Recevez une proposition technique et financière détaillée pour concrétiser votre projet.",
    cta: "Demander un devis",
    to: "/contact",
    highlight: false,
  },
];

const guarantees = [
  "100% gratuit — aucune carte bancaire requise",
  "Cahier des charges professionnel et complet",
  "Vos données restent confidentielles et sécurisées",
  "Aucun engagement — vous gardez votre CDC",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative overflow-hidden">
      {/* Decorative elements */}
      <img
        src={pricingDeco}
        alt=""
        className="absolute -top-16 -right-16 w-48 h-48 opacity-10 pointer-events-none"
      />
      <img
        src={pricingDeco}
        alt=""
        className="absolute -bottom-16 -left-16 w-48 h-48 opacity-10 pointer-events-none rotate-180"
      />

      <div className="container relative">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Tarifs</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Votre cahier des charges, <span className="text-primary">100% gratuit</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Nous croyons que chaque projet mérite un cadrage solide. C'est pourquoi la rédaction 
            de votre cahier des charges est entièrement gratuite — sans limite, sans engagement.
          </p>
        </div>

        {/* How to get your CDC */}
        <div className="mb-20">
          <h3 className="font-display text-xl md:text-2xl font-bold text-center mb-10">
            Comment obtenir votre CDC gratuit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-primary mb-4 shadow-lg">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* What happens after */}
        <div className="mb-16">
          <h3 className="font-display text-xl md:text-2xl font-bold text-center mb-4">
            Et après ?
          </h3>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Une fois votre CDC généré, vous choisissez librement la suite.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {nextSteps.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className={`relative h-full border-0 shadow-sm hover:shadow-lg transition-shadow ${item.highlight ? "ring-2 ring-primary shadow-lg" : ""}`}>
                  {item.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary border-0 px-4">Gratuit</Badge>
                    </div>
                  )}
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-display text-lg font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-6 flex-1">{item.description}</p>
                    <Button
                      asChild
                      className={`w-full ${item.highlight ? "gradient-primary border-0" : ""}`}
                      variant={item.highlight ? "default" : "outline"}
                    >
                      <Link to={item.to}>{item.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-0 bg-muted/50 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h4 className="font-display font-bold">Nos garanties</h4>
              </div>
              <ul className="space-y-3">
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
