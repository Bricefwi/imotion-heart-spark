import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

const OBTENEZ = [
  "Un audit de maturité sur les dimensions clés de votre activité.",
  "Une découverte guidée qui structure votre besoin réel.",
  "Un cahier des charges initial téléchargeable, qui vous appartient.",
];

const ETAPES = [
  "Vous répondez à un questionnaire guidé.",
  "Vous recevez votre score de maturité et vos points d'amélioration prioritaires.",
  "Vous téléchargez votre cahier des charges initial.",
];

const ENGAGEMENTS = [
  "Gratuit",
  "Sans engagement",
  "Vos données vous appartiennent",
  "Validation humaine avant toute proposition",
];

export default function AuditIANoCode() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Diagnostic gratuit — i-MOTION Conseil"
        description="Évaluez votre maturité digitale en quelques minutes, clarifiez votre besoin et repartez avec un cahier des charges initial. Gratuit, sans engagement."
        canonical="/diagnostic"
        jsonLd={[breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Diagnostic", url: "/diagnostic" },
        ])]}
      />

      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.18em] text-primary mb-4">
              Diagnostic · Gratuit · Sans engagement
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Votre diagnostic digital, gratuit et sans engagement.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En quelques minutes, évaluez votre maturité digitale, clarifiez votre besoin
              et repartez avec un cahier des charges initial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-lg mb-4">Ce que vous obtenez</h2>
              <ul className="space-y-3">
                {OBTENEZ.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="size-4 text-primary mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-bold text-lg mb-4">Comment ça se passe</h2>
              <ol className="space-y-3">
                {ETAPES.map((t, i) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="size-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
            <h2 className="font-bold text-lg mb-3">Et ensuite ?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si votre projet entre dans notre champ d'intervention, nos consultants approfondissent
              l'analyse — faisabilité, architecture, chiffrage — et nous revenons vers vous avec
              une proposition. Vous restez libre à chaque étape.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {ENGAGEMENTS.map((e) => (
              <span
                key={e}
                className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground"
              >
                {e}
              </span>
            ))}
          </div>

          <div className="text-center mt-12 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="flame" className="gap-2">
              <Link to="/register">
                Lancer mon diagnostic <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/register">Créer mon cahier des charges</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
