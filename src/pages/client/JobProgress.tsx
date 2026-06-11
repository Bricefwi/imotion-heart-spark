import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare, FileText, BrainCircuit, ShieldCheck, Sparkles,
  CheckCircle2, Loader2, Clock, ArrowRight, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const PHASES = [
  { key: "intake",   label: "Collecte",       desc: "Analyse de votre demande",          icon: MessageSquare },
  { key: "need",     label: "Besoins",         desc: "Identification des besoins clés",   icon: BrainCircuit },
  { key: "scoping",  label: "Cadrage",         desc: "Périmètre et fonctionnalités",      icon: FileText },
  { key: "critic",   label: "Validation",      desc: "Contrôle qualité IA",               icon: ShieldCheck },
  { key: "output",   label: "Génération",      desc: "Production du rapport final",       icon: Sparkles },
  { key: "done",     label: "Terminé",         desc: "Votre diagnostic est prêt !",       icon: CheckCircle2 },
];

const PHASE_ORDER = PHASES.map((p) => p.key);

const GRADE_CONFIG: Record<string, { label: string; className: string }> = {
  A: { label: "Lead A", className: "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-600))] border-[hsl(var(--imo-coral-600)/0.3)]" },
  B: { label: "Lead B", className: "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))] border-[hsl(var(--imo-amber-500)/0.3)]" },
  C: { label: "Lead C", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  D: { label: "Lead D", className: "bg-muted text-muted-foreground border-border" },
};

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Claude",
  mistral: "Mistral",
  gemini: "Gemini",
};

interface Job {
  id: string;
  status: string;
  agent_phase: string;
  lead_grade: string | null;
  quality_score: number | null;
  cost_eur: number;
  tokens_in: number;
  tokens_out: number;
  providers_used: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  project_id: string | null;
}

interface JobEvent {
  id: string;
  event_type: string;
  phase: string | null;
  provider: string | null;
  model: string | null;
  cost_eur: number;
  created_at: string;
}

