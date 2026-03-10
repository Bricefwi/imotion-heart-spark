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

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble du système</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Utilisateurs" value={profiles.length} icon={Users} />
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="Pipeline" value={totalPipeline > 0 ? `${(totalPipeline / 1000).toFixed(0)}k€` : "0€"} icon={Euro} />
        <StatsCard label="Messages" value={totalMessages} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base">Projets récents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/consultant/projects">Voir tous</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{project.code}</span>
                    <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {project.created_at && formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité.</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-1">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm">{activity.description || activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {(activity.profile as any)?.full_name || "Système"} · {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
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
