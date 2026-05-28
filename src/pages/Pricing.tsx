import { Link } from "react-router-dom";
import { ArrowRight, Search, Compass, Hammer, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const OFFRES = [
  {
    icon: Search,
    n: "01",
    name: "Diagnostic gratuit",
    purpose: "Pour clarifier votre besoin.",
    livrable: "Score de maturité + cahier des charges initial.",
    pricing: "Gratuit",
  },
  {
    icon: Compass,
    n: "02",
    name: "Conseil stratégique",
    purpose: "Pour décider sur des bases solides.",
    livrable: "Faisabilité, architecture, roadmap.",
    pricing: "Sur devis",
  },
  {
    icon: Hammer,
    n: "03",
    name: "Build",
    purpose: "Pour réaliser le projet.",
    livrable: "Solution livrée + documentation.",
    pricing: "Sur devis",
  },
  {
    icon: Activity,
    n: "04",
    name: "Run",
    purpose: "Pour pérenniser et faire évoluer.",
    livrable: "Maintenance, monitoring, évolutions.",
    pricing: "Sur devis",
  },
];

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Offres — i-MOTION Conseil"
        description="Du cadrage gratuit à l'accompagnement continu. Diagnostic, Conseil stratégique, Build et Run. Chaque proposition est personnalisée et validée par un consultant humain."
        canonical="/offres"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Offres", url: "/offres" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-[0.18em] text-primary mb-4">
            Nos lignes de service
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
            Du cadrage gratuit à l'accompagnement continu.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez le niveau d'accompagnement adapté à votre projet.
            Tout commence par un diagnostic gratuit.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            {OFFRES.map((o) => (
              <div key={o.name} className="rounded-2xl border border-border bg-card p-7 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center">
                      <o.icon className="size-5" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-[0.18em] text-primary">{o.n}</span>
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                    {o.pricing}
                  </span>
                </div>
                <h3 className="font-bold text-xl mb-2">{o.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{o.purpose}</p>
                <div className="mt-auto pt-4 border-t border-border">
                  <p className="text-sm">
                    <span className="font-semibold text-foreground">Livrable :</span>{" "}
                    <span className="text-muted-foreground">{o.livrable}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 flex gap-4">
            <ShieldCheck className="size-6 text-primary shrink-0 mt-1" />
            <p className="text-muted-foreground leading-relaxed">
              Chaque proposition est personnalisée, chiffrée et validée par un consultant humain
              avant de vous être envoyée.
            </p>
          </div>

          <div className="text-center mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="flame" className="gap-2">
              <Link to="/contact">
                Demander une proposition <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/diagnostic">Commencer par le diagnostic gratuit</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
