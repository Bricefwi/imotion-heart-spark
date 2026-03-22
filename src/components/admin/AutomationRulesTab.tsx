import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Zap, Mail, Clock, UserPlus, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, Play, BarChart3, Send,
  FileText, RefreshCw, Star, Calendar,
} from "lucide-react";
import type { AutomationLog, SupabaseError } from "@/types/admin";
import type { AutomationLog, SupabaseError } from "@/types/admin";

const TRIGGER_EVENTS = [
  { value: "user_registered", label: "Inscription utilisateur", icon: UserPlus, description: "Quand un nouveau client s'inscrit" },
  { value: "inactivity_7d", label: "Inactivité 7 jours", icon: Clock, description: "Client sans activité depuis 7 jours" },
  { value: "inactivity_14d", label: "Inactivité 14 jours", icon: Clock, description: "Client sans activité depuis 14 jours" },
  { value: "inactivity_30d", label: "Inactivité 30 jours", icon: AlertTriangle, description: "Client sans activité depuis 30 jours" },
  { value: "phase_completed", label: "Phase terminée", icon: CheckCircle2, description: "Quand un client termine une phase de découverte" },
  { value: "project_created", label: "Projet créé", icon: Zap, description: "Quand un client crée un nouveau projet" },
  { value: "document_ready", label: "Document prêt", icon: Mail, description: "Quand un document est finalisé" },
  { value: "project_signed", label: "Projet signé", icon: CheckCircle2, description: "Quand un projet passe en statut signé" },
  { value: "onboarding_incomplete_48h", label: "Onboarding incomplet 48h", icon: Clock, description: "Client n'a pas terminé l'onboarding après 48h" },
  { value: "cdc_generated", label: "CDC généré", icon: FileText, description: "Un Cahier des Charges vient d'être généré" },
  { value: "status_changed", label: "Statut modifié", icon: RefreshCw, description: "Le statut d'un projet a changé" },
  { value: "review_submitted", label: "Avis soumis", icon: Star, description: "Un client a soumis un avis" },
  { value: "weekly_digest", label: "Résumé hebdomadaire", icon: Calendar, description: "Envoi automatique du résumé chaque lundi" },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Envoi d'email" },
  { value: "notify_admin", label: "Notification in-app admin" },
  { value: "update_status", label: "Mise à jour automatique du statut" },
  { value: "slack_webhook", label: "Webhook externe (Slack, etc.)" },
];

const QUICK_TEMPLATES = [
  { name: "Email de bienvenue", trigger: "user_registered", actionType: "send_email", subject: "Bienvenue chez IMOTION Creator Studio !", body: "Bonjour {{nom}},\n\nBienvenue sur IMOTION Creator Studio ! Nous sommes ravis de vous accompagner dans votre projet digital.\n\nPour commencer, complétez votre profil et lancez votre premier projet.\n\nL'équipe IMOTION", icon: UserPlus, color: "bg-blue-500/10 text-blue-600" },
  { name: "Relance onboarding", trigger: "onboarding_incomplete_48h", actionType: "send_email", subject: "Finalisez votre inscription — {{entreprise}}", body: "Bonjour {{nom}},\n\nVous n'avez pas encore finalisé votre onboarding. Complétez votre profil en quelques minutes pour débloquer votre premier cahier des charges gratuit !\n\nÀ très vite,\nL'équipe IMOTION", icon: Clock, color: "bg-amber-500/10 text-amber-600" },
  { name: "Alerte CDC prêt", trigger: "cdc_generated", actionType: "notify_admin", subject: "", body: "Un nouveau CDC a été généré pour le projet {{projet}}. Vérifiez-le avant l'envoi au client.", icon: FileText, color: "bg-primary/10 text-primary" },
  { name: "Notification statut", trigger: "status_changed", actionType: "send_email", subject: "Votre projet évolue — {{projet}}", body: "Bonjour {{nom}},\n\nLe statut de votre projet {{projet}} a été mis à jour. Connectez-vous pour suivre l'avancement.\n\nCordialement,\nIMOTION Creator Studio", icon: RefreshCw, color: "bg-green-500/10 text-green-600" },
  { name: "Rappel inactivité", trigger: "inactivity_7d", actionType: "send_email", subject: "Votre projet vous attend — {{entreprise}}", body: "Bonjour {{nom}},\n\nNous avons remarqué que vous n'avez pas été actif depuis quelques jours. Votre projet {{projet}} attend votre retour !\n\nBesoin d'aide ? Contactez-nous à contact@imotion-conseils.fr\n\nL'équipe IMOTION", icon: AlertTriangle, color: "bg-secondary/10 text-secondary" },
  { name: "Alerte nouvel avis", trigger: "review_submitted", actionType: "notify_admin", subject: "", body: "Un client a soumis un nouvel avis. Consultez-le dans le panneau de modération.", icon: Star, color: "bg-yellow-500/10 text-yellow-600" },
  { name: "Archivage auto 90j", trigger: "inactivity_30d", actionType: "update_status", subject: "", body: "archived", icon: Clock, color: "bg-muted text-muted-foreground" },
];

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string;
  trigger_config: Record<string, string | number | boolean>;
  action_type: string;
  action_config: Record<string, string | number | boolean>;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

