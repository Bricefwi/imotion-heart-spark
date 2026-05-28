import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, Compass, Hammer, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const ETAPES = [
  {
    icon: Search,
    step: "01",
    title: "Diagnostic",
    desc: "Nous évaluons votre maturité digitale et clarifions votre besoin par une découverte guidée.",
    livrable: "Score de maturité + cahier des charges initial.",
  },
  {
    icon: Compass,
    step: "02",
    title: "Conseil stratégique",
    desc: "Pour les projets qualifiés, nous analysons la faisabilité, concevons l'architecture de la solution, priorisons et bâtissons une feuille de route.",
    livrable: "Note de faisabilité, architecture, roadmap.",
  },
  {
    icon: Hammer,
    step: "03",
    title: "Build",
    desc: "Nous réalisons : site, application, automatisation, intégration IA ou NoCode — sur la base d'une proposition personnalisée et d'un chiffrage validé.",
    livrable: "Solution opérationnelle + documentation.",
  },
  {
    icon: Activity,
    step: "04",
    title: "Run",
    desc: "Nous accompagnons dans la durée : maintenance, optimisation, monitoring, évolutions.",
    livrable: "Suivi continu et améliorations.",
  },
];

export default function CommentCaMarche() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Méthode — i-MOTION Conseil"
        description="Une méthode structurée, du cadrage à la mise en production. Quatre étapes claires, un livrable à chaque fois, une validation humaine à chaque décision importante."
        canonical="/methode"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Méthode", url: "/methode" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Une méthode structurée, du cadrage à la mise en production.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Quatre étapes claires, un livrable à chaque fois, une validation humaine
            à chaque décision importante.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl space-y-6">
          {ETAPES.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex gap-5 p-6 rounded-2xl border border-border bg-card"
            >
              <div className="shrink-0 flex flex-col items-center">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center">
                  <step.icon className="size-5" />
                </div>
                <span className="text-xs font-mono text-muted-foreground mt-2 tracking-wider">{step.step}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">
                  Étape {Number(step.step)} — {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                <p className="text-sm">
                  <span className="font-semibold text-foreground">Livrable :</span>{" "}
                  <span className="text-muted-foreground">{step.livrable}</span>
                </p>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 flex gap-4"
          >
            <ShieldCheck className="size-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2">Validation humaine</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nos consultants IA accélèrent l'analyse, mais aucune proposition commerciale
                ne part sans la validation d'un consultant humain. C'est notre garantie de sérieux.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/20 border-t border-border">
        <div className="container max-w-3xl text-center">
          <Button asChild size="lg" variant="flame" className="gap-2">
            <Link to="/offres">
              Voir nos offres <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
