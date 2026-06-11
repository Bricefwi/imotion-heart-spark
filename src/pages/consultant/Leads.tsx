import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  Search, ArrowRight, BrainCircuit, Flame, Target, Clock,
  CheckCircle2, Loader2, AlertTriangle, XCircle, Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const GRADE_CONFIG: Record<string, { label: string; className: string; dotClass: string }> = {
  A: {
    label: "Grade A",
    className: "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-600))] border-[hsl(var(--imo-coral-600)/0.3)]",
    dotClass: "bg-[hsl(var(--imo-coral-600))]",
  },
  B: {
    label: "Grade B",
    className: "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))] border-[hsl(var(--imo-amber-500)/0.3)]",
    dotClass: "bg-[hsl(var(--imo-amber-500))]",
  },
  C: {
    label: "Grade C",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    dotClass: "bg-blue-500",
  },
  D: {
    label: "Grade D",
    className: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  queued:            { label: "En attente",   icon: Clock,         className: "text-muted-foreground" },
  processing:        { label: "En cours",     icon: Loader2,       className: "text-blue-600" },
  waiting_validation:{ label: "À valider",    icon: Target,        className: "text-amber-600" },
  ready:             { label: "Prêt",         icon: CheckCircle2,  className: "text-emerald-600" },
  failed:            { label: "Échec",        icon: AlertTriangle, className: "text-destructive" },
  cancelled:         { label: "Annulé",       icon: XCircle,       className: "text-muted-foreground" },
};

const PHASE_LABELS: Record<string, string> = {
  intake: "Collecte", need: "Besoins", scoping: "Cadrage",
  critic: "Validation", output: "Génération", done: "Terminé",
};

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Claude", mistral: "Mistral", gemini: "Gemini",
};

interface JobLead {
  id: string;
  type: string;
  status: string;
  agent_phase: string;
  lead_grade: string | null;
  quality_score: number | null;
  cost_eur: number;
  created_at: string;
  completed_at: string | null;
  project_id: string | null;
  client_name: string | null;
  client_email: string | null;
  company_name: string | null;
  project_name: string | null;
}

export default function ConsultantLeads() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  const { data: leads = [], isLoading } = useQuery<JobLead[]>({
    queryKey: ["consultant-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs_admin_view")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as JobLead[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const filtered = leads.filter((l) => {
    if (gradeFilter !== "all" && l.lead_grade !== gradeFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (l.client_name ?? "").toLowerCase().includes(s) ||
      (l.client_email ?? "").toLowerCase().includes(s) ||
      (l.company_name ?? "").toLowerCase().includes(s) ||
      (l.project_name ?? "").toLowerCase().includes(s)
    );
  });

  const countByGrade = (g: string | null) =>
    leads.filter((l) => (g === null ? l.lead_grade == null : l.lead_grade === g)).length;

  const gradeGroups = ["A", "B", "C", "D"].map((g) => ({
    grade: g,
    count: countByGrade(g),
    config: GRADE_CONFIG[g],
  }));

  const totalReady     = leads.filter((l) => l.status === "ready").length;
  const totalProcessing= leads.filter((l) => l.status === "processing").length;
  const totalCost      = leads.reduce((s, l) => s + (l.cost_eur ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Leads IA</h1>
            <p className="text-sm text-muted-foreground">Pipeline qualifié par les agents de diagnostic</p>
          </div>
        </div>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Rechercher client, projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64 h-9"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total leads",  value: leads.length,      icon: BrainCircuit, color: "text-foreground" },
          { label: "Prêts",        value: totalReady,         icon: CheckCircle2, color: "text-emerald-600" },
          { label: "En cours",     value: totalProcessing,    icon: Loader2,      color: "text-blue-600" },
          { label: "Coût total",   value: `${totalCost.toFixed(2)} €`, icon: Zap, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade distribution */}
      <div className="grid grid-cols-4 gap-3">
        {gradeGroups.map(({ grade, count, config }) => (
          <button
            key={grade}
            onClick={() => setGradeFilter(gradeFilter === grade ? "all" : grade)}
            className={`rounded-xl p-3 border transition-all text-left ${
              gradeFilter === grade
                ? `${config.className} ring-2 ring-offset-1 ring-[hsl(var(--imo-coral-600)/0.4)]`
                : "border-border/60 bg-card hover:border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2 w-2 rounded-full ${config.dotClass}`} />
              <span className="text-xs font-semibold">{config.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{count}</p>
          </button>
        ))}
      </div>

      {/* Leads list */}
      <Tabs defaultValue="all" onValueChange={(v) => setGradeFilter(v === "all" ? "all" : v)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" onClick={() => setGradeFilter("all")}>
              Tous ({leads.length})
            </TabsTrigger>
            {["A", "B", "C", "D"].map((g) => (
              <TabsTrigger key={g} value={g} onClick={() => setGradeFilter(g)}>
                Grade {g} ({countByGrade(g)})
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="md:hidden relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <TabsContent value={gradeFilter === "all" ? "all" : gradeFilter} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BrainCircuit className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun lead {gradeFilter !== "all" ? `de grade ${gradeFilter}` : ""} pour l'instant</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead) => {
                const grade = lead.lead_grade ? GRADE_CONFIG[lead.lead_grade] : null;
                const statusCfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG["queued"];
                const StatusIcon = statusCfg.icon;
                return (
                  <Card key={lead.id} className="border-border/60 hover:border-border transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Grade indicator */}
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold border ${grade?.className ?? "bg-muted text-muted-foreground border-border"}`}>
                          {lead.lead_grade ?? "?"}
                        </div>

                        {/* Client info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">
                              {lead.client_name ?? "Client inconnu"}
                            </p>
                            {lead.company_name && (
                              <span className="text-xs text-muted-foreground truncate">· {lead.company_name}</span>
                            )}
                            {grade && (
                              <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${grade.className}`}>
                                {grade.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-xs text-muted-foreground truncate">
                              {lead.project_name ?? lead.id.slice(0, 8)}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${statusCfg.className}`}>
                              <StatusIcon className={`h-3 w-3 ${lead.status === "processing" ? "animate-spin" : ""}`} />
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Phase : {PHASE_LABELS[lead.agent_phase] ?? lead.agent_phase}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(lead.created_at), { locale: fr, addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Quality score */}
                        {lead.quality_score != null && (
                          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-24">
                            <span className="text-xs font-mono tabular-nums font-semibold">{lead.quality_score}/100</span>
                            <Progress value={lead.quality_score} className="h-1.5 w-full" />
                          </div>
                        )}

                        {/* Cost */}
                        <div className="hidden md:block text-right shrink-0">
                          <p className="text-xs font-mono tabular-nums">{(lead.cost_eur ?? 0).toFixed(4)} €</p>
                          <p className="text-[10px] text-muted-foreground">coût IA</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          {lead.project_id && (
                            <Button variant="ghost" size="sm" asChild className="h-8 text-xs gap-1">
                              <Link to={`/consultant/projects/${lead.project_id}`}>
                                Voir <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
