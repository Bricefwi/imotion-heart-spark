import { Card } from "@/components/ui/card";
import { Target, FileText, TrendingUp } from "lucide-react";

export default function MarketingDashboard() {
  return (
    <div className="container py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon espace marketing</h1>
        <p className="text-muted-foreground">Audits, stratégies et plans d'action issus de lovelib.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6"><Target className="h-6 w-6 text-primary mb-3" /><h3 className="font-semibold">Mes audits marketing</h3><p className="text-sm text-muted-foreground mt-1">Aucun audit pour le moment.</p></Card>
        <Card className="p-6"><FileText className="h-6 w-6 text-primary mb-3" /><h3 className="font-semibold">Plans stratégiques</h3><p className="text-sm text-muted-foreground mt-1">À venir après l'audit.</p></Card>
        <Card className="p-6"><TrendingUp className="h-6 w-6 text-primary mb-3" /><h3 className="font-semibold">Veille IA</h3><p className="text-sm text-muted-foreground mt-1">Module en migration.</p></Card>
      </div>
    </div>
  );
}
