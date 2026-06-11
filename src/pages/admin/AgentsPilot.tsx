import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Brain, Zap, MessageSquare, DollarSign, Activity, Save, RefreshCw, ToggleLeft, ToggleRight, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";

// Agents Mistral (La Plateforme) — secrets à saisir dans Lovable Cloud → Secrets
const MISTRAL_AGENTS = [
  { key: "maestro",  secret: "MISTRAL_AGENT_MAESTRO",  role: "Orchestrateur multi-agents" },
  { key: "stratos",  secret: "MISTRAL_AGENT_STRATOS",  role: "Stratégie business — enrichit CDC & conseil technique" },
  { key: "marketix", secret: "MISTRAL_AGENT_MARKETIX", role: "Stratégie marketing & acquisition" },
  { key: "literix",  secret: "MISTRAL_AGENT_LITERIX",  role: "Rédaction éditoriale — enrichit les articles de blog" },
  { key: "financix", secret: "MISTRAL_AGENT_FINANCIX", role: "Analyse financière — enrichit devis & propositions" },
  { key: "n8nix",    secret: "MISTRAL_AGENT_N8NIX",    role: "Automatisations & workflows" },
] as const;

// Agents et leurs tiers/modèles par défaut
const AGENTS = [
  { name: "ORCHESTRATOR",  tier: "routing",        defaultModel: "gemini-2.5-flash",     description: "Routing JSON entre phases" },
  { name: "EXTRACTOR",     tier: "routing",        defaultModel: "gemini-2.5-flash",     description: "Extraction JSON structuré" },
  { name: "NOTIFIER",      tier: "routing",        defaultModel: "gemini-2.5-flash",     description: "Rédaction emails courts" },
  { name: "INTAKE-AGENT",  tier: "conversational", defaultModel: "mistral-small-latest", description: "Phase 1 — Identité & douleur" },
  { name: "NEED-ANALYZER", tier: "conversational", defaultModel: "mistral-small-latest", description: "Phase 2 — Vision & besoins" },
  { name: "SCOPING-AGENT", tier: "conversational", defaultModel: "mistral-small-latest", description: "Phase 3 — Budget & cadrage" },
  { name: "CRITIC-AGENT",  tier: "strategic",      defaultModel: "claude-sonnet-4-6",    description: "Validation qualité & cohérence" },
  { name: "DOC-GENERATOR", tier: "strategic",      defaultModel: "claude-sonnet-4-6",    description: "Génération CDC long-form" },
  { name: "QUOTE-BUILDER", tier: "strategic",      defaultModel: "claude-sonnet-4-6",    description: "Génération devis structuré" },
] as const;

const TIER_COLORS: Record<string, string> = {
  routing:        "bg-blue-500/10 text-blue-700 border-blue-500/20",
  conversational: "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))] border-[hsl(var(--imo-amber-500)/0.2)]",
  strategic:      "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-700))] border-[hsl(var(--imo-coral-600)/0.2)]",
};

const MODEL_OPTIONS = {
  routing:        ["gemini-2.5-flash", "mistral-small-latest"],
  conversational: ["mistral-small-latest", "mistral-medium-latest", "claude-sonnet-4-6"],
  strategic:      ["claude-sonnet-4-6", "claude-opus-4-7"],
};

const PRICING_EUR: Record<string, { in: number; out: number }> = {
  "gemini-2.5-flash":      { in: 0.14,  out: 0.55  },
  "mistral-small-latest":  { in: 0.18,  out: 0.55  },
  "mistral-medium-latest": { in: 2.50,  out: 7.50  },
  "claude-sonnet-4-6":     { in: 2.75,  out: 13.75 },
  "claude-opus-4-7":       { in: 13.75, out: 68.75 },
};

interface AgentConfig {
  name: string;
  model: string;
  enabled: boolean;
  prompt_override: string | null;
}

interface JobMetrics {
  agent: string;
  calls: number;
  avg_cost: number;
  total_cost: number;
  avg_latency_ms: number;
}

