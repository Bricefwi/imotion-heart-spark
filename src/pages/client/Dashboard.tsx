import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhaseProgress } from "@/components/PhaseProgress";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "react-router-dom";
import {
  FolderKanban, FileText, Euro, MessageSquare, Clock, Plus, ArrowRight,
  FileDown, CheckCircle, Loader2, CalendarDays, TrendingUp, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

const PROJECT_MILESTONES = [
  { key: "discovery", label: "Discovery", icon: MessageSquare },
  { key: "cdc", label: "CDC", icon: FileText },
  { key: "proposal", label: "Devis", icon: Euro },
  { key: "development", label: "Développement", icon: FolderKanban },
  { key: "delivery", label: "Livraison", icon: CheckCircle },
];

function getMilestoneStatus(projectStatus: string) {
  const statusOrder = [
    "draft", "discovery_active", "discovery_paused", "discovery_completed",
    "cdc_ready", "cdc_generated",
    "proposal_sent", "proposal_accepted", "signed",
    "in_development",
    "delivered", "archived",
  ];
  const idx = statusOrder.indexOf(projectStatus);
  return {
    discovery: idx >= 1 ? (idx >= 3 ? "done" : "active") : "pending",
    cdc: idx >= 4 ? (idx >= 5 ? "done" : "active") : "pending",
    proposal: idx >= 6 ? (idx >= 8 ? "done" : "active") : "pending",
    development: idx >= 9 ? (idx >= 10 ? "done" : "active") : "pending",
    delivery: idx >= 10 ? "done" : "pending",
  } as Record<string, "done" | "active" | "pending">;
}

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  // Fetch recent conversations across all projects
  const { data: recentConversations = [] } = useQuery({
    queryKey: ["client-recent-conversations", user?.id],
    queryFn: async () => {
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("conversations")
        .select("*, project:projects!conversations_project_id_fkey(name, code, id)")
        .in("project_id", projectIds)
        .order("started_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && projects.length > 0,
  });

  // Fetch recent documents
  const { data: recentDocs = [] } = useQuery({
    queryKey: ["client-recent-docs", user?.id],
    queryFn: async () => {
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && projects.length > 0,
  });

  const activeProjects = projects.filter(
    (p) => !["draft", "archived", "delivered", "lost"].includes(p.status)
  );
  const currentProject = activeProjects[0];
  const totalMessages = projects.reduce((sum, p) => sum + (p.total_messages || 0), 0);
  const avgProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((sum, p) => sum + (p.overall_progress || 0), 0) / activeProjects.length)
    : 0;

  const typeLabels: Record<string, string> = {
    cdc: "CDC", proposal: "Devis", contract: "Contrat", pricing: "Tarifs",
    tech_recommendation: "Reco", invoice: "Facture", other: "Autre",
  };

  const handleDownloadPDF = async (doc: { id: string; name: string; storage_path: string; description: string | null }) => {
    if (downloadingId) return;
    setDownloadingId(doc.id);
    try {
      if (doc.storage_path) {
        const { data, error } = await supabase.storage.from("documents").download(doc.storage_path);
        if (error) throw error;
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.name.replace(/\s+/g, "_")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (doc.description) {
        const html2pdf = (await import("html2pdf.js")).default;
        const container = document.createElement("div");
        const sanitizedName = DOMPurify.sanitize(doc.name);
        const sanitizedDesc = DOMPurify.sanitize(doc.description ?? "");
        container.innerHTML = `<div style="font-family: Inter, sans-serif; padding: 2rem; max-width: 800px;">
          <h1 style="font-size: 1.5rem; font-weight: 700; border-bottom: 3px solid #d32f2f; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">${sanitizedName}</h1>
          <div style="font-size: 0.875rem; line-height: 1.75; color: #333; white-space: pre-wrap;">${sanitizedDesc}</div>
        </div>`;
        await (html2pdf() as unknown as { set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } } }).set({
          margin: [20, 12, 20, 12],
          filename: `${doc.name.replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        }).from(container).save();
      } else {
        toast.error("Aucun contenu disponible.");
      }
    } catch {
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setDownloadingId(null);
    }
  };

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
          <p className="text-muted-foreground mt-1">Voici un aperçu de votre espace.</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/client/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="Messages" value={totalMessages} icon={MessageSquare} />
        <StatsCard label="Documents" value={recentDocs.length > 0 ? projects.length : 0} icon={FileText} />
        <StatsCard label="Avancement" value={`${avgProgress}%`} icon={TrendingUp} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current project with phase progress */}
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
                      ? formatDistanceToNow(new Date(currentProject.last_activity_at), { addSuffix: true, locale: fr })
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
                    <MessageSquare className="mr-2 h-4 w-4" /> Continuer avec Marc
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/client/documents">
                    <FileText className="mr-2 h-3.5 w-3.5" /> Documents
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
                  Créez votre premier projet pour démarrer la conversation avec Marc.
                </p>
                <Button asChild className="gradient-primary border-0">
                  <Link to="/client/projects/new">
                    <Plus className="mr-2 h-4 w-4" /> Créer un projet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Project milestones / pipeline */}
          {currentProject && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Suivi avancement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  {PROJECT_MILESTONES.map((milestone, idx) => {
                    const statuses = getMilestoneStatus(currentProject.status);
                    const status = statuses[milestone.key];
                    const Icon = milestone.icon;
                    return (
                      <div key={milestone.key} className="flex items-center gap-2 flex-1">
                        <div className="flex flex-col items-center gap-1.5 flex-1">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                              status === "done"
                                ? "gradient-primary text-white"
                                : status === "active"
                                ? "bg-primary/15 text-primary ring-2 ring-primary/30 animate-pulse"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {status === "done" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <span className={`text-[10px] font-medium text-center ${
                            status === "done" ? "text-primary" : status === "active" ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {milestone.label}
                          </span>
                        </div>
                        {idx < PROJECT_MILESTONES.length - 1 && (
                          <div className={`h-0.5 flex-1 -mt-5 ${
                            status === "done" ? "bg-primary" : "bg-muted"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent conversations with Marc */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Conversations avec Marc</CardTitle>
                {currentProject && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/client/projects/${currentProject.id}/conversation`}>
                      Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucune conversation pour le moment.
                </p>
              ) : (
                recentConversations.slice(0, 3).map((conv) => {
                  const project = conv.project as { name?: string; code?: string; id?: string } | null;
                  return (
                    <Link
                      key={conv.id}
                      to={`/client/projects/${conv.project_id}/conversation`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{project?.name || "Projet"}</p>
                          {conv.phase_start && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              Phase {conv.phase_start}{conv.phase_end && conv.phase_end !== conv.phase_start ? `-${conv.phase_end}` : ""}
                            </Badge>
                          )}
                        </div>
                        {conv.ai_summary && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {conv.ai_summary}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          <CalendarDays className="h-3 w-3 inline mr-0.5" />
                          {conv.started_at
                            ? formatDistanceToNow(new Date(conv.started_at), { addSuffix: true, locale: fr })
                            : ""}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Documents récents with download */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Documents récents</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/client/documents">
                    Tout voir <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun document pour le moment.
                </p>
              ) : (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/client/documents/${doc.id}`} className="text-sm font-medium truncate block hover:underline">
                        {doc.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px]">
                          {typeLabels[doc.type] || doc.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">v{doc.version}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDownloadPDF(doc)}
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Security badge */}
          <Card className="border-0 shadow-sm bg-green-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Espace sécurisé</p>
                <p className="text-[11px] text-green-600">Vos données sont protégées et isolées.</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
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
                          {formatDistanceToNow(new Date(activity.created_at!), { addSuffix: true, locale: fr })}
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
    </div>
  );
}
