import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, Wallet, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Décrivez votre projet",
    description: "Répondez aux questions de Marc, notre consultant IA. En 7 phases structurées, il cerne votre vision, vos objectifs et vos contraintes.",
    accent: "from-primary to-primary/80",
    glow: "bg-primary/10",
  },
  {
    number: "02",
    icon: FileText,
    title: "Recevez votre CDC",
    description: "Un cahier des charges professionnel est généré automatiquement : spécifications, architecture technique et recommandations.",
    accent: "from-secondary to-amber-500",
    glow: "bg-secondary/10",
  },
  {
    number: "03",
    icon: Wallet,
    title: "Devis & Lancement",
    description: "Obtenez une proposition chiffrée détaillée avec planning, options comparées et contrat. Lancez votre projet en toute confiance.",
    accent: "from-blue-500 to-blue-600",
    glow: "bg-blue-500/10",
  },
];

export function HomeHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/20 text-primary">Comment ça marche</Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            De l'idée au projet en{" "}
            <span className="gradient-text">3 étapes simples</span>
          </h2>
          <p className="text-muted-foreground/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Un processus fluide et structuré, entièrement guidé par l'intelligence artificielle.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto relative">
          {/* Connector lines between steps */}
          <div className="hidden md:block absolute top-24 left-[calc(33.33%-1rem)] w-[calc(33.33%+2rem)] h-[2px] bg-gradient-to-r from-primary/30 via-secondary/30 to-blue-500/30" />
          <div className="hidden md:block absolute top-24 right-[calc(33.33%-1rem)] w-[calc(33.33%+2rem)] h-[2px] bg-gradient-to-r from-secondary/30 via-blue-500/30 to-blue-600/30" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="relative group"
            >
              <div className="text-center p-8 rounded-2xl border border-border/30 bg-background/50 backdrop-blur-sm hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
                {/* Step number + icon */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <step.icon className="h-9 w-9 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-3 h-8 w-8 rounded-full bg-background border-2 border-primary/30 text-xs font-bold flex items-center justify-center text-primary shadow-sm">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA under steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button asChild size="lg" variant="outline" className="text-base h-12 hover:-translate-y-0.5 transition-all">
            <Link to="/fonctionnalites">
              Voir le processus détaillé <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