export function AutomationRulesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<AutomationRule | null>(null);
  const [animateParent] = useAutoAnimate();

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formActionType, setFormActionType] = useState("send_email");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutomationRule[];
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
    mutationFn: async (rule: Omit<AutomationRule, "id" | "is_active" | "last_triggered_at" | "trigger_count" | "created_at"> & { created_by?: string }) => {
      const { error } = await supabase.from("automation_rules").insert(rule);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Automatisme créé", description: "La règle d'automatisation a été créée." });
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: SupabaseError) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from("automation_rules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({ title: "Mis à jour" });
      setEditRule(null);
      resetForm();
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
      toast({ title: "Supprimé" });
    },
    onError: (err: SupabaseError) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    },
  });

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormTrigger("");
    setFormSubject("");
    setFormBody("");
    setFormActionType("send_email");
  }

  function openEdit(rule: AutomationRule) {
    setEditRule(rule);
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormTrigger(rule.trigger_event);
    setFormSubject(rule.action_config?.subject?.toString() || "");
    setFormBody(rule.action_config?.body?.toString() || "");
    setFormActionType(rule.action_type || "send_email");
    setCreateOpen(true);
  }

  function applyTemplate(template: typeof QUICK_TEMPLATES[number]) {
    setEditRule(null);
    setFormName(template.name);
    setFormDescription("");
    setFormTrigger(template.trigger);
    setFormActionType(template.actionType);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setCreateOpen(true);
  }

  function handleSubmit() {
    if (!formName || !formTrigger) {
      toast({ title: "Champs requis", description: "Nom et déclencheur sont obligatoires.", variant: "destructive" });
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
      created_by: user?.id,
    };

    if (editRule) {
      updateMutation.mutate({ id: editRule.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const totalExecutions = rules.reduce((s, r) => s + r.trigger_count, 0);
  const activeRules = rules.filter((r) => r.is_active);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rules.length}</p>
              <p className="text-xs text-muted-foreground">Règles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Play className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRules.length}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalExecutions}</p>
              <p className="text-xs text-muted-foreground">Exécutions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Logs récents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create button */}
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold">Règles d'automatisation</h3>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setEditRule(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editRule ? "Modifier la règle" : "Nouvelle automatisation"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nom de la règle *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Email de bienvenue" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Courte description…" />
              </div>
              <div className="space-y-2">
                <Label>Déclencheur *</Label>
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
                  <p className="text-xs text-muted-foreground">
                    {TRIGGER_EVENTS.find((t) => t.value === formTrigger)?.description}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Type d'action *</Label>
                <Select value={formActionType} onValueChange={setFormActionType}>
                  <SelectTrigger><SelectValue placeholder="Choisir un type d'action" /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              {formActionType === "send_email" && (
                <>
                  <div className="space-y-2">
                    <Label>Sujet de l'email</Label>
                    <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Bienvenue chez IMOTION Creator Studio !" />
                  </div>
                  <div className="space-y-2">
                    <Label>Corps du message</Label>
                    <Textarea
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder="Bonjour {{nom}}, bienvenue sur notre plateforme…"
                      rows={5}
                    />
                    <p className="text-[10px] text-muted-foreground">Variables: {"{{nom}}, {{email}}, {{entreprise}}, {{projet}}"}</p>
                  </div>
                </>
              )}
              {formActionType === "notify_admin" && (
                <div className="space-y-2">
                  <Label>Message de notification</Label>
                  <Textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Message à afficher dans les notifications admin…"
                    rows={4}
                  />
                  <p className="text-[10px] text-muted-foreground">Variables: {"{{nom}}, {{email}}, {{entreprise}}, {{projet}}"}</p>
                </div>
              )}
              {formActionType === "update_status" && (
                <div className="space-y-2">
                  <Label>Nouveau statut</Label>
                  <Input
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Ex: archived, completed, in_review…"
                  />
                </div>
              )}
              {formActionType === "slack_webhook" && (
                <div className="space-y-2">
                  <Label>URL du webhook</Label>
                  <Input
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); setEditRule(null); resetForm(); }}>Annuler</Button>
              <Button className="gradient-primary border-0" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editRule ? "Mettre à jour" : "Créer la règle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick templates */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">Modèles rapides</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

      {/* Rules list */}
      <div className="space-y-3" ref={animateParent}>
        {rules.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Zap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucune règle d'automatisation.</p>
              <p className="text-xs text-muted-foreground mt-1">Créez votre première règle pour automatiser vos emails.</p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => {
            const triggerInfo = TRIGGER_EVENTS.find((t) => t.value === rule.trigger_event);
            const TriggerIcon = triggerInfo?.icon || Zap;
            return (
              <Card key={rule.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${rule.is_active ? "bg-primary/10" : "bg-muted"}`}>
                        <TriggerIcon className={`h-5 w-5 ${rule.is_active ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{rule.name}</h4>
                          <Badge variant={rule.is_active ? "default" : "outline"} className={`text-[10px] ${rule.is_active ? "bg-green-100 text-green-800" : ""}`}>
                            {rule.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {triggerInfo?.label || rule.trigger_event}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {rule.action_config?.subject?.toString() || "Email"}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" /> {rule.trigger_count} exécutions
                          </span>
                          {rule.last_triggered_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(rule.last_triggered_at), { addSuffix: true, locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, is_active: checked })}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(rule.id)}>
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

      {/* Recent logs */}
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
    </div>
  );
}
