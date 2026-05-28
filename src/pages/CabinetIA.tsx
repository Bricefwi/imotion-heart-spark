import { Link } from "react-router-dom";
import { MessageSquare, Search, ShieldCheck, Users, ArrowRight, Zap, Award, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const CONSULTANTS = [
  {
    icon: MessageSquare,
    name: "Cadrage & veille",
    role: "Comprendre votre contexte et votre marché.",
  },
  {
    icon: Search,
    name: "Analyse & conception",
    role: "Évaluer la faisabilité, concevoir la solution, estimer la charge.",
  },
  {
    icon: ShieldCheck,
    name: "Contrôle qualité",
    role: "Vérifier la cohérence et la fiabilité de chaque livrable.",
  },
  {
    icon: Users,
    name: "Supervision humaine",
    role: "Un consultant valide les analyses et toute proposition avant envoi.",
  },
];

const APPORTS = [
  {
    icon: Zap,
    title: "Rapidité",
    desc: "L'analyse avance sans les délais d'un cabinet classique.",
  },
  {
    icon: Award,
    title: "Rigueur",
    desc: "Chaque livrable est contrôlé avant de vous parvenir.",
  },
  {
    icon: Wallet,
    title: "Accessibilité",
    desc: "Une qualité de conseil à un coût adapté aux TPE et PME.",
  },
];

export default function CabinetIA() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Cabinet IA supervisé — i-MOTION Conseil"
        description="Un cabinet de conseil augmenté par l'IA, supervisé par l'humain. Consultants IA spécialisés et supervision humaine pour la rigueur d'un cabinet à un coût accessible."
        canonical="/cabinet"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Cabinet IA supervisé", url: "/cabinet" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Un cabinet de conseil augmenté par l'IA, supervisé par l'humain.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nous combinons des consultants IA spécialisés et une supervision humaine pour
            vous offrir la rigueur d'un cabinet, à un rythme et un coût accessibles.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Comment nous travaillons</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Chaque dossier qualifié est traité par des consultants spécialisés, chacun dans son domaine.
          </p>

          <div className="grid md:grid-cols-2 gap-5 mb-16">
            {CONSULTANTS.map((c) => (
              <div key={c.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center mb-4">
                  <c.icon className="size-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{c.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.role}</p>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Ce que cela vous apporte</h2>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {APPORTS.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border bg-card p-6">
                <a.icon className="size-6 text-primary mb-3" />
                <h3 className="font-bold text-lg mb-2">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
            <h2 className="font-bold text-lg mb-3">Ce que nous ne promettons pas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pas de magie, pas de « tout automatique sans humain », pas de résultats garantis.
              Nous promettons une méthode sérieuse et un interlocuteur responsable.
            </p>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="flame" className="gap-2">
              <Link to="/diagnostic">
                Démarrer mon diagnostic <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
