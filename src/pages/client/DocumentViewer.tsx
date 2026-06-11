import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, PenLine, FileText, MessageSquare, Loader2, CheckCircle, Clock, FileDown } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { SignaturePad } from "@/components/SignaturePad";
import { ProfessionalDocument } from "@/components/ProfessionalDocument";
import { toast } from "sonner";
import type { Profile } from "@/types/admin";

const phaseNames: Record<number, string> = {
  1: "Présentation et Contexte",
  2: "Objectifs et Cibles",
  3: "Fonctionnalités et Contenu",
  4: "Design et Identité visuelle",
  5: "Technique et Intégrations",
  6: "Budget et Planning",
  7: "Synthèse et Validation",
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

  const { data: project } = useQuery({
    queryKey: ["project-for-doc", document?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code, slug, status, current_phase, overall_progress, client_id, consultant_id, created_at, updated_at, client:profiles!projects_client_id_fkey(full_name, company_name)")
        .eq("id", document!.project_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!document?.project_id,
  });

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
    toast.success("Document signé avec succès.");
    queryClient.invalidateQueries({ queryKey: ["document", documentId] });
  };

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
  const client = project?.client as Profile | undefined;

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
          {needsSignature && (
            <Button size="sm" className="gradient-primary border-0" onClick={() => setSigningOpen(true)}>
              <PenLine className="h-3.5 w-3.5 mr-1" /> Signer
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (document.storage_path) {
                const { data, error } = await supabase.storage
                  .from("documents")
                  .download(document.storage_path);
                if (error) { toast.error("Erreur de téléchargement"); return; }
                const url = URL.createObjectURL(data);
                const a = window.document.createElement("a");
                a.href = url;
                a.download = `${document.name.replace(/\s+/g, "_")}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } else {
                // Trigger the ProfessionalDocument export button
                const exportBtn = window.document.querySelector('[data-pdf-export]') as HTMLButtonElement;
                if (exportBtn) exportBtn.click();
                else toast.info("Utilisez le bouton 'Exporter en PDF' dans le document ci-dessous.");
              }
            }}
          >
            <FileDown className="h-3.5 w-3.5 mr-1" /> Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Signature banners */}
      {isSigned && document.signed_at && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Document signé</p>
            <p className="text-xs text-green-600">
              Le {format(new Date(document.signed_at), "dd MMMM yyyy 'a' HH:mm", { locale: fr })}
            </p>
          </div>
        </div>
      )}

      {needsSignature && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50">
          <Clock className="h-5 w-5 text-orange-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">En attente de votre signature</p>
            <p className="text-xs text-orange-600">Veuillez relire le document puis le signer pour valider</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="document" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50">
          <TabsTrigger value="document" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Document
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Echanges ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="mt-4">
          <ProfessionalDocument
            content={document.content_markdown || document.description || "Le contenu du document sera disponible une fois la generation terminee."}
            documentName={document.name}
            projectName={project?.name}
            projectCode={project?.code || undefined}
            clientName={client?.full_name}
            clientCompany={client?.company_name}
            version={document.version || 1}
            date={document.created_at ? format(new Date(document.created_at), "dd MMMM yyyy", { locale: fr }) : undefined}
            status={document.status || "draft"}
          />
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
                    <div key={`${m.role}-${i}`} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
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
                <p className="text-sm text-muted-foreground">Aucun echange enregistre pour ce projet</p>
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
