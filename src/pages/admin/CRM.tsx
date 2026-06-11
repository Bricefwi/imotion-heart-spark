import { useState, type ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import type { Profile, Project, Activity as ActivityType, GeneratedDocument } from "@/types/admin";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/StatsCard";
import { ClientDetailDrawer } from "@/components/admin/ClientDetailDrawer";
import { AutomationRulesTab } from "@/components/admin/AutomationRulesTab";
import { CampaignsTab } from "@/components/admin/CampaignsTab";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Users, FolderKanban, Euro, TrendingUp, Search, Eye,
  MessageSquare, FileText, Clock, Mail, Phone, Building2, Globe,
  Activity, BarChart3, Target, Zap, Star, Megaphone, Flame, ArrowRight,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgClass: string }> = {
  draft: { label: "Brouillon", color: "hsl(220,10%,60%)", bgClass: "bg-muted text-muted-foreground" },
  discovery_active: { label: "Découverte", color: "hsl(30,100%,49%)", bgClass: "bg-secondary/10 text-secondary" },
  discovery: { label: "Découverte", color: "hsl(30,100%,49%)", bgClass: "bg-secondary/10 text-secondary" },
  review_pending: { label: "En revue", color: "hsl(45,100%,50%)", bgClass: "bg-accent/50 text-accent-foreground" },
  cdc_ready: { label: "CDC prêt", color: "hsl(200,80%,50%)", bgClass: "bg-primary/10 text-primary" },
  proposal: { label: "Proposition", color: "hsl(200,80%,50%)", bgClass: "bg-primary/10 text-primary" },
  negotiation: { label: "Négociation", color: "hsl(280,60%,55%)", bgClass: "bg-accent text-accent-foreground" },
  signed: { label: "Signé", color: "hsl(145,63%,42%)", bgClass: "bg-primary/10 text-primary" },
  in_progress: { label: "En cours", color: "hsl(200,80%,50%)", bgClass: "bg-primary/10 text-primary" },
  delivered: { label: "Livré", color: "hsl(145,63%,42%)", bgClass: "bg-primary/10 text-primary" },
  completed: { label: "Terminé", color: "hsl(145,63%,42%)", bgClass: "bg-primary/10 text-primary" },
  cancelled: { label: "Annulé", color: "hsl(0,0%,70%)", bgClass: "bg-muted text-muted-foreground" },
  lost: { label: "Perdu", color: "hsl(0,68%,51%)", bgClass: "bg-destructive/10 text-destructive" },
  archived: { label: "Archivé", color: "hsl(0,0%,70%)", bgClass: "bg-muted text-muted-foreground" },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-secondary/10 text-secondary border-secondary/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

function computeClientScore(profile: Profile, clientProjects: Project[]): number {
  let score = 0;
  if (profile?.company_name) score += 10;
  if (profile?.phone) score += 5;
  if (profile?.website) score += 5;
  if (profile?.industry) score += 5;
  if (profile?.onboarding_completed) score += 15;
  score += Math.min(clientProjects.length * 10, 30);
  const signed = clientProjects.filter((p: Project) => ["signed", "completed", "delivered"].includes(p.status));
  score += signed.length * 10;
  const totalMsgs = clientProjects.reduce((s: number, p: Project & { total_messages?: number }) => s + (p.total_messages || 0), 0);
  score += Math.min(totalMsgs, 20);
  return Math.min(score, 100);
}

const GRADE_COLORS: Record<string, string> = {
  A: "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-600))] border-[hsl(var(--imo-coral-600)/0.3)]",
  B: "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))] border-[hsl(var(--imo-amber-500)/0.3)]",
  C: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  D: "bg-muted text-muted-foreground border-border",
};

function LeadsIAPreview() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["crm-leads-preview"],
    queryFn: async () => {
      const { data } = await db
        .from("jobs_admin_view")
        .select("id, lead_grade, status, agent_phase, quality_score, cost_eur, client_name, company_name, project_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const gradeCount = ["A", "B", "C", "D"].reduce((acc, g) => {
    acc[g] = leads.filter((l) => l.lead_grade === g).length;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>;

  if (leads.length === 0) return (
    <Card className="border-border/60">
      <CardContent className="p-8 text-center text-muted-foreground">
        <Flame className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Aucun lead qualifié pour l'instant. Les diagnostics IA alimenteront ce pipeline automatiquement.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {["A", "B", "C", "D"].map((g) => (
          <div key={g} className={`rounded-xl p-3 border text-center ${GRADE_COLORS[g]}`}>
            <p className="text-xs font-semibold mb-0.5">Grade {g}</p>
            <p className="text-2xl font-bold tabular-nums">{gradeCount[g] ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {leads.slice(0, 8).map((lead) => (
          <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:border-border transition-colors">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm border shrink-0 ${lead.lead_grade ? GRADE_COLORS[lead.lead_grade] : "bg-muted text-muted-foreground border-border"}`}>
              {lead.lead_grade ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{lead.client_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{lead.company_name ?? lead.project_name ?? "—"}</p>
            </div>
            {lead.quality_score != null && (
              <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-20">
                <span className="text-xs font-mono">{lead.quality_score}/100</span>
                <Progress value={lead.quality_score} className="h-1 w-full" />
              </div>
            )}
            <Badge variant="outline" className={`text-[10px] shrink-0 ${lead.status === "ready" ? "text-emerald-700 border-emerald-500/30" : "text-muted-foreground"}`}>
              {lead.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminCRM() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pipelineView, setPipelineView] = useState<"kanban" | "list">("kanban");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["crm-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["crm-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*, client:profiles!projects_client_id_fkey(id, full_name, email, company_name, phone)")
        .order("last_activity_at", { ascending: false, nullsFirst: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["crm-documents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*, project:projects!documents_project_id_fkey(name, code)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*, profile:profiles!activities_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Computed
  const activeProjects = projects.filter((p) => !["archived", "lost", "cancelled"].includes(p.status));
  const signedProjects = projects.filter((p) => ["signed", "completed", "delivered"].includes(p.status));
  const pipelineValue = projects.reduce((s, p) => s + (p.proposal_amount || p.estimated_budget_max || 0), 0);
  const contractValue = signedProjects.reduce((s, p) => s + (p.contract_amount || p.proposal_amount || 0), 0);
  const conversionRate = projects.length > 0 ? Math.round((signedProjects.length / projects.length) * 100) : 0;

  const filteredProjects = projects.filter((p) => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch =
      !s ||
      p.name.toLowerCase().includes(s) ||
      p.code?.toLowerCase().includes(s) ||
      (p.client as Profile)?.full_name?.toLowerCase().includes(s) ||
      (p.client as Profile)?.company_name?.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stageGroups = ["draft", "discovery_active", "discovery", "review_pending", "cdc_ready", "proposal", "negotiation", "signed", "in_progress", "delivered", "completed"]
    .map((stage) => ({
      stage,
      config: STATUS_CONFIG[stage] || { label: stage, bgClass: "bg-muted", color: "" },
      projects: projects.filter((p) => p.status === stage),
    }))
    .filter((g) => g.projects.length > 0);

  const docsByType = {
    cdc: documents.filter((d) => d.type === "cahier_des_charges" || d.type === "cdc"),
    proposal: documents.filter((d) => d.type === "proposal" || d.type === "proposition"),
    quote: documents.filter((d) => d.type === "devis" || d.type === "quote"),
    invoice: documents.filter((d) => d.type === "facture" || d.type === "invoice"),
    other: documents.filter((d) => !["cahier_des_charges", "cdc", "proposal", "proposition", "devis", "quote", "facture", "invoice"].includes(d.type)),
  };

  function openClientDetail(id: string) {
    setSelectedClientId(id);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">CRM 360</h1>
            <p className="text-muted-foreground text-sm">Vision complète clients, pipeline & automatisations</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher client, projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatsCard label="Clients" value={profiles.length} icon={Users} />
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="Pipeline" value={pipelineValue > 0 ? `${(pipelineValue / 1000).toFixed(0)}k€` : "0€"} icon={TrendingUp} />
        <StatsCard label="Signés" value={contractValue > 0 ? `${(contractValue / 1000).toFixed(0)}k€` : "0€"} icon={Euro} />
        <StatsCard label="Conversion" value={`${conversionRate}%`} icon={Target} />
        <StatsCard label="Documents" value={documents.length} icon={FileText} />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            CRM 360
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Automatisations
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="leads-ia">
            <Flame className="h-3.5 w-3.5 mr-1.5 text-[hsl(var(--imo-coral-600))]" />
            Leads IA
          </TabsTrigger>
        </TabsList>

        {/* ── PIPELINE ── */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {pipelineView === "list" && (
                <>
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "gradient-primary border-0" : ""}
                  >
                    Tous ({projects.length})
                  </Button>
                  {stageGroups.map((g) => (
                    <Button
                      key={g.stage}
                      variant={statusFilter === g.stage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(statusFilter === g.stage ? "all" : g.stage)}
                    >
                      {g.config.label} ({g.projects.length})
                    </Button>
                  ))}
                </>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant={pipelineView === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setPipelineView("kanban")}
                className={pipelineView === "kanban" ? "gradient-primary border-0" : ""}
              >
                <FolderKanban className="h-3.5 w-3.5 mr-1" /> Kanban
              </Button>
              <Button
                variant={pipelineView === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setPipelineView("list")}
              >
                <Activity className="h-3.5 w-3.5 mr-1" /> Liste
              </Button>
            </div>
          </div>

          {pipelineView === "kanban" ? (
            <KanbanBoard projects={projects as ComponentProps<typeof KanbanBoard>["projects"]} onClientClick={openClientDetail} />
          ) : (
            <div className="space-y-3">
              {filteredProjects.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-muted-foreground">Aucun projet trouvé.</CardContent>
                </Card>
              ) : (
                filteredProjects.map((project) => {
                  const client = project.client as Profile | null;
                  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
                  return (
                    <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar
                              className="h-10 w-10 shrink-0 cursor-pointer"
                              onClick={() => client?.id && openClientDetail(client.id)}
                            >
                              <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
                                {client?.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm truncate">{project.name}</span>
                                <Badge className={`text-[10px] ${statusCfg.bgClass} border`}>{statusCfg.label}</Badge>
                                {project.priority && project.priority !== "medium" && (
                                  <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[project.priority] || ""}`}>
                                    {project.priority}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{project.code}</span>
                                {client?.full_name && (
                                  <button
                                    className="hover:text-primary transition-colors cursor-pointer"
                                    onClick={() => client?.id && openClientDetail(client.id)}
                                  >
                                    • {client.full_name}
                                  </button>
                                )}
                                {client?.company_name && <span>• {client.company_name}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                            <div className="flex items-center gap-1" title="Phase">
                              <BarChart3 className="h-3.5 w-3.5" />
                              <span>Phase {project.current_phase || 1}/7</span>
                            </div>
                            <div className="flex items-center gap-1" title="Messages">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{project.total_messages || 0}</span>
                            </div>
                            {(project.proposal_amount || project.estimated_budget_max) && (
                              <div className="flex items-center gap-1 font-medium text-foreground" title="Budget">
                                <Euro className="h-3.5 w-3.5" />
                                <span>{((project.proposal_amount || project.estimated_budget_max || 0) / 1000).toFixed(0)}k€</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1" title="Dernière activité">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {project.last_activity_at
                                  ? formatDistanceToNow(new Date(project.last_activity_at), { addSuffix: true, locale: fr })
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" asChild className="shrink-0">
                            <Link to={`/admin/projects/${project.id}`}>
                              <Eye className="h-4 w-4 mr-1" /> Voir
                            </Link>
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Progress value={project.overall_progress || 0} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* ── CRM 360 / CLIENTS ── */}
        <TabsContent value="clients" className="space-y-4">
          {/* Client count & sort info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {profiles.filter(
                (p) =>
                  !search ||
                  p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                  p.email?.toLowerCase().includes(search.toLowerCase()) ||
                  p.company_name?.toLowerCase().includes(search.toLowerCase())
              ).length}{" "}
              client{profiles.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {profiles
              .filter(
                (p) =>
                  !search ||
                  p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                  p.email?.toLowerCase().includes(search.toLowerCase()) ||
                  p.company_name?.toLowerCase().includes(search.toLowerCase())
              )
              .map((profile) => {
                const clientProjects = projects.filter((pr) => pr.client_id === profile.id);
                const activeCount = clientProjects.filter((p) => !["archived", "lost", "cancelled"].includes(p.status)).length;
                const signedCount = clientProjects.filter((p) => ["signed", "completed", "delivered"].includes(p.status)).length;
                const score = computeClientScore(profile, clientProjects);
                const totalBudget = clientProjects.reduce((s, p) => s + (p.contract_amount || p.proposal_amount || p.estimated_budget_max || 0), 0);
                const daysSinceLastSeen = profile.last_seen_at
                  ? Math.floor((Date.now() - new Date(profile.last_seen_at).getTime()) / 86400000)
                  : null;
                const scoreColor = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-muted-foreground";
                const scoreBg = score >= 70 ? "bg-green-50 dark:bg-green-900/20" : score >= 40 ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-muted/50";

                return (
                  <Card
                    key={profile.id}
                    className="border shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => openClientDetail(profile.id)}
                  >
                    <CardContent className="p-0">
                      {/* Card header with gradient accent */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                            <AvatarFallback className="gradient-primary text-primary-foreground font-semibold text-sm">
                              {profile.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              {profile.full_name || "Sans nom"}
                            </h3>
                            {profile.company_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3 shrink-0" /> {profile.company_name}
                                {profile.company_role && <span className="opacity-50">· {profile.company_role}</span>}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${scoreBg} ${scoreColor}`}>
                              <Star className="h-2.5 w-2.5" /> {score}
                            </div>
                            {daysSinceLastSeen !== null && daysSinceLastSeen > 14 && (
                              <Badge variant="destructive" className="text-[9px]">Inactif {daysSinceLastSeen}j</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="px-4 pb-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{profile.email}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.industry && (
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 shrink-0" />
                            <span>{profile.industry}</span>
                          </div>
                        )}
                        {profile.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span className="truncate">{profile.website?.replace(/^https?:\/\//, "")}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats footer */}
                      <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {clientProjects.length}
                          </span>
                          {activeCount > 0 && (
                            <Badge className="gradient-primary border-0 text-[10px] h-5">
                              {activeCount} actif{activeCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {signedCount > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 text-green-600 border-green-300">
                              {signedCount} signe{signedCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {totalBudget > 0 && (
                            <span className="font-semibold text-foreground flex items-center gap-0.5">
                              <Euro className="h-3 w-3" />{(totalBudget / 1000).toFixed(0)}k
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {profile.last_seen_at
                              ? formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true, locale: fr })
                              : profile.created_at
                              ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: fr })
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        {/* ── AUTOMATIONS ── */}
        <TabsContent value="automations">
          <AutomationRulesTab />
        </TabsContent>

        {/* ── CAMPAIGNS ── */}
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>

        {/* ── DOCUMENTS ── */}
        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Cahiers des charges", count: docsByType.cdc.length },
              { label: "Propositions", count: docsByType.proposal.length },
              { label: "Devis", count: docsByType.quote.length },
              { label: "Factures", count: docsByType.invoice.length },
              { label: "Autres", count: docsByType.other.length },
            ].map((d) => (
              <Card key={d.label} className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{d.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Document</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Projet</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.slice(0, 20).map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                          </div>
                        </td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px]">{doc.type}</Badge></td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {(doc.project as GeneratedDocument["project"])?.name || "—"} <span className="opacity-50">{(doc.project as GeneratedDocument["project"])?.code}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${doc.status === "final" || doc.status === "signed" ? "bg-primary/10 text-primary" : ""}`}>
                            {doc.status || "brouillon"}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy", { locale: fr }) : "—"}
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucun document.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACTIVITY ── */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Fil d'activité en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune activité enregistrée.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-6">
                    {activities.map((act) => (
                      <div key={act.id} className="flex gap-4 relative">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          act.importance === "high"
                            ? "bg-destructive/10 text-destructive"
                            : act.action === "message"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {act.action === "message" ? <MessageSquare className="h-3.5 w-3.5" />
                            : act.action === "document" ? <FileText className="h-3.5 w-3.5" />
                            : act.action === "project" ? <FolderKanban className="h-3.5 w-3.5" />
                            : <Activity className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{act.description || act.action}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{(act.profile as ActivityType["profile"])?.full_name || "Système"}</span>
                            <span>•</span>
                            <span>{act.created_at ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: fr }) : "—"}</span>
                            {act.importance === "high" && (
                              <><span>•</span><Badge variant="destructive" className="text-[9px] h-4">Important</Badge></>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEADS IA ── */}
        <TabsContent value="leads-ia" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Vue consolidée des leads qualifiés par les agents IA. Gérez-les depuis l'espace Consultant.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/consultant/leads">
                Ouvrir vue complète
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <LeadsIAPreview />
        </TabsContent>
      </Tabs>

      {/* Client Detail Drawer */}
      <ClientDetailDrawer
        profileId={selectedClientId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
