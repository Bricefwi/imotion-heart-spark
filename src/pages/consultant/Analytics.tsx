import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, FolderKanban, Euro, Target } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(220, 10%, 60%)",
  discovery: "hsl(30, 100%, 49%)",
  proposal: "hsl(200, 80%, 50%)",
  negotiation: "hsl(280, 60%, 55%)",
  signed: "hsl(145, 63%, 42%)",
  completed: "hsl(0, 68%, 51%)",
  cancelled: "hsl(0, 0%, 70%)",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  discovery: "Découverte",
  proposal: "Proposition",
  negotiation: "Négociation",
  signed: "Signé",
  completed: "Terminé",
  cancelled: "Annulé",
};

export default function ConsultantAnalytics() {
  const { data: projects = [] } = useQuery({
    queryKey: ["consultant-analytics-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, created_at, proposal_amount, contract_amount, current_phase, overall_progress");
      if (error) throw error;
      return data;
    },
  });

  // --- Projects by month (last 12 months) ---
  const monthlyData = (() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      months.push({ key, label, count: 0 });
    }
    projects.forEach((p) => {
      const d = new Date(p.created_at!);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((m) => m.key === key);
      if (m) m.count++;
    });
    return months;
  })();

  // --- Pipeline by status ---
  const pipelineData = (() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || "hsl(0,0%,70%)",
    }));
  })();

  // --- Conversion funnel ---
  const funnelData = (() => {
    const stages = ["draft", "discovery", "proposal", "negotiation", "signed", "completed"];
    return stages.map((stage) => ({
      name: STATUS_LABELS[stage] || stage,
      count: projects.filter((p) => {
        const idx = stages.indexOf(p.status);
        return idx >= stages.indexOf(stage);
      }).length,
    }));
  })();

  // --- KPIs ---
  const totalProjects = projects.length;
  const signedProjects = projects.filter((p) => ["signed", "completed"].includes(p.status)).length;
  const conversionRate = totalProjects > 0 ? Math.round((signedProjects / totalProjects) * 100) : 0;
  const pipelineValue = projects.reduce((sum, p) => sum + (p.proposal_amount || 0), 0);
  const contractValue = projects.reduce((sum, p) => sum + (p.contract_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de l'activité et des performances.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total projets" value={totalProjects} icon={FolderKanban} />
        <StatsCard label="Taux de conversion" value={`${conversionRate}%`} icon={Target} />
        <StatsCard label="Pipeline" value={`${(pipelineValue / 1000).toFixed(0)}k€`} icon={TrendingUp} />
        <StatsCard label="Contrats signés" value={`${(contractValue / 1000).toFixed(0)}k€`} icon={Euro} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by month */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Projets par mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Projets" fill="hsl(0,68%,51%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Répartition du pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {pipelineData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Tunnel de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Projets" fill="hsl(30,100%,49%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
