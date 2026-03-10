import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, FileText, Download, MessageSquare, Send, Star, Phone, Mail,
  Loader2, Clock, AlertTriangle, CheckCircle, RefreshCw, Eye, PenLine, ShieldCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { PhaseProgress } from "@/components/PhaseProgress";
import { cn } from "@/lib/utils";

const phaseLabels = [
  "Accueil & Mise en confiance",
  "Exploration du besoin",
  "Vision & Positionnement",
  "Écosystème & Intégrations",
  "Contraintes & Ressources",
  "Profil décisionnel",
  "Synthèse & Validation",
];

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  discovery_active: { label: "En découverte", color: "bg-green-100 text-green-700" },
  discovery_paused: { label: "En pause", color: "bg-yellow-100 text-yellow-700" },
  discovery_completed: { label: "Découverte terminée", color: "bg-blue-100 text-blue-700" },
  review_pending: { label: "En révision", color: "bg-purple-100 text-purple-700" },
  cdc_draft: { label: "CDC en cours", color: "bg-orange-100 text-orange-700" },
  cdc_ready: { label: "CDC prêt", color: "bg-blue-100 text-blue-700" },
  proposal_sent: { label: "Proposition envoyée", color: "bg-indigo-100 text-indigo-700" },
  signed: { label: "Signé", color: "bg-green-100 text-green-700" },
  lost: { label: "Perdu", color: "bg-red-100 text-red-700" },
};

const priorityOptions = [
  { value: "low", label: "Basse", color: "text-muted-foreground" },
  { value: "medium", label: "Moyenne", color: "text-secondary" },
  { value: "high", label: "Haute", color: "text-orange-600" },
  { value: "urgent", label: "Urgente", color: "text-destructive" },
];

