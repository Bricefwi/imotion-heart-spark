import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User, Building2, Globe, Target, Wallet, Wrench, Users, ArrowRight, ArrowLeft, Check, Sparkles,
} from "lucide-react";

const STEPS = [
  { icon: User, label: "Vous", title: "Faisons connaissance" },
  { icon: Building2, label: "Entreprise", title: "Votre entreprise" },
  { icon: Globe, label: "Digital", title: "Présence digitale" },
  { icon: Target, label: "Objectifs", title: "Vos objectifs" },
  { icon: Wallet, label: "Budget", title: "Budget & Planning" },
  { icon: Wrench, label: "Outils", title: "Stack actuelle" },
  { icon: Users, label: "Inspiration", title: "Concurrents & Inspiration" },
];

const INDUSTRIES = [
  "E-commerce", "SaaS / Tech", "Services B2B", "Services B2C", "Santé", "Éducation",
  "Finance", "Immobilier", "Média / Presse", "Association / ONG", "Industrie", "Autre",
];

const COMPANY_SIZES = ["1 personne", "2-10", "11-50", "51-200", "200+"];

const BUDGET_RANGES = [
  "< 5 000 €", "5 000 – 15 000 €", "15 000 – 30 000 €", "30 000 – 60 000 €", "60 000 – 100 000 €", "> 100 000 €",
];

const TIMELINES = [
  "Dès que possible", "1-3 mois", "3-6 mois", "6-12 mois", "Pas de deadline",
];

const OBJECTIVES = [
  "Créer un site vitrine", "Lancer un e-commerce", "Développer une application web",
  "Développer une app mobile", "Refondre un site existant", "Automatiser des processus",
  "Améliorer le SEO", "Mettre en place un CRM", "Autre",
];

