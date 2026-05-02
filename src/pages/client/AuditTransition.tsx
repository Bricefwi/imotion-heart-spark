import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, Sparkles, Inbox, FileSearch, Webhook,
  Database, Link2, FolderKanban, CheckCircle2, AlertCircle, Clock,
  Copy, ChevronDown, ChevronUp, RefreshCw, ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Audit = {
  id: string;
  status: string;
  source: string;
  external_id: string | null;
  company_name: string | null;
  website_url: string | null;
  score: number | null;
  summary: string | null;
  recommendations: any;
  full_payload: any;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
};

type LinkRow = {
  audit_id: string;
  project_id: string;
  created_at: string;
  note: string | null;
  linked_by: string;
  projects: { id: string; name: string; code: string | null; status: string } | null;
};

type SyncJob = {
  id: string;
  job_type: string;
  status: string;
  attempts: number;
  max_attempts: number;
  dedupe_key: string | null;
  last_error: string | null;
  next_retry_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  related_project_id: string | null;
  payload: any;
};

type SyncLog = {
  id: string;
  job_id: string;
  attempt_number: number;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  response_code: number | null;
  response_snippet: string | null;
  created_at: string;
};

type ActivityRow = {
  id: string;
  action: string;
  description: string | null;
  metadata: any;
  importance: string | null;
  created_at: string;
};

type TimelineEvent = {
  ts: string;
  kind: "audit_received" | "audit_completed" | "merge" | "webhook" | "sync_job" | "sync_attempt" | "link" | "activity";
  title: string;
  description?: string;
  status?: "ok" | "pending" | "error";
  ids?: { label: string; value: string }[];
  raw?: any;
};

function CopyId({ value, label }: { value: string; label?: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast({ title: "Copié", description: value });
      }}
      className="inline-flex items-center gap-1 font-mono text-[10px] bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded transition-colors"
      title={`Copier ${label ?? "l'ID"}`}
    >
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span className="truncate max-w-[180px]">{value}</span>
      <Copy className="h-2.5 w-2.5" />
    </button>
  );
}

function statusDot(status?: "ok" | "pending" | "error") {
  if (status === "ok") return "bg-green-500 border-green-500";
  if (status === "error") return "bg-primary/50 border-red-500";
  if (status === "pending") return "bg-secondary/50 border-orange-500";
  return "bg-muted border-border";
}

function eventIcon(kind: TimelineEvent["kind"]) {
  switch (kind) {
    case "audit_received": return Inbox;
    case "audit_completed": return FileSearch;
    case "merge": return Database;
    case "webhook": return Webhook;
    case "sync_job": return RefreshCw;
    case "sync_attempt": return Clock;
    case "link": return Link2;
    case "activity": return CheckCircle2;
  }
}

