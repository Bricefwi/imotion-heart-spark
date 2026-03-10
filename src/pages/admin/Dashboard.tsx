import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, FileText, Euro, TrendingUp, Activity } from "lucide-react";

const metrics = [
  { label: "Utilisateurs", value: "234", change: "+12", icon: Users },
  { label: "Projets totaux", value: "89", change: "+5", icon: FolderKanban },
  { label: "Documents générés", value: "156", change: "+23", icon: FileText },
  { label: "Revenue mensuel", value: "12 500 €", change: "+18%", icon: Euro },
  { label: "Taux conversion", value: "68%", change: "+3%", icon: TrendingUp },
  { label: "Sessions actives", value: "42", change: "", icon: Activity },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble du système</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <metric.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                {metric.change && <span className="text-xs text-green-600 font-medium">{metric.change}</span>}
              </div>
              <p className="font-display text-2xl font-bold">{metric.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
