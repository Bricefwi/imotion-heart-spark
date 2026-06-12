import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Megaphone, Loader2, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const CHANNEL_OPTIONS = ["LinkedIn", "Email", "Google Ads", "SEO", "Instagram", "Facebook", "YouTube", "Webinar", "Podcast", "Print"];
const TONE_OPTIONS = ["Expert chaleureux (IMOTION)", "Direct & punchy", "Pédagogique", "Inspirationnel", "Premium / luxe"];
const BUDGET_OPTIONS = ["< 2 000 €", "2 000 – 5 000 €", "5 000 – 15 000 €", "15 000 – 50 000 €", "> 50 000 €", "Non défini"];

interface Campaign {
  id: string;
  title: string;
  objective: string;
  target_audience: string;
  channels: string[];
  tone: string | null;
  budget_range: string | null;
  status: string;
  generated_content: Record<string, unknown> | null;
  raw_response: string | null;
  tokens_in: number;
  tokens_out: number;
  error_message: string | null;
  created_at: string;
  project_id: string | null;
}

export default function AdminMarketingCampaigns() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    objective: "",
    target_audience: "",
    channels: [] as string[],
    tone: "Expert chaleureux (IMOTION)",
    budget_range: "Non défini",
    extra_brief: "",
    project_id: "",
  });
  const [preview, setPreview] = useState<Campaign | null>(null);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["marketix-campaigns"],
    queryFn: async () => {
      const { data } = await db
        .from("mkt_marketix_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Campaign[];
    },
  });

  const { data: projects = [] } = useQuery<{ id: string; code: string; name: string }[]>({
    queryKey: ["admin-projects-light"],
    queryFn: async () => {
      const { data } = await db
        .from("projects")
        .select("id, code, name")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("marketix-generate-campaign", {
        body: {
          ...form,
          project_id: form.project_id || null,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Erreur génération");
      return data;
    },
    onSuccess: () => {
      toast.success("Campagne générée par MARKETIX");
      queryClient.invalidateQueries({ queryKey: ["marketix-campaigns"] });
      setForm({
        title: "", objective: "", target_audience: "",
        channels: [], tone: "Expert chaleureux (IMOTION)",
        budget_range: "Non défini", extra_brief: "", project_id: "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleChannel = (ch: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  };

  const canSubmit = form.title.trim() && form.objective.trim() && form.target_audience.trim() && form.channels.length > 0;

  return (
    <>
      <Helmet>
        <title>Campagnes MARKETIX — Admin IMOTION</title>
        <meta name="description" content="Génération manuelle de campagnes marketing via l'agent MARKETIX." />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[hsl(var(--imo-coral-600))] to-[hsl(var(--imo-amber-500))] flex items-center justify-center shrink-0">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campagnes MARKETIX</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Génération manuelle de campagnes marketing ciblées via l'agent stratégique <span className="font-mono font-semibold">MARKETIX</span>.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--imo-coral-600))]" />
              Nouveau brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Titre de la campagne *</Label>
                <Input id="title" placeholder="Ex. Lancement offre Audit IA Q3"
                  value={form.title} maxLength={200}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project">Projet associé (optionnel)</Label>
                <Select value={form.project_id || "none"} onValueChange={(v) => setForm(f => ({ ...f, project_id: v === "none" ? "" : v }))}>
                  <SelectTrigger id="project"><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-mono text-xs mr-2">{p.code}</span>{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="objective">Objectif *</Label>
              <Textarea id="objective" rows={2} maxLength={2000}
                placeholder="Ex. Générer 30 leads qualifiés PME pour un audit IA gratuit en 6 semaines."
                value={form.objective}
                onChange={(e) => setForm(f => ({ ...f, objective: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="audience">Audience cible *</Label>
              <Textarea id="audience" rows={2} maxLength={2000}
                placeholder="Ex. Dirigeants PME 10-50 salariés, secteur services B2B, France, sensibles à la transformation digitale mais sans équipe IT interne."
                value={form.target_audience}
                onChange={(e) => setForm(f => ({ ...f, target_audience: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Canaux *</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.map(ch => {
                  const active = form.channels.includes(ch);
                  return (
                    <button key={ch} type="button" onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? "bg-gradient-to-r from-[hsl(var(--imo-coral-600))] to-[hsl(var(--imo-amber-500))] text-white border-transparent"
                          : "bg-background text-muted-foreground border-border/60 hover:border-[hsl(var(--imo-coral-600)/0.5)]"
                      }`}>
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tone">Ton</Label>
                <Select value={form.tone} onValueChange={(v) => setForm(f => ({ ...f, tone: v }))}>
                  <SelectTrigger id="tone"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget">Budget indicatif</Label>
                <Select value={form.budget_range} onValueChange={(v) => setForm(f => ({ ...f, budget_range: v }))}>
                  <SelectTrigger id="budget"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extra">Contexte additionnel (optionnel)</Label>
              <Textarea id="extra" rows={3} maxLength={4000}
                placeholder="Contraintes, deadlines, événements à caler, contenus existants à réutiliser…"
                value={form.extra_brief}
                onChange={(e) => setForm(f => ({ ...f, extra_brief: e.target.value }))} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Déclenchement manuel. L'agent peut prendre 30-90 s.
              </p>
              <Button onClick={() => generate.mutate()} disabled={!canSubmit || generate.isPending}
                className="bg-gradient-to-r from-[hsl(var(--imo-coral-600))] to-[hsl(var(--imo-amber-500))] text-white hover:opacity-90">
                {generate.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Génération…</>
                  : <><Sparkles className="h-4 w-4 mr-2" />Générer la campagne</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Historique */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Aucune campagne générée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm truncate">{c.title}</span>
                        <StatusBadge status={c.status} />
                        {c.channels.slice(0, 4).map(ch => (
                          <Badge key={ch} variant="outline" className="text-[10px] px-1.5 py-0">{ch}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.objective}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {new Date(c.created_at).toLocaleString("fr-FR")} · {c.tokens_in + c.tokens_out} tokens
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setPreview(c)} disabled={c.status === "generating"}>
                      <Eye className="h-3.5 w-3.5 mr-1" />Voir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modale aperçu */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[hsl(var(--imo-coral-600))]" />
              {preview?.title}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={preview.status} />
                {preview.channels.map(ch => <Badge key={ch} variant="outline">{ch}</Badge>)}
              </div>
              {preview.error_message && (
                <div className="flex gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{preview.error_message}</span>
                </div>
              )}
              {preview.generated_content ? (
                <pre className="text-xs bg-muted/40 p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(preview.generated_content, null, 2)}
                </pre>
              ) : preview.raw_response ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Réponse brute (parsing JSON impossible) :</p>
                  <pre className="text-xs bg-muted/40 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {preview.raw_response}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground italic">Aucun contenu généré.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
    generating: { label: "Génération…", cls: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" /> },
    ready: { label: "Prête", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    ready_unparsed: { label: "Prête (brut)", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
    failed: { label: "Échec", cls: "bg-destructive/10 text-destructive border-destructive/20", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    draft: { label: "Brouillon", cls: "bg-muted text-muted-foreground border-border" },
  };
  const m = map[status] ?? map.draft;
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex items-center ${m.cls}`}>
      {m.icon}{m.label}
    </Badge>
  );
}