export default function AuditTransition() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [showRawPayload, setShowRawPayload] = useState(false);

  async function load() {
    if (!user || !id) return;
    setLoading(true);
    try {
      const { data: a, error: aErr } = await supabase
        .from("marketing_audits")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (aErr) throw aErr;
      if (!a) {
        setAudit(null);
        setLoading(false);
        return;
      }
      setAudit(a as Audit);

      const [{ data: lnk }, { data: js }, { data: acts }] = await Promise.all([
        supabase
          .from("audit_to_project_links")
          .select("audit_id, project_id, created_at, note, linked_by, projects(id, name, code, status)")
          .eq("audit_id", id),
        supabase
          .from("sync_queue")
          .select("id, job_type, status, attempts, max_attempts, dedupe_key, last_error, next_retry_at, created_at, updated_at, completed_at, related_project_id, payload")
          .or(`dedupe_key.eq.audit:${id},payload->>audit_id.eq.${id}`)
          .order("created_at", { ascending: true }),
        supabase
          .from("activities")
          .select("id, action, description, metadata, importance, created_at")
          .eq("user_id", user.id)
          .or(`metadata->>audit_id.eq.${id},action.eq.marketing_audit_merged`)
          .order("created_at", { ascending: true })
          .limit(50),
      ]);

      const linkRows = (lnk ?? []) as any as LinkRow[];
      const jobRows = (js ?? []) as SyncJob[];
      setLinks(linkRows);
      setJobs(jobRows);
      // Filter activities client-side strictly to this audit id
      const filteredActs = (acts ?? []).filter(
        (x: any) => x.metadata?.audit_id === id || (x.action === "marketing_audit_merged" && jobRows.length === 0)
      );
      setActivities(filteredActs as ActivityRow[]);

      if (jobRows.length > 0) {
        const jobIds = jobRows.map((j) => j.id);
        const { data: lg } = await supabase
          .from("sync_logs")
          .select("*")
          .in("job_id", jobIds)
          .order("created_at", { ascending: true });
        setLogs((lg ?? []) as SyncLog[]);
      } else {
        setLogs([]);
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message ?? "Impossible de charger les détails.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user, id]);

  // Realtime: refresh on sync_queue/sync_logs/audit_to_project_links changes
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`audit-transition-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_queue" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_to_project_links" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_audits", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const events = useMemo<TimelineEvent[]>(() => {
    if (!audit) return [];
    const evts: TimelineEvent[] = [];

    // 1. Audit received
    evts.push({
      ts: audit.created_at,
      kind: "audit_received",
      title: "Audit reçu",
      description: `Source: ${audit.source}${audit.external_id ? ` · external_id: ${audit.external_id}` : ""}`,
      status: "ok",
      ids: [
        { label: "audit_id", value: audit.id },
        ...(audit.external_id ? [{ label: "external_id", value: audit.external_id }] : []),
      ],
    });

    // 2. Audit completed
    if (audit.completed_at) {
      evts.push({
        ts: audit.completed_at,
        kind: "audit_completed",
        title: "Audit terminé",
        description: audit.score !== null ? `Score: ${audit.score}/100` : undefined,
        status: "ok",
      });
    }

    // 3. Webhook source detection (heuristique : full_payload contient signature/source)
    const fp = audit.full_payload || {};
    if (fp?.source === "lovelib_webhook" || fp?._webhook) {
      evts.push({
        ts: audit.updated_at,
        kind: "webhook",
        title: "Webhook lovelib reçu (HMAC vérifié)",
        description: "Signature HMAC-SHA256 + nonce + timestamp validés",
        status: "ok",
        ids: fp?._webhook?.nonce ? [{ label: "nonce", value: fp._webhook.nonce }] : undefined,
      });
    } else if (fp?.source === "lovelib_sdk" || audit.source === "lovelib") {
      evts.push({
        ts: audit.updated_at,
        kind: "merge",
        title: "merge_marketing_into_project (SDK / RPC)",
        description: "Fusion synchrone via RPC user-authentifiée (RLS)",
        status: "ok",
      });
    }

    // 4. Sync queue jobs
    jobs.forEach((j) => {
      const jobStatus: "ok" | "pending" | "error" =
        j.status === "success" ? "ok"
        : j.status === "dead_letter" || j.status === "failed" ? "error"
        : "pending";
      evts.push({
        ts: j.created_at,
        kind: "sync_job",
        title: `Job sync_queue : ${j.job_type}`,
        description: `Status: ${j.status} · ${j.attempts}/${j.max_attempts} tentatives${j.last_error ? ` · ${j.last_error.slice(0, 120)}` : ""}`,
        status: jobStatus,
        ids: [
          { label: "job_id", value: j.id },
          ...(j.dedupe_key ? [{ label: "dedupe_key", value: j.dedupe_key }] : []),
        ],
        raw: j,
      });

      // Logs of this job
      logs
        .filter((l) => l.job_id === j.id)
        .forEach((l) => {
          evts.push({
            ts: l.created_at,
            kind: "sync_attempt",
            title: `Tentative #${l.attempt_number} — ${l.status}`,
            description: [
              l.duration_ms ? `${l.duration_ms}ms` : null,
              l.response_code ? `HTTP ${l.response_code}` : null,
              l.error_message?.slice(0, 140),
            ].filter(Boolean).join(" · "),
            status: l.status === "success" ? "ok" : l.status === "partial" ? "pending" : "error",
          });
        });

      if (j.completed_at) {
        evts.push({
          ts: j.completed_at,
          kind: "sync_job",
          title: `Job ${j.job_type} terminé`,
          description: `Status final: ${j.status}`,
          status: jobStatus,
        });
      }
    });

    // 5. Project links
    links.forEach((l) => {
      evts.push({
        ts: l.created_at,
        kind: "link",
        title: "Lié à un projet Clarivi",
        description: l.projects ? `${l.projects.code ?? ""} ${l.projects.name}`.trim() : "Projet",
        status: "ok",
        ids: [{ label: "project_id", value: l.project_id }],
      });
    });

    // 6. Activities (filtered)
    activities.forEach((act) => {
      evts.push({
        ts: act.created_at,
        kind: "activity",
        title: act.action,
        description: act.description ?? undefined,
        status: act.importance === "high" ? "error" : "ok",
      });
    });

    return evts.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [audit, jobs, logs, links, activities]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Audit introuvable ou accès refusé.{" "}
            <Link to="/client/audits" className="underline font-medium">
              Retour à la liste
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const finalProject = links[0]?.projects;
  const hasError = jobs.some((j) => j.status === "dead_letter" || j.status === "failed");

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/client/audits">
            <ArrowLeft className="h-4 w-4 mr-1" /> Mes audits
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Transition de l'audit
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {audit.company_name || audit.website_url || "Audit"} · reçu{" "}
              {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-2" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Identifiers card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identifiants techniques</CardTitle>
          <CardDescription>Cliquez pour copier</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <CopyId label="audit_id" value={audit.id} />
          {audit.external_id && <CopyId label="external_id" value={audit.external_id} />}
          {jobs.map((j) => (
            <CopyId key={j.id} label={`job:${j.job_type}`} value={j.id} />
          ))}
          {links.map((l) => (
            <CopyId key={l.project_id} label="project_id" value={l.project_id} />
          ))}
        </CardContent>
      </Card>

      {/* Final state */}
      {finalProject ? (
        <Alert className="border-green-500/40 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
            <span>
              Audit fusionné dans le projet{" "}
              <strong>
                {finalProject.code ? `${finalProject.code} — ` : ""}
                {finalProject.name}
              </strong>
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/client/projects/${finalProject.id}/conversation`}>
                Ouvrir la découverte <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : hasError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Un job de synchronisation est en échec (dead-letter). Un administrateur peut le relancer depuis la sync queue.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>Transition en cours…</AlertDescription>
        </Alert>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline complète</CardTitle>
          <CardDescription>
            {events.length} événement{events.length !== 1 ? "s" : ""} · Webhook + RPC merge + sync_queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun événement enregistré.</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              <ol className="space-y-4">
                {events.map((evt, i) => {
                  const Icon = eventIcon(evt.kind);
                  return (
                    <li key={i} className="relative pl-8">
                      <div
                        className={`absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-background ${statusDot(evt.status)}`}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{evt.title}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {evt.kind}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(evt.ts), "dd/MM HH:mm:ss", { locale: fr })}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-muted-foreground break-words">{evt.description}</p>
                        )}
                        {evt.ids && evt.ids.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {evt.ids.map((id) => (
                              <CopyId key={id.label + id.value} label={id.label} value={id.value} />
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync queue jobs detail */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs sync_queue ({jobs.length})</CardTitle>
            <CardDescription>Détail des jobs liés à cet audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((j) => {
              const jobLogs = logs.filter((l) => l.job_id === j.id);
              return (
                <div key={j.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-semibold">{j.job_type}</code>
                      <Badge
                        variant={
                          j.status === "success" ? "default"
                          : j.status === "dead_letter" ? "destructive"
                          : "secondary"
                        }
                      >
                        {j.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {j.attempts}/{j.max_attempts} tentatives
                      </span>
                    </div>
                    <CopyId label="job" value={j.id} />
                  </div>
                  {j.last_error && (
                    <pre className="text-[11px] bg-destructive/5 border border-destructive/20 text-destructive rounded p-2 overflow-x-auto">
                      {j.last_error}
                    </pre>
                  )}
                  {jobLogs.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tentatives</p>
                      {jobLogs.map((l) => (
                        <div key={l.id} className="text-xs flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-muted-foreground">#{l.attempt_number}</span>
                          <Badge variant={l.status === "success" ? "default" : "secondary"} className="text-[10px]">
                            {l.status}
                          </Badge>
                          {l.duration_ms && <span className="text-muted-foreground">{l.duration_ms}ms</span>}
                          {l.response_code && <span className="text-muted-foreground">HTTP {l.response_code}</span>}
                          {l.error_message && <span className="text-destructive truncate">{l.error_message}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Raw payload */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowRawPayload((v) => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <CardTitle className="text-base">Payload complet</CardTitle>
              <CardDescription>JSON brut reçu de lovelib</CardDescription>
            </div>
            {showRawPayload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {showRawPayload && (
          <CardContent>
            <pre className="text-[11px] bg-muted rounded p-3 overflow-x-auto max-h-96">
              {JSON.stringify(audit.full_payload, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
