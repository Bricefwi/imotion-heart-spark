import { Link } from "react-router-dom";
import { Search, Compass, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const OFFERS = [
  {
    icon: Search,
    name: "Diagnostic",
    tagline: "Cadrer et clarifier",
    desc: "Audit conversationnel, cahier des charges structuré, restitution écrite. Idéal pour partir sur des bases solides.",
    items: [
      "Audit IA & NoCode gratuit",
      "Cahier des charges téléchargeable",
      "Recommandations priorisées",
    ],
    pricing: "Gratuit",
  },
  {
    icon: Compass,
    name: "Conseil",
    tagline: "Accompagner les décisions",
    desc: "Mission de conseil ciblée : aide au choix, cadrage approfondi, expertise IA / NoCode sur des sujets précis.",
    items: [
      "Sessions de travail avec un consultant",
      "Études d'opportunité ou de faisabilité",
      "Préconisations techniques et organisationnelles",
    ],
    pricing: "Sur devis",
  },
  {
    icon: Rocket,
    name: "Build & Run",
    tagline: "Concevoir, livrer, opérer",
    desc: "Réalisation NoCode / low-code, mise en production, suivi opérationnel. Le périmètre est défini avec vous, pas standardisé.",
    items: [
      "Conception et réalisation NoCode",
      "Intégrations et automatisations",
      "Suivi de mission et maintenance",
    ],
    pricing: "Sur devis",
  },
];

export function OffersSection() {
  return (
    <section className="py-20 md:py-28 bg-background border-t border-border">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-mono uppercase tracking-[0.18em] text-primary mb-3">
            Nos offres
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Diagnostic, Conseil, Build &amp; Run
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trois niveaux d'accompagnement, qui se combinent selon votre maturité, votre rythme et
            la nature de votre projet. Aucune grille standard : chaque proposition est construite
            sur la base de votre CDC.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {OFFERS.map((o) => (
            <div key={o.name} className="rounded-2xl border border-border bg-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center">
                  <o.icon className="size-5" />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                  {o.pricing}
                </span>
              </div>
              <h3 className="font-bold text-xl mb-1">{o.name}</h3>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">{o.tagline}</p>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{o.desc}</p>
              <ul className="space-y-2 mb-6">
                {o.items.map((it) => (
                  <li key={it} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild size="lg" variant="flame" className="gap-2">
            <Link to="/register">
              Commencer par l'audit gratuit <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
