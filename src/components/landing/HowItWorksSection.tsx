import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { FolderPlus, MessageSquare, FileText, Rocket } from "lucide-react";
import teamImg from "@/assets/team-collaboration.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const steps = [
  { icon: FolderPlus, number: "01", title: "Créez votre projet", description: "Décrivez votre idée en quelques mots et lancez la découverte." },
  { icon: MessageSquare, number: "02", title: "Discutez avec notre IA", description: "Notre consultant IA vous pose les bonnes questions en 7 phases." },
  { icon: FileText, number: "03", title: "Recevez votre CDC", description: "Un cahier des charges complet est généré automatiquement." },
  { icon: Rocket, number: "04", title: "Lancez votre projet", description: "Validez la proposition et démarrez le développement." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background photo with overlay */}
      <div className="absolute inset-0 -z-10">
        <img src={teamImg} alt="" className="w-full h-full object-cover opacity-5" />
      </div>

      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Comment ça marche</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            De l'idée au projet en 4 étapes
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Un processus simple et efficace pour transformer votre vision en réalité digitale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="relative text-center group"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[2px] bg-gradient-to-r from-primary/30 to-secondary/30" />
              )}

              <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-2xl gradient-primary mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <step.icon className="h-8 w-8 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center shadow">
                  {step.number}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
