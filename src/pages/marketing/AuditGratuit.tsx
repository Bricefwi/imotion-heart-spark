import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MarketingAuditGratuit() {
  return (
    <section className="container py-20">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold">Audit marketing offert</h1>
        <p className="text-lg text-muted-foreground">
          Diagnostic 360° de votre acquisition, conversion et rétention. Livré sous 48h, sans engagement.
        </p>
        <div className="rounded-2xl border border-dashed border-border p-12 bg-muted/20">
          <p className="text-sm text-muted-foreground italic">
            Module d'audit en cours de migration depuis lovelib (Phase 3 du plan de fusion).
          </p>
        </div>
        <Button asChild variant="flame" size="lg">
          <Link to="/marketing">Retour à l'accueil marketing</Link>
        </Button>
      </div>
    </section>
  );
}
