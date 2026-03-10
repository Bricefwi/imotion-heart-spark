import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MessageSquare, FileText, BarChart3, Lightbulb, ArrowRight, Check, Star, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  {
    icon: MessageSquare,
    title: "Conversation guidée",
    description: "Une IA qui vous pose les bonnes questions pour comprendre votre vision et vos besoins.",
  },
  {
    icon: FileText,
    title: "CDC sur-mesure",
    description: "Un document professionnel généré automatiquement à partir de votre conversation.",
  },
  {
    icon: BarChart3,
    title: "Proposition claire",
    description: "Des solutions techniques chiffrées et comparées pour une décision éclairée.",
  },
];

const stats = [
  { value: "150+", label: "Projets accompagnés" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "45 min", label: "Durée moyenne" },
];

const plans = [
  {
    name: "Découverte",
    price: "Gratuit",
    description: "Conversation + Synthèse",
    features: ["Conversation IA guidée", "Synthèse de vos besoins", "Recommandations initiales"],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Standard",
    price: "500€",
    description: "CDC + Proposition",
    features: ["Tout Découverte +", "Cahier des charges complet", "Proposition technique chiffrée", "Consultant dédié"],
    cta: "Choisir Standard",
    popular: true,
  },
  {
    name: "Premium",
    price: "Sur devis",
    description: "Accompagnement complet",
    features: ["Tout Standard +", "Suivi de projet", "Révisions illimitées", "Support prioritaire", "Signature électronique"],
    cta: "Nous contacter",
    popular: false,
  },
];

const testimonials = [
  {
    quote: "IMOTION a parfaitement compris notre besoin et nous a livré une solution sur-mesure en un temps record.",
    name: "Marie Dupont",
    role: "Directrice Marketing",
    company: "TechVision",
  },
  {
    quote: "Le processus de découverte est bluffant. En 45 minutes, nous avions un CDC complet et précis.",
    name: "Thomas Martin",
    role: "CEO",
    company: "StartupFlow",
  },
  {
    quote: "Un gain de temps considérable. La qualité des documents générés est impressionnante.",
    name: "Sophie Bernard",
    role: "Product Manager",
    company: "DataCorp",
  },
];

export default function Index() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="container text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Propulsé par l'IA
            </Badge>
          </motion.div>
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
          >
            Transformez votre vision en{" "}
            <span className="gradient-text">réalité digitale</span>
          </motion.h1>
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Découvrez comment nous pouvons vous accompagner grâce à notre outil de découverte intelligent.
          </motion.p>
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="gradient-primary border-0 text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all animate-pulse-glow">
              <Link to="/register">
                <Lightbulb className="mr-2 h-5 w-5" />
                Démarrer ma découverte
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base h-12">
              <a href="#features">En savoir plus <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="text-center"
              >
                <div className="font-display text-3xl md:text-4xl font-extrabold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Un processus en 3 étapes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              De l'idée au cahier des charges, notre IA vous guide à chaque étape.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-card h-full">
                  <CardContent className="p-8">
                    <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Témoignages</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              Ils nous font confiance
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className="h-full border-0 shadow-sm">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                      ))}
                    </div>
                    <p className="text-foreground/80 mb-6 leading-relaxed italic">"{t.quote}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
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
                <Card className={`relative h-full border-0 shadow-sm ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""}`}>
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

      {/* CTA FINAL */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="gradient-primary rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
                Prêt à donner vie à votre projet ?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Rejoignez plus de 150 entreprises qui ont transformé leurs idées en solutions concrètes.
              </p>
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-base h-12 px-8">
                <Link to="/register">
                  Démarrer maintenant <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
