import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  FileText, Download, Eye, PenLine, Loader2, CheckCircle,
  Clock, Search, Filter, FolderOpen, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { SignaturePad } from "@/components/SignaturePad";
import { motion } from "framer-motion";

const typeConfig: Record<string, { label: string; icon: string }> = {
  cdc: { label: "Cahier des charges", icon: "📋" },
  proposal: { label: "Devis", icon: "💰" },
  contract: { label: "Contrat", icon: "📝" },
  contract_fr: { label: "Contrat", icon: "📝" },
  tech_recommendation: { label: "Reco Technique", icon: "⚙️" },
  pricing: { label: "Proposition tarifaire", icon: "💶" },
  invoice: { label: "Facture", icon: "🧾" },
  appendix: { label: "Annexe", icon: "📎" },
  specification: { label: "Spécifications", icon: "📐" },
  upload: { label: "Upload", icon: "📤" },
  other: { label: "Autre", icon: "📄" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: rawDocuments = [], isLoading } = useQuery({
    queryKey: ["client-documents", user?.id],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("client_id", user!.id);
      if (!projects || projects.length === 0) return [];

      const projectMap: Record<string, string> = {};
      projects.forEach((p) => { projectMap[p.id] = p.name; });

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projects.map((p) => p.id))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d) => ({ ...d, project_name: projectMap[d.project_id] || "" }));
    },
    enabled: !!user,
  });

  const documents = rawDocuments.filter((d) => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d as any).project_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const pendingSignatures = rawDocuments.filter((d) => d.requires_signature && d.status !== "signed");

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
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">📄 Mes documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {rawDocuments.length} document{rawDocuments.length !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Pending signatures alert */}
      {pendingSignatures.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm border-l-4 border-l-destructive bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {pendingSignatures.length} document{pendingSignatures.length > 1 ? "s" : ""} en attente de signature
                </p>
                <p className="text-xs text-muted-foreground">
                  Veuillez signer vos documents pour continuer le processus.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type de document" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="cdc">Cahier des charges</SelectItem>
            <SelectItem value="proposal">Devis</SelectItem>
            <SelectItem value="contract">Contrat</SelectItem>
            <SelectItem value="invoice">Facture</SelectItem>
            <SelectItem value="specification">Spécifications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <FolderOpen className="h-14 w-14 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">
              {search || typeFilter !== "all" ? "Aucun document trouvé" : "Aucun document"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {search || typeFilter !== "all"
                ? "Essayez de modifier vos filtres."
                : "Vos documents (CDC, devis, contrats) apparaîtront ici une fois générés."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc, i) => {
            const status = statusConfig[doc.status || "draft"] || statusConfig.draft;
            const type = typeConfig[doc.type] || typeConfig.other;
            const isSigned = doc.status === "signed";
            const needsSignature = doc.requires_signature && !isSigned;

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`border-0 shadow-sm hover:shadow-md transition-all ${needsSignature ? "ring-1 ring-destructive/30" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                        {type.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(doc as any).project_name} · v{doc.version}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant={status.variant} className="text-[10px]">
                              {status.label}
                            </Badge>
                            {needsSignature && (
                              <Badge variant="destructive" className="text-[10px] animate-pulse">
                                <PenLine className="h-2.5 w-2.5 mr-0.5" /> À signer
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Meta + actions */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {doc.updated_at
                              ? formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: fr })
                              : ""}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                              <Link to={`/client/documents/${doc.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                              </Link>
                            </Button>
                            {needsSignature && (
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs gradient-primary border-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSigningDoc(doc);
                                }}
                              >
                                <PenLine className="h-3.5 w-3.5 mr-1" /> Signer
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Signed info */}
                        {isSigned && doc.signed_at && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Signé le {format(new Date(doc.signed_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <SignaturePad
        open={!!signingDoc}
        onOpenChange={(open) => !open && setSigningDoc(null)}
        documentName={signingDoc?.name || ""}
        onSign={handleSign}
      />
    </div>
  );
}
