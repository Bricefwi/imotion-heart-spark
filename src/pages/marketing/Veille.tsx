import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Brain, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function MarketingVeille() {
  return (
    <>

      <main className="container py-20 md:py-28">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5 text-sm font-semibold text-primary">
            <Brain className="w-4 h-4" /> Veille hebdomadaire
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Veille <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">IA & marketing</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Notre IA Marc surveille les tendances, outils et cas d'usage IA appliqués au marketing,
            et publie chaque semaine une synthèse actionnable.
          </p>
        </div>

        <Card className="p-12 text-center max-w-3xl mx-auto bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Module en migration</h2>
          <p className="text-muted-foreground mb-6">
            Le moteur de veille IA est en cours de rapatriement depuis lovelib (tables&nbsp;
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">mkt_ai_news_reports</code> + edge function&nbsp;
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">mkt-veille-ia</code>).
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild variant="flame">
              <Link to="/marketing/audit-gratuit">Démarrer un audit <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/marketing">Retour accueil</Link>
            </Button>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-5 mt-12 max-w-5xl mx-auto">
          {[
            { icon: Brain, title: "Tendances IA", desc: "Modèles et frameworks émergents pour le marketing." },
            { icon: TrendingUp, title: "Cas d'usage", desc: "Comment des marques tirent profit de l'IA générative." },
            { icon: Sparkles, title: "Outils & prompts", desc: "Templates et scripts prêts à brancher dans vos workflows." },
          ].map((c) => (
            <Card key={c.title} className="p-6 text-center hover:border-primary/40 transition-all">
              <c.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
