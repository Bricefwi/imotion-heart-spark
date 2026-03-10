import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { PhaseProgress } from "@/components/PhaseProgress";
import { Link } from "react-router-dom";
import { FolderKanban, MessageSquare, Clock, Euro, TrendingUp, ArrowRight, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const priorityColors: Record<string, string> = {
  urgent: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export default function ConsultantDashboard() {
  const { user } = useAuth();

  const { data: projects = [] } = useQuery({
    queryKey: ["consultant-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("last_activity_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ["consultant-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const activeProjects = projects.filter(
    (p) => !["archived", "delivered", "lost"].includes(p.status)
  );
  const discoveryActive = projects.filter((p) => p.status === "discovery_active");
  const totalPipeline = projects.reduce(
    (sum, p) => sum + (p.estimated_budget_max || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard Consultant</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="En conversation" value={discoveryActive.length} icon={MessageSquare} />
        <StatsCard
          label="À valider"
          value={projects.filter((p) => p.status === "review_pending" || p.status === "cdc_ready").length}
          icon={Clock}
        />
        <StatsCard
          label="Pipeline"
          value={totalPipeline > 0 ? `${(totalPipeline / 1000).toFixed(0)}k€` : "0€"}
          icon={Euro}
        />
        <StatsCard
          label="Taux conversion"
          value={
            projects.length > 0
              ? `${Math.round((projects.filter((p) => p.status === "signed").length / projects.length) * 100)}%`
              : "—"
          }
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority projects */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base">Projets prioritaires</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/consultant/projects">
                Voir tous <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun projet actif.</p>
            ) : (
              activeProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center gap-4 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/consultant/projects/${project.id}`}
                        className="font-medium text-sm truncate hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      <Badge
                        variant={priorityColors[project.priority || "medium"] as any}
                        className="text-[10px] shrink-0"
                      >
                        {project.priority || "medium"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Phase {project.current_phase || 1}/7</span>
                      {project.estimated_budget_max && (
                        <span>
                          {project.estimated_budget_min
                            ? `${project.estimated_budget_min / 1000}-${project.estimated_budget_max / 1000}k€`
                            : `${project.estimated_budget_max / 1000}k€`}
                        </span>
                      )}
                    </div>
                    <PhaseProgress
                      currentPhase={project.current_phase || 1}
                      compact
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Link to={`/consultant/projects/${project.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="font-display text-base">Activité temps réel</CardTitle>
              <CircleDot className="h-3 w-3 text-green-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                      activity.action === "message"
                        ? "bg-primary"
                        : activity.action === "project"
                        ? "bg-secondary"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-sm">{activity.description || activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at!).toLocaleDateString("fr-FR")}
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
