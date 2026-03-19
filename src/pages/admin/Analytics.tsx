import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/StatsCard";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, FolderKanban, Euro, TrendingUp, Target, MessageSquare, FileText, Clock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon", discovery: "Découverte", discovery_active: "Découverte",
  review_pending: "En revue", cdc_ready: "CDC prêt", proposal: "Proposition",
  negotiation: "Négociation", signed: "Signé", in_progress: "En cours",
  delivered: "Livré", completed: "Terminé", cancelled: "Annulé", lost: "Perdu",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(220,10%,60%)", discovery: "hsl(30,100%,49%)", discovery_active: "hsl(30,100%,49%)",
  review_pending: "hsl(45,100%,50%)", cdc_ready: "hsl(200,80%,50%)", proposal: "hsl(200,80%,50%)",
  negotiation: "hsl(280,60%,55%)", signed: "hsl(145,63%,42%)", in_progress: "hsl(200,80%,50%)",
  delivered: "hsl(145,63%,42%)", completed: "hsl(0,68%,51%)", cancelled: "hsl(0,0%,70%)", lost: "hsl(0,68%,51%)",
};

export default function AdminAnalytics() {
  const { user } = useAuth();

  const { data: profiles = [] } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["analytics-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, created_at, proposal_amount, contract_amount, estimated_budget_max, current_phase, overall_progress, total_messages, total_sessions");
      return data || [];
    },
    enabled: !!user,
  });

  // ── KPIs ──
  const totalClients = profiles.length;
  const totalProjects = projects.length;
  const signedProjects = projects.filter((p) => ["signed", "completed", "delivered"].includes(p.status));
  const conversionRate = totalProjects > 0 ? Math.round((signedProjects.length / totalProjects) * 100) : 0;
  const pipelineValue = projects.reduce((s, p) => s + (p.proposal_amount || p.estimated_budget_max || 0), 0);
  const contractValue = signedProjects.reduce((s, p) => s + (p.contract_amount || p.proposal_amount || 0), 0);
  const avgMessages = totalProjects > 0 ? Math.round(projects.reduce((s, p) => s + (p.total_messages || 0), 0) / totalProjects) : 0;
  const avgProgress = totalProjects > 0 ? Math.round(projects.reduce((s, p) => s + (p.overall_progress || 0), 0) / totalProjects) : 0;

  // ── Charts data ──
  const monthlyProjects = (() => {
    const now = new Date();
    const months: { key: string; label: string; projets: number; clients: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      months.push({ key, label, projets: 0, clients: 0 });
    }
    projects.forEach((p) => {
      const key = `${new Date(p.created_at!).getFullYear()}-${String(new Date(p.created_at!).getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((m) => m.key === key);
      if (m) m.projets++;
    });
    profiles.forEach((p) => {
      const key = `${new Date(p.created_at!).getFullYear()}-${String(new Date(p.created_at!).getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((m) => m.key === key);
      if (m) m.clients++;
    });
    return months;
  })();

  const pipelineDistribution = (() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || "hsl(0,0%,70%)",
    }));
  })();

  const funnelData = (() => {
    const stages = ["draft", "discovery", "proposal", "negotiation", "signed", "completed"];
    return stages.map((stage) => ({
      name: STATUS_LABELS[stage],
      count: projects.filter((p) => stages.indexOf(p.status) >= stages.indexOf(stage)).length,
    }));
  })();

  const revenueData = (() => {
    const now = new Date();
    const months: { label: string; pipeline: number; signé: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      const monthProjects = projects.filter((p) => {
        const pk = `${new Date(p.created_at!).getFullYear()}-${String(new Date(p.created_at!).getMonth() + 1).padStart(2, "0")}`;
        return pk === key;
      });
      months.push({
        label,
        pipeline: monthProjects.reduce((s, p) => s + (p.proposal_amount || p.estimated_budget_max || 0), 0) / 1000,
        signé: monthProjects.filter((p) => ["signed", "completed"].includes(p.status)).reduce((s, p) => s + (p.contract_amount || p.proposal_amount || 0), 0) / 1000,
      });
    }
    return months;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Analytiques</h1>
        <p className="text-muted-foreground text-sm mt-1">Performances et indicateurs clés</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Clients total" value={totalClients} icon={Users} />
        <StatsCard label="Taux conversion" value={`${conversionRate}%`} icon={Target} />
        <StatsCard label="Pipeline total" value={pipelineValue > 0 ? `${(pipelineValue / 1000).toFixed(0)}k€` : "0€"} icon={TrendingUp} />
        <StatsCard label="CA signé" value={contractValue > 0 ? `${(contractValue / 1000).toFixed(0)}k€` : "0€"} icon={Euro} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Projets total" value={totalProjects} icon={FolderKanban} />
        <StatsCard label="Msg / projet" value={avgMessages} icon={MessageSquare} />
        <StatsCard label="Progression moy." value={`${avgProgress}%`} icon={Clock} />
        <StatsCard label="Projets signés" value={signedProjects.length} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Activité mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyProjects}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="projets" name="Projets" fill="hsl(0,68%,51%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="clients" name="Nouveaux clients" fill="hsl(30,100%,49%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Répartition pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pipelineDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {pipelineDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Revenus (k€)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="pipeline" name="Pipeline" stroke="hsl(30,100%,49%)" fill="hsl(30,100%,49%)" fillOpacity={0.1} />
                <Area type="monotone" dataKey="signé" name="Signé" stroke="hsl(145,63%,42%)" fill="hsl(145,63%,42%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion funnel */}
        <Card className="border-0 shadow-sm">
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
                <Bar dataKey="count" name="Projets" fill="hsl(0,68%,51%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
