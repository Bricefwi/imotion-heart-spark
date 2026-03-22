import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const faqs = [
  {
    question: "Comment fonctionne la génération du cahier des charges ?",
    answer: "Notre consultant IA, Marc, vous guide à travers une conversation structurée en 7 phases. Il pose des questions précises sur votre projet (objectifs, cible, fonctionnalités, contraintes, budget) et génère automatiquement un cahier des charges professionnel à partir de vos réponses."
  },
  {
    question: "Est-ce vraiment gratuit ?",
    answer: "Oui, la génération du cahier des charges est 100% gratuite, sans engagement et sans carte bancaire. Vous pouvez télécharger votre CDC en PDF à tout moment. Si vous souhaitez ensuite faire réaliser votre projet, nous proposons des prestations BUILD à partir de 5 000€."
  },
  {
    question: "Combien de temps faut-il pour générer un CDC ?",
    answer: "En moyenne, une session de découverte complète prend environ 45 minutes. Vous pouvez aussi faire des pauses et reprendre plus tard — votre progression est sauvegardée automatiquement."
  },
  {
    question: "Quels types de projets sont couverts ?",
    answer: "IMOTION Creator Studio couvre les projets web et digitaux : sites vitrines, e-commerce, applications web SaaS, marketplaces, CRM sur mesure, applications mobiles hybrides, et refonte de systèmes existants."
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Vos données sont hébergées en Union européenne (serveurs Supabase en Allemagne/Irlande), conformément au RGPD. L'accès est protégé par Row Level Security et vos conversations restent strictement confidentielles."
  },
  {
    question: "Puis-je modifier mon cahier des charges après génération ?",
    answer: "Oui. Votre CDC reste accessible depuis votre espace client et peut être régénéré à tout moment si vous souhaitez ajuster vos réponses ou ajouter des précisions."
  },
  {
    question: "Comment vous contacter pour des questions ?",
    answer: "Écrivez-nous à contact@imotion-conseils.fr. Nous répondons sous 24h ouvrées. Vous pouvez également utiliser le formulaire de contact sur notre site."
  },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 border-b border-border/30 group"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors pr-4">
            {question}
          </h3>
          <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96 mt-3" : "max-h-0"}`}>
          <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
            {answer}
          </p>
        </div>
      </button>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/20 text-primary">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
          <p className="text-muted-foreground/70 max-w-xl mx-auto text-lg">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto" ref={animateParent}>
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
