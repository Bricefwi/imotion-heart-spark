import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw,
  Zap, Database, XCircle, Heart, TrendingDown, Siren
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type CronJob = {
  jobid: number; jobname: string; schedule: string; command: string;
  active: boolean; database: string; username: string;
};
type CronRun = {
  jobid: number; jobname: string | null; runid: number;
  status: string | null; return_message: string | null;
  start_time: string | null; end_time: string | null; duration_ms: number | null;
};
type SyncLog = {
  id: string; job_id: string; status: string; error_message: string | null;
  created_at: string; response_code: number | null;
};
type EmailLog = {
  id: string; status: string; error_message: string | null;
  created_at: string; template_name: string;
};
type DeadJob = {
  id: string; job_type: string; attempts: number; last_error: string | null;
  next_retry_at: string; updated_at: string;
};

/** Estimate expected interval (ms) from a simple cron expression. */
function expectedIntervalMs(schedule: string): number | null {
  if (!schedule) return null;
  const s = schedule.trim();
  // pg_cron also supports "@every 1 minute" style — be permissive
  if (/^\*\s+\*\s+\*\s+\*\s+\*$/.test(s)) return 60_000;
  const m = s.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (m) return Number(m[1]) * 60_000;
  if (/^0\s+\*\s+\*\s+\*\s+\*$/.test(s)) return 60 * 60_000;
  const h = s.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
  if (h) return Number(h[1]) * 60 * 60_000;
  if (/^0\s+0\s+\*\s+\*\s+\*$/.test(s)) return 24 * 60 * 60_000;
  return null;
}

type Health = "healthy" | "warning" | "critical" | "idle" | "disabled";

interface JobHealth {
  job: CronJob;
  lastRun: CronRun | null;
  runsTotal: number;
  runsFailed: number;
  successRate: number;
  expectedMs: number | null;
  staleness: "ok" | "late" | "stalled" | "unknown";
  health: Health;
  alerts: string[];
}

