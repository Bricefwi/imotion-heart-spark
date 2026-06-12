import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Building2, TrendingUp, Users, Scale, ShoppingBag,
  BrainCircuit, AlertTriangle, CheckCircle2, Clock,
  Loader2, RefreshCw, Send, ChevronRight, Eye, EyeOff,
  BarChart3, Lightbulb, Flag, Bell, Target
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ControlTowerMessage {
  id: string;
  specialist: string;
  direction: string;
  category: string;
  title: string;
  content_markdown: string;
  priority: string;
  mission_id: string | null;
  project_id: string | null;
  kpis: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// ─── Configuration des spécialistes ──────────────────────────────────────────

const SPECIALISTS = [
  {
    key: "daf",
    label: "DAF",
    fullLabel: "Directeur Administratif & Financier",
    icon: Building2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    mission: "daf_analysis",
    objective: "Analyse financière mensuelle IMOTION Creator Studio : rentabilité projets, coûts IA, trésorerie et directives budgétaires",
    context: "Analyse l'ensemble des projets actifs, les coûts opérationnels et formulez des directives pour améliorer la rentabilité.",
    description: "Rentabilité, coûts IA, trésorerie, directives budgétaires",
  },
  {
    key: "marketing_dir",
    label: "Dir. Marketing",
    fullLabel: "Directeur Marketing Système",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    mission: "marketing_system",
    objective: "Bilan marketing IMOTION : état du pipeline acquisition, notoriété et recommandations d'actions",
    context: "Analyse la présence digitale, le pipeline commercial et proposez un plan d'action marketing 30 jours.",
    description: "Acquisition, notoriété, contenu, automatisations growth",
  },
  {
    key: "commercial_dir",
    label: "Dir. Commercial",
    fullLabel: "Directeur Commercial",
    icon: ShoppingBag,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    mission: "commercial_action",
    objective: "Revue commerciale : analyse du pipe, opportunités de closing et recommandations pricing",
    context: "Analysez le pipeline commercial, identifiez les leads prioritaires et proposez une stratégie de closing.",
    description: "Pipeline, closing, pricing, croissance CA",
  },
  {
    key: "rh",
    label: "DRH",
    fullLabel: "Directeur Ressources Humaines",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    mission: "rh_assessment",
    objective: "Bilan RH : capacités équipe agents IA, besoins identifiés par les équipes Build et Marketing",
    context: "Évaluez les capacités actuelles des agents IA déployés, identifiez les gaps et recommandez les intégrations prioritaires.",
    description: "Agents IA, compétences, recrutement, capacités",
  },
  {
    key: "juridix",
    label: "Juriste",
    fullLabel: "Directeur Juridique",
    icon: Scale,
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    mission: "contract_review",
    objective: "Revue juridique : analyse des contrats actifs, risques juridiques, recommandations",
    context: "Analysez les contrats en cours et identifiez les points de vigilance juridiques.",
    description: "Contrats, RGPD, risques juridiques, conformité",
  },
] as const;

const PRIORITY_CONFIG = {
  critical: { label: "Critique", color: "text-red-600 bg-red-500/10 border-red-500/20" },
  high:     { label: "Haute",    color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
  normal:   { label: "Normal",   color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  low:      { label: "Basse",    color: "text-muted-foreground bg-muted/40 border-border/40" },
} as const;

const CATEGORY_ICONS = {
  report:         BarChart3,
  alert:          AlertTriangle,
  directive:      Flag,
  decision:       CheckCircle2,
  recommendation: Lightbulb,
  briefing:       Bell,
} as const;

// ─── Composants ───────────────────────────────────────────────────────────────

function SpecialistCard({
  specialist,
  lastReport,
  onLaunch,
  isLaunching,
}: {
  specialist: typeof SPECIALISTS[number];
  lastReport: ControlTowerMessage | undefined;
  onLaunch: () => void;
  isLaunching: boolean;
}) {
  const Icon = specialist.icon;
  const hasAlert = lastReport?.priority === "critical" || lastReport?.priority === "high";

  return (
    <Card className={`border-border/60 transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${specialist.bg} shrink-0`}>
              <Icon className={`h-5 w-5 ${specialist.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{specialist.label}</p>
                {hasAlert && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
              </div>
              <p className="text-[11px] text-muted-foreground">{specialist.description}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 shrink-0"
            onClick={onLaunch}
            disabled={isLaunching}
          >
            {isLaunching
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyse…</>
              : <><BrainCircuit className="h-3 w-3" /> Analyser</>}
          </Button>
        </div>
        {lastReport ? (
          <div className="mt-2 text-xs space-y-1">
            <p className="font-medium text-foreground/80 line-clamp-1">{lastReport.title}</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              {formatDistanceToNow(new Date(lastReport.created_at), { addSuffix: true, locale: fr })}
              {!lastReport.read_at && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-2 italic">Aucun rapport — lancez une analyse</p>
        )}
      </CardContent>
    </Card>
  );
}

function MessageCard({
  msg,
  onMarkRead,
}: {
  msg: ControlTowerMessage;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const specialist = SPECIALISTS.find((s) => s.key === msg.specialist);
  const Icon = specialist?.icon ?? Bell;
  const CatIcon = CATEGORY_ICONS[msg.category as keyof typeof CATEGORY_ICONS] ?? Bell;
  const priority = PRIORITY_CONFIG[msg.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.normal;

  return (
    <div className={`border border-border/60 rounded-xl p-4 transition-all hover:border-border/80 ${!msg.read_at ? "bg-primary/[0.02]" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${specialist?.bg ?? "bg-muted/40"} shrink-0 mt-0.5`}>
          <Icon className={`h-4 w-4 ${specialist?.color ?? "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{specialist?.label ?? msg.specialist}</span>
            <CatIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{msg.category}</span>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priority.color}`}>
              {priority.label}
            </Badge>
            {!msg.read_at && (
              <span className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            )}
          </div>
          <p className={`text-sm font-medium leading-snug ${!msg.read_at ? "text-foreground" : "text-foreground/80"}`}>
            {msg.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
          </p>

          {expanded && (
            <div className="mt-3 text-xs text-foreground/80 whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-3 max-h-96 overflow-y-auto">
              {msg.content_markdown}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <><EyeOff className="h-3 w-3" /> Réduire</> : <><Eye className="h-3 w-3" /> Lire le rapport</>}
            </Button>
            {!msg.read_at && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
                onClick={() => onMarkRead(msg.id)}
              >
                <CheckCircle2 className="h-3 w-3" /> Marquer lu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminControlTower() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [newMsgSpecialist, setNewMsgSpecialist] = useState("dg");
  const [newMsgCategory, setNewMsgCategory] = useState("directive");
  const [newMsgTitle, setNewMsgTitle] = useState("");
  const [newMsgContent, setNewMsgContent] = useState("");
  const [launchingSpecialist, setLaunchingSpecialist] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery<ControlTowerMessage[]>({
    queryKey: ["control-tower-messages"],
    queryFn: async () => {
      const { data } = await db
        .from("control_tower_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const unreadCount = messages.filter((m) => !m.read_at).length;
  const criticalCount = messages.filter((m) => m.priority === "critical" && !m.read_at).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await db
        .from("control_tower_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["control-tower-messages"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await db
        .from("control_tower_messages")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["control-tower-messages"] });
      toast.success("Tous les messages marqués comme lus");
    },
  });

  const sendDirective = useMutation({
    mutationFn: async () => {
      if (!newMsgTitle.trim() || !newMsgContent.trim()) throw new Error("Titre et contenu requis");
      await db.from("control_tower_messages").insert({
        specialist: newMsgSpecialist,
        direction: "from_dg",
        category: newMsgCategory,
        title: newMsgTitle.trim(),
        content_markdown: newMsgContent.trim(),
        priority: "high",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["control-tower-messages"] });
      setNewMsgTitle("");
      setNewMsgContent("");
      toast.success("Directive envoyée");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const launchAnalysis = async (specialist: typeof SPECIALISTS[number]) => {
    setLaunchingSpecialist(specialist.key);
    try {
      const { data, error } = await supabase.functions.invoke("agent-orchestrator", {
        body: {
          mission_type: specialist.mission,
          objective: specialist.objective,
          context: specialist.context,
          specialist: specialist.key,
        },
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || "Erreur agent");
      queryClient.invalidateQueries({ queryKey: ["control-tower-messages"] });
      toast.success(`Analyse ${specialist.label} terminée — rapport disponible dans le feed`);
    } catch (err) {
      toast.error(`Erreur analyse ${specialist.label} : ${(err as Error).message}`);
    } finally {
      setLaunchingSpecialist(null);
    }
  };

  const getLastReport = (key: string) =>
    messages.find((m) => m.specialist === key && m.direction === "to_dg");

  const filteredMessages = activeFilter === "all"
    ? messages
    : activeFilter === "unread"
    ? messages.filter((m) => !m.read_at)
    : messages.filter((m) => m.specialist === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tour de Contrôle</h1>
          <p className="text-sm text-muted-foreground mt-1">Direction Générale — rapports C-suite, alertes stratégiques, directives</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["control-tower-messages"] })}
          >
            <RefreshCw className="h-3 w-3" /> Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCircle2 className="h-3 w-3" /> Tout marquer lu ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Messages non lus",  value: unreadCount,   icon: Bell,          color: unreadCount > 0 ? "text-primary" : "text-muted-foreground" },
          { label: "Alertes critiques", value: criticalCount, icon: AlertTriangle,  color: criticalCount > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "Total messages",    value: messages.length, icon: BarChart3,    color: "text-foreground" },
          { label: "Spécialistes",      value: SPECIALISTS.length, icon: Target,   color: "text-foreground" },
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

      {/* Specialist cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Spécialistes — lancer une analyse
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SPECIALISTS.map((sp) => (
            <SpecialistCard
              key={sp.key}
              specialist={sp}
              lastReport={getLastReport(sp.key)}
              onLaunch={() => launchAnalysis(sp)}
              isLaunching={launchingSpecialist === sp.key}
            />
          ))}
        </div>
      </div>

      {/* Main content: feed + compose */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Feed */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Feed</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { value: "all",    label: "Tous" },
                { value: "unread", label: `Non lus${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
                ...SPECIALISTS.map((s) => ({ value: s.key, label: s.label })),
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setActiveFilter(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    activeFilter === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun message — lancez une analyse depuis les cartes spécialistes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} onMarkRead={(id) => markRead.mutate(id)} />
              ))}
            </div>
          )}
        </div>

        {/* Compose — DG directive */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Envoyer une directive DG
          </h2>
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 block">Destinataire</label>
                  <Select value={newMsgSpecialist} onValueChange={setNewMsgSpecialist}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALISTS.map((s) => (
                        <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 block">Catégorie</label>
                  <Select value={newMsgCategory} onValueChange={setNewMsgCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directive" className="text-xs">Directive</SelectItem>
                      <SelectItem value="decision" className="text-xs">Décision</SelectItem>
                      <SelectItem value="briefing" className="text-xs">Briefing</SelectItem>
                      <SelectItem value="recommendation" className="text-xs">Recommandation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 block">Sujet</label>
                <Input
                  value={newMsgTitle}
                  onChange={(e) => setNewMsgTitle(e.target.value)}
                  placeholder="Ex : Revoir la politique tarifaire Q3..."
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 block">Message</label>
                <Textarea
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  placeholder="Rédigez votre directive ou décision stratégique…"
                  className="text-xs min-h-24 resize-y"
                />
              </div>
              <Button
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={() => sendDirective.mutate()}
                disabled={sendDirective.isPending || !newMsgTitle.trim() || !newMsgContent.trim()}
              >
                {sendDirective.isPending
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Envoi…</>
                  : <><Send className="h-3 w-3" /> Envoyer la directive</>}
              </Button>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground">Spécialistes configurés</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {SPECIALISTS.map((sp) => {
                const Icon = sp.icon;
                return (
                  <div key={sp.key} className="flex items-center gap-2 text-xs">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${sp.bg} shrink-0`}>
                      <Icon className={`h-3 w-3 ${sp.color}`} />
                    </div>
                    <div>
                      <span className="font-semibold">{sp.label}</span>
                      <span className="text-muted-foreground ml-1">— {sp.fullLabel}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
