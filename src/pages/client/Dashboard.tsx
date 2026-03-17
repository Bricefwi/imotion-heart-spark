import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhaseProgress } from "@/components/PhaseProgress";
import { StatsCard } from "@/components/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  FolderKanban, FileText, MessageSquare, Clock, Plus,
  ArrowRight, CheckCircle, AlertCircle, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  discovery_active: "gradient-primary text-primary-foreground border-0",
  discovery_paused: "bg-amber-100 text-amber-700",
  discovery_completed: "bg-blue-100 text-blue-700",
  cdc_ready: "bg-emerald-100 text-emerald-700",
  proposal_sent: "bg-violet-100 text-violet-700",
  signed: "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  discovery_active: "En découverte",
  discovery_paused: "En pause",
  discovery_completed: "Découverte terminée",
  cdc_ready: "CDC prêt",
  proposal_sent: "Proposition envoyée",
  signed: "Signé",
};

export default function ClientDashboard() {
  const { user, profile } = useAuth();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
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

  const { data: documents = [] } = useQuery({
    queryKey: ["client-docs-count", user?.id],
    queryFn: async () => {
      const { data: projs } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", user!.id);
      if (!projs?.length) return [];
      const { data } = await supabase
        .from("documents")
        .select("id, status, requires_signature, signed_at")
        .in("project_id", projs.map((p) => p.id));
      return data || [];
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
        .limit(6);
      return data || [];
    },
    enabled: !!user,
  });

  const activeProjects = projects.filter(
    (p) => !["draft", "archived", "delivered", "lost"].includes(p.status)
  );
  const currentProject = activeProjects[0];
  const otherProjects = projects.filter((p) => p.id !== currentProject?.id);
  const totalMessages = projects.reduce((sum, p) => sum + (p.total_messages || 0), 0);
  const pendingSignatures = documents.filter((d) => d.requires_signature && !d.signed_at).length;

  const activityIcons: Record<string, typeof MessageSquare> = {
    message: MessageSquare,
    document: FileText,
    project: FolderKanban,
  };

  const firstName = profile?.full_name?.split(" ")[0] || "";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Bonjour {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici un aperçu de vos projets et documents.
          </p>
        </div>
        <Button asChild className="gradient-primary border-0 shadow-md">
          <Link to="/client/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      {loadingProjects ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            label="Projets actifs"
            value={activeProjects.length}
            icon={FolderKanban}
            className="border-0"
          />
          <StatsCard
            label="Messages échangés"
            value={totalMessages}
            icon={MessageSquare}
            className="border-0"
          />
          <StatsCard
            label="Documents"
            value={documents.length}
            icon={FileText}
            className="border-0"
          />
          <StatsCard
            label="Signatures en attente"
            value={pendingSignatures}
            icon={AlertCircle}
            change={pendingSignatures > 0 ? "Action requise" : undefined}
            changeType={pendingSignatures > 0 ? "down" : "neutral"}
            className="border-0"
          />
        </div>
      )}

      {/* Main content: current project + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current project - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {loadingProjects ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : currentProject ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="h-1 gradient-primary" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[currentProject.status] || "bg-muted"}>
                        {statusLabels[currentProject.status] || currentProject.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {currentProject.code}
                      </span>
                    </div>
                    {currentProject.last_activity_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(currentProject.last_activity_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    )}
                  </div>
                  <CardTitle className="font-display text-xl mt-2">
                    {currentProject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Phase progress - full version */}
                  <PhaseProgress
                    currentPhase={currentProject.current_phase || 1}
                    phaseProgress={0}
                  />

                  {/* Quick stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {currentProject.total_messages || 0} messages
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="h-4 w-4" />
                      {currentProject.total_sessions || 0} sessions
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="gradient-primary border-0">
                      <Link to={`/client/projects/${currentProject.id}/conversation`}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Continuer avec Marc
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/client/documents">
                        <FileText className="mr-2 h-4 w-4" /> Voir les documents
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10 text-center">
                <FolderKanban className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">
                  Aucun projet en cours
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  Lancez votre premier projet pour démarrer une conversation avec Marc, notre IA spécialisée en découverte de projets digitaux.
                </p>
                <Button asChild className="gradient-primary border-0">
                  <Link to="/client/projects/new">
                    <Plus className="mr-2 h-4 w-4" /> Créer un projet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Other projects */}
          {otherProjects.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">Autres projets</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/client/projects" className="text-xs">
                      Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {otherProjects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    to={`/client/projects/${project.id}/conversation`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {statusLabels[project.status] || project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Phase {project.current_phase || 1}/7
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity sidebar */}
        <div className="space-y-6">
          {/* Pending actions */}
          {pendingSignatures > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        {pendingSignatures} document{pendingSignatures > 1 ? "s" : ""} à signer
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Des documents nécessitent votre signature
                      </p>
                      <Button variant="link" size="sm" asChild className="px-0 h-auto mt-1">
                        <Link to="/client/documents">Voir les documents →</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recent activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucune activité récente.
                </p>
              ) : (
                <div className="space-y-1">
                  {recentActivities.map((activity, i) => {
                    const Icon = activityIcons[activity.action] || MessageSquare;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm leading-snug">
                            {activity.description || activity.action}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {activity.created_at &&
                              formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
