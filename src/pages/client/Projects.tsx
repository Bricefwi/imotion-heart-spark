import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhaseProgress } from "@/components/PhaseProgress";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  discovery_active: { label: "En découverte", variant: "default" },
  discovery_paused: { label: "En pause", variant: "secondary" },
  discovery_completed: { label: "Découverte terminée", variant: "secondary" },
  cdc_ready: { label: "CDC prêt", variant: "secondary" },
  proposal_sent: { label: "Proposition envoyée", variant: "default" },
  signed: { label: "Signé", variant: "default" },
};

export default function ClientProjects() {
  const { user } = useAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client-projects-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} projets</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/client/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-5 h-24" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Aucun projet pour le moment.</p>
            <Button asChild className="gradient-primary border-0">
              <Link to="/client/projects/new">
                <Plus className="mr-2 h-4 w-4" /> Créer mon premier projet
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const status = statusLabels[project.status] || statusLabels.draft;
            return (
              <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-semibold text-lg">{project.name}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{project.code}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {project.updated_at
                            ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: fr })
                            : ""}
                        </span>
                      </div>
                      <PhaseProgress
                        currentPhase={project.current_phase || 1}
                        compact
                      />
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/client/projects/${project.id}/conversation`}>
                        Ouvrir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
