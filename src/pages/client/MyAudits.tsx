import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Sparkles, ExternalLink, FolderKanban, Plus,
  CheckCircle2, Clock, AlertCircle, Link2, FileSearch, Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type AuditStatus = "in_progress" | "completed" | "failed";

type Audit = {
  id: string;
  status: AuditStatus | string;
  source: string;
  external_id: string | null;
  company_name: string | null;
  website_url: string | null;
  score: number | null;
  summary: string | null;
  recommendations: any;
  created_at: string;
  completed_at: string | null;
};

type LinkRow = {
  audit_id: string;
  project_id: string;
  created_at: string;
  projects: { id: string; name: string; code: string | null; status: string } | null;
};

type Step = "received" | "completed" | "linked" | "in_project";

function statusBadge(status: string) {
  if (status === "completed")
    return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Terminé</Badge>;
  if (status === "failed")
    return <Badge variant="destructive">Échec</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />En cours</Badge>;
}

function StepLine({ step, currentStep }: { step: { key: Step; label: string; icon: any }; currentStep: Step }) {
  const order: Step[] = ["received", "completed", "linked", "in_project"];
  const idx = order.indexOf(step.key);
  const cur = order.indexOf(currentStep);
  const done = idx <= cur;
  const Icon = step.icon;
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
          done
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        <Icon className="h-3 w-3" />
      </div>
      <span className={done ? "font-medium text-foreground" : "text-muted-foreground"}>{step.label}</span>
    </div>
  );
}

export default function MyAudits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const { data: aud, error: aErr } = await supabase
        .from("marketing_audits")
        .select("id, status, source, external_id, company_name, website_url, score, summary, recommendations, created_at, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (aErr) throw aErr;

      const auditList = (aud ?? []) as Audit[];
      setAudits(auditList);

      if (auditList.length > 0) {
        const ids = auditList.map((a) => a.id);
        const { data: lnk, error: lErr } = await supabase
          .from("audit_to_project_links")
          .select("audit_id, project_id, created_at, projects(id, name, code, status)")
          .in("audit_id", ids);
        if (lErr) throw lErr;
        setLinks((lnk ?? []) as any);
      } else {
        setLinks([]);
      }
    } catch (e: any) {
      toast({
        title: "Erreur de chargement",
        description: e?.message ?? "Impossible de charger vos audits.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  const linksByAudit = useMemo(() => {
    const map = new Map<string, LinkRow[]>();
    links.forEach((l) => {
      const arr = map.get(l.audit_id) ?? [];
      arr.push(l);
      map.set(l.audit_id, arr);
    });
    return map;
  }, [links]);

  const stats = useMemo(() => {
    const total = audits.length;
    const completed = audits.filter((a) => a.status === "completed").length;
    const linkedCount = new Set(links.map((l) => l.audit_id)).size;
    return { total, completed, linked: linkedCount, pending: total - linkedCount };
  }, [audits, links]);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Mes audits marketing
          </h1>
          <p className="text-muted-foreground mt-2">
            Suivi de vos audits lovelib jusqu'à leur transformation en projet Clarivi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/client/lovelib-audit">
              <Plus className="h-4 w-4 mr-2" /> Récupérer un audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Terminés</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Liés à un projet</p>
            <p className="text-2xl font-bold text-primary">{stats.linked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Aucun audit pour le moment</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Lancez votre audit marketing gratuit sur lovelib pour démarrer.
              </p>
            </div>
            <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white">
              <Link to="/client/lovelib-audit">
                Récupérer mon audit <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => {
            const auditLinks = linksByAudit.get(audit.id) ?? [];
            const hasProject = auditLinks.length > 0;
            const recCount = Array.isArray(audit.recommendations) ? audit.recommendations.length : 0;

            const currentStep: Step =
              hasProject ? "in_project"
              : audit.status === "completed" ? "completed"
              : "received";

            return (
              <Card key={audit.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {audit.company_name || audit.website_url || "Audit sans nom"}
                        {statusBadge(audit.status)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap text-xs">
                        <span>Source : {audit.source}</span>
                        <span>•</span>
                        <span>
                          Reçu {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true, locale: fr })}
                        </span>
                        {audit.external_id && (
                          <>
                            <span>•</span>
                            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{audit.external_id}</code>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    {audit.score !== null && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {audit.score}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {audit.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{audit.summary}</p>
                  )}

                  {/* Steps */}
                  <div className="flex items-center gap-2 md:gap-4 flex-wrap rounded-lg bg-muted/40 p-3">
                    <StepLine step={{ key: "received", label: "Reçu", icon: Inbox }} currentStep={currentStep} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground hidden md:block" />
                    <StepLine step={{ key: "completed", label: "Audit terminé", icon: FileSearch }} currentStep={currentStep} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground hidden md:block" />
                    <StepLine step={{ key: "linked", label: "Lié à un projet", icon: Link2 }} currentStep={currentStep} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground hidden md:block" />
                    <StepLine step={{ key: "in_project", label: "Dans la découverte", icon: CheckCircle2 }} currentStep={currentStep} />
                  </div>

                  {/* Linked projects */}
                  {hasProject ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Projet{auditLinks.length > 1 ? "s" : ""} associé{auditLinks.length > 1 ? "s" : ""}
                      </p>
                      {auditLinks.map((l) =>
                        l.projects ? (
                          <Link
                            key={l.project_id}
                            to={`/client/projects/${l.project_id}/conversation`}
                            className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FolderKanban className="h-4 w-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {l.projects.code ? `${l.projects.code} — ` : ""}
                                  {l.projects.name}
                                </p>
                                <p className="text-xs text-muted-foreground">Statut : {l.projects.status}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </Link>
                        ) : null
                      )}
                    </div>
                  ) : audit.status === "completed" ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
                        <span>Cet audit n'est pas encore lié à un projet.</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/client/lovelib-audit?audit=${audit.id}`}>
                            Lier à un projet <ArrowRight className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>{recCount} recommandation{recCount !== 1 ? "s" : ""}</span>
                    {audit.website_url && (
                      <a
                        href={audit.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {audit.website_url} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