export default function ConsultantProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("conversation");
  const [consultantMessage, setConsultantMessage] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [notesLoaded, setNotesLoaded] = useState(false);

  // Fetch project with client profile
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["consultant-project", id],
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

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["project-messages", id],
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

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ["project-documents", id],
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

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["project-conversations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Set notes when project loads
  if (project && !notesLoaded) {
    setInternalNotes(project.internal_notes || "");
    setNotesLoaded(true);
  }

  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-project", id] });
      toast.success("Projet mis à jour");
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Send consultant message
  const sendConsultantMsg = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        project_id: id!,
        role: "consultant",
        content,
        phase: project?.current_phase || 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-messages", id] });
      setConsultantMessage("");
      toast.success("Message envoyé");
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Save notes
  const saveNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("projects")
        .update({ internal_notes: internalNotes })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Notes sauvegardées"),
    onError: (error: any) => toast.error(error.message),
  });

  // Streaming document generation
  const [streamingContent, setStreamingContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const generateDocument = useCallback(async (docType: string = "cdc") => {
    setIsGenerating(true);
    setGeneratingType(docType);
    setStreamingContent("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

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
        throw new Error(errorData.error || "Erreur lors de la génération");
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
              // First event contains document_id
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

      queryClient.invalidateQueries({ queryKey: ["project-documents", id] });
      toast.success(`${docType === "cdc" ? "CDC" : docType === "proposal" ? "Proposition" : "Contrat"} généré !`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  }, [id, queryClient]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Projet non trouvé</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/consultant/projects">Retour aux projets</Link>
        </Button>
      </div>
    );
  }

  const client = project.client as any;
  const status = statusLabels[project.status] || statusLabels.draft;
  const discoveryData = (project.discovery_data || {}) as Record<string, any>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/consultant/projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-xl font-bold truncate">{project.name}</h1>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", status.color)}>
              {status.label}
            </span>
            <Badge variant={project.priority === "urgent" ? "destructive" : project.priority === "high" ? "default" : "secondary"} className="text-[10px]">
              {project.priority || "medium"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{project.code}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateDocument("cdc")}
            disabled={isGenerating}
          >
            {isGenerating && generatingType === "cdc" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1" />
            )}
            Générer CDC
          </Button>
        </div>
      </div>

      {/* Phase progress */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <PhaseProgress
            currentPhase={project.current_phase || 1}
            phaseProgress={0}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="conversation">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Conversation ({messages.length})
              </TabsTrigger>
              <TabsTrigger value="synthesis">Synthèse</TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Documents ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* CONVERSATION TAB */}
            <TabsContent value="conversation">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="max-h-[500px] overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Aucun message dans cette conversation.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "")}
                        >
                          {msg.role !== "user" && (
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback
                                className={cn(
                                  "text-[10px] font-bold text-white",
                                  msg.role === "consultant" ? "bg-secondary" : "gradient-primary"
                                )}
                              >
                                {msg.role === "consultant" ? "C" : "IA"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="max-w-[75%]">
                            {msg.role !== "user" && (
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[10px] text-muted-foreground">
                                  {msg.role === "consultant" ? "Consultant" : "Assistant IA"}
                                </p>
                                {msg.sentiment && (
                                  <span className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded-full",
                                    msg.sentiment === "positive" ? "bg-green-100 text-green-700" :
                                    msg.sentiment === "frustrated" ? "bg-red-100 text-red-700" :
                                    msg.sentiment === "confused" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {msg.sentiment}
                                  </span>
                                )}
                              </div>
                            )}
                            <div
                              className={cn(
                                "rounded-xl px-3 py-2 text-sm",
                                msg.role === "user"
                                  ? "gradient-primary text-white rounded-br-md"
                                  : msg.role === "consultant"
                                  ? "bg-secondary/10 border border-secondary/20 rounded-bl-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              {msg.role === "assistant" ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              ) : (
                                msg.content
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {msg.created_at && formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Consultant intervention */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Intervenir dans la conversation (visible par le client)
                    </p>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Votre message en tant que consultant..."
                        className="resize-none"
                        rows={2}
                        value={consultantMessage}
                        onChange={(e) => setConsultantMessage(e.target.value)}
                      />
                      <Button
                        size="icon"
                        className="gradient-primary border-0 shrink-0 self-end"
                        onClick={() => sendConsultantMsg.mutate(consultantMessage)}
                        disabled={!consultantMessage.trim() || sendConsultantMsg.isPending}
                      >
                        {sendConsultantMsg.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SYNTHESIS TAB */}
            <TabsContent value="synthesis">
              <div className="space-y-4">
                {/* Phase timeline */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base">Progression des phases</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {phaseLabels.map((phase, i) => {
                      const phaseNum = i + 1;
                      const isCompleted = phaseNum < (project.current_phase || 1);
                      const isCurrent = phaseNum === (project.current_phase || 1);
                      const phaseData = discoveryData[`phase${phaseNum}`] || {};
                      const dataKeys = Object.keys(phaseData).filter(k => phaseData[k] != null && phaseData[k] !== "");

                      return (
                        <div key={phase} className="flex items-start gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            isCompleted ? "gradient-primary text-white" :
                            isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary/30" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? <CheckCircle className="h-4 w-4" /> : phaseNum}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium", isCurrent && "text-primary")}>
                              {phase}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isCompleted ? "Complété" : isCurrent ? "En cours" : "À venir"}
                              {dataKeys.length > 0 && ` · ${dataKeys.length} donnée(s) collectée(s)`}
                            </p>
                            {/* Show extracted data */}
                            {dataKeys.length > 0 && (isCompleted || isCurrent) && (
                              <div className="mt-2 bg-muted/50 rounded-lg p-3 space-y-1">
                                {dataKeys.slice(0, 5).map((key) => (
                                  <div key={key} className="text-xs">
                                    <span className="font-medium text-muted-foreground">{key}: </span>
                                    <span>{typeof phaseData[key] === "object" ? JSON.stringify(phaseData[key]) : String(phaseData[key])}</span>
                                  </div>
                                ))}
                                {dataKeys.length > 5 && (
                                  <p className="text-[10px] text-muted-foreground">+{dataKeys.length - 5} autres</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Sessions */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base">Sessions ({conversations.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune session enregistrée.</p>
                    ) : (
                      <div className="space-y-3">
                        {conversations.map((conv, i) => (
                          <div key={conv.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {conv.session_number || i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Session #{conv.session_number || i + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                {conv.started_at && new Date(conv.started_at).toLocaleDateString("fr-FR")}
                                {conv.duration && ` · ${Math.round(conv.duration / 60)} min`}
                                {conv.phase_start && conv.phase_end && ` · Phases ${conv.phase_start}-${conv.phase_end}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* DOCUMENTS TAB */}
            <TabsContent value="documents">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {documents.length === 0 && !streamingContent ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Aucun document généré.</p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => generateDocument("cdc")} disabled={isGenerating}>
                          {isGenerating && generatingType === "cdc" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                          Générer CDC
                        </Button>
                        <Button variant="outline" onClick={() => generateDocument("proposal")} disabled={isGenerating}>
                          {isGenerating && generatingType === "proposal" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                          Proposition
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                                <Badge variant="secondary" className="text-[10px]">{doc.status}</Badge>
                                <span className="text-[10px] text-muted-foreground">v{doc.version}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {doc.storage_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={doc.storage_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Streaming preview */}
                  {streamingContent && (
                    <Card className="mt-4 border border-primary/20">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-display text-sm flex items-center gap-2">
                            {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                            {isGenerating ? "Génération en cours..." : "Document généré"}
                          </CardTitle>
                          {!isGenerating && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStreamingContent("")}>
                              Fermer
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="prose prose-sm max-w-none max-h-[500px] overflow-y-auto">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES TAB */}
            <TabsContent value="notes">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">Notes internes</CardTitle>
                  <p className="text-xs text-muted-foreground">Visibles uniquement par les consultants et admins</p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Notes internes sur ce projet (non visibles par le client)..."
                    rows={8}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                  />
                  <Button
                    className="mt-3 gradient-primary border-0"
                    size="sm"
                    onClick={() => saveNotes.mutate()}
                    disabled={saveNotes.isPending}
                  >
                    {saveNotes.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                    Sauvegarder
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
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
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{client?.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{client?.company_name || ""}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {client?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <a href={`mailto:${client.email}`} className="hover:text-primary truncate">{client.email}</a>
                  </div>
                )}
                {client?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                  </div>
                )}
                {client?.industry && (
                  <p className="text-muted-foreground">Secteur : {client.industry}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <span className="font-display text-3xl font-bold gradient-text">
                  {project.overall_progress || 0}%
                </span>
              </div>
              <Progress value={project.overall_progress || 0} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Phase {project.current_phase || 1}/7 · {messages.length} messages
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {project.last_activity_at
                  ? formatDistanceToNow(new Date(project.last_activity_at), { addSuffix: true, locale: fr })
                  : "Pas d'activité"}
              </div>
            </CardContent>
          </Card>

          {/* Qualification */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => updateProject.mutate({ qualification_score: i })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={cn(
                      "h-5 w-5",
                      i <= (project.qualification_score || 0) ? "fill-secondary text-secondary" : "text-muted"
                    )} />
                  </button>
                ))}
              </div>
              {(project.estimated_budget_min || project.estimated_budget_max) && (
                <p className="text-xs text-muted-foreground">
                  Budget : {project.estimated_budget_min ? `${(project.estimated_budget_min / 1000).toFixed(0)}k` : "?"} - {project.estimated_budget_max ? `${(project.estimated_budget_max / 1000).toFixed(0)}k€` : "?"}
                </p>
              )}
              <div>
                <p className="text-xs font-medium mb-1.5">Priorité</p>
                <Select
                  value={project.priority || "medium"}
                  onValueChange={(v) => updateProject.mutate({ priority: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {project.tags && (project.tags as string[]).length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {(project.tags as string[]).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => generateDocument("cdc")}
                disabled={isGenerating}
              >
                <FileText className="h-3.5 w-3.5 mr-2" />Générer CDC
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => generateDocument("proposal")}
                disabled={isGenerating}
              >
                <FileText className="h-3.5 w-3.5 mr-2" />Proposition
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => generateDocument("contract")}
                disabled={isGenerating}
              >
                <FileText className="h-3.5 w-3.5 mr-2" />Contrat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  updateProject.mutate({ status: "review_pending" });
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />Marquer en révision
              </Button>
              {client?.email && (
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" asChild>
                  <a href={`mailto:${client.email}`}>
                    <Mail className="h-3.5 w-3.5 mr-2" />Relancer client
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
