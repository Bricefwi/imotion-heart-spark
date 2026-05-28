import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const COVERED = [
  "Cadrage de votre besoin métier et fonctionnel",
  "Évaluation des opportunités IA & NoCode dans votre contexte",
  "Cartographie de votre stack existante",
  "Identification des contraintes (budget, délai, ressources)",
  "Restitution sous forme de cahier des charges structuré",
];

const NOT_COVERED = [
  "Aucun chiffrage public ni promesse de résultat",
  "Aucun engagement contractuel à l'issue de l'audit",
  "Aucune communication commerciale invasive",
];

export default function AuditIANoCode() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Audit IA & NoCode gratuit — i-MOTION Conseil"
        description="Diagnostic gratuit IA & NoCode : cadrage de votre besoin, cahier des charges structuré, proposition personnalisée. Sans engagement."
        canonical="/audit-ia-nocode"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Audit IA & NoCode", url: "/audit-ia-nocode" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.18em] text-primary mb-4">
              Audit gratuit · Sans engagement
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Un audit IA &amp; NoCode pour cadrer votre projet
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Un échange conversationnel guidé pour comprendre votre contexte, identifier les
              opportunités IA &amp; NoCode pertinentes, et produire un cahier des charges
              exploitable. Le résultat est validé par un consultant humain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-lg mb-4">Ce que couvre l'audit</h2>
              <ul className="space-y-3">
                {COVERED.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-lg mb-4">Ce que l'audit ne fait pas</h2>
              <ul className="space-y-3">
                {NOT_COVERED.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="flame" className="gap-2">
              <Link to="/register">
                Démarrer l'audit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Inscription rapide · Pas de carte bancaire · CDC téléchargeable en PDF
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
