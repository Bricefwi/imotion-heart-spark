import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { AuthPhotoCarousel } from "@/components/AuthPhotoCarousel";
import { toast } from "sonner";
import { Loader2, Mail, Wand2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
    } else {
      navigate("/client/dashboard");
    }
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/client/dashboard` },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Lien magique envoyé ! Vérifiez votre email.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/client/dashboard` },
    });
    if (error) {
      toast.error("Erreur lors de la connexion Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead title="Connexion" description="Connectez-vous à IMOTION Creator Studio pour accéder à vos projets et votre cahier des charges." canonical="/login" noindex />
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-xl">
        <div className="mb-8">
          <Link to="/"><Logo size="lg" /></Link>
          <p className="text-sm text-muted-foreground mt-2 font-medium tracking-wide uppercase">
            AI-Powered Project Discovery
          </p>
        </div>
        <div className="space-y-2 mb-8">
          <h1 className="font-display text-3xl font-bold">
            {mode === "password" ? "Bienvenue" : "Connexion magique"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "password" ? "Connectez-vous pour accéder à votre espace." : "Recevez un lien de connexion par email."}
          </p>
        </div>

        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full h-11 mb-4 text-sm font-medium"
          onClick={handleGoogleLogin}
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
          Continuer avec Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {mode === "password" ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Mot de passe oublié ?</Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter →"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input id="magic-email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Mail className="mr-2 h-4 w-4" /> Envoyer le lien magique</>
              )}
            </Button>
          </form>
        )}

        <button
          onClick={() => setMode(mode === "password" ? "magic" : "password")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {mode === "password" ? "Connexion sans mot de passe" : "Connexion avec mot de passe"}
        </button>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Créer un compte</Link>
        </p>
      </div>

      {/* Right - Photo carousel */}
      <div className="hidden lg:block flex-1 relative">
        <AuthPhotoCarousel />
      </div>
    </div>
  );
}
