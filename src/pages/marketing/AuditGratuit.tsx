import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Zap, TrendingUp, Target, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BRAND } from "@/lib/brand";

const benefits = [
  { icon: Zap, title: "Analyse rapide", desc: "Collecte automatique des données de votre site en 10 minutes." },
  { icon: Brain, title: "17 agents IA spécialisés", desc: "Technologie MANUS IA 2.0 pour une analyse complète." },
  { icon: Target, title: "Opportunités identifiées", desc: "Rapport préliminaire avec quick wins et axes d'amélioration." },
  { icon: TrendingUp, title: "4 scénarios chiffrés", desc: "Projections ROI : ambitieux, raisonné, opportuniste, mix." },
];

const whatYouGet = [
  "Collecte automatique des données de votre site",
  "Analyse de votre stack technique et présence digitale",
  "Rapport préliminaire avec opportunités identifiées",
  "4 scénarios chiffrés (ambitieux, raisonné, opportuniste, mix)",
  "Estimation ROI et recommandations prioritaires",
];

export default function MarketingAuditGratuit() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Audit marketing gratuit — IMOTION</title>
        <meta name="description" content="Audit marketing gratuit en 10 minutes. Analyse IA de votre site web par 17 agents spécialisés. Rapport préliminaire et 4 scénarios chiffrés. Sans engagement." />
        <link rel="canonical" href={`${BRAND.appUrl}/marketing/audit-gratuit`} />
      </Helmet>

      <main className="container py-20 md:py-28">
        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5 text-sm font-semibold text-primary">
            <Zap className="w-4 h-4" /> 100% gratuit • Sans engagement
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Audit <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">marketing gratuit</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Découvrez le potentiel inexploité de votre site web en <strong>10 minutes</strong>.
            Notre IA analyse votre présence digitale et identifie vos opportunités de croissance.
          </p>

          <Button size="lg" variant="flame" onClick={() => navigate("/register?next=/marketing/audit-gratuit")} className="text-base px-8 py-6">
            Démarrer mon audit gratuit
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4">Résultats envoyés par email • Aucun engagement</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {benefits.map((b) => (
            <Card key={b.title} className="p-6 text-center hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15">
                <b.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </Card>
          ))}
        </div>

        {/* What you get */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Ce que vous obtiendrez
          </h2>
          <Card className="p-8 md:p-10">
            <ul className="space-y-4">
              {whatYouGet.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5 text-success" />
                  <p className="text-base md:text-lg">{item}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Comparison */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Audit gratuit vs audit premium
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gratuit */}
            <Card className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Audit gratuit</h3>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">0€</p>
                <p className="text-sm text-muted-foreground mt-2">Analyse rapide (10 min) • 5 agents IA • Rapport préliminaire</p>
              </div>
              <ul className="space-y-3 mb-6">
                {["Analyse technique de base", "Opportunités quick wins", "4 scénarios d'évolution", "Estimation ROI préliminaire"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" onClick={() => navigate("/register?next=/marketing/audit-gratuit")}>
                Démarrer l'audit gratuit
              </Button>
            </Card>

            {/* Premium */}
            <Card className="p-8 relative border-2 border-primary bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-primary to-secondary shadow-md">
                Recommandé
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Audit premium</h3>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sur devis</p>
                <p className="text-sm text-muted-foreground mt-2">Analyse complète (2 semaines) • 17 agents IA • Rapport ultra-détaillé</p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  <><strong>17 agents IA orchestrés</strong> (MANUS IA 2.0)</>,
                  "Analyse approfondie (CRM, Analytics, Ads)",
                  "Plan stratégique 12-24 mois",
                  "Roadmap trimestrielle détaillée",
                  "Séance Q&A + itération 30 jours",
                  "Garantie ZÉRO hallucination (95%+ confiance)",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="flame" className="w-full" onClick={() => navigate("/contact")}>
                Demander un devis
              </Button>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à découvrir votre potentiel ?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Lancez votre audit gratuit maintenant et recevez vos résultats par email en 10 minutes.
          </p>
          <Button size="lg" variant="flame" onClick={() => navigate("/register?next=/marketing/audit-gratuit")} className="text-base px-8 py-6">
            Démarrer mon audit gratuit
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </main>
    </>
  );
}
