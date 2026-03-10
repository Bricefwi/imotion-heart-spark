import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import featureConversation from "@/assets/feature-conversation.png";
import featureDocument from "@/assets/feature-document.png";
import featureAnalytics from "@/assets/feature-analytics.png";

const features = [
  {
    image: featureConversation,
    badge: "Étape 1",
    title: "Conversation guidée par l'IA",
    description:
      "Notre consultant IA vous pose les bonnes questions en 7 phases structurées pour explorer votre vision, vos contraintes et vos objectifs. Pas de jargon technique — juste une discussion naturelle.",
    highlights: ["7 phases de découverte", "Questions adaptatives", "Analyse en temps réel"],
  },
  {
    image: featureDocument,
    badge: "Étape 2",
    title: "Cahier des charges sur-mesure",
    description:
      "À partir de votre conversation, un document professionnel est généré automatiquement : spécifications fonctionnelles, contraintes techniques et recommandations — prêt à partager avec vos équipes.",
    highlights: ["Génération automatique", "Format professionnel", "Exportable en PDF"],
  },
  {
    image: featureAnalytics,
    badge: "Étape 3",
    title: "Proposition claire et chiffrée",
    description:
      "Recevez une proposition technique détaillée avec estimation budgétaire, planning et options comparées. Prenez des décisions éclairées grâce à des données structurées.",
    highlights: ["Budget estimé", "Planning prévisionnel", "Options comparées"],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 overflow-hidden">
      <div className="container">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Un processus en 3 étapes
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            De l'idée au cahier des charges, notre IA vous guide à chaque étape.
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {features.map((feature, i) => {
            const isReversed = i % 2 === 1;

            return (
              <div
                key={feature.title}
                className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-16 lg:gap-24`}
              >
                {/* Illustration */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? 60 : -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="flex-1 flex justify-center relative"
                >
                  {/* Decorative blob */}
                  <div className="absolute inset-0 flex items-center justify-center -z-10">
                    <div
                      className={`w-64 h-64 md:w-80 md:h-80 rounded-full blur-3xl opacity-20 ${
                        i === 0 ? "bg-primary" : i === 1 ? "bg-secondary" : "bg-primary"
                      }`}
                    />
                  </div>
                  <motion.img
                    src={feature.image}
                    alt={feature.title}
                    className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain drop-shadow-xl"
                    whileHover={{ scale: 1.08, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  />
                </motion.div>

                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                  className="flex-1 max-w-lg"
                >
                  <Badge variant="secondary" className="mb-4 text-xs font-semibold">
                    {feature.badge}
                  </Badge>
                  <h3 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-sm font-medium">
                        <span className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                          <svg className="h-3.5 w-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
