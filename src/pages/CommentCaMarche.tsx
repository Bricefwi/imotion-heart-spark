import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Bot, FileCheck, Handshake, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const FLOW = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Le client exprime son besoin",
    desc: "Vous démarrez un échange guidé (en ligne ou avec un consultant). Pas de jargon : on parle problème, objectifs, contraintes.",
  },
  {
    icon: Bot,
    step: "02",
    title: "Notre cabinet IA structure la matière",
    desc: "En arrière-plan, des agents IA spécialisés (intake, analyse du besoin, scoping, contrôle qualité) organisent vos réponses en un cadrage cohérent.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Un consultant valide le cahier des charges",
    desc: "Un consultant i-MOTION relit, complète et signe la version finale du CDC. Rien n'est livré sans supervision humaine.",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Proposition personnalisée",
    desc: "Sur la base du CDC, nous construisons une proposition adaptée à votre périmètre réel : diagnostic, conseil, ou réalisation NoCode.",
  },
  {
    icon: Rocket,
    step: "05",
    title: "Suivi de mission dans votre espace client",
    desc: "Vous retrouvez vos documents, jalons et échanges dans un espace dédié, suivis par votre consultant référent.",
  },
];

export default function CommentCaMarche() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Comment ça marche — i-MOTION Conseil"
        description="Du besoin client au suivi de mission : découvrez le flux i-MOTION Conseil. Audit, cabinet IA, validation humaine, proposition personnalisée."
        canonical="/comment-ca-marche"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Comment ça marche", url: "/comment-ca-marche" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Comment nous accompagnons vos projets
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            i-MOTION Conseil combine un cabinet d'agents IA spécialisés et l'expertise de
            consultants humains. Voici comment se déroule une mission, de la première
            conversation au suivi opérationnel.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl space-y-6">
          {FLOW.map((step, i) => (
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
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-muted/20 border-t border-border">
        <div className="container max-w-3xl text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Prêt à clarifier votre projet ?
          </h2>
          <p className="text-muted-foreground mb-8">
            L'audit et le cahier des charges sont gratuits. Vous ne vous engagez qu'après
            réception d'une proposition personnalisée.
          </p>
          <Button asChild size="lg" variant="flame" className="gap-2">
            <Link to="/register">
              Démarrer mon audit gratuit <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
