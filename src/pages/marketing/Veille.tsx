/**
 * Marketing — Veille IA quotidienne (rapatrié depuis lovelib `VeilleIA.tsx`).
 *
 * MOCK : la table `mkt_ai_news_reports` n'est pas encore migrée et l'edge fn
 * `mkt-collect-ai-news` non plus. On affiche des rapports statiques pour démo.
 */
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, TrendingUp, Lightbulb, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildSEO } from "@/lib/marketing/seo";

interface NewsItem {
  title: string;
  category: string;
  importance: "high" | "medium" | "low";
  summary: string;
  source: string;
  key_takeaways: string[];
  impact: string;
}

interface AINewsReport {
  id: string;
  date: string;
  summary: string;
  top_news: NewsItem[];
  trends: string[];
  recommendations: string[];
}

const MOCK_REPORTS: AINewsReport[] = [
  {
    id: "r1",
    date: "2026-05-02",
    summary: "Semaine marquée par l'arrivée de Gemini 3 Pro et la baisse des prix Anthropic Claude Opus 4.5.",
    top_news: [
      {
        title: "Google annonce Gemini 3 Pro avec contexte 2M tokens",
        category: "Modèles",
        importance: "high",
        source: "Google Blog",
        summary: "Le nouveau modèle multimodal supporte 2M tokens et améliore le raisonnement de 23% sur GPQA.",
        key_takeaways: ["Contexte 2M tokens", "+23% GPQA", "Disponible sur Vertex AI dès lundi"],
        impact: "Pertinent pour nos audits longs (>500 pages de scraping).",
      },
      {
        title: "Anthropic baisse Claude Opus 4.5 de 40%",
        category: "Business",
        importance: "high",
        source: "Anthropic",
        summary: "Le tarif passe à $9/$45 par million de tokens (in/out).",
        key_takeaways: ["Prix divisé par ~1,7", "Quotas API doublés"],
        impact: "Impact direct sur nos coûts d'audit Premium.",
      },
    ],
    trends: ["Convergence multimodale (texte + image + vidéo)", "Prix divisés par 2 sur 12 mois", "Open source rattrape les leaders sur les benchmarks"],
    recommendations: ["Tester Gemini 3 Pro sur la phase de scraping", "Réviser les marges des audits Pro", "Préparer une comparaison Claude vs GPT pour le Q3"],
  },
];

const CATEGORY_BADGE: Record<string, string> = {
  Modèles: "bg-primary/10 text-primary",
  Produits: "bg-secondary/10 text-secondary",
  Business: "bg-primary/10 text-primary",
  Recherche: "bg-secondary/10 text-secondary",
  Régulation: "bg-destructive/10 text-destructive",
};

const IMPORTANCE_BORDER: Record<string, string> = {
  high: "border-l-4 border-l-primary",
  medium: "border-l-4 border-l-secondary",
  low: "",
};

export default function MarketingVeille() {
  const [reports] = useState<AINewsReport[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<AINewsReport | null>(MOCK_REPORTS[0] ?? null);
  const [collecting, setCollecting] = useState(false);
  const { toast } = useToast();

  const seo = buildSEO({
    title: "Veille IA – IMOTION Marketing",
    description: "Synthèse quotidienne des actualités de l'industrie IA : modèles, produits, business, régulation. Recommandations IMOTION.",
    url: "/marketing/veille",
  });

  const handleCollect = async () => {
    setCollecting(true);
    // TODO(mkt-collect-ai-news): supabase.functions.invoke('mkt-collect-ai-news')
    setTimeout(() => {
      toast({ title: "Collecte simulée", description: "Le worker mkt-collect-ai-news n'est pas encore migré." });
      setCollecting(false);
    }, 1200);
  };

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
      </Helmet>

      <main className="container py-12 md:py-16">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              🤖 Veille <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">IA</span>
            </h1>
            <p className="text-muted-foreground">Collecte et synthèse quotidienne des actualités de l'industrie IA.</p>
          </div>
          <Button onClick={handleCollect} disabled={collecting} variant="flame" size="lg">
            {collecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {collecting ? "Collecte…" : "Collecter maintenant"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>{reports.length} rapport(s) disponible(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedReport?.id === r.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-80 line-clamp-2">{r.top_news.length} actualités</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            {selectedReport ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Rapport du {new Date(selectedReport.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </CardTitle>
                    <CardDescription className="mt-2">{selectedReport.summary}</CardDescription>
                  </CardHeader>
                </Card>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">🔥 Actualités principales</h2>
                  {selectedReport.top_news.map((item, idx) => (
                    <Card key={idx} className={IMPORTANCE_BORDER[item.importance]}>
                      <CardHeader>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={CATEGORY_BADGE[item.category] ?? "bg-muted"}>{item.category}</Badge>
                          <Badge variant="outline">
                            {item.importance === "high" ? "Haute importance" : item.importance === "medium" ? "Importance moyenne" : "Info"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{item.source}</span>
                        </div>
                        <CardTitle className="text-xl">{item.title}</CardTitle>
                        <CardDescription>{item.summary}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <p className="font-semibold mb-2">Points clés :</p>
                          <ul className="list-disc list-inside space-y-1">
                            {item.key_takeaways.map((t, i) => (
                              <li key={i} className="text-sm">{t}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                          <p className="font-semibold mb-1 text-primary">Impact IMOTION :</p>
                          <p className="text-sm">{item.impact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" /> Tendances observées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {selectedReport.trends.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-secondary" /> Recommandations IMOTION
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                      {selectedReport.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  Aucun rapport disponible.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
