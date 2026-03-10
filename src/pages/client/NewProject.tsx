import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles } from "lucide-react";
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
      const { data, error } = await supabase
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

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert({
        user_id: user.id,
        project_id: data.id,
        action: "project",
        description: `Projet "${name}" créé`,
      });

      toast.success("Projet créé avec succès !");
      navigate(`/client/projects/${data.id}/conversation`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du projet");
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
        <h1 className="font-display text-2xl font-bold">Nouveau projet</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Décrivez votre projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Refonte de mon site e-commerce"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description rapide (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement votre besoin..."
              rows={4}
            />
          </div>
          <Button
            className="w-full gradient-primary border-0"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? "Création..." : "Créer et démarrer la conversation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
