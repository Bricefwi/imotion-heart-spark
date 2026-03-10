import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhaseProgress } from "@/components/PhaseProgress";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "react-router-dom";
import { FolderKanban, FileText, Euro, MessageSquare, Clock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ClientDashboard() {
  const { user, profile } = useAuth();

  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user!.id)
        .order("last_activity_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ["client-activities", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const activeProjects = projects.filter(
    (p) => !["draft", "archived", "delivered", "lost"].includes(p.status)
  );
  const currentProject = activeProjects[0];

  const activityIcons: Record<string, typeof MessageSquare> = {
    message: MessageSquare,
    document: FileText,
    project: FolderKanban,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Bonjour {profile?.full_name?.split(" ")[0] || ""}
          </h1>
          <p className="text-muted-foreground mt-1">Voici un aperçu de vos projets.</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/client/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="Total projets" value={projects.length} icon={FileText} />
        <StatsCard label="Messages échangés" value={projects.reduce((sum, p) => sum + (p.total_messages || 0), 0)} icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current project */}
        <div className="lg:col-span-2">
          {currentProject ? (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="gradient-primary border-0 text-[11px]">En cours</Badge>
                  <span className="text-xs text-muted-foreground">{currentProject.code}</span>
                </div>
                <CardTitle className="font-display text-xl">{currentProject.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhaseProgress
                  currentPhase={currentProject.current_phase || 1}
                  phaseProgress={0}
                  compact
                />
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {currentProject.last_activity_at
                      ? new Date(currentProject.last_activity_at).toLocaleDateString("fr-FR")
                      : "Pas encore d'activité"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {currentProject.total_messages || 0} messages
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-3 pt-0">
                <Button asChild className="gradient-primary border-0">
                  <Link to={`/client/projects/${currentProject.id}/conversation`}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Continuer la conversation
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">Aucun projet en cours</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Créez votre premier projet pour démarrer la conversation avec notre IA.
                </p>
                <Button asChild className="gradient-primary border-0">
                  <Link to="/client/projects/new">
                    <Plus className="mr-2 h-4 w-4" /> Créer un projet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            ) : (
              recentActivities.map((activity) => {
                const Icon = activityIcons[activity.action] || MessageSquare;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.description || activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at!).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
