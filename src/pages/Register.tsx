import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", companyName: "", companyRole: "", companySize: "", industry: "",
  });

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.fullName },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Vérifiez votre email pour confirmer votre inscription.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-xl">
        <div className="mb-10">
          <Link to="/"><Logo size="md" /></Link>
        </div>
        <div className="space-y-2 mb-8">
          <h1 className="font-display text-3xl font-bold">Créer un compte 🚀</h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Commencez par vos informations de connexion." : "Parlez-nous de votre entreprise."}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "gradient-primary" : "bg-muted"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "gradient-primary" : "bg-muted"}`} />
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="space-y-5">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input placeholder="Jean Dupont" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email professionnel</Label>
                <Input type="email" placeholder="jean@entreprise.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input type="password" placeholder="Min. 8 caractères" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 h-11">
                Continuer →
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nom de l'entreprise</Label>
                <Input placeholder="Votre entreprise" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Votre fonction</Label>
                <Input placeholder="CEO, CTO, PM..." value={form.companyRole} onChange={(e) => update("companyRole", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Taille de l'entreprise</Label>
                <Select value={form.companySize} onValueChange={(v) => update("companySize", v)}>
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
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>← Retour</Button>
                <Button type="submit" className="flex-1 gradient-primary border-0" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
        </p>
      </div>

      {/* Right */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative text-white text-center max-w-md p-12">
          <h2 className="font-display text-3xl font-bold mb-4">Rejoignez IMOTION</h2>
          <p className="text-white/80">Plus de 150 entreprises transforment déjà leurs idées en projets concrets.</p>
        </div>
      </div>
    </div>
  );
}
