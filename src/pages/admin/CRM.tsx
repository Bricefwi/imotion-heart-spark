import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/StatsCard";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Users, FolderKanban, Euro, TrendingUp, Search, Filter, Eye,
  MessageSquare, FileText, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Mail, Phone, Building2, Globe, Calendar, Activity,
  BarChart3, Target, Zap,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgClass: string }> = {
  draft: { label: "Brouillon", color: "hsl(220,10%,60%)", bgClass: "bg-muted text-muted-foreground" },
  discovery_active: { label: "Découverte", color: "hsl(30,100%,49%)", bgClass: "bg-secondary/10 text-secondary" },
  discovery: { label: "Découverte", color: "hsl(30,100%,49%)", bgClass: "bg-secondary/10 text-secondary" },
  review_pending: { label: "En revue", color: "hsl(45,100%,50%)", bgClass: "bg-yellow-100 text-yellow-800" },
  cdc_ready: { label: "CDC prêt", color: "hsl(200,80%,50%)", bgClass: "bg-blue-100 text-blue-800" },
  proposal: { label: "Proposition", color: "hsl(200,80%,50%)", bgClass: "bg-blue-100 text-blue-800" },
  negotiation: { label: "Négociation", color: "hsl(280,60%,55%)", bgClass: "bg-purple-100 text-purple-800" },
  signed: { label: "Signé", color: "hsl(145,63%,42%)", bgClass: "bg-green-100 text-green-800" },
  in_progress: { label: "En cours", color: "hsl(200,80%,50%)", bgClass: "bg-blue-100 text-blue-800" },
  delivered: { label: "Livré", color: "hsl(145,63%,42%)", bgClass: "bg-green-100 text-green-800" },
  completed: { label: "Terminé", color: "hsl(145,63%,42%)", bgClass: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulé", color: "hsl(0,0%,70%)", bgClass: "bg-muted text-muted-foreground" },
  lost: { label: "Perdu", color: "hsl(0,68%,51%)", bgClass: "bg-destructive/10 text-destructive" },
  archived: { label: "Archivé", color: "hsl(0,0%,70%)", bgClass: "bg-muted text-muted-foreground" },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-secondary/10 text-secondary border-secondary/20",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-muted text-muted-foreground border-border",
};

export default function AdminCRM() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Queries ──
  const { data: profiles = [] } = useQuery({
    queryKey: ["crm-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
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

  // ── Computed ──
  const activeProjects = projects.filter((p) => !["archived", "lost", "cancelled"].includes(p.status));
  const signedProjects = projects.filter((p) => ["signed", "completed", "delivered"].includes(p.status));
  const pipelineValue = projects.reduce((s, p) => s + (p.proposal_amount || p.estimated_budget_max || 0), 0);
  const contractValue = signedProjects.reduce((s, p) => s + (p.contract_amount || p.proposal_amount || 0), 0);
  const conversionRate = projects.length > 0 ? Math.round((signedProjects.length / projects.length) * 100) : 0;

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      (p.client as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.client as any)?.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pipeline stages for Kanban-style view
  const pipelineStages = ["draft", "discovery_active", "discovery", "review_pending", "cdc_ready", "proposal", "negotiation", "signed", "in_progress", "delivered", "completed"];
  const stageGroups = pipelineStages
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Tower Control</h1>
              <p className="text-muted-foreground text-sm">CRM & Gestion centralisée</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        {/* ── PIPELINE ── */}
        <TabsContent value="pipeline" className="space-y-4">
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Projects list */}
          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucun projet trouvé.
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => {
                const client = project.client as any;
                const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
                return (
                  <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Client avatar + info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 shrink-0">
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
                              {client?.full_name && <span>• {client.full_name}</span>}
                              {client?.company_name && <span>• {client.company_name}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Metrics */}
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

                        {/* Actions */}
                        <Button variant="ghost" size="sm" asChild className="shrink-0">
                          <Link to={`/consultant/projects/${project.id}`}>
                            <Eye className="h-4 w-4 mr-1" /> Voir
                          </Link>
                        </Button>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <Progress value={project.overall_progress || 0} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ── CLIENTS ── */}
        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                return (
                  <Card key={profile.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
                            {profile.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{profile.full_name || "Sans nom"}</h3>
                          {profile.company_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3" /> {profile.company_name}
                            </p>
                          )}
                        </div>
                        {activeCount > 0 && (
                          <Badge className="gradient-primary border-0 text-[10px]">{activeCount} actif{activeCount > 1 ? "s" : ""}</Badge>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{profile.email}</span>
                        </div>
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {profile.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary">
                              {profile.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                        {profile.industry && (
                          <div className="flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 shrink-0" />
                            <span>{profile.industry}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {clientProjects.length} projet{clientProjects.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground">
                          Inscrit {profile.created_at ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: fr }) : "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        {/* ── DOCUMENTS ── */}
        <TabsContent value="documents" className="space-y-4">
          {/* Document stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{docsByType.cdc.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Cahiers des charges</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{docsByType.proposal.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Propositions</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{docsByType.quote.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Devis</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{docsByType.invoice.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Factures</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{docsByType.other.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Autres</p>
              </CardContent>
            </Card>
          </div>

          {/* Documents list */}
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
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {(doc.project as any)?.name || "—"} <span className="opacity-50">{(doc.project as any)?.code}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${doc.status === "final" || doc.status === "signed" ? "bg-green-100 text-green-800" : ""}`}>
                            {doc.status || "brouillon"}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy", { locale: fr }) : "—"}
                        </td>
                      </tr>
                    ))}
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Aucun document.
                        </td>
                      </tr>
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
                          {act.action === "message" ? (
                            <MessageSquare className="h-3.5 w-3.5" />
                          ) : act.action === "document" ? (
                            <FileText className="h-3.5 w-3.5" />
                          ) : act.action === "project" ? (
                            <FolderKanban className="h-3.5 w-3.5" />
                          ) : (
                            <Activity className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{act.description || act.action}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{(act.profile as any)?.full_name || "Système"}</span>
                            <span>•</span>
                            <span>
                              {act.created_at
                                ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: fr })
                                : "—"}
                            </span>
                            {act.importance === "high" && (
                              <>
                                <span>•</span>
                                <Badge variant="destructive" className="text-[9px] h-4">Important</Badge>
                              </>
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
      </Tabs>
    </div>
  );
}
