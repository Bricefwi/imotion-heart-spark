/**
 * Marketing — Méthodologie ROI (rapatrié depuis lovelib).
 * Explique le calcul du ROI, hypothèses et bornes (optimiste/médiane/prudente).
 */
import { Helmet } from "react-helmet";
import { ChartBlock } from "@/components/marketing/ChartBlock";
import { Card } from "@/components/ui/card";
import { buildSEO } from "@/lib/marketing/seo";

const chartSpec = {
  title: "ROI cumulé sur 24 mois (exemple médian)",
  type: "line" as const,
  xKey: "mois",
  yKeys: ["roi"],
  data: [
    { mois: "M0", roi: 0 },
    { mois: "M3", roi: 40 },
    { mois: "M6", roi: 120 },
    { mois: "M12", roi: 280 },
    { mois: "M18", roi: 360 },
    { mois: "M24", roi: 450 },
  ],
};

export default function MarketingMethodologieROI() {
  const seo = buildSEO({
    title: "Méthodologie ROI – IMOTION",
    description: "Comment IMOTION calcule un ROI réaliste et mesurable, initiative par initiative, avec bornes et confidence score.",
    url: "/marketing/methodologie-roi",
  });

  return (
    <>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
      </Helmet>

      <main className="container py-20 md:py-24 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Méthodologie <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ROI</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Le ROI est calculé initiative par initiative, puis agrégé. Nous exposons les hypothèses,
          la formule et les bornes (optimiste, médiane, prudente).
        </p>

        <pre className="bg-muted p-4 rounded-lg border text-sm overflow-x-auto mb-8">
{`ROI = ((Revenus générés − Coûts) / Coûts) × 100
Où Revenus générés = Nouveaux contrats + Upsells + Récurrence conservée`}
        </pre>

        <ChartBlock {...chartSpec} />

        <Card className="mt-8 p-5 border-l-4 border-l-primary bg-secondary/5">
          <p className="text-sm">
            <strong>Conformité :</strong> toute projection cite sa source (CRM/Analytics/Benchmarks)
            et la période. Un <em>confidence_score</em> &gt; 0,85 est requis pour valider une estimation.
          </p>
        </Card>
      </main>
    </>
  );
}
