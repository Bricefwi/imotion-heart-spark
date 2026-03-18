import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Star, Eye, MessageSquare, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { PhaseProgress } from "@/components/PhaseProgress";
import type { Profile } from "@/types/admin";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const priorityVariants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  urgent: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export default function ConsultantProjects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["consultant-all-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:profiles!projects_client_id_fkey(full_name, company_name, email)")
        .order("last_activity_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const client = p.client as Profile | undefined;
    const searchLower = search.toLowerCase();
    if (search && 
      !p.name.toLowerCase().includes(searchLower) && 
      !(client?.full_name || "").toLowerCase().includes(searchLower) &&
      !(client?.company_name || "").toLowerCase().includes(searchLower) &&
      !(p.code || "").toLowerCase().includes(searchLower)
    ) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Tous les projets ({projects.length})</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, client, code..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="discovery_active">En découverte</SelectItem>
            <SelectItem value="discovery_paused">En pause</SelectItem>
            <SelectItem value="discovery_completed">Découverte terminée</SelectItem>
            <SelectItem value="cdc_draft">CDC en cours</SelectItem>
            <SelectItem value="cdc_ready">CDC prêt</SelectItem>
            <SelectItem value="proposal_sent">Proposition envoyée</SelectItem>
            <SelectItem value="signed">Signé</SelectItem>
            <SelectItem value="lost">Perdu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            {search || statusFilter !== "all" ? "Aucun projet ne correspond aux filtres." : "Aucun projet."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((project) => {
            const client = project.client as Profile | undefined;
            return (
              <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/consultant/projects/${project.id}`} className="font-display font-semibold hover:text-primary transition-colors truncate">
                          {project.name}
                        </Link>
                        <Badge variant={priorityVariants[project.priority || "medium"]} className="text-[10px]">
                          {project.priority || "medium"}
                        </Badge>
                        {project.qualification_score && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className={`h-3 w-3 ${i <= project.qualification_score! ? "fill-secondary text-secondary" : "text-muted"}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>{client?.full_name || "Client inconnu"}</span>
                        {client?.company_name && <span>{client.company_name}</span>}
                        <span>{project.code}</span>
                        <span>Phase {project.current_phase || 1}/7</span>
                        {project.estimated_budget_max && (
                          <span>
                            {project.estimated_budget_min
                              ? `${(project.estimated_budget_min / 1000).toFixed(0)}-${(project.estimated_budget_max / 1000).toFixed(0)}k€`
                              : `${(project.estimated_budget_max / 1000).toFixed(0)}k€`}
                          </span>
                        )}
                        {project.last_activity_at && (
                          <span>{formatDistanceToNow(new Date(project.last_activity_at), { addSuffix: true, locale: fr })}</span>
                        )}
                      </div>
                      {project.tags && (project.tags as string[]).length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {(project.tags as string[]).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <PhaseProgress currentPhase={project.current_phase || 1} compact />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/consultant/projects/${project.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                        </Link>
                      </Button>
                    </div>
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
