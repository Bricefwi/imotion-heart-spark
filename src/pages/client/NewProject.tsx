import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);

    try {
      // 1. Create the project
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          client_id: user.id,
          status: "draft",
          discovery_data: {
            initial_description: description.trim() || null,
          },
        })
        .select("id")
        .single();

      if (projError) throw projError;

      // 2. Create a discovery_audit job linked to the project
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          client_id: user.id,
          project_id: project.id,
          type: "discovery_audit",
          status: "queued",
          agent_phase: "intake",
          payload: {
            project_name: name.trim(),
            initial_description: description.trim() || null,
          },
          created_by: user.id,
        })
        .select("id")
        .single();

      if (jobError) throw jobError;

      // 3. Log activity
      await supabase.from("activities").insert({
        user_id: user.id,
        project_id: project.id,
        action: "project",
        description: `Projet "${name}" créé + diagnostic IA lancé`,
      });

      toast.success("Projet créé — analyse IA en cours !");
      navigate(`/client/jobs/${job.id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/client/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Nouveau diagnostic</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-[hsl(var(--imo-coral-600))]" />
            Décrivez votre projet
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Nos agents IA analyseront votre besoin et produiront un diagnostic complet en quelques minutes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Refonte de mon site e-commerce"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Décrivez votre besoin</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Plus vous êtes précis, plus le diagnostic sera pertinent. Décrivez votre activité, vos objectifs, vos contraintes..."
              rows={5}
            />
          </div>

          {/* What happens next */}
          <div className="rounded-xl bg-muted/50 border border-border/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Ce qui va se passer</p>
            {[
              "Collecte et analyse de votre demande (Mistral EU)",
              "Identification de vos besoins clés (Mistral EU)",
              "Cadrage périmètre & fonctionnalités",
              "Validation qualité (Claude Sonnet)",
              "Génération du rapport de diagnostic",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-[hsl(var(--imo-coral-600)/0.1)] text-[hsl(var(--imo-coral-600))] flex items-center justify-center font-bold text-[10px] shrink-0">
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>

          <Button
            className="w-full gradient-primary border-0"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? (
              <>
                <BrainCircuit className="h-4 w-4 mr-2 animate-pulse" />
                Lancement du diagnostic…
              </>
            ) : (
              <>
                <BrainCircuit className="h-4 w-4 mr-2" />
                Lancer le diagnostic IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
