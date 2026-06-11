import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Zap, Mail, Clock, UserPlus, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, Play, BarChart3, Send,
  FileText, RefreshCw, Star, Calendar, Eye, Gift, Snowflake,
  PartyPopper, Rocket, Sparkles, MessageCircleHeart, Target,
} from "lucide-react";
import type { AutomationLog, SupabaseError } from "@/types/admin";
import { AUTOMATION_VARIABLES, insertVariableAtCursor } from "@/lib/automation-variables";
import { AutomationEmailPreviewModal } from "@/components/automation/AutomationEmailPreviewModal";

// ── Déclencheurs disponibles ───────────────────────────────────────────────
const TRIGGER_EVENTS = [
  { value: "user_registered", label: "Inscription utilisateur", icon: UserPlus, description: "Quand un nouveau client s'inscrit" },
  { value: "inactivity_7d", label: "Inactivité 7 jours", icon: Clock, description: "Client sans activité depuis 7 jours" },
  { value: "inactivity_14d", label: "Inactivité 14 jours", icon: Clock, description: "Client sans activité depuis 14 jours" },
  { value: "inactivity_30d", label: "Inactivité 30 jours", icon: AlertTriangle, description: "Client sans activité depuis 30 jours" },
  { value: "phase_completed", label: "Phase terminée", icon: CheckCircle2, description: "Quand un client termine une phase de découverte" },
  { value: "project_created", label: "Projet créé", icon: Zap, description: "Quand un client crée un nouveau projet" },
  { value: "document_ready", label: "Document prêt", icon: Mail, description: "Quand un document est finalisé" },
  { value: "project_signed", label: "Projet signé", icon: CheckCircle2, description: "Quand un projet passe en statut signé" },
  { value: "project_delivered", label: "Projet livré", icon: Rocket, description: "Quand le projet bascule en statut livré" },
  { value: "onboarding_incomplete_48h", label: "Onboarding incomplet 48h", icon: Clock, description: "Client n'a pas terminé l'onboarding après 48h" },
  { value: "cdc_generated", label: "CDC généré", icon: FileText, description: "Un Cahier des Charges vient d'être généré" },
  { value: "status_changed", label: "Statut modifié", icon: RefreshCw, description: "Le statut d'un projet a changé" },
  { value: "review_submitted", label: "Avis soumis", icon: Star, description: "Un client a soumis un avis" },
  { value: "nps_requested", label: "Demande d'avis (NPS)", icon: MessageCircleHeart, description: "Déclenchement d'une enquête de satisfaction" },
  { value: "client_anniversary", label: "Anniversaire client", icon: Gift, description: "1 an après l'inscription du client" },
  { value: "proposal_stale_30d", label: "Proposition froide 30j", icon: Snowflake, description: "Proposition envoyée sans signature depuis 30 jours" },
  { value: "weekly_digest", label: "Résumé hebdomadaire", icon: Calendar, description: "Envoi automatique du résumé chaque lundi" },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Envoi d'email" },
  { value: "notify_admin", label: "Notification in-app admin" },
  { value: "update_status", label: "Mise à jour automatique du statut" },
  { value: "slack_webhook", label: "Webhook externe (Slack, etc.)" },
];

const PROJECT_STATUSES = [
  "draft", "discovery", "discovery_complete", "cdc_ready",
  "proposal", "negotiation", "signed", "in_progress",
  "delivered", "completed", "cancelled", "lost",
];

const RECIPIENTS = [
  { value: "client", label: "Client du projet" },
  { value: "consultant", label: "Consultant assigné" },
  { value: "admin", label: "Admin (Patrice)" },
  { value: "custom", label: "Email personnalisé" },
];

