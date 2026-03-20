import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseProgress } from "@/components/PhaseProgress";
import { Link } from "react-router-dom";
import {
  Plus, ArrowRight, Clock, MessageSquare, FileText,
  FolderKanban, Filter, Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  discovery_active: { label: "En découverte", color: "gradient-primary text-primary-foreground border-0" },
  discovery_paused: { label: "En pause", color: "bg-amber-100 text-amber-700 border-0" },
  discovery_completed: { label: "Découverte terminée", color: "bg-blue-100 text-blue-700 border-0" },
  cdc_ready: { label: "CDC prêt", color: "bg-emerald-100 text-emerald-700 border-0" },
  proposal_sent: { label: "Proposition envoyée", color: "bg-violet-100 text-violet-700 border-0" },
  signed: { label: "Signé", color: "bg-emerald-100 text-emerald-700 border-0" },
};

export default function ClientProjects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client-projects-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code, slug, status, current_phase, overall_progress, phase_progress, client_id, created_at, updated_at, last_activity_at, total_messages, total_sessions, priority, tags")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: docCounts = {} } = useQuery({
    queryKey: ["client-project-doc-counts", user?.id],
    queryFn: async () => {
      const { data: projs } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", user!.id);
      if (!projs?.length) return {};
      const { data } = await supabase
        .from("documents")
        .select("id, project_id")
        .in("project_id", projs.map((p) => p.id));
      const counts: Record<string, number> = {};
      (data || []).forEach((d) => {
        counts[d.project_id] = (counts[d.project_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const filtered = projects.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} projet{projects.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Button asChild className="gradient-primary border-0 shadow-md">
          <Link to="/client/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="discovery_active">En découverte</SelectItem>
            <SelectItem value="discovery_completed">Découverte terminée</SelectItem>
            <SelectItem value="cdc_ready">CDC prêt</SelectItem>
            <SelectItem value="proposal_sent">Proposition envoyée</SelectItem>
            <SelectItem value="signed">Signé</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-28 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <FolderKanban className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">
              {search || statusFilter !== "all" ? "Aucun projet trouvé" : "Aucun projet pour le moment"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search || statusFilter !== "all"
                ? "Essayez de modifier vos filtres."
                : "Créez votre premier projet pour commencer."}
            </p>
            {!search && statusFilter === "all" && (
              <Button asChild className="gradient-primary border-0">
                <Link to="/client/projects/new">
                  <Plus className="mr-2 h-4 w-4" /> Créer mon premier projet
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((project, i) => {
            const status = statusConfig[project.status] || statusConfig.draft;
            const docs = docCounts[project.id] || 0;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      {/* Top row: name + status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors">
                              {project.name}
                            </h3>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono">{project.code}</span>
                            {project.updated_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(project.updated_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phase progress */}
                      <PhaseProgress currentPhase={project.current_phase || 1} compact />

                      {/* Bottom row: stats + actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {project.total_messages || 0} messages
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {docs} doc{docs !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/client/projects/${project.id}/conversation`}>
                              Conversation <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
