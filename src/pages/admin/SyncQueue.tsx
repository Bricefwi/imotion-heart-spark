import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { RefreshCw, RotateCw, Eye, Inbox, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";

type SyncStatus = "pending" | "processing" | "success" | "dead_letter" | "failed";

interface SyncJob {
  id: string;
  job_type: string;
  status: SyncStatus;
  attempts: number;
  max_attempts: number;
  payload: any;
  dedupe_key: string | null;
  last_error: string | null;
  next_retry_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  worker_id: string | null;
  related_project_id: string | null;
  related_user_id: string | null;
}

interface SyncLog {
  id: string;
  job_id: string;
  attempt_number: number;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  response_code: number | null;
  response_snippet: string | null;
  worker_id: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  processing: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  failed: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  dead_letter: "bg-destructive/15 text-destructive",
};

export default function SyncQueue() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["sync-queue-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_queue")
        .select("status");
      if (error) throw error;
      const counts: Record<string, number> = { pending: 0, processing: 0, success: 0, failed: 0, dead_letter: 0 };
      (data || []).forEach((r: any) => { counts[r.status] = (counts[r.status] || 0) + 1; });
      return counts;
    },
    refetchInterval: 15000,
  });

  const { data: jobTypes = [] } = useQuery({
    queryKey: ["sync-queue-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_queue")
        .select("job_type")
        .limit(1000);
      if (error) throw error;
      return Array.from(new Set((data || []).map((r: any) => r.job_type))).sort();
    },
  });

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ["sync-queue", statusFilter, typeFilter, search],
    queryFn: async () => {
      let q = supabase
        .from("sync_queue")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      if (typeFilter !== "all") q = q.eq("job_type", typeFilter);
      if (search.trim()) q = q.or(`dedupe_key.ilike.%${search}%,id.eq.${isUuid(search) ? search : "00000000-0000-0000-0000-000000000000"}`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SyncJob[];
    },
    refetchInterval: 15000,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["sync-logs", selectedJob?.id],
    enabled: !!selectedJob?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .eq("job_id", selectedJob!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SyncLog[];
    },
  });

  const requeue = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.rpc("requeue_sync_job", { _job_id: jobId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job remis en file");
      qc.invalidateQueries({ queryKey: ["sync-queue"] });
      qc.invalidateQueries({ queryKey: ["sync-queue-stats"] });
    },
    onError: (e: any) => toast.error(e.message || "Échec du requeue"),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sync Queue</h1>
          <p className="text-sm text-muted-foreground">File d'attente de synchronisation et journaux d'exécution</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Clock} label="Pending" value={stats?.pending ?? 0} color="text-amber-600" />
        <StatCard icon={Loader2} label="Processing" value={stats?.processing ?? 0} color="text-blue-600" />
        <StatCard icon={CheckCircle2} label="Success" value={stats?.success ?? 0} color="text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Failed" value={stats?.failed ?? 0} color="text-orange-600" />
        <StatCard icon={AlertTriangle} label="Dead letter" value={stats?.dead_letter ?? 0} color="text-destructive" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="dead_letter">Dead letter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Type de job" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {jobTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Rechercher (dedupe_key ou UUID)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Jobs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Aucun job correspondant</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Tentatives</TableHead>
                  <TableHead>Prochain retry</TableHead>
                  <TableHead>Mis à jour</TableHead>
                  <TableHead>Dedupe</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.job_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[job.status]}>{job.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{job.attempts}/{job.max_attempts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.status === "pending" ? formatDistanceToNow(new Date(job.next_retry_at), { addSuffix: true, locale: fr }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true, locale: fr })}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[160px] truncate">{job.dedupe_key || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedJob(job)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(job.status === "dead_letter" || job.status === "failed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={requeue.isPending}
                            onClick={() => requeue.mutate(job.id)}
                          >
                            <RotateCw className="h-3.5 w-3.5" /> Relancer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Job details dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-sm">{selectedJob?.job_type}</span>
              {selectedJob && <Badge variant="outline" className={STATUS_STYLES[selectedJob.status]}>{selectedJob.status}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <Section title="Métadonnées">
                  <KV k="ID" v={selectedJob.id} mono />
                  <KV k="Tentatives" v={`${selectedJob.attempts}/${selectedJob.max_attempts}`} />
                  <KV k="Worker" v={selectedJob.worker_id || "—"} mono />
                  <KV k="Dedupe key" v={selectedJob.dedupe_key || "—"} mono />
                  <KV k="Créé" v={new Date(selectedJob.created_at).toLocaleString("fr-FR")} />
                  <KV k="MAJ" v={new Date(selectedJob.updated_at).toLocaleString("fr-FR")} />
                  {selectedJob.completed_at && <KV k="Terminé" v={new Date(selectedJob.completed_at).toLocaleString("fr-FR")} />}
                </Section>

                {selectedJob.last_error && (
                  <Section title="Dernière erreur">
                    <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded whitespace-pre-wrap">{selectedJob.last_error}</pre>
                  </Section>
                )}

                <Section title="Payload">
                  <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-all">{JSON.stringify(selectedJob.payload, null, 2)}</pre>
                </Section>

                <Section title={`Historique (${logs.length})`}>
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun log.</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="border border-border/50 rounded p-2 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={log.status === "success" ? STATUS_STYLES.success : STATUS_STYLES.failed}>
                              #{log.attempt_number} {log.status}
                            </Badge>
                            {log.duration_ms != null && <span className="text-muted-foreground">{log.duration_ms}ms</span>}
                            {log.response_code != null && <span className="text-muted-foreground">HTTP {log.response_code}</span>}
                            <span className="text-muted-foreground ml-auto">{new Date(log.created_at).toLocaleString("fr-FR")}</span>
                          </div>
                          {log.error_message && <pre className="text-destructive whitespace-pre-wrap">{log.error_message}</pre>}
                          {log.response_snippet && <pre className="text-muted-foreground whitespace-pre-wrap">{log.response_snippet}</pre>}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {(selectedJob.status === "dead_letter" || selectedJob.status === "failed") && (
                  <Button
                    onClick={() => requeue.mutate(selectedJob.id)}
                    disabled={requeue.isPending}
                    className="w-full gap-2"
                  >
                    <RotateCw className="h-4 w-4" /> Relancer ce job
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="text-muted-foreground w-24 shrink-0">{k}</span>
      <span className={mono ? "font-mono break-all" : ""}>{v}</span>
    </div>
  );
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
}
