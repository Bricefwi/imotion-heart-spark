/**
 * Marketing — Audit gratuit (rapatriée depuis lovelib).
 * Loss-leader : audit 100% gratuit. CTA → /register?next=/marketing/account.
 */
import { SEOHead } from "@/components/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Zap, TrendingUp, Target, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildSEO } from "@/lib/marketing/seo";

const benefits = [
  { icon: Zap, title: "Analyse rapide", description: "Collecte automatique des données de votre site en 10 minutes." },
  { icon: Brain, title: "17 agents IA spécialisés", description: "Technologie MANUS IA 2.0 pour une analyse complète." },
  { icon: Target, title: "Opportunités identifiées", description: "Rapport préliminaire avec quick wins et axes d'amélioration." },
  { icon: TrendingUp, title: "4 scénarios chiffrés", description: "Projections ROI : ambitieux, raisonné, opportuniste, mix." },
];

const whatYouGet = [
  "Collecte automatique des données de votre site",
  "Analyse de votre stack technique et présence digitale",
  "Rapport préliminaire avec opportunités identifiées",
  "4 scénarios chiffrés (ambitieux, raisonné, opportuniste, mix)",
  "Estimation ROI et recommandations prioritaires",
];

const freeFeatures = [
  "Analyse technique de base",
  "Opportunités quick wins",
  "4 scénarios d'évolution",
  "Estimation ROI préliminaire",
];

const premiumFeatures = [
  "17 agents IA orchestrés (MANUS IA 2.0)",
  "Analyse approfondie (CRM, Analytics, Ads)",
  "Plan stratégique 12-24 mois",
  "Roadmap trimestrielle détaillée",
  "Séance Q&A + itération 30 jours",
  "Garantie ZÉRO hallucination (95%+ confiance)",
];

export default function MarketingAuditGratuit() {
  const navigate = useNavigate();
  const seo = buildSEO({
    title: "Audit Digital Gratuit – IMOTION",
    description:
      "Audit digital gratuit en 10 minutes. Analyse IA avec 17 agents spécialisés. Rapport préliminaire, opportunités et scénarios chiffrés.",
    url: "/marketing/audit-gratuit",
  });

  return (
    <>
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
      />

      <main className="container py-20 md:py-28">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <Badge className="mb-6 px-4 py-1.5">
            <Zap className="mr-2 h-4 w-4" /> 100% Gratuit • Sans Engagement
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Audit digital gratuit
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Découvrez le potentiel inexploité de votre site web en <strong>10 minutes</strong>.
            Notre IA analyse votre présence digitale et identifie vos opportunités de croissance.
          </p>
          <Button size="lg" variant="flame" onClick={() => navigate("/register?next=/marketing/account/new-audit")}>
            Démarrer mon audit gratuit <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Résultats par email • Aucun engagement</p>
        </div>

        {/* Bénéfices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {benefits.map((b) => (
            <Card key={b.title} className="border-2 hover:border-primary/40 hover:shadow-lg transition-all text-center p-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15">
                <b.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </Card>
          ))}
        </div>

        {/* Ce que vous obtenez */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Ce que vous obtenez</h2>
          <Card className="p-8">
            <ul className="space-y-4">
              {whatYouGet.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5 text-primary" />
                  <span className="text-foreground text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Comparison */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Audit gratuit vs Audit premium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Audit gratuit</h3>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">0€</p>
                <p className="text-sm text-muted-foreground mt-2">Analyse rapide (10 min) • 5 agents IA</p>
              </div>
              <ul className="space-y-3 mb-6">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" onClick={() => navigate("/register?next=/marketing/account/new-audit")}>
                Démarrer l'audit gratuit
              </Button>
            </Card>
            <Card className="p-8 border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-secondary/5 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Recommandé</Badge>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Audit premium</h3>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sur devis</p>
                <p className="text-sm text-muted-foreground mt-2">Analyse complète (2 sem.) • 17 agents IA</p>
              </div>
              <ul className="space-y-3 mb-6">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant="flame">
                <Link to="/contact">Demander un devis</Link>
              </Button>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <Card className="p-10 md:p-14 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à découvrir votre potentiel ?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Lancez votre audit gratuit et recevez vos résultats par email en 10 minutes.
            </p>
            <Button size="lg" variant="flame" onClick={() => navigate("/register?next=/marketing/account/new-audit")}>
              Démarrer mon audit gratuit <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>
      </main>
    </>
  );
}
