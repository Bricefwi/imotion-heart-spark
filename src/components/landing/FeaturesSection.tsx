import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import featureConversation from "@/assets/feature-conversation.png";
import featureDocument from "@/assets/feature-document.png";
import featureAnalytics from "@/assets/feature-analytics.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  {
    image: featureConversation,
    title: "Conversation guidée",
    description: "Une IA qui vous pose les bonnes questions pour comprendre votre vision et vos besoins.",
  },
  {
    image: featureDocument,
    title: "CDC sur-mesure",
    description: "Un document professionnel généré automatiquement à partir de votre conversation.",
  },
  {
    image: featureAnalytics,
    title: "Proposition claire",
    description: "Des solutions techniques chiffrées et comparées pour une décision éclairée.",
  },
];

export function FeaturesSection() {
  return (
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
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-24 w-24 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
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
  );
}
