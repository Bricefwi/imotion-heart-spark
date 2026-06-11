import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  AlertTriangle,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  User as UserIcon,
  FolderKanban,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import {
  getDocumentMissingInfo,
  getDocCompleteness,
  type DocLike,
} from "@/lib/document-missing-info";

const typeLabels: Record<string, string> = {
  cdc: "CDC",
  proposal: "Devis",
  contract: "Contrat",
  contract_fr: "Contrat FR",
  tech_recommendation: "Reco Technique",
  pricing: "Tarifs",
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

interface DocumentsManagerProps {
  /** Filtre les projets affichés. undefined = tous les projets */
  scope: "all" | { consultantId: string } | { clientId: string };
  /** Lien vers la page d'ouverture complète (différent selon le rôle) */
  fullViewPath: (id: string) => string;
  title?: string;
  subtitle?: string;
}

type DocRow = DocLike & {
  created_at?: string | null;
  updated_at?: string | null;
  signed_at?: string | null;
  project?: {
    id: string;
    name: string;
    code: string | null;
    client_id: string | null;
    consultant_id: string | null;
    client?: { full_name: string | null; company_name: string | null } | null;
  } | null;
};

export function DocumentsManager({ scope, fullViewPath, title, subtitle }: DocumentsManagerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [missingOnly, setMissingOnly] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents-manager", scope],
    queryFn: async () => {
      let projectQuery = supabase
        .from("projects")
        .select("id, name, code, client_id, consultant_id");

      if (scope !== "all" && "consultantId" in scope) {
        projectQuery = projectQuery.eq("consultant_id", scope.consultantId);
      } else if (scope !== "all" && "clientId" in scope) {
        projectQuery = projectQuery.eq("client_id", scope.clientId);
      }

      const { data: projects, error: pErr } = await projectQuery;
      if (pErr) throw pErr;
      if (!projects || projects.length === 0) return [] as DocRow[];

      const projectMap = new Map(projects.map((p) => [p.id, p]));
      const projectIds = projects.map((p) => p.id);

      const { data: docs, error: dErr } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false });
      if (dErr) throw dErr;
      if (!docs) return [] as DocRow[];

      // Récupère les profils clients
      const clientIds = Array.from(
        new Set(projects.map((p) => p.client_id).filter(Boolean) as string[])
      );
      const { data: clients } = clientIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, company_name")
            .in("id", clientIds)
        : { data: [] as Array<{ id: string; full_name: string | null; company_name: string | null }> };
      const clientMap = new Map((clients || []).map((c) => [c.id, c]));

      return docs.map((d) => {
        const proj = projectMap.get(d.project_id);
        return {
          ...d,
          project: proj
            ? {
                ...proj,
                client: proj.client_id ? clientMap.get(proj.client_id) || null : null,
              }
            : null,
        } as DocRow;
      });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (missingOnly && getDocumentMissingInfo(d).length === 0) return false;
      if (!q) return true;
      const hay = [
        d.name,
        d.project?.name,
        d.project?.code,
        d.project?.client?.full_name,
        d.project?.client?.company_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [documents, search, statusFilter, typeFilter, missingOnly]);

  const stats = useMemo(() => {
    const total = documents.length;
    const withIssues = documents.filter((d) => getDocumentMissingInfo(d).length > 0).length;
    const awaitingSign = documents.filter(
      (d) => d.requires_signature && !d.signed_at
    ).length;
    const drafts = documents.filter((d) => d.status === "draft").length;
    return { total, withIssues, awaitingSign, drafts };
  }, [documents]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">{title || "Documents"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {subtitle || "Tous les documents — client, projet, infos manquantes."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText, tone: "text-primary" },
          {
            label: "Infos manquantes",
            value: stats.withIssues,
            icon: AlertTriangle,
            tone: "text-orange-600",
          },
          {
            label: "Signatures en attente",
            value: stats.awaitingSign,
            icon: Clock,
            tone: "text-amber-600",
          },
          { label: "Brouillons", value: stats.drafts, icon: FileText, tone: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-4.5 w-4.5 ${s.tone}`} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher document, client, projet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={missingOnly ? "default" : "outline"}
            onClick={() => setMissingOnly((v) => !v)}
            className={missingOnly ? "gradient-primary border-0" : ""}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Infos manquantes
          </Button>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Complétude</TableHead>
                    <TableHead>Maj</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => {
                    const issues = getDocumentMissingInfo(doc);
                    const score = getDocCompleteness(doc);
                    const status = statusLabels[doc.status || "draft"] || statusLabels.draft;
                    return (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setPreviewId(doc.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[240px]">
                                {doc.name || (
                                  <span className="text-muted-foreground italic">
                                    Sans nom
                                  </span>
                                )}
                              </p>
                              <div className="flex gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[9px]">
                                  {typeLabels[doc.type || "other"] || doc.type || "—"}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  v{doc.version || 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.project?.client ? (
                            <div className="min-w-0">
                              <p className="text-sm flex items-center gap-1">
                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                {doc.project.client.full_name || "—"}
                              </p>
                              {doc.project.client.company_name && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-2.5 w-2.5" />
                                  {doc.project.client.company_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Non renseigné
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.project ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <FolderKanban className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <p className="font-mono text-[10px] text-muted-foreground">
                                  {doc.project.code || "—"}
                                </p>
                                <p className="truncate max-w-[180px]">{doc.project.name}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-destructive">Aucun projet</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                          {doc.signed_at && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-green-700">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Signé
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full ${
                                  score >= 80
                                    ? "bg-green-500"
                                    : score >= 50
                                    ? "bg-amber-500"
                                    : "bg-destructive"
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{score}%</span>
                          </div>
                          {issues.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                              {issues.slice(0, 2).map((i) => (
                                <Badge
                                  key={i.key}
                                  variant={i.severity === "error" ? "destructive" : "outline"}
                                  className="text-[9px] px-1 py-0"
                                >
                                  {i.label}
                                </Badge>
                              ))}
                              {issues.length > 2 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                  +{issues.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {doc.updated_at &&
                            formatDistanceToNow(new Date(doc.updated_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewId(doc.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentPreviewModal
        documentId={previewId}
        open={!!previewId}
        onOpenChange={(o) => !o && setPreviewId(null)}
        fullViewPath={fullViewPath}
      />
    </div>
  );
}
