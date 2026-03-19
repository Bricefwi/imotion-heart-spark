import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, FileText, MessageSquare, Loader2, CheckCircle, Eye,
  Wrench, ClipboardCheck, BookOpen, Scale, Cpu, Download, AlertTriangle,
  Clock, ShieldCheck, PenLine,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import { PhaseProgress } from "@/components/PhaseProgress";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/admin";

const DOC_TYPE_LABELS: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  cdc: { label: "Cahier des Charges", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
  tech_recommendation: { label: "Reco Technique & Prompt", icon: Cpu, color: "bg-purple-100 text-purple-700" },
  proposal: { label: "Proposition Commerciale", icon: FileText, color: "bg-indigo-100 text-indigo-700" },
  pricing: { label: "Devis", icon: FileText, color: "bg-amber-100 text-amber-700" },
  devis: { label: "Devis", icon: FileText, color: "bg-amber-100 text-amber-700" },
  contract: { label: "Contrat", icon: Scale, color: "bg-green-100 text-green-700" },
  contrat: { label: "Contrat", icon: Scale, color: "bg-green-100 text-green-700" },
  contract_fr: { label: "Contrat (Droit FR)", icon: Scale, color: "bg-green-100 text-green-700" },
  pv_reception: { label: "PV de Reception", icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-700" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  discovery_active: { label: "En decouverte", color: "bg-green-100 text-green-700" },
  discovery_completed: { label: "Decouverte terminee", color: "bg-blue-100 text-blue-700" },
  cdc_draft: { label: "CDC en cours", color: "bg-orange-100 text-orange-700" },
  cdc_ready: { label: "CDC pret", color: "bg-blue-100 text-blue-700" },
  proposal_sent: { label: "Proposition envoyee", color: "bg-indigo-100 text-indigo-700" },
  signed: { label: "Signe", color: "bg-green-100 text-green-700" },
  in_development: { label: "En developpement", color: "bg-yellow-100 text-yellow-700" },
  delivered: { label: "Livre", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Perdu", color: "bg-red-100 text-red-700" },
};

const TOOL_CATEGORIES: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend / BDD",
  hosting: "Hebergement",
  cms: "CMS / Contenu",
  design: "Design / UX",
  devops: "CI/CD / DevOps",
  analytics: "Analytics",
  ai: "IA / Automatisation",
  other: "Autre",
};

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [streamingContent, setStreamingContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:profiles!projects_client_id_fkey(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["admin-project-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-project-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: projectTools = [] } = useQuery({
    queryKey: ["admin-project-tools", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tools")
        .select("*")
        .eq("project_id", id!)
        .order("category");
      if (error) return [];
      return data || [];
    },
    enabled: !!id,
  });

  const { data: estimate } = useQuery({
    queryKey: ["admin-project-estimate", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_estimates")
        .select("*")
        .eq("project_id", id!)
        .eq("is_current", true)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!id,
  });

  const generateDocument = useCallback(async (docType: string) => {
    setIsGenerating(true);
    setGeneratingType(docType);
    setStreamingContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifie");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ projectId: id, type: docType, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la generation");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.document_id) continue;
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                accumulated += delta;
                setStreamingContent(accumulated);
              }
            } catch { /* skip */ }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["admin-project-documents", id] });
      toast.success(`${DOC_TYPE_LABELS[docType]?.label || docType} genere !`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la generation");
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projet non trouve</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/admin/crm">Retour au CRM</Link>
        </Button>
      </div>
    );
  }

  const client = project.client as Profile | undefined;
  const status = statusLabels[project.status] || statusLabels.draft;
  const discoveryData = (project.discovery_data || {}) as Record<string, unknown>;

  // Group documents by type
  const docsByType: Record<string, typeof documents> = {};
  for (const doc of documents) {
    const type = doc.type || "other";
    if (!docsByType[type]) docsByType[type] = [];
    docsByType[type].push(doc);
  }

  // Group tools by category
  const toolsByCategory: Record<string, typeof projectTools> = {};
  for (const tool of projectTools) {
    const cat = (tool as Record<string, unknown>).category as string || "other";
    if (!toolsByCategory[cat]) toolsByCategory[cat] = [];
    toolsByCategory[cat].push(tool);
  }

  // Extract tools from discovery data
  const discoveryTools = discoveryData.current_tools || discoveryData.tools || discoveryData.phase4;
  const hasDiscoveryTools = discoveryTools && typeof discoveryTools === "object";

  const cdcDocs = docsByType.cdc || [];
  const techRecoDocs = docsByType.tech_recommendation || [];
  const contractDocs = [...(docsByType.contract || []), ...(docsByType.contrat || []), ...(docsByType.contract_fr || [])];
  const pvDocs = docsByType.pv_reception || [];
  const proposalDocs = [...(docsByType.proposal || []), ...(docsByType.pricing || []), ...(docsByType.devis || [])];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/crm"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-xl font-bold truncate">{project.name}</h1>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", status.color)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{project.code} | {client?.company_name || client?.full_name || "Client"}</p>
        </div>
      </div>

      {/* Phase progress */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <PhaseProgress currentPhase={project.current_phase || 1} phaseProgress={0} />
        </CardContent>
      </Card>

      {/* Pipeline overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "CDC", count: cdcDocs.length, icon: BookOpen, color: "text-blue-600", type: "cdc" },
          { label: "Reco & Prompt", count: techRecoDocs.length, icon: Cpu, color: "text-purple-600", type: "tech_recommendation" },
          { label: "Outils", count: projectTools.length, icon: Wrench, color: "text-orange-600", type: null },
          { label: "Devis", count: proposalDocs.length, icon: FileText, color: "text-amber-600", type: "pricing" },
          { label: "Contrat", count: contractDocs.length, icon: Scale, color: "text-green-600", type: "contract_fr" },
          { label: "PV Reception", count: pvDocs.length, icon: ClipboardCheck, color: "text-emerald-600", type: "pv_reception" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <item.icon className={cn("h-5 w-5 mx-auto mb-1", item.color)} />
              <p className="text-xs font-medium">{item.label}</p>
              <p className="text-lg font-bold">{item.count}</p>
              {item.type && item.count === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] mt-1"
                  onClick={() => generateDocument(item.type!)}
                  disabled={isGenerating}
                >
                  {isGenerating && generatingType === item.type ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Generer"
                  )}
                </Button>
              )}
              {item.count > 0 && (
                <CheckCircle className="h-3.5 w-3.5 mx-auto mt-1 text-green-500" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="cdc">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            CDC ({cdcDocs.length})
          </TabsTrigger>
          <TabsTrigger value="tech">
            <Cpu className="h-3.5 w-3.5 mr-1" />
            Prompt & Outils
          </TabsTrigger>
          <TabsTrigger value="contract">
            <Scale className="h-3.5 w-3.5 mr-1" />
            Contrat ({contractDocs.length})
          </TabsTrigger>
          <TabsTrigger value="pv">
            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
            PV Reception ({pvDocs.length})
          </TabsTrigger>
          <TabsTrigger value="all-docs">
            <FileText className="h-3.5 w-3.5 mr-1" />
            Tous ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client info */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="gradient-primary text-white text-sm font-bold">
                      {client?.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{client?.full_name || "-"}</p>
                    <p className="text-xs text-muted-foreground">{client?.company_name || ""}</p>
                  </div>
                </div>
                {client?.industry && <p className="text-xs text-muted-foreground">Secteur : {client.industry}</p>}
                {client?.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                {(project.estimated_budget_min || project.estimated_budget_max) && (
                  <p className="text-xs">Budget : {project.estimated_budget_min ? `${(project.estimated_budget_min / 1000).toFixed(0)}k` : "?"} - {project.estimated_budget_max ? `${(project.estimated_budget_max / 1000).toFixed(0)}k` : "?"}EUR</p>
                )}
                {estimate && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-medium">Estimation actuelle</p>
                    <p className="text-sm font-bold">{estimate.final_price?.toLocaleString("fr-FR")} EUR HT</p>
                    <p className="text-[10px] text-muted-foreground">{estimate.duration_weeks_min}-{estimate.duration_weeks_max} semaines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discovery data summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm">Donnees de decouverte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {Object.entries(discoveryData).filter(([, v]) => v != null).slice(0, 10).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-medium text-muted-foreground">{key}: </span>
                      <span>{typeof value === "object" ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100)}</span>
                    </div>
                  ))}
                  {Object.keys(discoveryData).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune donnee collectee.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversation stats */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{messages.length} messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Phase {project.current_phase || 1}/7</span>
                </div>
                <Progress value={project.overall_progress || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">{project.overall_progress || 0}% complete</p>
                {project.qualification_score && (
                  <p className="text-xs">Score : {project.qualification_score}/5</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document pipeline */}
          <Card className="border-0 shadow-sm mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Pipeline documentaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                  { label: "CDC", docs: cdcDocs, type: "cdc" },
                  { label: "Reco Technique", docs: techRecoDocs, type: "tech_recommendation" },
                  { label: "Devis", docs: proposalDocs, type: "pricing" },
                  { label: "Contrat", docs: contractDocs, type: "contract_fr" },
                  { label: "PV Reception", docs: pvDocs, type: "pv_reception" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-2 shrink-0">
                    <div className={cn(
                      "rounded-lg px-4 py-3 text-center min-w-[120px] border-2 transition-all",
                      step.docs.length > 0
                        ? "border-green-300 bg-green-50"
                        : "border-dashed border-muted-foreground/30 bg-muted/30"
                    )}>
                      <p className="text-xs font-medium">{step.label}</p>
                      {step.docs.length > 0 ? (
                        <CheckCircle className="h-4 w-4 mx-auto mt-1 text-green-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] mt-1"
                          onClick={() => generateDocument(step.type)}
                          disabled={isGenerating}
                        >
                          {isGenerating && generatingType === step.type ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Generer"
                          )}
                        </Button>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="text-muted-foreground/30">→</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CDC TAB */}
        <TabsContent value="cdc">
          <DocumentSection
            title="Cahier des Charges"
            docs={cdcDocs}
            docType="cdc"
            isGenerating={isGenerating}
            generatingType={generatingType}
            onGenerate={generateDocument}
            emptyMessage="Aucun CDC genere. Le CDC est le document fondateur qui definit le perimetre du projet."
          />
        </TabsContent>

        {/* TECH & TOOLS TAB */}
        <TabsContent value="tech">
          <div className="space-y-6">
            {/* Tech recommendation documents */}
            <DocumentSection
              title="Recommandation Technique & Prompt"
              docs={techRecoDocs}
              docType="tech_recommendation"
              isGenerating={isGenerating}
              generatingType={generatingType}
              onGenerate={generateDocument}
              emptyMessage="La recommandation technique inclut le prompt IA associe au besoin et les outils les plus adaptes."
            />

            {/* Structured tools */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Outils recommandes ({projectTools.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {projectTools.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(toolsByCategory).map(([category, tools]) => (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {TOOL_CATEGORIES[category] || category}
                        </p>
                        <div className="space-y-1.5">
                          {tools.map((tool: Record<string, unknown>) => (
                            <div key={String(tool.id)} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{String(tool.name || '')}</span>
                                {tool.is_recommended && (
                                  <Badge variant="secondary" className="text-[10px]">Recommande</Badge>
                                )}
                              </div>
                              {tool.justification && (
                                <p className="text-[10px] text-muted-foreground max-w-[200px] truncate">{String(tool.justification)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasDiscoveryTools ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Outils collectes lors de la decouverte :</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <pre className="text-xs whitespace-pre-wrap">{typeof discoveryTools === "object" ? JSON.stringify(discoveryTools, null, 2) : String(discoveryTools)}</pre>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Generez une recommandation technique pour obtenir des outils structures.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Wrench className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Aucun outil configure. Generez une recommandation technique pour identifier les outils adaptes.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateDocument("tech_recommendation")}
                      disabled={isGenerating}
                    >
                      {isGenerating && generatingType === "tech_recommendation" ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Cpu className="h-3.5 w-3.5 mr-1" />
                      )}
                      Generer Reco Technique
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTRACT TAB */}
        <TabsContent value="contract">
          <DocumentSection
            title="Contrat de Prestation"
            docs={contractDocs}
            docType="contract_fr"
            isGenerating={isGenerating}
            generatingType={generatingType}
            onGenerate={generateDocument}
            emptyMessage="Le contrat encadre juridiquement la relation avec le client, conforme au droit francais."
          />
        </TabsContent>

        {/* PV RECEPTION TAB */}
        <TabsContent value="pv">
          <DocumentSection
            title="Proces-Verbal de Reception"
            docs={pvDocs}
            docType="pv_reception"
            isGenerating={isGenerating}
            generatingType={generatingType}
            onGenerate={generateDocument}
            emptyMessage="Le PV de reception atteste la conformite des livrables au CDC et au contrat. Il est juridiquement opposable une fois signe par les deux parties."
          />
          {pvDocs.length === 0 && (
            <Card className="border-0 shadow-sm mt-4 border-l-4 border-l-amber-400">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pre-requis pour le PV de reception</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      <li className="flex items-center gap-1.5">
                        {cdcDocs.length > 0 ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                        CDC valide {cdcDocs.length > 0 ? "(OK)" : "(manquant)"}
                      </li>
                      <li className="flex items-center gap-1.5">
                        {contractDocs.length > 0 ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                        Contrat signe {contractDocs.length > 0 ? "(OK)" : "(manquant)"}
                      </li>
                      <li className="flex items-center gap-1.5">
                        {techRecoDocs.length > 0 ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                        Reco technique {techRecoDocs.length > 0 ? "(OK)" : "(optionnel)"}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ALL DOCS TAB */}
        <TabsContent value="all-docs">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Tous les documents ({documents.length})</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {["cdc", "tech_recommendation", "pricing", "contract_fr", "pv_reception"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => generateDocument(type)}
                      disabled={isGenerating}
                    >
                      {isGenerating && generatingType === type ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : null}
                      {DOC_TYPE_LABELS[type]?.label || type}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun document.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} projectId={id!} queryClient={queryClient} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Streaming preview */}
      {streamingContent && (
        <Card className="border border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {isGenerating ? "Generation en cours..." : "Document genere"}
              </CardTitle>
              {!isGenerating && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStreamingContent("")}>
                  Fermer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none max-h-[500px] overflow-y-auto">
            <SafeMarkdown>{streamingContent}</SafeMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Reusable document section component
function DocumentSection({
  title,
  docs,
  docType,
  isGenerating,
  generatingType,
  onGenerate,
  emptyMessage,
}: {
  title: string;
  docs: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    version: number;
    requires_signature?: boolean;
    signed_at?: string | null;
    created_at: string | null;
  }>;
  docType: string;
  isGenerating: boolean;
  generatingType: string | null;
  onGenerate: (type: string) => void;
  emptyMessage: string;
}) {
  const meta = DOC_TYPE_LABELS[docType];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base flex items-center gap-2">
            {meta && <meta.icon className="h-4 w-4" />}
            {title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onGenerate(docType)}
            disabled={isGenerating}
          >
            {isGenerating && generatingType === docType ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1" />
            )}
            {docs.length > 0 ? "Regenerer" : "Generer"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="text-center py-6">
            {meta && <meta.icon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", meta?.color || "bg-muted")}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{doc.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">v{doc.version}</span>
                      {doc.requires_signature && !doc.signed_at && (
                        <Badge variant="destructive" className="text-[10px]">
                          <PenLine className="h-2.5 w-2.5 mr-0.5" /> Signature requise
                        </Badge>
                      )}
                      {doc.signed_at && (
                        <Badge className="text-[10px] bg-green-600">
                          <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Signe
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/consultant/documents/${doc.id}/edit`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Document card for "all docs" tab
function DocumentCard({
  doc,
  projectId,
  queryClient,
}: {
  doc: {
    id: string;
    name: string;
    type: string;
    status: string;
    version: number;
    requires_signature?: boolean;
    signed_at?: string | null;
    created_at: string | null;
  };
  projectId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const meta = DOC_TYPE_LABELS[doc.type];
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", meta?.color || "bg-muted text-muted-foreground")}>
          {meta ? <meta.icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium">{doc.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{meta?.label || doc.type}</Badge>
            <Badge variant="secondary" className="text-[10px]">{doc.status}</Badge>
            <span className="text-[10px] text-muted-foreground">v{doc.version}</span>
            {doc.created_at && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: fr })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        {doc.requires_signature && !doc.signed_at && (
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-7"
            onClick={async () => {
              const { error } = await supabase
                .from("documents")
                .update({ requires_signature: true, status: "sent" })
                .eq("id", doc.id);
              if (error) {
                toast.error("Erreur");
              } else {
                toast.success("Signature demandee");
                queryClient.invalidateQueries({ queryKey: ["admin-project-documents", projectId] });
              }
            }}
          >
            <PenLine className="h-3 w-3 mr-0.5" /> Signature
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link to={`/consultant/documents/${doc.id}/edit`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
