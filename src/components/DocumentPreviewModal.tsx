import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, FileDown, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { ProfessionalDocument } from "@/components/ProfessionalDocument";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDocumentMissingInfo } from "@/lib/document-missing-info";
import { toast } from "sonner";

interface DocumentPreviewModalProps {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lien vers la page complète d'ouverture (varie selon le rôle de l'utilisateur) */
  fullViewPath?: (id: string) => string;
}

export function DocumentPreviewModal({
  documentId,
  open,
  onOpenChange,
  fullViewPath = (id) => `/client/documents/${id}`,
}: DocumentPreviewModalProps) {
  const { data: doc, isLoading } = useQuery({
    queryKey: ["doc-preview", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!documentId && open,
  });

  const { data: project } = useQuery({
    queryKey: ["doc-preview-project", doc?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, name, code, client:profiles!projects_client_id_fkey(full_name, company_name)"
        )
        .eq("id", doc!.project_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!doc?.project_id,
  });

  const client = project?.client as { full_name?: string; company_name?: string } | undefined;
  const issues = doc ? getDocumentMissingInfo(doc) : [];

  const handleDownload = async () => {
    if (!doc) return;
    if (doc.storage_path) {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);
      if (error) {
        toast.error("Erreur de téléchargement");
        return;
      }
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${doc.name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const btn = window.document.querySelector("[data-pdf-export]") as HTMLButtonElement;
      if (btn) btn.click();
      else toast.info("Utilisez le bouton 'Exporter en PDF' dans l'aperçu.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base">
                  {doc?.name || "Aperçu document"}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {project && (
                    <Badge variant="outline" className="text-[10px]">
                      {project.code || "—"} · {project.name}
                    </Badge>
                  )}
                  {client && (
                    <Badge variant="secondary" className="text-[10px]">
                      {client.full_name}
                      {client.company_name ? ` — ${client.company_name}` : ""}
                    </Badge>
                  )}
                  {issues.map((i) => (
                    <Badge
                      key={i.key}
                      variant={i.severity === "error" ? "destructive" : "outline"}
                      className="text-[10px] gap-1"
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {i.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!doc}>
                <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
              {doc && (
                <Button asChild size="sm" className="gradient-primary border-0">
                  <Link to={fullViewPath(doc.id)} onClick={() => onOpenChange(false)}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ouvrir
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/30">
          {isLoading || !doc ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4">
              <ProfessionalDocument
                content={
                  (doc as unknown as { content_markdown?: string }).content_markdown ||
                  doc.description ||
                  "Aucun contenu disponible pour ce document."
                }
                documentName={doc.name}
                projectName={project?.name}
                projectCode={project?.code || undefined}
                clientName={client?.full_name}
                clientCompany={client?.company_name}
                version={doc.version || 1}
                date={
                  doc.created_at
                    ? format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })
                    : undefined
                }
                status={doc.status || "draft"}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
