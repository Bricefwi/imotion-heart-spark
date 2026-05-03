import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, TrendingUp, Shield, Zap, CheckCircle2, ArrowRight,
  Users, BarChart3, Rocket, Target, Award,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

const steps = [
  { n: 1, icon: Users, title: "Inscrivez-vous", desc: "Créez votre compte en 30 secondes. Confirmez votre email et identifiez votre entreprise avec votre SIRET.", points: ["Validation SIRET automatique", "Données légales pré-remplies", "Score de confiance calculé"] },
  { n: 2, icon: Sparkles, title: "Lancez l'audit", desc: "Saisissez l'URL de votre site. Nos 17 agents IA analysent votre entreprise en profondeur.", points: ["3 audits gratuits inclus", "Analyse multi-sources (web, social, presse)", "Suivi temps réel de la progression"] },
  { n: 3, icon: BarChart3, title: "Recevez le rapport", desc: "Consultez votre rapport ultra-détaillé par email. Téléchargez-le en PDF et passez à l'action.", points: ["Rapport de 50+ pages", "4 scénarios chiffrés avec ROI", "Plan d'action prioritaire"] },
];

const deliverables = [
  { icon: Target, title: "Analyse de marché approfondie", desc: "PESTEL, Porter, SWOT, benchmark concurrentiel 2025, opportunités sectorielles identifiées par nos agents spécialisés." },
  { icon: TrendingUp, title: "Stratégie digitale personnalisée", desc: "Recommandations SEO/SEA, stratégie de contenu, plan d'acquisition client adapté à votre secteur." },
  { icon: Zap, title: "4 scénarios chiffrés", desc: "Ambitieux, raisonné, opportuniste, mix — chacun avec budget détaillé, timeline, ROI projeté et KPIs de suivi." },
  { icon: Award, title: "Plan d'action prioritaire", desc: "Quick wins identifiés, roadmap détaillée, recommandations d'outils et de partenaires." },
];

export default function MarketingMethode() {
  const navigate = useNavigate();
  return (
    <>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/10">
        <section className="container py-20 md:py-28 text-center max-w-5xl">
          <Badge className="mb-6 px-5 py-1.5"><Sparkles className="mr-2 h-4 w-4" />Comment ça marche ?</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Votre audit digital en <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">3 étapes simples</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Découvrez comment notre intelligence artificielle analyse votre entreprise et génère
            un rapport ultra-détaillé pour booster votre transformation digitale.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" variant="flame" onClick={() => navigate("/register?next=/marketing/audit-gratuit")}>
              <Rocket className="mr-2 h-5 w-5" /> Démarrer gratuitement
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/marketing/audit-gratuit")}>
              Voir un exemple <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* 3 étapes */}
        <section className="container py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">Le processus</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <Card key={s.n} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary" />
                <CardContent className="pt-12 pb-8">
                  <div className="mb-6 relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center mx-auto">
                      <s.icon className="h-9 w-9 text-primary" />
                    </div>
                    <Badge className="absolute -top-1 -right-1 text-base font-bold px-3 py-1">{s.n}</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center">{s.title}</h3>
                  <p className="text-muted-foreground text-center mb-5">{s.desc}</p>
                  <ul className="space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Livrables */}
        <section className="container py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ce que vous obtenez</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Un rapport complet généré par 17 agents IA spécialisés, orchestrés par notre système MANUS IA 2.0.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {deliverables.map((d) => (
              <Card key={d.title} className="p-6 hover:border-primary/40 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center flex-shrink-0">
                    <d.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{d.title}</h3>
                    <p className="text-muted-foreground">{d.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Sécurité */}
        <section className="container py-16 md:py-20">
          <div className="text-center mb-10">
            <Badge className="mb-4"><Shield className="mr-2 h-4 w-4" />Sécurité & confiance</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Vos données en sécurité</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Validation d'entreprise (SIRET), anti-abus, et conformité RGPD.
            </p>
          </div>
        </section>

        {/* CTA Final */}
        <section className="container py-20 text-center">
          <Card className="p-10 md:p-14 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à booster votre stratégie ?</h2>
            <p className="text-lg text-muted-foreground mb-8">Démarrez votre audit gratuit dès maintenant.</p>
            <Button size="lg" variant="flame" onClick={() => navigate("/register?next=/marketing/audit-gratuit")}>
              <Rocket className="mr-2 h-5 w-5" /> Démarrer mon audit gratuit
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}
