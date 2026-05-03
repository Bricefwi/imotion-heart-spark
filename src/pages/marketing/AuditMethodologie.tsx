/**
 * Marketing — Méthodologie d'audit (rapatriée depuis lovelib).
 * Décrit MANUS IA 2.0 + 17 agents + 6 phases + KPIs + quality gates.
 */
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { CheckCircle2, Brain, Zap, Target, FileText, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildSEO } from "@/lib/marketing/seo";

const methodologySteps = [
  { icon: Target, title: "Intake & périmètre", description: "Secteur, ICP, canaux, ARR, cycle de vente.", deliverable: "Check-list de complétude", agents: ["A01 - Market Researcher", "A02 - Competitor Analyst"], duration: "1-2 jours" },
  { icon: Brain, title: "Collecte de données", description: "CRM (HubSpot/Pipedrive), Analytics (GA4), Ads, facturation (Stripe).", deliverable: "Contrôles : fenêtres d'attribution, cohérence unités", agents: ["A04 - Tech Auditor", "A05 - Conversational Marketing"], duration: "2-3 jours" },
  { icon: Zap, title: "Scoring multi-agents", description: "RICE, fiabilité (A/B/C), risques (probabilité × impact).", deliverable: "Matrice de priorisation avec scores de confiance", agents: ["A17 - Truth Guardian", "A08 - Strategy Auditor"], duration: "1 jour" },
  { icon: TrendingUp, title: "Analyses approfondies", description: "Funnel, CAC/LTV, cohortes, couverture pipeline, win/loss, pricing.", deliverable: "Dashboards interactifs + insights actionnables", agents: ["A09 - SEO", "A10 - Content", "A11 - UX", "A12 - Conversion"], duration: "3-4 jours" },
  { icon: FileText, title: "Synthèse stratégique", description: "10–15 initiatives classées, budget, planning trimestriel, KPIs cibles.", deliverable: "Plan stratégique + roadmap + scénarios d'évolution", agents: ["A13 - Synthesis", "A14 - Recommendation Engine"], duration: "2 jours" },
  { icon: CheckCircle2, title: "Restitution & suivi", description: "Rapport PDF + tableaux de bord + séance Q&A.", deliverable: "Documentation complète + itération sous 30 jours", agents: ["A15 - Report Generator", "A16 - Quality Reviewer"], duration: "1 jour" },
];

const kpis = [
  { name: "CAC", description: "Coût d'acquisition client par canal" },
  { name: "LTV", description: "Lifetime Value par segment" },
  { name: "MQL→SQL", description: "Taux de conversion Marketing → Sales" },
  { name: "Win Rate", description: "Taux de conversion des opportunités" },
  { name: "Cycle", description: "Durée moyenne du cycle de vente" },
  { name: "NRR", description: "Net Revenue Retention" },
  { name: "Churn", description: "Taux d'attrition client" },
  { name: "Pipeline", description: "Ratio pipeline / quota" },
];

const qualityGates = [
  "Phase 1 - Market Study : seuil de confiance ≥ 85% (retry x3 → fallback sources)",
  "Phase 2 - Audits : seuil 80% avec questions complémentaires si nécessaire",
  "Phase 3 - Analyses : seuil 85% avec validation expert virtuel",
  "Phase 4 - Synthèse : seuil 95% (blocage → révision complète)",
  "Validation croisée : minimum 2 sources indépendantes pour chaque affirmation",
];

export default function MarketingAuditMethodologie() {
  const seo = buildSEO({
    title: "Méthodologie d'audit – IMOTION",
    description: "Collecte, scoring, analyse, restitution : notre méthodologie d'audit propulsée par MANUS IA 2.0 avec 17 agents spécialisés.",
    url: "/marketing/audit-methodologie",
  });

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
      </Helmet>

      <main className="container py-20 md:py-24">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Méthodologie d'<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">audit IMOTION</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Propulsée par <strong>MANUS IA 2.0</strong>, notre méthodologie combine expertise humaine et IA
            pour des audits marketing & commerciaux d'une précision chirurgicale.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-6 py-3 bg-muted rounded-full text-sm font-semibold">
            <Brain className="w-4 h-4 text-primary" /> 17 agents IA
            <span className="opacity-30">•</span>
            <Zap className="w-4 h-4 text-primary" /> Zéro hallucination
            <span className="opacity-30">•</span>
            <Target className="w-4 h-4 text-primary" /> Livré sous 2 semaines
          </div>
        </div>

        {/* Objectif */}
        <Card className="p-6 mb-12 border-l-4 border-l-primary bg-primary/5">
          <h2 className="text-xl font-bold mb-2 text-primary">🎯 Objectif</h2>
          <p>
            Établir une photographie exploitable sous <strong>2 semaines</strong>, avec recommandations
            actionnables à <strong>90 jours</strong> et un plan stratégique sur <strong>12-24 mois</strong>.
          </p>
        </Card>

        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">Les 6 étapes de notre méthodologie</h2>
          <div className="space-y-5">
            {methodologySteps.map((s, i) => (
              <Card key={s.title} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <h3 className="text-xl font-bold">{i + 1}. {s.title}</h3>
                      <Badge variant="outline">{s.duration}</Badge>
                    </div>
                    <p className="mb-3 text-muted-foreground">{s.description}</p>
                    <p className="text-sm mb-3">
                      <span className="font-semibold text-primary">Livrable : </span>
                      <span className="text-muted-foreground">{s.deliverable}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {s.agents.map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">📊 KPIs évalués</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <Card key={k.name} className="p-4">
                <h3 className="font-bold mb-1 text-primary">{k.name}</h3>
                <p className="text-sm text-muted-foreground">{k.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Quality gates */}
        <Card className="p-6 mb-16">
          <h2 className="text-2xl font-bold mb-4 text-primary">🛡️ Quality gates & anti-hallucination</h2>
          <div className="space-y-3">
            {qualityGates.map((g) => (
              <div key={g} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p>{g}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" variant="flame">
            <Link to="/marketing/audit-gratuit">Demander un audit gratuit</Link>
          </Button>
        </div>
      </main>
    </>
  );
}
