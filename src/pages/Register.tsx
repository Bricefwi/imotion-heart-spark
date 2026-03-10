import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { AuthPhotoCarousel } from "@/components/AuthPhotoCarousel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
        data: { full_name: form.fullName, company_name: form.companyName, company_role: form.companyRole },
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

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/client/dashboard` },
    });
    if (error) {
      toast.error("Erreur lors de l'inscription Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-xl">
        <div className="mb-8">
          <Link to="/"><Logo size="lg" /></Link>
          <p className="text-sm text-muted-foreground mt-2 font-medium tracking-wide uppercase">
            AI-Powered Project Discovery
          </p>
        </div>
        <div className="space-y-2 mb-8">
          <h1 className="font-display text-3xl font-bold">Créer un compte 🚀</h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Commencez par vos informations de connexion." : "Parlez-nous de votre entreprise."}
          </p>
        </div>

        {step === 1 && (
          <>
            <Button
              variant="outline"
              className="w-full h-11 mb-4 text-sm font-medium"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              S'inscrire avec Google
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 mb-6">
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
              <Button type="submit" className="w-full gradient-primary border-0 h-11">Continuer →</Button>
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

      {/* Right - Photo carousel */}
      <div className="hidden lg:block flex-1 relative">
        <AuthPhotoCarousel />
      </div>
    </div>
  );
}
