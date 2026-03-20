import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { Users, FolderKanban, FileText, Euro, TrendingUp, Activity, MessageSquare, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Activity as ActivityType } from "@/types/admin";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, created_at").limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*, profile:profiles!activities_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const activeProjects = projects.filter(p => !["archived", "delivered", "lost"].includes(p.status));
  const signedProjects = projects.filter(p => p.status === "signed");
  const totalPipeline = projects.reduce((sum, p) => sum + (p.estimated_budget_max || 0), 0);
  const totalMessages = projects.reduce((sum, p) => sum + (p.total_messages || 0), 0);

  const statusColors: Record<string, string> = {
    draft: "muted",
    discovery_active: "info",
    discovery_completed: "info",
    cdc_ready: "warning",
    cdc_generated: "warning",
    proposal_sent: "warning",
    proposal_accepted: "success",
    signed: "success",
    in_development: "default",
    delivered: "success",
    archived: "muted",
  };

  return (
    <div className="space-y-8">
      {/* Hero header with gradient glow */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Administration</h1>
          <p className="text-white/60 mt-2 text-sm max-w-md">Vue d'ensemble du système et pilotage de la plateforme.</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Utilisateurs" value={profiles.length} icon={Users} />
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="Pipeline" value={totalPipeline > 0 ? `${(totalPipeline / 1000).toFixed(0)}k€` : "0€"} icon={Euro} />
        <StatsCard label="Messages" value={totalMessages} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
              </div>
              Projets récents
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/consultant/projects">Voir tous</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {projects.slice(0, 5).map((project, i) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <span className="text-xs font-bold text-primary">{project.name?.charAt(0) || "P"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground font-mono">{project.code}</span>
                      <Badge
                        variant={(statusColors[project.status] as "default" | "success" | "warning" | "info" | "muted" | "destructive") || "outline"}
                        className="text-[10px] h-5"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-2">
                  {project.created_at && formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-blue-500" />
              </div>
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune activité.</p>
            ) : (
              recentActivities.map((activity, i) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-200"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="relative mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{activity.description || activity.action}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      <span className="font-medium text-muted-foreground/80">{(activity as unknown as ActivityType).profile?.full_name || "Système"}</span>
                      {" · "}
                      {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
