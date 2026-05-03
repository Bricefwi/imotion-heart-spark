import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Search,
  Zap, Database, PlayCircle, XCircle, Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type CronJob = {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
  database: string;
  username: string;
};

type CronRun = {
  jobid: number;
  jobname: string | null;
  runid: number;
  status: string | null;
  return_message: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_ms: number | null;
};

const KNOWN_EDGE_FUNCTIONS = [
  { name: "ai-chat", purpose: "Conversation IA Marc Delaunay (7 phases)", scheduled: false },
  { name: "generate-document", purpose: "Génération CDC / Devis / Contrat", scheduled: false },
  { name: "generate-blog-post", purpose: "Génération auto articles SEO", scheduled: true },
  { name: "process-scheduled-cdc", purpose: "Traitement CDC programmés", scheduled: true },
  { name: "process-sync-queue", purpose: "Worker queue sync lovelib↔Clarivi", scheduled: true },
  { name: "process-email-queue", purpose: "Envoi des emails en file", scheduled: true },
  { name: "send-email", purpose: "Envoi email transactionnel", scheduled: false },
  { name: "send-cdc-email", purpose: "Envoi CDC au client", scheduled: false },
  { name: "send-transactional-email", purpose: "Email transactionnel (templates)", scheduled: false },
  { name: "marketing-webhook", purpose: "Webhook entrant lovelib (HMAC)", scheduled: false },
  { name: "issue-bridge-token", purpose: "Émission token cross-app HMAC", scheduled: false },
  { name: "consume-bridge-token", purpose: "Consommation token cross-app", scheduled: false },
  { name: "verify-lovelib-token", purpose: "Vérification token lovelib", scheduled: false },
  { name: "claim-lovelib-token", purpose: "Réclamation token lovelib", scheduled: false },
  { name: "commercial-agent", purpose: "Agent IA commercial", scheduled: false },
  { name: "auth-email-hook", purpose: "Hook custom emails auth", scheduled: false },
];