export default function ClientJobProgress() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);

  const { data: job } = useQuery<Job>({
    queryKey: ["job-progress", jobId],
    queryFn: async () => {
      const { data, error } = await db
        .from("jobs")
        .select("*")
        .eq("id", jobId!)
        .single();
      if (error) throw error;
      return data as Job;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "failed" || status === "cancelled") return false;
      return 3000;
    },
  });

  const { data: events = [] } = useQuery<JobEvent[]>({
    queryKey: ["job-events", jobId],
    queryFn: async () => {
      const { data } = await db
        .from("job_events")
        .select("id, event_type, phase, provider, model, cost_eur, created_at")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: true });
      return (data ?? []) as JobEvent[];
    },
    enabled: !!jobId,
    refetchInterval: 5000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!jobId) return;
    const channel = supabase
      .channel(`job-${jobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["job-progress", jobId] });
        queryClient.invalidateQueries({ queryKey: ["job-events", jobId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId, queryClient]);

  // Elapsed timer
  useEffect(() => {
    if (!job?.started_at || job.completed_at || job.failed_at) return;
    const start = new Date(job.started_at).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [job?.started_at, job?.completed_at, job?.failed_at]);

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--imo-coral-600))]" />
        <p className="text-muted-foreground text-sm">Chargement de l'analyse…</p>
      </div>
    );
  }

  const currentPhaseIdx = PHASE_ORDER.indexOf(job.agent_phase);
  const progressPct = Math.round((currentPhaseIdx / (PHASE_ORDER.length - 1)) * 100);
  const isFinished = job.status === "ready" || job.agent_phase === "done";
  const isFailed = job.status === "failed";
  const grade = job.lead_grade ? GRADE_CONFIG[job.lead_grade] : null;

  const elapsedStr = elapsed > 0
    ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
    : job.started_at
    ? formatDistanceToNow(new Date(job.started_at), { locale: fr, addSuffix: false })
    : "—";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-4">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary mb-2">
          <BrainCircuit className="h-7 w-7 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold">
          {isFinished ? "Diagnostic terminé !" : isFailed ? "Analyse interrompue" : "Analyse IA en cours…"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isFinished
            ? "Votre rapport de diagnostic est prêt. Consultez les résultats ci-dessous."
            : isFailed
            ? "Une erreur est survenue. Notre équipe a été notifiée."
            : "Nos agents IA analysent votre projet en temps réel."}
        </p>
      </div>

      {/* Progress bar */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-5 space-y-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progression</span>
            <span className="font-mono tabular-nums">{progressPct}%</span>
          </div>
          <Progress
            value={isFinished ? 100 : progressPct}
            className={`h-2 ${isFailed ? "[&>div]:bg-destructive" : "[&>div]:gradient-primary"}`}
          />

          {/* Phase steps */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {PHASES.map((phase, idx) => {
              const done   = idx < currentPhaseIdx || isFinished;
              const active = idx === currentPhaseIdx && !isFinished;
              const Icon   = phase.icon;
              return (
                <div key={phase.key} className="flex flex-col items-center gap-1 text-center">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      done
                        ? "gradient-primary text-white"
                        : active
                        ? "border-2 border-[hsl(var(--imo-coral-600))] text-[hsl(var(--imo-coral-600))] bg-[hsl(var(--imo-coral-600)/0.06)]"
                        : "border border-border/40 text-muted-foreground/40 bg-muted/30"
                    }`}
                  >
                    {active && !isFailed ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${done || active ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {phase.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Durée</p>
            <p className="font-mono text-sm font-semibold tabular-nums">{elapsedStr}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Coût IA</p>
            <p className="font-mono text-sm font-semibold tabular-nums">{job.cost_eur.toFixed(4)} €</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Grade lead</p>
            {grade ? (
              <Badge variant="outline" className={`text-[10px] font-bold ${grade.className}`}>
                {grade.label}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quality score */}
      {isFinished && job.quality_score != null && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Score qualité</span>
              <span className="font-mono tabular-nums font-semibold">{job.quality_score}/100</span>
            </div>
            <Progress value={job.quality_score} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {job.quality_score >= 80
                ? "Excellent dossier — votre projet est bien cadré."
                : job.quality_score >= 60
                ? "Bon dossier — quelques points à affiner avec votre consultant."
                : "Dossier en cours de maturation — un consultant vous contactera."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Providers used */}
      {job.providers_used?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Analysé par :</span>
          {job.providers_used.map((p) => (
            <Badge key={p} variant="outline" className="text-[10px]">
              {PROVIDER_LABEL[p] ?? p}
            </Badge>
          ))}
        </div>
      )}

      {/* Error state */}
      {isFailed && job.error_message && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">Erreur technique</p>
              <p className="text-xs text-muted-foreground mt-0.5">{job.error_message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isFinished && job.project_id && (
          <Button
            className="flex-1 gradient-primary border-0"
            onClick={() => navigate(`/client/projects/${job.project_id}/conversation`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Voir la conversation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
        {isFinished && (
          <Button variant="outline" className="flex-1" onClick={() => navigate("/client/documents")}>
            <FileText className="h-4 w-4 mr-2" />
            Mes documents
          </Button>
        )}
        {!isFinished && !isFailed && (
          <Button variant="outline" className="flex-1" onClick={() => navigate("/client/dashboard")}>
            <Clock className="h-4 w-4 mr-2" />
            Retourner au dashboard
          </Button>
        )}
        {isFailed && (
          <Button variant="outline" className="flex-1" onClick={() => navigate("/client/projects/new")}>
            Recommencer
          </Button>
        )}
      </div>

      {/* Event timeline (collapsible) */}
      {events.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 list-none">
            <span className="group-open:hidden">▶ Journal détaillé ({events.length} événements)</span>
            <span className="hidden group-open:inline">▼ Journal détaillé</span>
          </summary>
          <div className="mt-3 space-y-1 border-l-2 border-border/40 pl-4">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums shrink-0">
                  {new Date(ev.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className="font-medium text-foreground/70">{ev.event_type}</span>
                {ev.phase && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{ev.phase}</span>}
                {ev.provider && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {PROVIDER_LABEL[ev.provider] ?? ev.provider} {ev.model ? `· ${ev.model}` : ""}
                  </span>
                )}
                {ev.cost_eur > 0 && (
                  <span className="font-mono tabular-nums text-[10px]">{ev.cost_eur.toFixed(5)} €</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
