import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  FileText,
  Eye,
  PenLine,
  Loader2,
  CheckCircle,
  Clock,
  FileDown,
  AlertTriangle,
  FolderKanban,
  ExternalLink,
} from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { SignaturePad, type SignatureContextLine } from "@/components/SignaturePad";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { getDocumentMissingInfo } from "@/lib/document-missing-info";

const typeLabels: Record<string, string> = {
  cdc: "CDC",
  proposal: "Devis",
  contract: "Contrat",
  contract_fr: "Contrat FR",
  tech_recommendation: "Reco Technique",
  pricing: "Proposition Tarifaire",
  invoice: "Facture",
  appendix: "Annexe",
  specification: "Spécifications",
  upload: "Upload",
  other: "Autre",
};

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Brouillon", variant: "outline" },
  review: { label: "En révision", variant: "secondary" },
  approved: { label: "Approuvé", variant: "default" },
  sent: { label: "Envoyé", variant: "default" },
  signed: { label: "Signé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export default function ClientDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [signingDoc, setSigningDoc] = useState<{ id: string; name: string; contextLines?: SignatureContextLine[] } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["client-documents", user?.id],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, code, proposal_amount, contract_amount, estimated_budget_min, estimated_budget_max, currency")
        .eq("client_id", user!.id);

      if (!projects || projects.length === 0) return [];
      const projectMap = new Map(projects.map((p) => [p.id, p]));

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projects.map((p) => p.id))
        .not("type", "in", '("guide_technique","build_prompts")')
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d) => ({
        ...d,
        _project: projectMap.get(d.project_id) || null,
      }));
    },
    enabled: !!user,
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (doc: {
    id: string;
    name: string;
    storage_path: string;
    description: string | null;
  }) => {
    if (downloadingId) return;
    setDownloadingId(doc.id);
    try {
      if (doc.storage_path) {
        const { data, error } = await supabase.storage
          .from("documents")
          .download(doc.storage_path);
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
        const opt = {
          margin: [20, 12, 20, 12] as [number, number, number, number],
          filename: `${doc.name.replace(/\s+/g, "_")}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        };
        await (
          html2pdf() as unknown as {
            set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => Promise<void> } };
          }
        )
          .set(opt)
          .from(container)
          .save();
      } else {
        toast.error("Aucun contenu disponible pour ce document.");
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    if (!signingDoc || !user) return;
    const docRecord = documents.find((d) => d.id === signingDoc.id);
    const { error } = await supabase
      .from("documents")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signed_by: user.id,
        signature_data: {
          image: signatureDataUrl,
          signed_at: new Date().toISOString(),
          signer_id: user.id,
          signer_ip: "client-side",
          user_agent: navigator.userAgent,
        },
      })
      .eq("id", signingDoc.id);
    if (error) {
      toast.error("Erreur lors de la signature.");
      throw error;
    }
    // Notify consultant via activity log (visible dans le dashboard consultant)
    if (docRecord?.project_id) {
      supabase
        .from("activities")
        .insert({
          user_id: user.id,
          project_id: docRecord.project_id,
          action: "signature",
          description: `${signingDoc.name} signé par le client`,
        })
        .then(({ error: e }) => {
          if (e) console.warn("Activity log failed:", e);
        });
    }
    toast.success("Document signé avec succès !");
    queryClient.invalidateQueries({ queryKey: ["client-documents", user.id] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tous vos documents projets — cliquez pour un aperçu rapide.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Aucun document</h3>
            <p className="text-muted-foreground text-sm">
              Vos documents (CDC, propositions, contrats) apparaîtront ici une fois générés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const status = statusLabels[doc.status || "draft"] || statusLabels.draft;
            const isSigned = doc.status === "signed";
            const needsSignature = doc.requires_signature && !isSigned;
            const issues = getDocumentMissingInfo(doc);
            const project = (doc as { _project?: { name: string; code: string | null; proposal_amount?: number | null; contract_amount?: number | null; estimated_budget_min?: number | null; estimated_budget_max?: number | null; currency?: string | null } | null })._project;

            const buildContextLines = (): SignatureContextLine[] => {
              const lines: SignatureContextLine[] = [
                { label: "Document", value: doc.name },
                { label: "Type", value: typeLabels[doc.type] || doc.type },
                { label: "Date", value: format(new Date(), "dd MMMM yyyy", { locale: fr }) },
              ];
              const currency = project?.currency || "EUR";
              const amt = project?.contract_amount || project?.proposal_amount;
              if (amt) lines.push({ label: "Montant", value: `${amt.toLocaleString("fr-FR")} ${currency}` });
              else if (project?.estimated_budget_min || project?.estimated_budget_max) {
                const min = project.estimated_budget_min;
                const max = project.estimated_budget_max;
                lines.push({ label: "Estimation", value: min && max ? `${min.toLocaleString("fr-FR")} – ${max.toLocaleString("fr-FR")} ${currency}` : `${(max || min)?.toLocaleString("fr-FR")} ${currency}` });
              }
              return lines;
            };

            return (
              <Card
                key={doc.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setPreviewId(doc.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        {project && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <FolderKanban className="h-2.5 w-2.5" />
                            <span className="font-mono">{project.code || "—"}</span>
                            <span>·</span>
                            <span className="truncate">{project.name}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {typeLabels[doc.type] || doc.type}
                          </Badge>
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                          {needsSignature && (
                            <Badge variant="destructive" className="text-[10px] animate-pulse">
                              <PenLine className="h-2.5 w-2.5 mr-0.5" /> Signature requise
                            </Badge>
                          )}
                          {issues
                            .filter((i) => i.key !== "signature" && i.key !== "draft")
                            .slice(0, 2)
                            .map((i) => (
                              <Badge
                                key={i.key}
                                variant={i.severity === "error" ? "destructive" : "outline"}
                                className="text-[10px] gap-0.5"
                              >
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {i.label}
                              </Badge>
                            ))}
                          <span className="text-xs text-muted-foreground">
                            v{doc.version} ·{" "}
                            {doc.updated_at &&
                              formatDistanceToNow(new Date(doc.updated_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Aperçu"
                        onClick={() => setPreviewId(doc.id)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Télécharger PDF"
                        onClick={() => handleDownloadPDF(doc)}
                        disabled={downloadingId === doc.id}
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {needsSignature && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 px-3 text-xs gradient-primary border-0 gap-1"
                          title="Signer le document"
                          onClick={() => setSigningDoc({ id: doc.id, name: doc.name, contextLines: buildContextLines() })}
                        >
                          <PenLine className="h-3.5 w-3.5" /> Signer
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        title="Ouvrir la page complète"
                      >
                        <Link to={`/client/documents/${doc.id}`}>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {isSigned && doc.signed_at && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-green-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>
                        Signé le{" "}
                        {format(new Date(doc.signed_at), "dd MMM yyyy 'à' HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}

                  {needsSignature && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>En attente de votre signature</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DocumentPreviewModal
        documentId={previewId}
        open={!!previewId}
        onOpenChange={(o) => !o && setPreviewId(null)}
        fullViewPath={(id) => `/client/documents/${id}`}
      />

      <SignaturePad
        open={!!signingDoc}
        onOpenChange={(open) => !open && setSigningDoc(null)}
        documentName={signingDoc?.name || ""}
        onSign={handleSign}
        contextLines={signingDoc?.contextLines}
      />
    </div>
  );
}
