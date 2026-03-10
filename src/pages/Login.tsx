import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/client/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-xl">
        <div className="mb-10">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>
        <div className="space-y-2 mb-8">
          <h1 className="font-display text-3xl font-bold">Bienvenue ! 👋</h1>
          <p className="text-muted-foreground">Connectez-vous pour accéder à votre espace.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full gradient-primary border-0 h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter →"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>

      {/* Right - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative text-white text-center max-w-md p-12">
          <h2 className="font-display text-3xl font-bold mb-4">Donnez vie à vos idées</h2>
          <p className="text-white/80 mb-8">
            IMOTION Discovery vous accompagne de l'idée au cahier des charges.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left">
            <p className="text-white/90 text-sm italic leading-relaxed mb-4">
              "IMOTION a parfaitement compris notre besoin et nous a livré une solution sur-mesure en un temps record."
            </p>
            <div>
              <p className="font-semibold text-sm">Marie Dupont</p>
              <p className="text-xs text-white/60">Directrice Marketing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
