import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Sparkles, ArrowRight } from "lucide-react";

export default function MarketingHome() {
  return (
    <>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm font-medium text-primary">
            <Target className="h-4 w-4" />
            IMOTION Marketing — Stratégie & Acquisition
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Une <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">stratégie marketing</span><br/>
            qui transforme vos prospects.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Diagnostic 360° offert, restructuration stratégique, accompagnement dans la durée.
            Marc analyse votre acquisition, vos conversions et vos rétentions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="flame" size="lg">
              <Link to="/marketing/audit-gratuit">
                Démarrer l'audit gratuit <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/marketing/methode">Découvrir la méthode</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Marketing & Build, deux apps, un seul compte</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Votre espace IMOTION centralise audits marketing et projets de build digital.
            Vous basculez d'une app à l'autre sans vous reconnecter.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link to="/marketing/dashboard" className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all">
            <Target className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Mon espace marketing</h3>
            <p className="text-sm text-muted-foreground">Audits, plans d'action, veille IA, conversations avec Marc.</p>
          </Link>
          <Link to="/client/dashboard" className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all">
            <Sparkles className="h-8 w-8 text-secondary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Mon espace BUILD</h3>
            <p className="text-sm text-muted-foreground">Projets digitaux, cahiers des charges, livrables, contrats.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
