import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Pourquoi le cahier des charges est-il gratuit ?",
    answer:
      "Notre modèle repose sur la réalisation de votre projet, pas sur la vente de documents. Le CDC gratuit nous permet de comprendre précisément votre besoin et de vous proposer un accompagnement sur-mesure. C'est un investissement pour nous — chaque CDC nous coûte environ 0,50€ en ressources IA — mais c'est la meilleure façon de démarrer une collaboration de confiance.",
  },
  {
    question: "Que contient exactement le cahier des charges ?",
    answer:
      "Le CDC comprend : le contexte et les objectifs du projet, les fonctionnalités détaillées, les contraintes techniques, les personas utilisateurs, l'architecture recommandée, une estimation budgétaire et un planning prévisionnel. C'est un document professionnel de 15 à 30 pages, prêt à être partagé avec vos équipes ou prestataires.",
  },
  {
    question: "Combien de temps faut-il pour générer mon CDC ?",
    answer:
      "La conversation avec notre IA dure en moyenne 45 minutes, réparties en 7 phases structurées. Vous pouvez la faire en une seule session ou la reprendre plus tard. Le document est généré instantanément à la fin de la conversation.",
  },
  {
    question: "Suis-je obligé de passer par vous pour la réalisation ?",
    answer:
      "Absolument pas. Le CDC vous appartient et vous pouvez l'utiliser librement : le confier à votre équipe interne, à un autre prestataire, ou nous demander un devis. Aucun engagement, aucune obligation.",
  },
  {
    question: "Quels types de projets pouvez-vous réaliser ?",
    answer:
      "Sites vitrines, applications web et mobiles, plateformes SaaS, e-commerce, outils métiers, API et intégrations. Notre équipe couvre le design, le développement front-end et back-end, le DevOps et l'accompagnement post-lancement.",
  },
  {
    question: "Comment sont calculés les tarifs de réalisation (BUILD) ?",
    answer:
      "Le devis est basé sur la complexité fonctionnelle, le nombre de pages/écrans, les intégrations nécessaires et le niveau de personnalisation. Les projets démarrent généralement à partir de 5 000€ et peuvent atteindre 50 000€+ pour des plateformes complexes. Tout est détaillé et transparent dans la proposition.",
  },
  {
    question: "Que comprend l'offre RUN à 399€/mois ?",
    answer:
      "L'offre RUN inclut : l'hébergement haute disponibilité, la maintenance corrective et préventive, les mises à jour de sécurité, le monitoring 24/7, un support prioritaire et jusqu'à 4h d'évolutions mineures par mois. Sans engagement de durée minimale.",
  },
  {
    question: "Dois-je fournir un email professionnel ?",
    answer:
      "Oui, nous demandons un email professionnel vérifié pour garantir la qualité de nos échanges et vous fournir un document personnalisé. Les adresses personnelles (Gmail, Yahoo, etc.) ne sont pas acceptées pour la génération du CDC.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PricingFAQ() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground">
            Tout ce que vous devez savoir sur notre offre et notre processus.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-background border border-border/50 rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-display font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