// ── Modèles rapides ────────────────────────────────────────────────────────
const QUICK_TEMPLATES = [
  // Existants
  { name: "Email de bienvenue", trigger: "user_registered", actionType: "send_email", subject: "Bienvenue chez IMOTION Creator Studio !", body: "Bonjour {{prenom}},\n\nBienvenue sur IMOTION Creator Studio ! Nous sommes ravis de vous accompagner dans votre projet digital.\n\n### Vos premiers pas\n\n- Complétez votre profil\n- Lancez votre première discovery avec Marc, votre consultant IA\n- Recevez un Cahier des Charges professionnel **offert**\n\n[Commencer maintenant](https://app.imotion-conseils.fr/client/projects)\n\nÀ très vite,\n**L'équipe IMOTION**", icon: UserPlus, color: "bg-blue-500/10 text-blue-600", delayMinutes: 0 },
  { name: "Relance onboarding", trigger: "onboarding_incomplete_48h", actionType: "send_email", subject: "Finalisez votre inscription — {{entreprise}}", body: "Bonjour {{prenom}},\n\nVous n'avez pas encore finalisé votre onboarding. Complétez votre profil en quelques minutes pour débloquer votre premier cahier des charges **gratuit** !\n\n[Reprendre où je m'étais arrêté]({{lien_projet}})\n\nÀ très vite,\n**L'équipe IMOTION**", icon: Clock, color: "bg-amber-500/10 text-amber-600", delayMinutes: 0 },
  { name: "Alerte CDC prêt", trigger: "cdc_generated", actionType: "notify_admin", subject: "", body: "Un nouveau CDC a été généré pour le projet {{projet}}. Vérifiez-le avant l'envoi au client.", icon: FileText, color: "bg-primary/10 text-primary", delayMinutes: 0 },
  { name: "Notification statut", trigger: "status_changed", actionType: "send_email", subject: "Votre projet évolue — {{projet}}", body: "Bonjour {{prenom}},\n\nLe statut de votre projet **{{projet}}** a été mis à jour : `{{statut}}`.\n\n[Suivre l'avancement]({{lien_projet}})\n\nCordialement,\n**IMOTION Creator Studio**", icon: RefreshCw, color: "bg-green-500/10 text-green-600", delayMinutes: 0 },
  { name: "Rappel inactivité", trigger: "inactivity_7d", actionType: "send_email", subject: "Votre projet vous attend — {{entreprise}}", body: "Bonjour {{prenom}},\n\nNous avons remarqué que vous n'avez pas été actif depuis quelques jours. Votre projet **{{projet}}** attend votre retour !\n\n> Besoin d'aide ? Répondez simplement à cet email, nous reviendrons vers vous sous 24h.\n\n[Reprendre mon projet]({{lien_projet}})\n\n**L'équipe IMOTION**", icon: AlertTriangle, color: "bg-secondary/10 text-secondary", delayMinutes: 0 },
  { name: "Alerte nouvel avis", trigger: "review_submitted", actionType: "notify_admin", subject: "", body: "Un client a soumis un nouvel avis. Consultez-le dans le panneau de modération.", icon: Star, color: "bg-yellow-500/10 text-yellow-600", delayMinutes: 0 },
  { name: "Archivage auto 90j", trigger: "inactivity_30d", actionType: "update_status", subject: "", body: "archived", icon: Clock, color: "bg-muted text-muted-foreground", delayMinutes: 60 * 24 * 60 },
  // Nouveaux modèles intelligents
  { name: "Bienvenue + 1er pas", trigger: "user_registered", actionType: "send_email", subject: "Et si on démarrait votre projet ?", body: "Bonjour {{prenom}},\n\nUne heure que vous êtes des nôtres ! Pour bien commencer, voici **3 minutes** qui vont vous faire gagner des semaines :\n\n### 1. Lancez la discovery\nMarc, notre consultant IA, va clarifier votre besoin en 7 étapes guidées.\n\n### 2. Recevez votre CDC offert\nUn document professionnel, structuré, prêt à présenter à n'importe quel prestataire.\n\n### 3. On en discute (sans engagement)\nSi notre approche vous convient, on vous fait un devis sur-mesure.\n\n[Démarrer la discovery]({{lien_projet}})\n\n**Patrice & l'équipe IMOTION**", icon: Sparkles, color: "bg-blue-500/10 text-blue-600", delayMinutes: 60 },
  { name: "Discovery démarrée", trigger: "phase_completed", actionType: "send_email", subject: "Belle première étape, {{prenom}} !", body: "Bonjour {{prenom}},\n\nFélicitations, vous venez de boucler la première phase de votre discovery sur **{{projet}}**. Excellent travail !\n\n### Ce qu'on a déjà clarifié\n- Votre besoin métier\n- Vos enjeux prioritaires\n\n### Prochaine étape\nLa phase **Vision** : on va dessiner ensemble ce à quoi ressemble votre projet une fois livré.\n\n[Continuer]({{lien_projet}})\n\nBon courage !\n**L'équipe IMOTION**", icon: PartyPopper, color: "bg-pink-500/10 text-pink-600", delayMinutes: 0 },
  { name: "CDC prêt à valider", trigger: "cdc_generated", actionType: "send_email", subject: "Votre Cahier des Charges est prêt 🎉", body: "Bonjour {{prenom}},\n\n**Votre Cahier des Charges pour {{projet}} est prêt.**\n\nC'est le résultat condensé de notre discovery : objectifs, périmètre fonctionnel, contraintes, livrables. Vous pouvez :\n\n- Le télécharger en PDF\n- Le partager avec votre équipe\n- L'utiliser pour consulter d'autres prestataires (oui, vraiment 😉)\n\n[Voir mon CDC]({{lien_cdc}})\n\nUne fois que vous l'avez lu, on peut en discuter et établir une proposition adaptée.\n\n**À très vite,\nIMOTION**", icon: FileText, color: "bg-primary/10 text-primary", delayMinutes: 0 },
  { name: "Signature contrat", trigger: "project_signed", actionType: "send_email", subject: "Bienvenue à bord, {{prenom}} 🚀", body: "Bonjour {{prenom}},\n\n**On y est. Merci pour votre confiance.**\n\nVotre projet **{{projet}}** démarre officiellement. Voici ce qui se passe maintenant :\n\n### Cette semaine\n- Réunion de kickoff (votre consultant {{consultant}} vous contacte)\n- Mise en place des accès et de l'environnement\n\n### Les semaines suivantes\nVous suivrez l'avancement en temps réel dans votre espace.\n\n[Accéder à mon espace]({{lien_projet}})\n\n**Patrice Simion**\nIMOTION Cabinet Conseil", icon: Rocket, color: "bg-green-500/10 text-green-600", delayMinutes: 0 },
  { name: "Projet livré", trigger: "project_delivered", actionType: "send_email", subject: "Votre projet est en ligne ! 🎉", body: "Bonjour {{prenom}},\n\n**{{projet}} est livré.**\n\nMerci pour votre engagement tout au long du projet. Vous trouverez dans votre espace tous les livrables, la documentation et les accès.\n\n### Et maintenant ?\n- Profitez de la garantie incluse pour ajuster les derniers détails\n- Découvrez nos options de maintenance pour pérenniser votre investissement\n\n[Voir mon projet]({{lien_projet}})\n\n**Bravo et à très vite !\nIMOTION**", icon: Rocket, color: "bg-emerald-500/10 text-emerald-600", delayMinutes: 0 },
  { name: "Demande d'avis (NPS)", trigger: "inactivity_7d", actionType: "send_email", subject: "{{prenom}}, 2 minutes pour nous aider ?", body: "Bonjour {{prenom}},\n\nVotre projet **{{projet}}** est livré depuis quelques jours. On aimerait beaucoup avoir votre retour.\n\n> Sur une échelle de 0 à 10, recommanderiez-vous IMOTION à un proche ?\n\n[Donner mon avis]({{lien_projet}})\n\nVotre retour, même critique, est précieux : il nous aide à progresser et oriente les autres porteurs de projet.\n\n**Merci !\nPatrice & l'équipe IMOTION**", icon: MessageCircleHeart, color: "bg-pink-500/10 text-pink-600", delayMinutes: 0 },
  { name: "Anniversaire client", trigger: "user_registered", actionType: "send_email", subject: "Joyeux anniversaire d'inscription, {{prenom}} !", body: "Bonjour {{prenom}},\n\nIl y a un an, jour pour jour, vous nous faisiez confiance. **Merci.** 🎂\n\nPour fêter ça, on vous offre :\n\n- Un nouveau **CDC offert** sur votre prochain projet\n- Un audit marketing **gratuit** réalisé par lovelib\n\n[Profiter de mon cadeau]({{lien_projet}})\n\n**À bientôt,\nIMOTION**", icon: Gift, color: "bg-rose-500/10 text-rose-600", delayMinutes: 60 * 24 * 365 },
  { name: "Pipeline froid", trigger: "proposal_stale_30d", actionType: "notify_admin", subject: "", body: "La proposition sur **{{projet}}** ({{entreprise}}) est sans réponse depuis 30 jours. Pensez à relancer {{nom}} ({{email}}).", icon: Snowflake, color: "bg-sky-500/10 text-sky-600", delayMinutes: 0 },
  { name: "Relance proposition", trigger: "proposal_stale_30d", actionType: "send_email", subject: "On en est où sur {{projet}} ?", body: "Bonjour {{prenom}},\n\nJe me permets de revenir vers vous : ma proposition pour **{{projet}}** date d'il y a un mois et je n'ai pas eu de nouvelles.\n\n> Pas de pression : juste savoir si le sujet est toujours d'actualité, ou si vos priorités ont évolué.\n\nUn simple mot suffit, je m'adapte.\n\n[Discutons-en]({{lien_projet}})\n\n**Patrice Simion**\nIMOTION Cabinet Conseil", icon: Target, color: "bg-orange-500/10 text-orange-600", delayMinutes: 0 },
];

