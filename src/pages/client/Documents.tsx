import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, PenLine, Loader2, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { SignaturePad } from "@/components/SignaturePad";

const typeLabels: Record<string, string> = {
  cdc: "CDC",
  proposal: "Devis",
  contract: "Contrat",
  invoice: "Facture",
  appendix: "Annexe",
  specification: "Spécifications",
  upload: "Upload",
  other: "Autre",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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
  const [signingDoc, setSigningDoc] = useState<any>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["client-documents", user?.id],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", user!.id);

      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSign = async (signatureDataUrl: string) => {
    if (!signingDoc || !user) return;

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

    toast.success("Document signé avec succès !");
    queryClient.invalidateQueries({ queryKey: ["client-documents", user.id] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">Tous vos documents projets</p>
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

            return (
              <Card key={doc.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{typeLabels[doc.type] || doc.type}</Badge>
                          <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                          {needsSignature && (
                            <Badge variant="destructive" className="text-[10px] animate-pulse">
                              <PenLine className="h-2.5 w-2.5 mr-0.5" /> Signature requise
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            v{doc.version} · {doc.updated_at && formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
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
                      {needsSignature && (
                        <Button
                          size="sm"
                          className="gradient-primary border-0"
                          onClick={() => setSigningDoc(doc)}
                        >
                          <PenLine className="h-3.5 w-3.5 mr-1" /> Signer
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Signature info */}
                  {isSigned && doc.signed_at && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-green-700 bg-green-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>
                        Signé le {format(new Date(doc.signed_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
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

      {/* Signature dialog */}
      <SignaturePad
        open={!!signingDoc}
        onOpenChange={(open) => !open && setSigningDoc(null)}
        documentName={signingDoc?.name || ""}
        onSign={handleSign}
      />
    </div>
  );
}