export default function AdminAgentsPilot() {
  const queryClient = useQueryClient();
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState("");

  // Charger les configs depuis agent_state
  const { data: configs = [] } = useQuery<AgentConfig[]>({
    queryKey: ["agent-configs"],
    queryFn: async () => {
      const { data } = await db
        .from("agent_state")
        .select("key, value")
        .eq("scope", "agent-config");
      if (!data) return [];
      return data.map((row: any) => ({
        name: row.key as string,
        ...(row.value as Omit<AgentConfig, "name">),
      }));
    },
  });

  // Métriques des derniers jobs
  const { data: metrics = [] } = useQuery<JobMetrics[]>({
    queryKey: ["agent-metrics"],
    queryFn: async () => {
      const { data } = await db
        .from("job_events")
        .select("payload, tokens_in, tokens_out, cost_eur, created_at")
        .eq("event_type", "phase_end")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
        .limit(500);
      if (!data) return [];

      // Agréger par agent
      const agg: Record<string, { calls: number; cost: number }> = {};
      data.forEach((ev: any) => {
        const agent = (ev.payload as Record<string, string>)?.agent ?? "unknown";
        if (!agg[agent]) agg[agent] = { calls: 0, cost: 0 };
        agg[agent].calls++;
        agg[agent].cost += ev.cost_eur ?? 0;
      });
      return Object.entries(agg).map(([agent, v]) => ({
        agent,
        calls: v.calls,
        avg_cost: v.calls > 0 ? v.cost / v.calls : 0,
        total_cost: v.cost,
        avg_latency_ms: 0,
      }));
    },
  });

  const saveConfig = useMutation({
    mutationFn: async ({ agentName, model, enabled }: { agentName: string; model: string; enabled: boolean }) => {
      await db.from("agent_state").upsert({
        key: agentName,
        scope: "agent-config",
        value: { model, enabled, prompt_override: null },
      }, { onConflict: "key,scope" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-configs"] });
      toast.success("Config agent sauvegardée");
    },
  });

  const savePrompt = useMutation({
    mutationFn: async ({ agentName, prompt }: { agentName: string; prompt: string }) => {
      const existing = configs.find((c) => c.name === agentName);
      await db.from("agent_state").upsert({
        key: agentName,
        scope: "agent-config",
        value: { ...(existing ?? {}), prompt_override: prompt || null },
      }, { onConflict: "key,scope" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-configs"] });
      setEditingAgent(null);
      toast.success("Prompt sauvegardé");
    },
  });

  const getConfig = (agentName: string): AgentConfig | undefined =>
    configs.find((c) => c.name === agentName);

  // État de configuration des secrets Mistral (booleans uniquement, jamais les valeurs)
  const { data: mistralStatus, refetch: refetchMistral, isFetching: mistralFetching } = useQuery<Record<string, boolean> | null>({
    queryKey: ["mistral-agents-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("call-mistral-agent", {
        body: { mode: "status" },
      });
      if (error || !data?.success) return null;
      return data.agents as Record<string, boolean>;
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pilotage agents IA</h1>
        <p className="text-sm text-muted-foreground mt-1">Modèle, prompt, kill-switch par agent — sans redéploiement</p>
      </div>

      {/* Résumé coûts 7j */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Appels 7j",     value: metrics.reduce((s, m) => s + m.calls, 0),                      icon: Activity,     color: "text-foreground" },
          { label: "Coût 7j",       value: `${metrics.reduce((s, m) => s + m.total_cost, 0).toFixed(3)} €`, icon: DollarSign,   color: "text-[hsl(var(--imo-coral-600))]" },
          { label: "Agents actifs", value: AGENTS.filter((a) => getConfig(a.name)?.enabled !== false).length, icon: Brain,     color: "text-emerald-600" },
          { label: "LLM providers", value: 3,                                                               icon: Zap,          color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Agents grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {AGENTS.map((agent) => {
          const cfg = getConfig(agent.name);
          const enabled = cfg?.enabled !== false;
          const currentModel = cfg?.model ?? agent.defaultModel;
          const pricing = PRICING_EUR[currentModel];
          const agentMetrics = metrics.find((m) => m.agent === agent.name);
          const isEditing = editingAgent === agent.name;

          return (
            <Card key={agent.name} className={`border-border/60 transition-all ${!enabled ? "opacity-50" : ""}`}>
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-foreground">{agent.name}</span>
                      <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 ${TIER_COLORS[agent.tier]}`}>
                        {agent.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{agent.description}</p>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    className={`h-7 w-7 p-0 shrink-0 ${enabled ? "text-emerald-600" : "text-muted-foreground"}`}
                    onClick={() => saveConfig.mutate({ agentName: agent.name, model: currentModel, enabled: !enabled })}
                  >
                    {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 space-y-3">
                {/* Modèle sélecteur */}
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Modèle</p>
                  <Select
                    value={currentModel}
                    onValueChange={(model) => saveConfig.mutate({ agentName: agent.name, model, enabled })}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS[agent.tier].map((m) => (
                        <SelectItem key={m} value={m} className="text-xs font-mono">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pricing && (
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                      {pricing.in.toFixed(2)} € / 1M in · {pricing.out.toFixed(2)} € / 1M out
                    </p>
                  )}
                </div>

                {/* Métriques */}
                {agentMetrics && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-muted-foreground">{agentMetrics.calls} appels</span>
                    <span className="text-muted-foreground font-mono">{agentMetrics.avg_cost.toFixed(5)} € moy.</span>
                    <span className="font-mono tabular-nums">{agentMetrics.total_cost.toFixed(4)} € total</span>
                  </div>
                )}

                <Separator />

                {/* Prompt override */}
                {isEditing ? (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Prompt override</p>
                    <Textarea
                      value={promptDraft}
                      onChange={(e) => setPromptDraft(e.target.value)}
                      placeholder="Laisser vide pour utiliser le prompt par défaut…"
                      className="text-xs font-mono min-h-24 resize-y"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs gap-1"
                        onClick={() => savePrompt.mutate({ agentName: agent.name, prompt: promptDraft })}
                        disabled={savePrompt.isPending}>
                        <Save className="h-3 w-3" /> Sauvegarder
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => setEditingAgent(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs w-full gap-1"
                    onClick={() => { setEditingAgent(agent.name); setPromptDraft(cfg?.prompt_override ?? ""); }}>
                    <MessageSquare className="h-3 w-3" />
                    {cfg?.prompt_override ? "Modifier le prompt" : "Ajouter un prompt override"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agents Mistral — état des secrets */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[hsl(var(--imo-coral-600))]" />
                Agents Mistral — configuration des secrets
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Saisissez les secrets dans <span className="font-semibold">Lovable Cloud → Secrets</span> (jamais dans l'application).
                Les agents non configurés sont simplement ignorés par le pipeline.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0"
              onClick={() => refetchMistral()} disabled={mistralFetching}>
              <RefreshCw className={`h-3 w-3 ${mistralFetching ? "animate-spin" : ""}`} /> Vérifier
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md bg-muted/40">
            {mistralStatus?.api_key
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
            <span className="font-mono font-semibold">MISTRAL_API_KEY</span>
            <span className="text-muted-foreground">— clé API principale (obligatoire pour tous les agents)</span>
          </div>
          {MISTRAL_AGENTS.map(({ key, secret, role }) => (
            <div key={key} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md hover:bg-muted/30">
              {mistralStatus?.[key]
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className="font-mono font-semibold uppercase">{key}</span>
              <span className="font-mono text-muted-foreground">{secret}</span>
              <span className="text-muted-foreground hidden sm:inline">— {role}</span>
            </div>
          ))}
          {!mistralStatus && (
            <p className="text-xs text-muted-foreground italic pt-1">
              Statut indisponible — la fonction <span className="font-mono">call-mistral-agent</span> doit être déployée.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
