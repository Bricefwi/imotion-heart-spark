import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Radar, Search, ExternalLink, Link as LinkIcon, Sparkles,
  CheckCircle2, AlertCircle, RefreshCw, Inbox,
} from "lucide-react";

type AuditStatus = "in_progress" | "completed" | "failed";

interface MarketingAudit {
  id: string;
  user_id: string;
  source: string;
  status: AuditStatus;
  external_id: string | null;
  company_name: string | null;
  website_url: string | null;
  score: number | null;
  summary: string | null;
  recommendations: any;
  created_at: string;
  completed_at: string | null;
}

interface ProjectLite {
  id: string;
  name: string;
  code: string | null;
  status: string;
  client_id: string;
}

export default function MarketingLeads() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [linkFilter, setLinkFilter] = useState<string>("all"); // all | linked | orphan
  const [convertAudit, setConvertAudit] = useState<MarketingAudit | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Audits
  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["admin-marketing-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_audits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as MarketingAudit[];
    },
    refetchInterval: 30000,
  });

  // Liens audit ↔ projet
  const auditIds = audits.map((a) => a.id);
  const { data: links = [] } = useQuery({
    queryKey: ["admin-audit-links", auditIds.length],
    queryFn: async () => {
      if (auditIds.length === 0) return [];
      const { data, error } = await supabase
        .from("audit_to_project_links")
        .select("audit_id, project_id, created_at")
        .in("audit_id", auditIds);
      if (error) throw error;
      return data || [];
    },
    enabled: auditIds.length > 0,
  });

  // Profils utilisateurs
  const userIds = Array.from(new Set(audits.map((a) => a.user_id)));
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-audit-profiles", userIds.length],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name")
        .in("id", userIds);
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileById = useMemo(() => {
    const m = new Map<string, any>();
    profiles.forEach((p: any) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const linksByAudit = useMemo(() => {
    const m = new Map<string, string[]>();
    links.forEach((l: any) => {
      const arr = m.get(l.audit_id) || [];
      arr.push(l.project_id);
      m.set(l.audit_id, arr);
    });
    return m;
  }, [links]);

  // Projets de l'utilisateur sélectionné (pour conversion)
  const { data: candidateProjects = [] } = useQuery({
    queryKey: ["admin-user-projects", convertAudit?.user_id],
    queryFn: async () => {
      if (!convertAudit) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code, status, client_id")
        .eq("client_id", convertAudit.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectLite[];
    },
    enabled: !!convertAudit,
  });

  // Filtres
  const filtered = audits.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    const isLinked = (linksByAudit.get(a.id) || []).length > 0;
    if (linkFilter === "linked" && !isLinked) return false;
    if (linkFilter === "orphan" && isLinked) return false;
    if (search) {
      const s = search.toLowerCase();
      const profile = profileById.get(a.user_id);
      const haystack = [
        a.company_name, a.website_url, a.summary,
        profile?.email, profile?.full_name, profile?.company_name,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    return true;
  });

  // Stats
  const stats = useMemo(() => {
    const total = audits.length;
    const linked = audits.filter((a) => (linksByAudit.get(a.id) || []).length > 0).length;
    const orphans = total - linked;
    const completed = audits.filter((a) => a.status === "completed").length;
    return { total, linked, orphans, completed };
  }, [audits, linksByAudit]);

  // Mutation : créer un nouveau projet à partir de l'audit
  const createProjectMutation = useMutation({
    mutationFn: async (audit: MarketingAudit) => {
      const projectName = audit.company_name
        ? `Projet ${audit.company_name}`
        : `Projet issu d'audit marketing`;
      const { data: project, error: createErr } = await supabase
        .from("projects")
        .insert({
          client_id: audit.user_id,
          name: projectName,
          status: "draft",
          discovery_data: {
            marketing_audit: {
              audit_id: audit.id,
              score: audit.score,
              summary: audit.summary,
              recommendations: audit.recommendations,
              source: "lovelib_admin_conversion",
              received_at: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();
      if (createErr) throw createErr;

      const { error: linkErr } = await supabase
        .from("audit_to_project_links")
        .insert({
          audit_id: audit.id,
          project_id: project.id,
          linked_by: (await supabase.auth.getUser()).data.user!.id,
          note: "Conversion admin depuis dashboard Marketing Leads",
        });
      if (linkErr) throw linkErr;

      return project;
    },
    onSuccess: (project) => {
      toast.success("Projet créé et lié à l'audit");
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-audits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-links"] });
      setConvertAudit(null);
      navigate(`/admin/projects/${project.id}`);
    },
    onError: (err: any) => {
      toast.error("Échec de la création", { description: err.message });
    },
  });

  // Mutation : lier à un projet existant
  const linkExistingMutation = useMutation({
    mutationFn: async ({ audit, projectId }: { audit: MarketingAudit; projectId: string }) => {
      const { data, error } = await supabase.rpc("link_audit_to_project", {
        _audit_id: audit.id,
        _project_id: projectId,
        _note: "Liaison admin via dashboard Marketing Leads",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Audit lié au projet");
      queryClient.invalidateQueries({ queryKey: ["admin-audit-links"] });
      setConvertAudit(null);
      setSelectedProjectId("");
    },
    onError: (err: any) => {
      toast.error("Échec de la liaison", { description: err.message });
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Radar className="w-8 h-8 text-primary" />
            Marketing Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Audits gratuits réalisés via lovelib (imotion-conseils.fr) — convertis-les en projets BUILD.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-marketing-audits"] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Total audits"
          value={stats.total}
          icon={Inbox}
          onClick={() => { setStatusFilter("all"); setLinkFilter("all"); setSearch(""); }}
        />
        <StatTile
          label="Complétés"
          value={stats.completed}
          icon={CheckCircle2}
          tone="success"
          onClick={() => { setStatusFilter("completed"); setLinkFilter("all"); }}
        />
        <StatTile
          label="Convertis"
          value={stats.linked}
          icon={LinkIcon}
          tone="primary"
          onClick={() => { setLinkFilter("linked"); setStatusFilter("all"); }}
        />
        <StatTile
          label="Orphelins"
          value={stats.orphans}
          icon={AlertCircle}
          tone="warning"
          onClick={() => { setLinkFilter("orphan"); setStatusFilter("all"); }}
        />
      </div>


      {/* Filtres */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (email, société, URL…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="completed">Complété</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
            </SelectContent>
          </Select>
          <Select value={linkFilter} onValueChange={setLinkFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Liaison" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="orphan">Orphelins (à convertir)</SelectItem>
              <SelectItem value="linked">Convertis</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Audits ({filtered.length})</CardTitle>
          <CardDescription>
            Cliquez sur "Convertir" pour rattacher l'audit à un projet existant ou en créer un nouveau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucun audit ne correspond aux filtres.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Société / Site</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Liaison</TableHead>
                    <TableHead>Créé</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const profile = profileById.get(a.user_id);
                    const projectIds = linksByAudit.get(a.id) || [];
                    const isLinked = projectIds.length > 0;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">
                            {a.company_name || profile?.company_name || "—"}
                          </div>
                          {a.website_url && (
                            <a
                              href={a.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              {a.website_url} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{profile?.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{profile?.email || ""}</div>
                        </TableCell>
                        <TableCell>
                          {a.score != null ? (
                            <Badge variant={a.score >= 70 ? "default" : a.score >= 40 ? "secondary" : "destructive"}>
                              {a.score}/100
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status === "completed" ? "default" : "outline"}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isLinked ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              {projectIds.length} projet{projectIds.length > 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              Orphelin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isLinked ? "outline" : "default"}
                            onClick={() => {
                              setConvertAudit(a);
                              setSelectedProjectId("");
                            }}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {isLinked ? "Rattacher à un autre" : "Convertir"}
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

      {/* Dialog de conversion */}
      <Dialog open={!!convertAudit} onOpenChange={(o) => !o && setConvertAudit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convertir l'audit en projet</DialogTitle>
            <DialogDescription>
              {convertAudit?.company_name || "Audit"} —{" "}
              {profileById.get(convertAudit?.user_id || "")?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {convertAudit?.summary && (
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                <strong>Résumé :</strong> {convertAudit.summary}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Lier à un projet existant
              </label>
              {candidateProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Cet utilisateur n'a aucun projet existant.
                </p>
              ) : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un projet…" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ` : ""}{p.name} — {p.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="border-t pt-3 text-xs text-muted-foreground">
              Ou créer un nouveau projet pré-rempli avec les données de l'audit.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={!selectedProjectId || linkExistingMutation.isPending}
              onClick={() =>
                convertAudit &&
                selectedProjectId &&
                linkExistingMutation.mutate({ audit: convertAudit, projectId: selectedProjectId })
              }
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Lier au projet sélectionné
            </Button>
            <Button
              disabled={!convertAudit || createProjectMutation.isPending}
              onClick={() => convertAudit && createProjectMutation.mutate(convertAudit)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Créer un nouveau projet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({
  label, value, icon: Icon, tone = "default", onClick,
}: {
  label: string;
  value: number;
  icon: any;
  tone?: "default" | "primary" | "success" | "warning";
  onClick?: () => void;
}) {
  const toneClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-green-600",
    warning: "text-amber-600",
  }[tone];
  const content = (
    <Card className={onClick ? "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30" : undefined}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${toneClasses} opacity-70`} />
      </CardContent>
    </Card>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={`Filtrer : ${label}`} className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg">
        {content}
      </button>
    );
  }
  return content;
}

