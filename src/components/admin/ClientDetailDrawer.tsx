import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail, Phone, Building2, Globe, Calendar, MessageSquare,
  FileText, FolderKanban, Activity, Target, Clock, Euro,
  TrendingUp, User, Star, BarChart3, MapPin, Briefcase,
  Users, CheckCircle2, XCircle, Brain, Lightbulb, Settings,
  Shield, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface ClientDetailDrawerProps {
  profileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function computeScore(profile: any, projects: any[], messages: any[]): number {
  let score = 0;
  if (profile?.company_name) score += 10;
  if (profile?.phone) score += 5;
  if (profile?.website) score += 5;
  if (profile?.industry) score += 5;
  if (profile?.onboarding_completed) score += 15;
  score += Math.min(projects.length * 10, 30);
  const signed = projects.filter((p: any) => ["signed", "completed", "delivered"].includes(p.status));
  score += signed.length * 10;
  score += Math.min(messages.length, 20);
  return Math.min(score, 100);
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  discovery_active: { label: "Decouverte", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  discovery: { label: "Decouverte", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  review_pending: { label: "En revue", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  cdc_ready: { label: "CDC pret", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  proposal: { label: "Proposition", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  negotiation: { label: "Negociation", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  signed: { label: "Signe", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  delivered: { label: "Livre", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  completed: { label: "Termine", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Annule", className: "bg-muted text-muted-foreground" },
  lost: { label: "Perdu", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  archived: { label: "Archive", className: "bg-muted text-muted-foreground" },
};

const PHASE_LABELS: Record<number, string> = {
  1: "Accueil & Contexte",
  2: "Besoin & Objectifs",
  3: "Vision & Design",
  4: "Ecosysteme & Technique",
  5: "Contraintes & Budget",
  6: "Synthese & Validation",
  7: "Finalisation",
};

function formatDiscoveryKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/^Has /, "")
    .replace(/^Needs /, "")
    .replace(/^Is /, "");
}

function renderDiscoveryValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value === "true") return "Oui";
  if (value === "false") return "Non";
  if (typeof value === "number") return value.toLocaleString("fr-FR");
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copie dans le presse-papiers");
}

export function ClientDetailDrawer({ profileId, open, onOpenChange }: ClientDetailDrawerProps) {
  const { data: profile } = useQuery({
    queryKey: ["client-detail", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", profileId).single();
      return data;
    },
    enabled: !!profileId && open,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", profileId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profileId && open,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["client-messages-count", profileId],
    queryFn: async () => {
      if (!profileId || projects.length === 0) return [];
      const projectIds = projects.map((p: any) => p.id);
      const { data } = await supabase
        .from("messages")
        .select("id, created_at, role, project_id")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!profileId && open && projects.length > 0,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["client-documents", profileId],
    queryFn: async () => {
      if (!profileId || projects.length === 0) return [];
      const projectIds = projects.map((p: any) => p.id);
      const { data } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profileId && open && projects.length > 0,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["client-activities", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!profileId && open,
  });

  if (!profile) return null;

  const score = computeScore(profile, projects, messages);
  const totalBudget = projects.reduce(
    (s: number, p: any) => s + (p.contract_amount || p.proposal_amount || p.estimated_budget_max || 0),
    0
  );
  const activeProjects = projects.filter(
    (p: any) => !["archived", "lost", "cancelled"].includes(p.status)
  );
  const signedProjects = projects.filter(
    (p: any) => ["signed", "completed", "delivered"].includes(p.status)
  );
  const daysSinceLastSeen = profile.last_seen_at
    ? Math.floor((Date.now() - new Date(profile.last_seen_at).getTime()) / 86400000)
    : null;

  // Extract discovery data from all projects
  const projectsWithDiscovery = projects.filter(
    (p: any) => p.discovery_data && typeof p.discovery_data === "object" && Object.keys(p.discovery_data).length > 0
  );

  const hasAddress = (profile as any).address_street || (profile as any).address_city || (profile as any).address_postal_code;

  const scoreColor =
    score >= 70 ? "text-green-600 dark:text-green-400" : score >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-500";
  const scoreBg =
    score >= 70 ? "bg-green-50 dark:bg-green-900/20" : score >= 40 ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-red-50 dark:bg-red-900/20";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header section */}
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <SheetHeader className="pb-0">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
                  {profile.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="font-display text-xl">
                  {profile.full_name || "Sans nom"}
                </SheetTitle>
                {profile.company_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {profile.company_name}
                    {profile.company_role && (
                      <span className="opacity-60">· {profile.company_role}</span>
                    )}
                    {profile.company_size && (
                      <Badge variant="outline" className="text-[10px] ml-1">
                        {profile.company_size}
                      </Badge>
                    )}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${scoreBg} ${scoreColor}`}>
                    <Star className="h-3.5 w-3.5" />
                    Score: {score}/100
                  </div>
                  {profile.onboarding_completed ? (
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Onboarding OK
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">
                      <XCircle className="h-3 w-3 mr-0.5" /> Onboarding incomplet
                    </Badge>
                  )}
                  {daysSinceLastSeen !== null && daysSinceLastSeen > 14 && (
                    <Badge variant="destructive" className="text-[10px]">
                      Inactif {daysSinceLastSeen}j
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* KPI row */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { label: "Projets", value: projects.length, icon: FolderKanban },
              { label: "Actifs", value: activeProjects.length, icon: TrendingUp },
              { label: "Signes", value: signedProjects.length, icon: CheckCircle2 },
              { label: "Messages", value: messages.length, icon: MessageSquare },
              { label: "Budget", value: totalBudget > 0 ? `${(totalBudget / 1000).toFixed(0)}k` : "—", icon: Euro },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center p-2 rounded-lg bg-background/80 border">
                <kpi.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                <p className="text-base font-bold leading-tight">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs content */}
        <Tabs defaultValue="fiche" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3">
            <TabsList className="w-full grid grid-cols-5 h-9">
              <TabsTrigger value="fiche" className="text-xs">Fiche</TabsTrigger>
              <TabsTrigger value="projects" className="text-xs">Projets</TabsTrigger>
              <TabsTrigger value="discovery" className="text-xs">Discovery</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Docs</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Activite</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* ── FICHE CLIENT ── */}
            <TabsContent value="fiche" className="mt-4 space-y-4">
              {/* Contact */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Coordonnees
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
                  <ContactRow icon={Mail} label="Email" value={profile.email} copyable />
                  {profile.phone && <ContactRow icon={Phone} label="Telephone" value={profile.phone} copyable />}
                  {profile.website && (
                    <ContactRow
                      icon={Globe}
                      label="Site web"
                      value={profile.website.replace(/^https?:\/\//, "")}
                      href={profile.website}
                    />
                  )}
                  {hasAddress && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Adresse</p>
                        <p>
                          {[
                            (profile as any).address_street,
                            [(profile as any).address_postal_code, (profile as any).address_city]
                              .filter(Boolean)
                              .join(" "),
                            (profile as any).address_country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Entreprise */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Entreprise
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoField label="Societe" value={profile.company_name} />
                    <InfoField label="Fonction" value={profile.company_role} />
                    <InfoField label="Taille" value={profile.company_size} />
                    <InfoField label="Secteur" value={profile.industry} />
                  </div>
                </CardContent>
              </Card>

              {/* Tracking & Source */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Suivi & Acquisition
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoField
                      label="Inscription"
                      value={
                        profile.created_at
                          ? format(new Date(profile.created_at), "dd MMMM yyyy", { locale: fr })
                          : null
                      }
                    />
                    <InfoField
                      label="Derniere visite"
                      value={
                        profile.last_seen_at
                          ? formatDistanceToNow(new Date(profile.last_seen_at), {
                              addSuffix: true,
                              locale: fr,
                            })
                          : null
                      }
                    />
                    {profile.utm_source && <InfoField label="Source UTM" value={profile.utm_source} />}
                    {profile.utm_medium && <InfoField label="Medium UTM" value={profile.utm_medium} />}
                    {profile.utm_campaign && <InfoField label="Campagne UTM" value={profile.utm_campaign} />}
                    {profile.referrer && <InfoField label="Referrer" value={profile.referrer} />}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── PROJETS ── */}
            <TabsContent value="projects" className="mt-4 space-y-3">
              {projects.length === 0 ? (
                <EmptyState icon={FolderKanban} text="Aucun projet pour ce client." />
              ) : (
                projects.map((project: any) => {
                  const statusCfg = STATUS_LABELS[project.status] || STATUS_LABELS.draft;
                  const budget = project.contract_amount || project.proposal_amount || project.estimated_budget_max;
                  return (
                    <Card key={project.id} className="border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{project.name}</span>
                              <Badge className={`text-[10px] ${statusCfg.className} border`}>
                                {statusCfg.label}
                              </Badge>
                              {project.priority && project.priority !== "medium" && (
                                <Badge variant="outline" className="text-[10px]">
                                  {project.priority}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{project.code}</p>
                          </div>
                          {budget && (
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold flex items-center gap-1">
                                <Euro className="h-3.5 w-3.5" />
                                {(budget / 1000).toFixed(0)}k
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Phase {project.current_phase || 1}/7
                            <span className="opacity-60">
                              ({PHASE_LABELS[project.current_phase as number] || ""})
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {project.total_messages || 0} msg
                          </span>
                          {project.last_activity_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(project.last_activity_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          )}
                        </div>
                        <Progress value={project.overall_progress || 0} className="h-1.5 mt-2" />
                        {project.internal_notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-2">
                            {project.internal_notes}
                          </p>
                        )}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {project.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* ── DISCOVERY DATA ── */}
            <TabsContent value="discovery" className="mt-4 space-y-3">
              {projectsWithDiscovery.length === 0 ? (
                <EmptyState icon={Brain} text="Aucune donnee de discovery disponible." />
              ) : (
                projectsWithDiscovery.map((project: any) => {
                  const data = project.discovery_data as Record<string, any>;
                  const phases = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));

                  return (
                    <Card key={project.id} className="border shadow-sm">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          {project.name}
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {project.code}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        {phases.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Donnees vides.</p>
                        ) : (
                          <Accordion type="multiple" className="space-y-1">
                            {phases.map(([phaseKey, phaseData]) => {
                              const phaseLabel = phaseKey
                                .replace(/^phase_(\d+)_/, (_, num) => `Phase ${num} — `)
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase());

                              const entries =
                                typeof phaseData === "object" && phaseData !== null && !Array.isArray(phaseData)
                                  ? Object.entries(phaseData as Record<string, unknown>)
                                  : [];

                              if (entries.length === 0 && typeof phaseData !== "object") {
                                return (
                                  <div key={phaseKey} className="text-sm py-2">
                                    <span className="font-medium">{phaseLabel}:</span>{" "}
                                    <span className="text-muted-foreground">{renderDiscoveryValue(phaseData)}</span>
                                  </div>
                                );
                              }

                              return (
                                <AccordionItem key={phaseKey} value={phaseKey} className="border rounded-lg px-3">
                                  <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline">
                                    <span className="flex items-center gap-2">
                                      <Lightbulb className="h-3.5 w-3.5 text-primary/70" />
                                      {phaseLabel}
                                      <Badge variant="secondary" className="text-[10px]">
                                        {entries.length} champs
                                      </Badge>
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2 pb-1">
                                      {entries.map(([key, value]) => {
                                        // Nested object
                                        if (
                                          typeof value === "object" &&
                                          value !== null &&
                                          !Array.isArray(value)
                                        ) {
                                          const subEntries = Object.entries(value as Record<string, unknown>);
                                          return (
                                            <div key={key} className="ml-2">
                                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                                {formatDiscoveryKey(key)}
                                              </p>
                                              <div className="space-y-1 ml-2 border-l-2 border-muted pl-3">
                                                {subEntries.map(([sk, sv]) => (
                                                  <div key={sk} className="flex items-baseline justify-between gap-2 text-xs">
                                                    <span className="text-muted-foreground">
                                                      {formatDiscoveryKey(sk)}
                                                    </span>
                                                    <span className="font-medium text-right">
                                                      {renderDiscoveryValue(sv)}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={key}
                                            className="flex items-baseline justify-between gap-4 text-xs py-1 border-b border-dashed last:border-0"
                                          >
                                            <span className="text-muted-foreground">
                                              {formatDiscoveryKey(key)}
                                            </span>
                                            <span className="font-medium text-right max-w-[60%] break-words">
                                              {renderDiscoveryValue(value)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* ── DOCUMENTS ── */}
            <TabsContent value="documents" className="mt-4 space-y-3">
              {documents.length === 0 ? (
                <EmptyState icon={FileText} text="Aucun document pour ce client." />
              ) : (
                <>
                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { type: "cahier_des_charges", label: "CDC" },
                      { type: "proposal", label: "Propositions" },
                      { type: "devis", label: "Devis" },
                      { type: "facture", label: "Factures" },
                    ].map((dt) => {
                      const count = documents.filter(
                        (d: any) => d.type === dt.type || d.type === dt.label.toLowerCase()
                      ).length;
                      if (count === 0) return null;
                      return (
                        <Badge key={dt.type} variant="secondary" className="text-xs">
                          {dt.label}: {count}
                        </Badge>
                      );
                    })}
                  </div>

                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">
                            {doc.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              doc.status === "final" || doc.status === "signed"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : ""
                            }`}
                          >
                            {doc.status || "brouillon"}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {doc.created_at
                          ? format(new Date(doc.created_at), "dd/MM/yy", { locale: fr })
                          : ""}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            {/* ── TIMELINE / ACTIVITE ── */}
            <TabsContent value="timeline" className="mt-4 space-y-2">
              {activities.length === 0 && messages.length === 0 ? (
                <EmptyState icon={Activity} text="Aucune activite enregistree." />
              ) : (
                <div className="relative">
                  <div className="absolute left-[13px] top-0 bottom-0 w-px bg-border" />
                  {activities.map((act: any) => (
                    <div key={act.id} className="flex gap-3 relative pb-4">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          act.importance === "high"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : act.action === "message"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {act.action === "message" ? (
                          <MessageSquare className="h-3 w-3" />
                        ) : act.action === "document" ? (
                          <FileText className="h-3 w-3" />
                        ) : act.action === "project" ? (
                          <FolderKanban className="h-3 w-3" />
                        ) : (
                          <Activity className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{act.description || act.action}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {act.created_at
                            ? formatDistanceToNow(new Date(act.created_at), {
                                addSuffix: true,
                                locale: fr,
                              })
                            : ""}
                        </p>
                      </div>
                      {act.importance === "high" && (
                        <Badge variant="destructive" className="text-[9px] h-5 shrink-0">
                          Important
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ── Helper sub-components ── */

function ContactRow({
  icon: Icon,
  label,
  value,
  copyable,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  copyable?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm group">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate flex items-center gap-1"
          >
            {value} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="truncate">{value}</p>
        )}
      </div>
      {copyable && (
        <button
          onClick={() => copyToClipboard(value)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copier"
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <Icon className="h-10 w-10 mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