// ── Types ──────────────────────────────────────────────────────────────────
type Conditions = {
  project_status?: string[];
  min_phase?: number;
  tag?: string;
  min_amount?: number | null;
  max_amount?: number | null;
  role?: string;
};

type ScheduleConfig = {
  delay_minutes?: number;
  send_window?: { hour_start?: number; hour_end?: number };
  frequency_cap?: { max?: number; per_days?: number };
};

type TargetConfig = {
  recipient?: string;
  custom_email?: string;
  cc?: string[];
  bcc?: string[];
};

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string;
  trigger_config: Record<string, string | number | boolean>;
  action_type: string;
  action_config: Record<string, string | number | boolean>;
  conditions: Conditions;
  schedule_config: ScheduleConfig;
  target_config: TargetConfig;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

const DEFAULT_SCHEDULE: ScheduleConfig = { delay_minutes: 0, send_window: { hour_start: 9, hour_end: 18 }, frequency_cap: { max: 3, per_days: 30 } };
const DEFAULT_TARGET: TargetConfig = { recipient: "client", custom_email: "", cc: [], bcc: [] };
const DEFAULT_CONDITIONS: Conditions = {};

// ── Composant ──────────────────────────────────────────────────────────────
export function AutomationRulesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [previewRule, setPreviewRule] = useState<AutomationRule | null>(null);
  const [viewTab, setViewTab] = useState<"rules" | "emails">("rules");
  const [formTab, setFormTab] = useState("trigger");

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formActionType, setFormActionType] = useState("send_email");
  const [formConditions, setFormConditions] = useState<Conditions>(DEFAULT_CONDITIONS);
  const [formSchedule, setFormSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [formTarget, setFormTarget] = useState<TargetConfig>(DEFAULT_TARGET);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<"subject" | "body">("body");

  const { data: rules = [] } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown) as AutomationRule[];
    },
    enabled: !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["automation-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (rule: Record<string, unknown>) => {
      const { error } = await supabase.from("automation_rules").insert(rule as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Automatisme créé", description: "La règle a été enregistrée." });
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: SupabaseError) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from("automation_rules").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Règle mise à jour" });
      setEditRule(null);
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: SupabaseError) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Règle supprimée" });
    },
    onError: (err: SupabaseError) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormTrigger("");
    setFormSubject("");
    setFormBody("");
    setFormActionType("send_email");
    setFormConditions(DEFAULT_CONDITIONS);
    setFormSchedule(DEFAULT_SCHEDULE);
    setFormTarget(DEFAULT_TARGET);
    setFormTab("trigger");
  }

  function openEdit(rule: AutomationRule) {
    setEditRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormTrigger(rule.trigger_event);
    setFormSubject(rule.action_config?.subject?.toString() || "");
    setFormBody(rule.action_config?.body?.toString() || rule.action_config?.message?.toString() || rule.action_config?.new_status?.toString() || rule.action_config?.webhook_url?.toString() || "");
    setFormActionType(rule.action_type || "send_email");
    setFormConditions({ ...DEFAULT_CONDITIONS, ...(rule.conditions || {}) });
    setFormSchedule({ ...DEFAULT_SCHEDULE, ...(rule.schedule_config || {}) });
    setFormTarget({ ...DEFAULT_TARGET, ...(rule.target_config || {}) });
    setCreateOpen(true);
    setFormTab("trigger");
  }

  function applyTemplate(template: typeof QUICK_TEMPLATES[number]) {
    setEditRule(null);
    setFormName(template.name);
    setFormDescription("");
    setFormTrigger(template.trigger);
    setFormActionType(template.actionType);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setFormConditions(DEFAULT_CONDITIONS);
    setFormSchedule({ ...DEFAULT_SCHEDULE, delay_minutes: template.delayMinutes ?? 0 });
    setFormTarget(DEFAULT_TARGET);
    setCreateOpen(true);
    setFormTab("trigger");
  }

  function handleSubmit() {
    if (!formName || !formTrigger) {
      toast({ title: "Champs requis", description: "Nom et déclencheur sont obligatoires.", variant: "destructive" });
      setFormTab("trigger");
      return;
    }

    const actionConfig: Record<string, string> = {};
    if (formActionType === "send_email") {
      actionConfig.subject = formSubject;
      actionConfig.body = formBody;
    } else if (formActionType === "notify_admin") {
      actionConfig.message = formBody;
    } else if (formActionType === "update_status") {
      actionConfig.new_status = formBody;
    } else if (formActionType === "slack_webhook") {
      actionConfig.webhook_url = formBody;
    }

    const payload = {
      name: formName,
      description: formDescription || null,
      type: formActionType === "send_email" ? "email" : formActionType,
      trigger_event: formTrigger,
      trigger_config: {},
      action_type: formActionType,
      action_config: actionConfig,
      conditions: formConditions as unknown as Record<string, unknown>,
      schedule_config: formSchedule as unknown as Record<string, unknown>,
      target_config: formTarget as unknown as Record<string, unknown>,
      created_by: user?.id,
    };

    if (editRule) {
      updateMutation.mutate({ id: editRule.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function insertVariable(key: string) {
    const target = lastFocusedField === "subject" ? subjectRef.current : bodyRef.current;
    const current = lastFocusedField === "subject" ? formSubject : formBody;
    const { value, nextCursor } = insertVariableAtCursor(target, current, key);
    if (lastFocusedField === "subject") setFormSubject(value);
    else setFormBody(value);
    requestAnimationFrame(() => {
      target?.focus();
      try { target?.setSelectionRange(nextCursor, nextCursor); } catch { /* ignore */ }
    });
  }

  const totalExecutions = rules.reduce((s, r) => s + r.trigger_count, 0);
  const activeRules = rules.filter((r) => r.is_active);
  const emailRules = rules.filter((r) => r.action_type === "send_email");

  return (
    <div className="space-y-4">
      {/* Stats KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Règles" value={rules.length} icon={Zap} tone="primary" />
        <StatTile label="Actives" value={activeRules.length} icon={Play} tone="success" />
        <StatTile label="Exécutions" value={totalExecutions} icon={Send} tone="info" />
        <StatTile label="Logs récents" value={logs.length} icon={BarChart3} tone="secondary" />
      </div>

      {/* Onglet Règles / Emails */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "rules" | "emails")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="rules"><Zap className="h-3.5 w-3.5 mr-1.5" /> Règles</TabsTrigger>
            <TabsTrigger value="emails"><Mail className="h-3.5 w-3.5 mr-1.5" /> Emails ({emailRules.length})</TabsTrigger>
          </TabsList>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setEditRule(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle règle
              </Button>
            </DialogTrigger>
            <FormDialog
              editRule={editRule}
              formTab={formTab}
              setFormTab={setFormTab}
              formName={formName}
              setFormName={setFormName}
              formDescription={formDescription}
              setFormDescription={setFormDescription}
              formTrigger={formTrigger}
              setFormTrigger={setFormTrigger}
              formActionType={formActionType}
              setFormActionType={setFormActionType}
              formSubject={formSubject}
              setFormSubject={setFormSubject}
              formBody={formBody}
              setFormBody={setFormBody}
              formConditions={formConditions}
              setFormConditions={setFormConditions}
              formSchedule={formSchedule}
              setFormSchedule={setFormSchedule}
              formTarget={formTarget}
              setFormTarget={setFormTarget}
              bodyRef={bodyRef}
              subjectRef={subjectRef}
              setLastFocusedField={setLastFocusedField}
              insertVariable={insertVariable}
              onSubmit={handleSubmit}
              onCancel={() => { setCreateOpen(false); setEditRule(null); resetForm(); }}
              isPending={createMutation.isPending || updateMutation.isPending}
            />
          </Dialog>
        </div>

        {/* Onglet Règles */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          {/* Modèles rapides */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Modèles intelligents ({QUICK_TEMPLATES.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {QUICK_TEMPLATES.map((tpl) => {
                const TplIcon = tpl.icon;
                return (
                  <Card key={tpl.name} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => applyTemplate(tpl)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tpl.color}`}>
                        <TplIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{tpl.name}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs shrink-0 h-7 px-2">Activer</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Liste des règles */}
          <div className="space-y-3">
            {rules.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune règle d'automatisation.</p>
                  <p className="text-xs text-muted-foreground mt-1">Activez un modèle ci-dessus ou créez votre première règle.</p>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule) => {
                const triggerInfo = TRIGGER_EVENTS.find((t) => t.value === rule.trigger_event);
                const TriggerIcon = triggerInfo?.icon || Zap;
                const delay = rule.schedule_config?.delay_minutes || 0;
                return (
                  <Card key={rule.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${rule.is_active ? "bg-primary/10" : "bg-muted"}`}>
                            <TriggerIcon className={`h-5 w-5 ${rule.is_active ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{rule.name}</h4>
                              <Badge variant={rule.is_active ? "default" : "outline"} className={`text-[10px] ${rule.is_active ? "bg-green-100 text-green-800" : ""}`}>
                                {rule.is_active ? "Actif" : "Inactif"}
                              </Badge>
                              {delay > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Clock className="h-2.5 w-2.5 mr-1" /> {formatDelay(delay)}
                                </Badge>
                              )}
                            </div>
                            {rule.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{rule.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {triggerInfo?.label || rule.trigger_event}</span>
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {rule.action_config?.subject?.toString() || ACTION_TYPES.find(a => a.value === rule.action_type)?.label || "—"}</span>
                              <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {rule.trigger_count} exécutions</span>
                              {rule.last_triggered_at && (
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(rule.last_triggered_at), { addSuffix: true, locale: fr })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch checked={rule.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })} />
                          {rule.action_type === "send_email" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Aperçu de l'email" onClick={() => setPreviewRule(rule)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => openEdit(rule)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Supprimer" onClick={() => deleteMutation.mutate(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Historique */}
          {logs.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">Historique d'exécution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {logs.map((log: AutomationLog) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-green-500" : log.status === "error" ? "bg-destructive" : "bg-yellow-500"}`} />
                      <span>{log.target_email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                      <span>{formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: fr })}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Emails — galerie d'aperçus */}
        <TabsContent value="emails" className="space-y-3 mt-4">
          {emailRules.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun email automatisé pour le moment.</p>
                <p className="text-xs text-muted-foreground mt-1">Activez un modèle "Email" pour voir l'aperçu ici.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emailRules.map((rule) => (
                <Card key={rule.id} className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{rule.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{rule.action_config?.subject?.toString() || "(sans objet)"}</p>
                      </div>
                      <Badge variant={rule.is_active ? "default" : "outline"} className={`text-[10px] shrink-0 ${rule.is_active ? "bg-green-100 text-green-800" : ""}`}>
                        {rule.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    {/* Aperçu miniature du bandeau */}
                    <div className="rounded-md overflow-hidden border bg-white">
                      <div className="h-10 flex items-center justify-between px-3" style={{ background: "linear-gradient(90deg, #0F0D0B 0%, #0F0D0B 26%, #2A1108 33%, #6B2210 40%, #B23E1A 50%, #D9591F 62%, #EB7A1F 78%, #F08A00 100%)" }}>
                        <span className="text-white text-[10px] font-bold tracking-wide">IMOTION</span>
                        <span className="text-white/90 text-[10px] uppercase tracking-wider">Cabinet Conseil</span>
                      </div>
                      <p className="p-3 text-xs text-muted-foreground line-clamp-3">{(rule.action_config?.body?.toString() || "").slice(0, 200)}…</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreviewRule(rule)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Voir le rendu
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Modifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal d'aperçu */}
      {previewRule && (
        <AutomationEmailPreviewModal
          open={!!previewRule}
          onOpenChange={(o) => !o && setPreviewRule(null)}
          ruleName={previewRule.name}
          subject={previewRule.action_config?.subject?.toString() || ""}
          body={previewRule.action_config?.body?.toString() || ""}
        />
      )}
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof Zap; tone: "primary" | "success" | "info" | "secondary" }) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-600",
    info: "bg-blue-100 text-blue-600",
    secondary: "bg-secondary/10 text-secondary",
  }[tone];
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDelay(minutes: number): string {
  if (minutes < 60) return `+${minutes} min`;
  if (minutes < 60 * 24) return `+${Math.round(minutes / 60)} h`;
  if (minutes < 60 * 24 * 30) return `+${Math.round(minutes / 60 / 24)} j`;
  return `+${Math.round(minutes / 60 / 24 / 30)} mois`;
}

// ── Modal formulaire (extraite pour lisibilité) ────────────────────────────

interface FormDialogProps {
  editRule: AutomationRule | null;
  formTab: string;
  setFormTab: (v: string) => void;
  formName: string; setFormName: (v: string) => void;
  formDescription: string; setFormDescription: (v: string) => void;
  formTrigger: string; setFormTrigger: (v: string) => void;
  formActionType: string; setFormActionType: (v: string) => void;
  formSubject: string; setFormSubject: (v: string) => void;
  formBody: string; setFormBody: (v: string) => void;
  formConditions: Conditions; setFormConditions: (v: Conditions) => void;
  formSchedule: ScheduleConfig; setFormSchedule: (v: ScheduleConfig) => void;
  formTarget: TargetConfig; setFormTarget: (v: TargetConfig) => void;
  bodyRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  subjectRef: React.MutableRefObject<HTMLInputElement | null>;
  setLastFocusedField: (v: "subject" | "body") => void;
  insertVariable: (key: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function FormDialog(props: FormDialogProps) {
  const {
    editRule, formTab, setFormTab,
    formName, setFormName, formDescription, setFormDescription,
    formTrigger, setFormTrigger, formActionType, setFormActionType,
    formSubject, setFormSubject, formBody, setFormBody,
    formConditions, setFormConditions, formSchedule, setFormSchedule, formTarget, setFormTarget,
    bodyRef, subjectRef, setLastFocusedField, insertVariable,
    onSubmit, onCancel, isPending,
  } = props;

  const delayMinutes = formSchedule.delay_minutes ?? 0;
  const freqMax = formSchedule.frequency_cap?.max ?? 3;
  const freqDays = formSchedule.frequency_cap?.per_days ?? 30;

  return (
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display">{editRule ? "Modifier la règle" : "Nouvelle automatisation"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-3 py-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nom de la règle *</Label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Email de bienvenue" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Courte description…" />
          </div>
        </div>

        <Tabs value={formTab} onValueChange={setFormTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="trigger">Déclencheur</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="action">Action</TabsTrigger>
            <TabsTrigger value="schedule">Planification</TabsTrigger>
          </TabsList>

          {/* Déclencheur */}
          <TabsContent value="trigger" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label>Événement déclencheur *</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger><SelectValue placeholder="Choisir un déclencheur" /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formTrigger && (
                <p className="text-xs text-muted-foreground">{TRIGGER_EVENTS.find((t) => t.value === formTrigger)?.description}</p>
              )}
            </div>
          </TabsContent>

          {/* Conditions */}
          <TabsContent value="conditions" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground">
              Filtres optionnels combinés en ET. Laissez vide pour appliquer la règle à tous les destinataires.
            </p>
            <div className="space-y-1.5">
              <Label>Rôle du destinataire</Label>
              <Select
                value={formConditions.role || "any"}
                onValueChange={(v) => setFormConditions({ ...formConditions, role: v === "any" ? undefined : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Tous</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statuts de projet acceptés</Label>
              <div className="flex flex-wrap gap-1.5">
                {PROJECT_STATUSES.map((s) => {
                  const active = formConditions.project_status?.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = formConditions.project_status || [];
                        const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
                        setFormConditions({ ...formConditions, project_status: next.length ? next : undefined });
                      }}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phase minimale</Label>
                <Select
                  value={String(formConditions.min_phase ?? 0)}
                  onValueChange={(v) => setFormConditions({ ...formConditions, min_phase: Number(v) || undefined })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucune</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <SelectItem key={p} value={String(p)}>Phase {p}+</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tag CRM contient</Label>
                <Input value={formConditions.tag || ""} onChange={(e) => setFormConditions({ ...formConditions, tag: e.target.value || undefined })} placeholder="vip, urgent…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Montant proposal min (€)</Label>
                <Input type="number" value={formConditions.min_amount ?? ""} onChange={(e) => setFormConditions({ ...formConditions, min_amount: e.target.value ? Number(e.target.value) : null })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Montant proposal max (€)</Label>
                <Input type="number" value={formConditions.max_amount ?? ""} onChange={(e) => setFormConditions({ ...formConditions, max_amount: e.target.value ? Number(e.target.value) : null })} placeholder="—" />
              </div>
            </div>
          </TabsContent>

          {/* Action */}
          <TabsContent value="action" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label>Type d'action *</Label>
              <Select value={formActionType} onValueChange={setFormActionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formActionType === "send_email" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:col-span-1">
                    <Label>Destinataire principal</Label>
                    <Select value={formTarget.recipient || "client"} onValueChange={(v) => setFormTarget({ ...formTarget, recipient: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECIPIENTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {formTarget.recipient === "custom" && (
                    <div className="space-y-1.5">
                      <Label>Email custom</Label>
                      <Input type="email" value={formTarget.custom_email || ""} onChange={(e) => setFormTarget({ ...formTarget, custom_email: e.target.value })} placeholder="contact@exemple.fr" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Objet de l'email</Label>
                  <Input
                    ref={subjectRef}
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    onFocus={() => setLastFocusedField("subject")}
                    placeholder="Bienvenue chez IMOTION !"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Corps (markdown)</Label>
                  <Textarea
                    ref={bodyRef}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    onFocus={() => setLastFocusedField("body")}
                    placeholder="Bonjour {{prenom}}, …&#10;&#10;### Sous-titre&#10;&#10;[Bouton CTA](https://app.imotion-conseils.fr)"
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Variables disponibles — cliquez pour insérer</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {AUTOMATION_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        title={v.description}
                        className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/30 transition-colors font-mono"
                      >
                        {`{{${v.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {formActionType === "notify_admin" && (
              <div className="space-y-1.5">
                <Label>Message de notification</Label>
                <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Message à afficher dans les notifications admin…" rows={4} />
              </div>
            )}
            {formActionType === "update_status" && (
              <div className="space-y-1.5">
                <Label>Nouveau statut</Label>
                <Input value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Ex: archived, completed…" />
              </div>
            )}
            {formActionType === "slack_webhook" && (
              <div className="space-y-1.5">
                <Label>URL du webhook</Label>
                <Input value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="https://hooks.slack.com/…" />
              </div>
            )}
          </TabsContent>

          {/* Planification */}
          <TabsContent value="schedule" className="space-y-5 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Délai après déclenchement</Label>
                <Badge variant="outline" className="text-[10px]">{formatDelay(delayMinutes)}</Badge>
              </div>
              <Slider
                value={[delayMinutes]}
                min={0}
                max={60 * 24 * 30}
                step={15}
                onValueChange={(v) => setFormSchedule({ ...formSchedule, delay_minutes: v[0] })}
              />
              <p className="text-[11px] text-muted-foreground">0 = immédiat. Max : 30 jours.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Fenêtre d'envoi (heure)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">À partir de</Label>
                  <Select value={String(formSchedule.send_window?.hour_start ?? 9)} onValueChange={(v) => setFormSchedule({ ...formSchedule, send_window: { ...formSchedule.send_window, hour_start: Number(v) } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 24 }, (_, i) => <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}h</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jusqu'à</Label>
                  <Select value={String(formSchedule.send_window?.hour_end ?? 18)} onValueChange={(v) => setFormSchedule({ ...formSchedule, send_window: { ...formSchedule.send_window, hour_end: Number(v) } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 24 }, (_, i) => <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}h</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Évite les envois en pleine nuit. Heure de Paris.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Plafond de fréquence (anti-spam)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max d'envois</Label>
                  <Input type="number" min={1} max={50} value={freqMax} onChange={(e) => setFormSchedule({ ...formSchedule, frequency_cap: { ...formSchedule.frequency_cap, max: Number(e.target.value) || 1 } })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sur (jours)</Label>
                  <Input type="number" min={1} max={365} value={freqDays} onChange={(e) => setFormSchedule({ ...formSchedule, frequency_cap: { ...formSchedule.frequency_cap, per_days: Number(e.target.value) || 1 } })} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Ex : max 3 envois sur 30 jours par destinataire.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button className="gradient-primary border-0" onClick={onSubmit} disabled={isPending}>
          {editRule ? "Mettre à jour" : "Créer la règle"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