function statusBadge(status: string | null | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "succeeded" || s === "success") {
    return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Succès</Badge>;
  }
  if (s === "failed" || s === "error") {
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><XCircle className="h-3 w-3" />Échec</Badge>;
  }
  if (s === "running" || s === "starting") {
    return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1"><Activity className="h-3 w-3 animate-pulse" />En cours</Badge>;
  }
  return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{status || "—"}</Badge>;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export default function ScheduledActions() {
  const [search, setSearch] = useState("");

  const jobsQuery = useQuery({
    queryKey: ["admin-cron-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_cron_jobs");
      if (error) throw error;
      return (data || []) as CronJob[];
    },
    refetchInterval: 30000,
  });

  const runsQuery = useQuery({
    queryKey: ["admin-cron-runs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_cron_runs", { p_limit: 200 });
      if (error) throw error;
      return (data || []) as CronRun[];
    },
    refetchInterval: 15000,
  });

  // Latest run per job
  const latestRunByJob = useMemo(() => {
    const map = new Map<number, CronRun>();
    (runsQuery.data || []).forEach((r) => {
      const existing = map.get(r.jobid);
      if (!existing || (r.start_time && existing.start_time && r.start_time > existing.start_time)) {
        map.set(r.jobid, r);
      }
    });
    return map;
  }, [runsQuery.data]);

  const stats = useMemo(() => {
    const jobs = jobsQuery.data || [];
    const runs = runsQuery.data || [];
    const last24h = runs.filter((r) => r.start_time && new Date(r.start_time).getTime() > Date.now() - 86400000);
    const failed24h = last24h.filter((r) => (r.status || "").toLowerCase() === "failed").length;
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.active).length,
      runs24h: last24h.length,
      failed24h,
    };
  }, [jobsQuery.data, runsQuery.data]);

  const filteredJobs = (jobsQuery.data || []).filter((j) =>
    !search || j.jobname?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRuns = (runsQuery.data || []).filter((r) =>
    !search || r.jobname?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFns = KNOWN_EDGE_FUNCTIONS.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  const refetchAll = async () => {
    await Promise.all([jobsQuery.refetch(), runsQuery.refetch()]);
    toast.success("Données rafraîchies");
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Actions programmées</h1>
              <Badge variant="outline" className="text-[10px]">Control Tower</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Supervision des jobs pg_cron, Edge Functions et historique d'exécution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer par nom…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Button variant="outline" onClick={refetchAll} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Database} label="Jobs cron" value={stats.totalJobs} hint={`${stats.activeJobs} actifs`} />
          <KpiCard icon={Zap} label="Edge Functions" value={KNOWN_EDGE_FUNCTIONS.length} hint={`${KNOWN_EDGE_FUNCTIONS.filter(f=>f.scheduled).length} planifiées`} />
          <KpiCard icon={PlayCircle} label="Runs 24h" value={stats.runs24h} hint="exécutions cron" />
          <KpiCard
            icon={AlertTriangle}
            label="Échecs 24h"
            value={stats.failed24h}
            hint="à investiguer"
            tone={stats.failed24h > 0 ? "danger" : "success"}
          />
        </div>

        <Tabs defaultValue="jobs">
          <TabsList>
            <TabsTrigger value="jobs" className="gap-2"><Database className="h-4 w-4" />Jobs cron</TabsTrigger>
            <TabsTrigger value="runs" className="gap-2"><Clock className="h-4 w-4" />Historique</TabsTrigger>
            <TabsTrigger value="functions" className="gap-2"><Zap className="h-4 w-4" />Edge Functions</TabsTrigger>
          </TabsList>

          {/* JOBS */}
          <TabsContent value="jobs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Jobs pg_cron</CardTitle>
                <CardDescription>Tâches planifiées dans la base. Dernier run et statut.</CardDescription>
              </CardHeader>
              <CardContent>
                {jobsQuery.isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : jobsQuery.error ? (
                  <ErrorState message={(jobsQuery.error as Error).message} />
                ) : filteredJobs.length === 0 ? (
                  <EmptyState icon={Database} title="Aucun job cron" hint="Aucune tâche planifiée trouvée." />
                ) : (
                  <ScrollArea className="max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Actif</TableHead>
                          <TableHead>Dernier run</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Durée</TableHead>
                          <TableHead>Erreur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobs.map((job) => {
                          const last = latestRunByJob.get(job.jobid);
                          return (
                            <TableRow key={job.jobid}>
                              <TableCell className="font-medium">{job.jobname || `#${job.jobid}`}</TableCell>
                              <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{job.schedule}</code></TableCell>
                              <TableCell>
                                {job.active
                                  ? <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Actif</Badge>
                                  : <Badge variant="outline">Désactivé</Badge>}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {last?.start_time
                                  ? formatDistanceToNow(new Date(last.start_time), { addSuffix: true, locale: fr })
                                  : "—"}
                              </TableCell>
                              <TableCell>{statusBadge(last?.status)}</TableCell>
                              <TableCell className="text-xs">{formatDuration(last?.duration_ms ?? null)}</TableCell>
                              <TableCell className="max-w-xs">
                                {last?.return_message && (last.status || "").toLowerCase() === "failed" ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-destructive truncate block cursor-help">
                                        {last.return_message.slice(0, 60)}{last.return_message.length > 60 ? "…" : ""}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md">
                                      <pre className="text-xs whitespace-pre-wrap">{last.return_message}</pre>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RUNS */}
          <TabsContent value="runs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique des exécutions</CardTitle>
                <CardDescription>200 derniers runs cron, plus récents en premier.</CardDescription>
              </CardHeader>
              <CardContent>
                {runsQuery.isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : runsQuery.error ? (
                  <ErrorState message={(runsQuery.error as Error).message} />
                ) : filteredRuns.length === 0 ? (
                  <EmptyState icon={Clock} title="Aucun run" hint="Pas d'exécution récente." />
                ) : (
                  <ScrollArea className="max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job</TableHead>
                          <TableHead>Démarré</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Durée</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRuns.map((r) => (
                          <TableRow key={r.runid}>
                            <TableCell className="font-medium text-xs">{r.jobname || `#${r.jobid}`}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.start_time ? formatDistanceToNow(new Date(r.start_time), { addSuffix: true, locale: fr }) : "—"}
                            </TableCell>
                            <TableCell>{statusBadge(r.status)}</TableCell>
                            <TableCell className="text-xs">
                              <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3 text-muted-foreground" />{formatDuration(r.duration_ms)}</span>
                            </TableCell>
                            <TableCell className="max-w-md">
                              {r.return_message ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`text-xs truncate block cursor-help ${(r.status || "").toLowerCase() === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                                      {r.return_message.slice(0, 80)}{r.return_message.length > 80 ? "…" : ""}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <pre className="text-xs whitespace-pre-wrap">{r.return_message}</pre>
                                  </TooltipContent>
                                </Tooltip>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EDGE FUNCTIONS */}
          <TabsContent value="functions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edge Functions déployées</CardTitle>
                <CardDescription>
                  Inventaire des fonctions serverless. Les logs détaillés sont consultables côté Lovable Cloud.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredFns.map((fn) => (
                    <div key={fn.name} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                          <code className="text-sm font-medium truncate">{fn.name}</code>
                        </div>
                        <p className="text-xs text-muted-foreground">{fn.purpose}</p>
                      </div>
                      {fn.scheduled
                        ? <Badge className="bg-primary/15 text-primary border-primary/30 shrink-0">Cron</Badge>
                        : <Badge variant="outline" className="shrink-0">HTTP</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, tone = "default",
}: {
  icon: typeof Activity; label: string; value: number | string; hint?: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneCls =
    tone === "danger" ? "text-destructive" :
    tone === "success" ? "text-emerald-600 dark:text-emerald-400" :
    "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneCls}`} />
        </div>
        <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Activity; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-destructive">Impossible de charger les données</p>
        <p className="text-xs text-muted-foreground mt-1 break-words">{message}</p>
      </div>
    </div>
  );
}
