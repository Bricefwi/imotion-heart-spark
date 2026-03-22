import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Building2, Save } from "lucide-react";

export default function ClientProfile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    company_role: "",
    company_size: "",
    industry: "",
    website: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        company_name: profile.company_name || "",
        company_role: profile.company_role || "",
        company_size: profile.company_size || "",
        industry: profile.industry || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        company_name: form.company_name,
        company_role: form.company_role,
        company_size: form.company_size,
        industry: form.industry,
        website: form.website,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du profil.");
    } else {
      toast.success("Profil mis à jour avec succès !");
    }
    setLoading(false);
  };

  const initials = form.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles et professionnelles.</p>
      </div>

      {/* Avatar section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-lg font-bold">{form.full_name || "Votre nom"}</h2>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            {form.company_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{form.company_role} — {form.company_name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input placeholder="06 00 00 00 00" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input placeholder="https://monsite.com" value={form.website} onChange={(e) => update("website", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Company info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Informations entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom de l'entreprise</Label>
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fonction</Label>
            <Input placeholder="CEO, CTO, PM..." value={form.company_role} onChange={(e) => update("company_role", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Taille de l'entreprise</Label>
            <Select value={form.company_size} onValueChange={(v) => update("company_size", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Indépendant</SelectItem>
                <SelectItem value="2-10">2-10 employés</SelectItem>
                <SelectItem value="11-50">11-50 employés</SelectItem>
                <SelectItem value="51-200">51-200 employés</SelectItem>
                <SelectItem value="201-500">201-500 employés</SelectItem>
                <SelectItem value="500+">500+ employés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Secteur d'activité</Label>
            <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Technologie</SelectItem>
                <SelectItem value="retail">Commerce / Retail</SelectItem>
                <SelectItem value="health">Santé</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="education">Éducation</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="industry">Industrie</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gradient-primary border-0 h-11 px-8" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
