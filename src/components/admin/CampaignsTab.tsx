import { useState } from "react";
import type { Campaign, SupabaseError } from "@/types/admin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Megaphone, Plus, Send, Clock, CheckCircle2, Users,
  Eye, MousePointer, Pencil, Trash2, BarChart3,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  draft: { label: "Brouillon", class: "bg-muted text-muted-foreground" },
  scheduled: { label: "Planifiée", class: "bg-blue-100 text-blue-800" },
  sending: { label: "En cours", class: "bg-yellow-100 text-yellow-800" },
  sent: { label: "Envoyée", class: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulée", class: "bg-destructive/10 text-destructive" },
};

const SEGMENTS = [
  { value: "all", label: "Tous les clients" },
  { value: "active", label: "Clients actifs (projet en cours)" },
  { value: "inactive_14d", label: "Inactifs depuis 14 jours" },
  { value: "inactive_30d", label: "Inactifs depuis 30 jours" },
  { value: "new_30d", label: "Inscrits ces 30 derniers jours" },
  { value: "signed", label: "Clients avec projet signé" },
  { value: "no_project", label: "Sans projet" },
];

export function CampaignsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSegment, setFormSegment] = useState("all");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["campaign-profiles-count"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id");
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { error } = await supabase.from("email_campaigns").insert(campaign);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast({ title: "Campagne créée" });
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: SupabaseError) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast({ title: "Campagne supprimée" });
    },
  });

  function resetForm() {
    setFormName("");
    setFormSubject("");
    setFormContent("");
    setFormSegment("all");
  }

  function handleCreate() {
    if (!formName || !formSubject || !formContent) {
      toast({ title: "Champs requis", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      name: formName,
      subject: formSubject,
      content: formContent,
      segment_filter: { segment: formSegment },
      total_recipients: profiles.length,
      created_by: user?.id,
    });
  }

  const totalSent = campaigns.reduce((s, c: Campaign) => s + (c.total_sent || 0), 0);
  const totalOpened = campaigns.reduce((s, c: Campaign) => s + (c.total_opened || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campaigns.length}</p>
              <p className="text-xs text-muted-foreground">Campagnes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSent}</p>
              <p className="text-xs text-muted-foreground">Envoyés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOpened}</p>
              <p className="text-xs text-muted-foreground">Ouverts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profiles.length}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold">Campagnes email</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nouvelle campagne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nom de la campagne *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Newsletter Mars 2026" />
              </div>
              <div className="space-y-2">
                <Label>Segment cible</Label>
                <Select value={formSegment} onValueChange={setFormSegment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sujet de l'email *</Label>
                <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="Objet de l'email" />
              </div>
              <div className="space-y-2">
                <Label>Contenu *</Label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Corps du message (Markdown supporté)…"
                  rows={8}
                />
                <p className="text-[10px] text-muted-foreground">Variables: {"{{nom}}, {{email}}, {{entreprise}}"}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Annuler</Button>
              <Button className="gradient-primary border-0" onClick={handleCreate} disabled={createMutation.isPending}>
                Créer la campagne
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns list */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucune campagne créée.</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign: Campaign) => {
            const statusInfo = STATUS_MAP[campaign.status] || STATUS_MAP.draft;
            const segmentLabel = SEGMENTS.find((s) => s.value === campaign.segment_filter?.segment)?.label || "Tous";
            return (
              <Card key={campaign.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{campaign.name}</h4>
                        <Badge className={`text-[10px] ${statusInfo.class}`}>{statusInfo.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sujet: {campaign.subject}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {segmentLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" /> {campaign.total_sent || 0} envoyés
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {campaign.total_opened || 0} ouverts
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" /> {campaign.total_clicked || 0} clics
                        </span>
                        <span>
                          {campaign.created_at ? formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: fr }) : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {campaign.status === "draft" && (
                        <Button variant="outline" size="sm" className="text-xs">
                          <Send className="h-3 w-3 mr-1" /> Envoyer
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(campaign.id)}>
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
    </div>
  );
}
