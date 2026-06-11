import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity, Zap, Clock, AlertTriangle, CheckCircle2, XCircle,
  Play, StopCircle, RotateCcw, Eye, ChevronDown, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type JobStatus = "queued" | "processing" | "waiting_validation" | "ready" | "failed" | "cancelled";
type AgentPhase = "intake" | "need" | "scoping" | "critic" | "output" | "done";

interface Job {
  id: string;
  type: string;
  status: JobStatus;
  agent_phase: AgentPhase;
  lead_grade: string | null;
  quality_score: number | null;
  cost_eur: number;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  providers_used: string[];
  client_name?: string;
  client_email?: string;
  company_name?: string;
  project_title?: string;
}

interface JobEvent {
  id: string;
  job_id: string;
  event_type: string;
  actor: string;
  phase: string | null;
  provider: string | null;
  model: string | null;
  tokens_in: number;
  tokens_out: number;
  cost_eur: number;
  payload: Record<string, unknown>;
  created_at: string;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: typeof Activity }> = {
  queued:             { label: "En attente",      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",    icon: Clock },
  processing:         { label: "En cours",         color: "bg-blue-500/10 text-blue-600 border-blue-500/20",      icon: Zap },
  waiting_validation: { label: "À valider",        color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Eye },
  ready:              { label: "Prêt",             color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  failed:             { label: "Échoué",           color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  cancelled:          { label: "Annulé",           color: "bg-muted text-muted-foreground border-border",          icon: StopCircle },
};

const PHASE_LABELS: Record<AgentPhase, string> = {
  intake:  "P1 Intake",
  need:    "P2 Besoins",
  scoping: "P3 Cadrage",
  critic:  "Validation",
  output:  "Génération",
  done:    "Terminé",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  B: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  C: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  D: "bg-muted text-muted-foreground border-border",
};

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-700))]",
  mistral:   "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))]",
  gemini:    "bg-blue-500/10 text-blue-700",
};

function JobCard({ job, onKill, onReplay }: { job: Job; onKill: (id: string) => void; onReplay: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;
  const isLive = job.status === "processing";

  const { data: events = [] } = useQuery<JobEvent[]>({
    queryKey: ["job-events", job.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_events")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: true });
      return (data ?? []) as JobEvent[];
    },
    enabled: expanded,
  });

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border ${isLive ? "border-blue-500/30 shadow-[0_0_0_1px_hsl(var(--imo-coral-600)/0.15)]" : "border-border/60"} transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Status icon */}
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cfg.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm text-foreground truncate">
                  {job.company_name || job.client_name || job.client_email || "Prospect"}
                </span>
                {job.lead_grade && (
                  <Badge variant="outline" className={`text-[10px] font-bold px-1.5 ${GRADE_COLORS[job.lead_grade] ?? ""}`}>
                    Grade {job.lead_grade}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                  {cfg.label}
                </Badge>
                {isLive && (
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="font-mono">{PHASE_LABELS[job.agent_phase] ?? job.agent_phase}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">{job.cost_eur.toFixed(4)} €</span>
                {job.providers_used?.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex gap-1">
                      {job.providers_used.map((p) => (
                        <span key={p} className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${PROVIDER_COLORS[p] ?? "bg-muted"}`}>{p}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {job.error_message && (
                <p className="text-xs text-destructive mt-1 font-mono truncate">{job.error_message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {job.status === "processing" && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10"
                  onClick={() => onKill(job.id)}>
                  <StopCircle className="h-3.5 w-3.5" />
                </Button>
              )}
              {job.status === "failed" && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-primary hover:bg-primary/10"
                  onClick={() => onReplay(job.id)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground"
                onClick={() => setExpanded((v) => !v)}>
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Timeline étendue */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />
                <ScrollArea className="max-h-48">
                  <div className="space-y-1.5 pr-2">
                    {events.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Aucun événement</p>
                    ) : events.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground/50 font-mono tabular-nums shrink-0 mt-px">
                          {format(new Date(ev.created_at), "HH:mm:ss")}
                        </span>
                        <span className={`shrink-0 font-semibold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                          ev.event_type === "error" ? "bg-destructive/10 text-destructive" :
                          ev.event_type === "phase_end" ? "bg-emerald-500/10 text-emerald-700" :
                          "bg-muted text-muted-foreground"
                        }`}>{ev.event_type}</span>
                        <span className="text-muted-foreground">{ev.phase ?? ""}</span>
                        {ev.provider && <span className={`px-1 rounded text-[9px] font-bold uppercase ${PROVIDER_COLORS[ev.provider] ?? ""}`}>{ev.provider}</span>}
                        {ev.cost_eur > 0 && <span className="font-mono tabular-nums text-muted-foreground/60">{ev.cost_eur.toFixed(5)}€</span>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminOperations() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["admin-jobs", filter],
    queryFn: async () => {
      let q = supabase
        .from("jobs_admin_view")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Job[];
    },
    refetchInterval: 10000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const killJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ status: "cancelled" }).eq("id", jobId);
    if (error) toast.error("Impossible d'arrêter le job");
    else {
      toast.success("Job annulé");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    }
  };

  const replayJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").update({ status: "queued", error_message: null, failed_at: null }).eq("id", jobId);
    if (error) toast.error("Impossible de relancer le job");
    else {
      toast.success("Job remis en queue");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    }
  };

  // Stats
  const stats = {
    live:    jobs.filter((j) => j.status === "processing").length,
    queued:  jobs.filter((j) => j.status === "queued").length,
    ready:   jobs.filter((j) => j.status === "ready").length,
    failed:  jobs.filter((j) => j.status === "failed").length,
    costDay: jobs.reduce((s, j) => s + (j.cost_eur ?? 0), 0),
  };

  const filters: { key: JobStatus | "all"; label: string }[] = [
    { key: "all",               label: "Tous" },
    { key: "processing",        label: "En cours" },
    { key: "queued",            label: "En attente" },
    { key: "waiting_validation",label: "À valider" },
    { key: "ready",             label: "Prêts" },
    { key: "failed",            label: "Échoués" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opérations en direct</h1>
        <p className="text-sm text-muted-foreground mt-1">Pipeline temps réel — kill-switch, replay, timeline agent</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "En cours",   value: stats.live,    color: "text-blue-600",    icon: Zap },
          { label: "En attente", value: stats.queued,  color: "text-amber-600",   icon: Clock },
          { label: "Prêts",      value: stats.ready,   color: "text-emerald-600", icon: CheckCircle2 },
          { label: "Échoués",    value: stats.failed,  color: "text-destructive", icon: XCircle },
          { label: "Coût total", value: `${stats.costDay.toFixed(3)} €`, color: "text-foreground", icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-3 flex items-center gap-2">
              <Icon className={`h-4 w-4 shrink-0 ${color}`} />
              <div>
                <p className={`font-bold text-lg leading-none tabular-nums ${color}`}>{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            className="h-7 text-xs rounded-full px-3"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Chargement…</div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 text-center">
            <Play className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun job{filter !== "all" ? ` avec le statut "${filter}"` : ""}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onKill={killJob} onReplay={replayJob} />
          ))}
        </div>
      )}
    </div>
  );
}
