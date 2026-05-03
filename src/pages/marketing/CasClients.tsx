import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Users, Zap, BarChart3, Rocket } from "lucide-react";
import { BRAND } from "@/lib/brand";

const solutions = [
  { icon: Target, title: "Audit stratégique", description: "Analyse complète de votre positionnement marché, canaux d'acquisition et opportunités de croissance.", features: ["Analyse concurrentielle", "Cartographie des canaux", "Recommandations actionnables"] },
  { icon: TrendingUp, title: "Pilotage commercial", description: "Optimisation des cycles de vente, prévisions précises et stratégies de fidélisation client.", features: ["Optimisation du tunnel de vente", "Prévisions de revenus", "Score de qualification leads"] },
  { icon: Users, title: "Campagnes multi-canales", description: "Gestion et mesure de performance sur l'ensemble de vos canaux d'acquisition digitale.", features: ["Attribution multi-touch", "ROI par canal", "Optimisation budget"] },
  { icon: Zap, title: "Automatisation marketing", description: "Mise en place de workflows automatisés pour gagner en efficacité et en personnalisation.", features: ["Email marketing automatisé", "Lead nurturing", "Segmentation dynamique"] },
  { icon: BarChart3, title: "Analytics & reporting", description: "Tableaux de bord personnalisés et rapports d'analyse pour piloter vos décisions.", features: ["Dashboards temps réel", "KPIs personnalisés", "Alertes intelligentes"] },
  { icon: Rocket, title: "Accompagnement IA", description: "Intégration d'outils d'IA pour décupler vos performances commerciales et marketing.", features: ["Prédictions de churn", "Recommandations produits", "Optimisation prix"] },
];

export default function MarketingCasClients() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Solutions & cas clients — IMOTION Marketing</title>
        <meta name="description" content="Découvrez les solutions IMOTION pour optimiser votre marketing et votre commercial : audit stratégique, pilotage, campagnes multi-canales, automatisation, analytics, accompagnement IA." />
        <link rel="canonical" href={`${BRAND.appUrl}/marketing/cas-clients`} />
      </Helmet>

      <main className="container py-20 md:py-28">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Nos <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">solutions marketing</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            IMOTION optimise vos performances à travers des stratégies data-driven, des outils
            d'analyse avancés et un accompagnement sur mesure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((s) => (
            <Card key={s.title} className="border-2 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-xl flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-20 p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <h2 className="text-3xl font-bold mb-3">Prêt à transformer vos opérations ?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Demandez un audit gratuit pour identifier vos opportunités de croissance.
          </p>
          <Button size="lg" variant="flame" onClick={() => navigate("/marketing/audit-gratuit")}>
            Demander un audit gratuit
          </Button>
        </Card>
      </main>
    </>
  );
}