const TOOLS = [
  "WordPress", "Shopify", "Wix", "HubSpot", "Salesforce", "Notion",
  "Google Workspace", "Microsoft 365", "Slack", "Trello / Asana", "Aucun", "Autre",
];

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    company_name: profile?.company_name || "",
    company_role: profile?.company_role || "",
    company_size: profile?.company_size || "",
    industry: profile?.industry || "",
    website: profile?.website || "",
    social_linkedin: "",
    social_instagram: "",
    social_facebook: "",
    objectives: [] as string[],
    objectives_detail: "",
    budget_range: "",
    timeline: "",
    desired_deadline: "",
    current_tools: [] as string[],
    other_tools: "",
    competitors: "",
    inspiration: "",
    additional_notes: "",
  });

  const update = (field: string, value: any) => setData((d) => ({ ...d, [field]: value }));
  const toggleArray = (field: string, value: string) => {
    const arr = (data as any)[field] as string[];
    update(field, arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const canNext = () => {
    if (step === 0) return data.full_name.trim().length > 0;
    if (step === 1) return data.company_name.trim().length > 0 && data.industry.length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Save profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          company_name: data.company_name,
          company_role: data.company_role,
          company_size: data.company_size,
          industry: data.industry,
          website: data.website,
          onboarding_completed: true,
          onboarding_step: STEPS.length,
          preferences: {
            ...((profile?.preferences && typeof profile.preferences === "object" && !Array.isArray(profile.preferences)) ? profile.preferences : {}),
            social_linkedin: data.social_linkedin,
            social_instagram: data.social_instagram,
            social_facebook: data.social_facebook,
            objectives: data.objectives,
            objectives_detail: data.objectives_detail,
            budget_range: data.budget_range,
            timeline: data.timeline,
            desired_deadline: data.desired_deadline,
            current_tools: data.current_tools,
            other_tools: data.other_tools,
            competitors: data.competitors,
            inspiration: data.inspiration,
            additional_notes: data.additional_notes,
          },
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Auto-create a project and redirect to the AI conversation
      const projectName = data.objectives_detail?.trim()
        ? data.objectives_detail.slice(0, 60)
        : data.objectives.length > 0
          ? data.objectives[0]
          : "Mon projet digital";

      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectName,
          client_id: user.id,
          status: "discovery",
          discovery_data: {
            initial_description: data.objectives_detail || null,
            objectives: data.objectives,
            budget_range: data.budget_range,
            timeline: data.timeline,
            current_tools: data.current_tools,
            competitors: data.competitors,
            inspiration: data.inspiration,
          },
        })
        .select("id")
        .single();

      if (projectError) throw projectError;

      toast.success("Bienvenue ! Démarrons la création de votre cahier des charges.");
      navigate(`/client/projects/${newProject.id}/conversation`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      console.error("Onboarding finish error:", err);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const saveStep = async () => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_step: step + 1 })
        .eq("id", user.id);
    } catch (err) {
      console.warn("Failed to save step progress:", err);
    }
  };

  const next = async () => {
    if (step < STEPS.length - 1) {
      await saveStep();
      setStep(step + 1);
    } else {
      await handleFinish();
    }
  };

  const prev = () => step > 0 && setStep(step - 1);

  const SelectChip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Commençons par apprendre à vous connaître.</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nom complet *</Label>
                <Input id="full_name" value={data.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jean Dupont" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+33 6 12 34 56 78" className="mt-1.5" />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Parlez-nous de votre entreprise pour mieux vous accompagner.</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                <Input id="company_name" value={data.company_name} onChange={(e) => update("company_name", e.target.value)} placeholder="Ma Super Startup" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="company_role">Votre rôle</Label>
                <Input id="company_role" value={data.company_role} onChange={(e) => update("company_role", e.target.value)} placeholder="CEO, Directeur Marketing…" className="mt-1.5" />
              </div>
              <div>
                <Label>Taille de l'entreprise</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {COMPANY_SIZES.map((s) => (
                    <SelectChip key={s} selected={data.company_size === s} onClick={() => update("company_size", s)}>{s}</SelectChip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Secteur d'activité *</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {INDUSTRIES.map((ind) => (
                    <SelectChip key={ind} selected={data.industry === ind} onClick={() => update("industry", ind)}>{ind}</SelectChip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Votre présence en ligne actuelle nous aide à évaluer vos besoins.</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="website">Site web actuel</Label>
                <Input id="website" value={data.website} onChange={(e) => update("website", e.target.value)} placeholder="https://monsite.com" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="social_linkedin">LinkedIn</Label>
                <Input id="social_linkedin" value={data.social_linkedin} onChange={(e) => update("social_linkedin", e.target.value)} placeholder="https://linkedin.com/company/…" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="social_instagram">Instagram</Label>
                <Input id="social_instagram" value={data.social_instagram} onChange={(e) => update("social_instagram", e.target.value)} placeholder="@moncompte" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="social_facebook">Facebook</Label>
                <Input id="social_facebook" value={data.social_facebook} onChange={(e) => update("social_facebook", e.target.value)} placeholder="https://facebook.com/…" className="mt-1.5" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Quels sont vos objectifs principaux ? Sélectionnez tout ce qui s'applique.</p>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVES.map((obj) => (
                <SelectChip key={obj} selected={data.objectives.includes(obj)} onClick={() => toggleArray("objectives", obj)}>{obj}</SelectChip>
              ))}
            </div>
            <div>
              <Label htmlFor="objectives_detail">Précisez votre besoin</Label>
              <Textarea id="objectives_detail" value={data.objectives_detail} onChange={(e) => update("objectives_detail", e.target.value)} placeholder="Décrivez en quelques lignes ce que vous souhaitez réaliser…" className="mt-1.5 min-h-[100px]" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Ces informations nous permettent de calibrer notre proposition.</p>
            <div className="space-y-4">
              <div>
                <Label>Budget estimé</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {BUDGET_RANGES.map((b) => (
                    <SelectChip key={b} selected={data.budget_range === b} onClick={() => update("budget_range", b)}>{b}</SelectChip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Horizon de lancement</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {TIMELINES.map((t) => (
                    <SelectChip key={t} selected={data.timeline === t} onClick={() => update("timeline", t)}>{t}</SelectChip>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="desired_deadline">Date limite souhaitée (optionnel)</Label>
                <Input id="desired_deadline" type="date" value={data.desired_deadline} onChange={(e) => update("desired_deadline", e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Quels outils utilisez-vous actuellement ?</p>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <SelectChip key={tool} selected={data.current_tools.includes(tool)} onClick={() => toggleArray("current_tools", tool)}>{tool}</SelectChip>
              ))}
            </div>
            <div>
              <Label htmlFor="other_tools">Autres outils</Label>
              <Input id="other_tools" value={data.other_tools} onChange={(e) => update("other_tools", e.target.value)} placeholder="ERP interne, logiciel métier…" className="mt-1.5" />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">Partagez vos sources d'inspiration pour nous aider à comprendre votre vision.</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="competitors">Concurrents principaux</Label>
                <Textarea id="competitors" value={data.competitors} onChange={(e) => update("competitors", e.target.value)} placeholder="Listez vos concurrents ou sites similaires…" className="mt-1.5 min-h-[80px]" />
              </div>
              <div>
                <Label htmlFor="inspiration">Sites ou apps qui vous inspirent</Label>
                <Textarea id="inspiration" value={data.inspiration} onChange={(e) => update("inspiration", e.target.value)} placeholder="URLs ou noms de sites dont vous aimez le design ou les fonctionnalités…" className="mt-1.5 min-h-[80px]" />
              </div>
              <div>
                <Label htmlFor="additional_notes">Notes supplémentaires</Label>
                <Textarea id="additional_notes" value={data.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} placeholder="Tout ce que vous aimeriez ajouter…" className="mt-1.5 min-h-[80px]" />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <Badge variant="outline" className="text-xs">
          Étape {step + 1} / {STEPS.length}
        </Badge>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step indicators (desktop) */}
      <div className="hidden md:flex justify-center gap-1 py-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={i}
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 md:py-10">
        <Card className="w-full max-w-xl border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                    <StepIcon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold">{STEPS[step].title}</h2>
                  </div>
                </div>

                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="ghost" onClick={prev} disabled={step === 0} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Précédent
              </Button>
              <Button
                onClick={next}
                disabled={!canNext() || saving}
                className="gradient-primary border-0 gap-2"
              >
                {step === STEPS.length - 1 ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {saving ? "Lancement…" : "Démarrer mon CDC"}
                  </>
                ) : (
                  <>
                    Suivant <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
