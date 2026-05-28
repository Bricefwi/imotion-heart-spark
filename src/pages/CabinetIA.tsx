import { Link } from "react-router-dom";
import { Users, MessageSquare, Search, FileCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const AGENTS = [
  {
    icon: MessageSquare,
    name: "Agent d'accueil",
    role: "Vous écoute, reformule votre contexte et identifie la nature de votre besoin.",
  },
  {
    icon: Search,
    name: "Analyste du besoin",
    role: "Explore votre activité, vos objectifs, vos contraintes et la maturité de votre projet.",
  },
  {
    icon: FileCheck,
    name: "Cadreur de périmètre",
    role: "Définit ce qui entre dans le projet (et ce qui en sort), pose les jalons et priorités.",
  },
  {
    icon: ShieldCheck,
    name: "Contrôle qualité",
    role: "Vérifie la cohérence, signale les zones d'ombre, prévient les contresens.",
  },
  {
    icon: Users,
    name: "Consultant humain (i-MOTION)",
    role: "Relit, valide, complète et engage le cabinet sur les livrables. Toujours dans la boucle.",
  },
];

export default function CabinetIA() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Notre cabinet IA — i-MOTION Conseil"
        description="i-MOTION Conseil s'appuie sur un cabinet d'agents IA spécialisés (accueil, analyse, scoping, contrôle qualité), toujours sous supervision d'un consultant humain."
        canonical="/cabinet-ia"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Cabinet IA", url: "/cabinet-ia" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Un cabinet d'agents IA, supervisé par des humains
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Derrière chaque mission i-MOTION Conseil, plusieurs agents IA spécialisés travaillent
            en arrière-plan pour structurer votre besoin. Aucun livrable n'est envoyé sans la
            validation d'un consultant humain.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-5">
            {AGENTS.map((a) => (
              <div key={a.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center mb-4">
                  <a.icon className="size-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{a.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.role}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
            <h2 className="font-bold text-lg mb-3">Notre principe : pas d'automatisation aveugle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les agents IA accélèrent l'analyse et fiabilisent la structuration. Mais le jugement,
              la décision et la responsabilité restent du ressort des consultants i-MOTION. Vous
              savez toujours qui valide quoi.
            </p>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="flame" className="gap-2">
              <Link to="/register">
                Démarrer mon audit gratuit <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