function healthMeta(h: Health) {
  switch (h) {
    case "healthy": return { label: "Sain", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", icon: CheckCircle2 };
    case "warning": return { label: "Vigilance", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: AlertTriangle };
    case "critical": return { label: "Critique", cls: "bg-destructive/15 text-destructive border-destructive/30", icon: Siren };
    case "idle": return { label: "Inactif", cls: "bg-muted text-muted-foreground border", icon: Clock };
    case "disabled": return { label: "Désactivé", cls: "bg-muted text-muted-foreground border", icon: XCircle };
  }
}

export default function OperationsHealth() {
  const jobsQuery = useQuery({
    queryKey: ["ops-cron-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_cron_jobs");
      if (error) throw error;
      return (data || []) as CronJob[];
    },
    refetchInterval: 30_000,
  });

  const runsQuery = useQuery({
    queryKey: ["ops-cron-runs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_cron_runs", { p_limit: 500 });
      if (error) throw error;
      return (data || []) as CronRun[];
    },
    refetchInterval: 15_000,
  });

  const syncLogsQuery = useQuery({
    queryKey: ["ops-sync-logs"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("sync_logs")
        .select("id,job_id,status,error_message,created_at,response_code")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as SyncLog[];
    },
    refetchInterval: 30_000,
  });

  const deadJobsQuery = useQuery({
    queryKey: ["ops-dead-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_queue")
        .select("id,job_type,attempts,last_error,next_retry_at,updated_at")
        .eq("status", "dead_letter")
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as DeadJob[];
    },
    refetchInterval: 60_000,
  });

  const emailsQuery = useQuery({
    queryKey: ["ops-email-logs"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from("email_send_log")
        .select("id,status,error_message,created_at,template_name")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as EmailLog[];
    },
    refetchInterval: 60_000,
  });

  const jobHealth: JobHealth[] = useMemo(() => {
    const jobs = jobsQuery.data || [];
    const runs = runsQuery.data || [];
    return jobs.map((job) => {
      const jobRuns = runs.filter((r) => r.jobid === job.jobid);
      const lastRun = jobRuns
        .slice()
        .sort((a, b) => (b.start_time || "").localeCompare(a.start_time || ""))[0] || null;
      const failed = jobRuns.filter((r) => (r.status || "").toLowerCase() === "failed").length;
      const successRate = jobRuns.length ? ((jobRuns.length - failed) / jobRuns.length) * 100 : 100;
      const expectedMs = expectedIntervalMs(job.schedule);
      const sinceLast = lastRun?.start_time ? Date.now() - new Date(lastRun.start_time).getTime() : null;

      let staleness: JobHealth["staleness"] = "unknown";
      if (expectedMs && sinceLast !== null) {
        if (sinceLast > expectedMs * 5) staleness = "stalled";
        else if (sinceLast > expectedMs * 2) staleness = "late";
        else staleness = "ok";
      }

      const alerts: string[] = [];
      let health: Health = "healthy";

      if (!job.active) { health = "disabled"; alerts.push("Job désactivé"); }
      else if (!lastRun) { health = "idle"; alerts.push("Aucune exécution enregistrée"); }
      else {
        if ((lastRun.status || "").toLowerCase() === "failed") {
          health = "critical";
          alerts.push("Dernier run en échec");
        }
        if (staleness === "stalled") { health = "critical"; alerts.push("Aucune exécution depuis longtemps"); }
        else if (staleness === "late" && health !== "critical") { health = "warning"; alerts.push("Exécution en retard"); }
        if (successRate < 60 && health !== "critical") { health = "warning"; alerts.push(`Taux de succès faible (${successRate.toFixed(0)}%)`); }
      }

      return {
        job, lastRun, runsTotal: jobRuns.length, runsFailed: failed,
        successRate, expectedMs, staleness, health, alerts,
      };
    });
  }, [jobsQuery.data, runsQuery.data]);

  const incidents = useMemo(() => {
    const list: Array<{ severity: Health; source: string; title: string; detail: string; when: string; link?: string }> = [];

    jobHealth.forEach((j) => {
      if (j.health === "critical" || j.health === "warning") {
        list.push({
          severity: j.health,
          source: "pg_cron",
          title: j.job.jobname || `Job #${j.job.jobid}`,
          detail: j.alerts.join(" · "),
          when: j.lastRun?.start_time || j.job.schedule,
          link: "/admin/scheduled-actions",
        });
      }
    });

    (deadJobsQuery.data || []).forEach((d) => {
      list.push({
        severity: "critical",
        source: "sync_queue",
        title: `Dead-letter : ${d.job_type}`,
        detail: d.last_error?.slice(0, 200) || "Erreur non détaillée",
        when: d.updated_at,
        link: `/admin/sync-queue?job=${d.id}`,
      });
    });

    const failedSync = (syncLogsQuery.data || []).filter((l) => l.status === "failure");
    if (failedSync.length >= 3) {
      list.push({
        severity: failedSync.length >= 10 ? "critical" : "warning",
        source: "edge:process-sync-queue",
        title: `${failedSync.length} échecs sync 24h`,
        detail: failedSync[0]?.error_message?.slice(0, 200) || "Voir logs",
        when: failedSync[0]?.created_at || new Date().toISOString(),
        link: "/admin/sync-queue",
      });
    }

    const failedEmails = (emailsQuery.data || []).filter((e) => e.status === "failed" || e.status === "error");
    if (failedEmails.length >= 3) {
      list.push({
        severity: failedEmails.length >= 10 ? "critical" : "warning",
        source: "edge:send-email",
        title: `${failedEmails.length} emails en erreur 24h`,
        detail: failedEmails[0]?.error_message?.slice(0, 200) || "Voir logs",
        when: failedEmails[0]?.created_at || new Date().toISOString(),
      });
    }

    return list.sort((a, b) => {
      const order = { critical: 0, warning: 1, idle: 2, healthy: 3, disabled: 4 } as const;
      return order[a.severity] - order[b.severity];
    });
  }, [jobHealth, deadJobsQuery.data, syncLogsQuery.data, emailsQuery.data]);

  const kpis = useMemo(() => {
    const critical = jobHealth.filter((j) => j.health === "critical").length
      + (deadJobsQuery.data?.length || 0);
    const warning = jobHealth.filter((j) => j.health === "warning").length;
    const healthy = jobHealth.filter((j) => j.health === "healthy").length;
    const total = jobHealth.length;
    const score = total === 0 ? 100 : Math.max(0, Math.round(((healthy * 100) - (critical * 40) - (warning * 15)) / Math.max(1, total)));
    return { critical, warning, healthy, total, score };
  }, [jobHealth, deadJobsQuery.data]);

  const refetchAll = async () => {
    await Promise.all([jobsQuery.refetch(), runsQuery.refetch(), syncLogsQuery.refetch(), deadJobsQuery.refetch(), emailsQuery.refetch()]);
    toast.success("Santé rafraîchie");
  };

  const loading = jobsQuery.isLoading || runsQuery.isLoading;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Santé des opérations</h1>
            <Badge variant="outline" className="text-[10px]">Live</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Vue agrégée pg_cron + Edge Functions, avec alertes sur erreurs et tâches inactives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/scheduled-actions">Vue détaillée</Link>
          </Button>
          <Button onClick={refetchAll} className="gap-2 bg-gradient-to-r from-primary to-secondary text-white">
            <RefreshCw className="h-4 w-4" />Rafraîchir
          </Button>
        </div>
      </div>

      {/* Score + KPI */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Score de santé global</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {kpis.score}<span className="text-base text-muted-foreground">/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={kpis.score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {kpis.critical > 0 ? "Action requise immédiatement" : kpis.warning > 0 ? "Surveillance recommandée" : "Tous les systèmes opérationnels"}
            </p>
          </CardContent>
        </Card>
        <KpiCard icon={Siren} label="Critiques" value={kpis.critical} tone="danger" />
        <KpiCard icon={AlertTriangle} label="Avertissements" value={kpis.warning} tone={kpis.warning > 0 ? "warning" : "default"} />
        <KpiCard icon={CheckCircle2} label="Sains" value={kpis.healthy} tone="success" />
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Siren className="h-4 w-4 text-destructive" />Incidents actifs
          </CardTitle>
          <CardDescription>Alertes consolidées sur les 24 dernières heures.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : incidents.length === 0 ? (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertTitle>Tout va bien</AlertTitle>
              <AlertDescription>Aucun incident détecté actuellement.</AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-2">
                {incidents.map((inc, i) => {
                  const meta = healthMeta(inc.severity);
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${meta.cls}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{inc.title}</span>
                          <Badge variant="outline" className="text-[10px]">{inc.source}</Badge>
                          <Badge className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{inc.detail}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {inc.when ? formatDistanceToNow(new Date(inc.when), { addSuffix: true, locale: fr }) : "—"}
                        </p>
                      </div>
                      {inc.link && (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={inc.link}>Inspecter</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Job grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />État détaillé par job
          </CardTitle>
          <CardDescription>
            Couleur basée sur dernier statut, fraîcheur (vs schedule) et taux de succès récent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : jobHealth.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun job pg_cron enregistré.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {jobHealth.map((j) => {
                const meta = healthMeta(j.health);
                const Icon = meta.icon;
                return (
                  <div key={j.job.jobid} className="p-3 rounded-lg border bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                          <code className="text-sm font-medium truncate">{j.job.jobname || `#${j.job.jobid}`}</code>
                        </div>
                        <code className="text-[10px] text-muted-foreground">{j.job.schedule}</code>
                      </div>
                      <Badge className={`gap-1 shrink-0 ${meta.cls}`}>
                        <Icon className="h-3 w-3" />{meta.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Dernier run</span>
                      <span>{j.lastRun?.start_time ? formatDistanceToNow(new Date(j.lastRun.start_time), { addSuffix: true, locale: fr }) : "jamais"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Succès (récents)</span>
                      <span className="font-medium">{j.runsTotal === 0 ? "—" : `${j.successRate.toFixed(0)}% (${j.runsTotal - j.runsFailed}/${j.runsTotal})`}</span>
                    </div>
                    <Progress value={j.runsTotal === 0 ? 0 : j.successRate} className="h-1" />
                    {j.alerts.length > 0 && (
                      <div className="flex items-start gap-1 pt-1">
                        <TrendingDown className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-muted-foreground">{j.alerts.join(" · ")}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edge functions proxy health */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />process-sync-queue (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EdgeStats
              loading={syncLogsQuery.isLoading}
              total={(syncLogsQuery.data || []).length}
              failed={(syncLogsQuery.data || []).filter((l) => l.status === "failure").length}
              lastError={(syncLogsQuery.data || []).find((l) => l.status === "failure")?.error_message}
              link="/admin/sync-queue"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />Emails transactionnels (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EdgeStats
              loading={emailsQuery.isLoading}
              total={(emailsQuery.data || []).length}
              failed={(emailsQuery.data || []).filter((e) => e.status === "failed" || e.status === "error").length}
              lastError={(emailsQuery.data || []).find((e) => e.status === "failed" || e.status === "error")?.error_message}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, tone = "default",
}: {
  icon: typeof Activity; label: string; value: number;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const toneCls = tone === "danger" ? "text-destructive" : tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold ${toneCls}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EdgeStats({ loading, total, failed, lastError, link }: {
  loading: boolean; total: number; failed: number; lastError?: string | null; link?: string;
}) {
  if (loading) return <Skeleton className="h-20 w-full" />;
  const rate = total === 0 ? 100 : ((total - failed) / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold">{total}</span>
        <span className="text-xs text-muted-foreground">événements</span>
      </div>
      <Progress value={rate} className="h-1.5" />
      <div className="flex items-center justify-between text-xs">
        <span className={failed > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
          {failed} échec{failed > 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground">{rate.toFixed(0)}% succès</span>
      </div>
      {lastError && (
        <p className="text-[11px] text-destructive line-clamp-2 pt-1 border-t">{lastError}</p>
      )}
      {link && (
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link to={link}>Voir les jobs</Link>
        </Button>
      )}
    </div>
  );
}
