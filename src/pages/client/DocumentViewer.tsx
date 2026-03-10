import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, PenLine, FileText, MessageSquare, Loader2, CheckCircle, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { SignaturePad } from "@/components/SignaturePad";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const phaseNames: Record<number, string> = {
  1: "Présentation & Contexte",
  2: "Objectifs & Cibles",
  3: "Fonctionnalités & Contenu",
  4: "Design & Identité visuelle",
  5: "Technique & Intégrations",
  6: "Budget & Planning",
  7: "Synthèse & Validation",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  review: { label: "En révision", variant: "secondary" },
  approved: { label: "Approuvé", variant: "default" },
  sent: { label: "Envoyé", variant: "default" },
  signed: { label: "Signé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export default function DocumentViewer() {
  const { id: documentId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [signingOpen, setSigningOpen] = useState(false);

  // Fetch document
  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });

  // Fetch project info
  const { data: project } = useQuery({
    queryKey: ["project-for-doc", document?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:profiles!projects_client_id_fkey(full_name, company_name)")
        .eq("id", document!.project_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!document?.project_id,
  });

  // Fetch conversation messages grouped by phase
  const { data: messages = [] } = useQuery({
    queryKey: ["doc-messages", document?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, phase, created_at")
        .eq("project_id", document!.project_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!document?.project_id,
  });

  const handleSign = async (signatureDataUrl: string) => {
    if (!document || !user) return;
    const { error } = await supabase.from("documents").update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signed_by: user.id,
      signature_data: {
        image: signatureDataUrl,
        signed_at: new Date().toISOString(),
        signer_id: user.id,
        user_agent: navigator.userAgent,
      },
    }).eq("id", document.id);
    if (error) {
      toast.error("Erreur lors de la signature.");
      return;
    }
    toast.success("Document signé avec succès !");
    queryClient.invalidateQueries({ queryKey: ["document", documentId] });
  };

  // Group messages by phase
  const messagesByPhase: Record<number, typeof messages> = {};
  for (const m of messages) {
    const phase = m.phase || 1;
    if (!messagesByPhase[phase]) messagesByPhase[phase] = [];
    messagesByPhase[phase].push(m);
  }

  if (docLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Document introuvable</p>
      </div>
    );
  }

  const status = statusLabels[document.status || "draft"] || statusLabels.draft;
  const isSigned = document.status === "signed";
  const needsSignature = document.requires_signature && !isSigned;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/client/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">{document.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
              <span className="text-xs text-muted-foreground">
                v{document.version} · {document.updated_at && formatDistanceToNow(new Date(document.updated_at), { addSuffix: true, locale: fr })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" /> Télécharger
          </Button>
          {needsSignature && (
            <Button size="sm" className="gradient-primary border-0" onClick={() => setSigningOpen(true)}>
              <PenLine className="h-3.5 w-3.5 mr-1" /> Signer
            </Button>
          )}
        </div>
      </div>

      {/* Signature banner */}
      {isSigned && document.signed_at && (
        <Card className="border-green-200 bg-green-50 border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Document signé</p>
              <p className="text-xs text-green-600">
                Signé le {format(new Date(document.signed_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {needsSignature && (
        <Card className="border-orange-200 bg-orange-50 border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">En attente de votre signature</p>
              <p className="text-xs text-orange-600">Veuillez relire le document puis le signer pour valider</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Document + Échanges */}
      <Tabs defaultValue="document" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50">
          <TabsTrigger value="document" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Document
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Échanges ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 md:p-10">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-h1:text-2xl prose-h1:border-b prose-h1:pb-3 prose-h2:text-xl prose-h3:text-lg prose-table:text-xs prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-td:border">
                <ReactMarkdown>{document.description || "Le contenu du document sera affiché ici une fois généré."}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchanges" className="mt-4 space-y-4">
          {Object.entries(messagesByPhase).map(([phase, msgs]) => (
            <Card key={phase} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {phase}
                  </div>
                  <h3 className="font-display font-semibold text-sm">
                    {phaseNames[Number(phase)] || `Phase ${phase}`}
                  </h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {msgs.length} messages
                  </Badge>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {msgs.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                      <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%] ${
                        m.role === "user"
                          ? "gradient-primary text-white rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}>
                        {m.content.length > 300 ? m.content.substring(0, 300) + "..." : m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {messages.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Aucun échange enregistré pour ce projet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <SignaturePad
        open={signingOpen}
        onOpenChange={setSigningOpen}
        documentName={document.name}
        onSign={handleSign}
      />
    </div>
  );
}
