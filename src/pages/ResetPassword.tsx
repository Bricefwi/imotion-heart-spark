import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check, X, AlertTriangle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Au moins 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/[0-9]/, "Au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial");

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères minimum", ok: password.length >= 8 },
    { label: "Une majuscule", ok: /[A-Z]/.test(password) },
    { label: "Une minuscule", ok: /[a-z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
    { label: "Un caractère spécial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? (score <= 2 ? "bg-destructive" : score <= 3 ? "bg-secondary" : "bg-green-500") : "bg-muted"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1 text-[11px]">
            {c.ok ? <Check className="h-3 w-3 text-green-500 shrink-0" /> : <X className="h-3 w-3 text-muted-foreground shrink-0" />}
            <span className={c.ok ? "text-green-600" : "text-muted-foreground"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  // Finding M6 : le formulaire n'est affiché que si une session de récupération
  // (événement PASSWORD_RECOVERY, émis par le SDK à l'arrivée via le lien
  // de reset) est effectivement détectée. Sinon, état « lien invalide/expiré ».
  const [recoveryState, setRecoveryState] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryState("ready");
      }
    });

    // Filet de sécurité : si aucun événement PASSWORD_RECOVERY ne survient
    // (lien expiré, déjà consommé, ou visite directe de la page), on affiche
    // un état explicite au lieu d'un formulaire non autorisé.
    const timer = setTimeout(() => {
      setRecoveryState((current) => (current === "checking" ? "invalid" : current));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryState !== "ready") {
      toast.error("Lien de récupération invalide ou expiré.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour !");
      navigate("/login");
    }
    setLoading(false);
  };

  if (recoveryState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification du lien de récupération…</p>
        </div>
      </div>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <div className="flex justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="font-display text-2xl font-bold">Lien invalide ou expiré</h1>
          <p className="text-muted-foreground">
            Ce lien de réinitialisation est expiré, a déjà été utilisé, ou est invalide.
            Demandez un nouveau lien pour continuer.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full gradient-primary border-0 h-11">
              <Link to="/forgot-password">Demander un nouveau lien</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-11">
              <Link to="/login">Retour à la connexion</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="font-display text-2xl font-bold mb-2">Nouveau mot de passe</h1>
          <p className="text-muted-foreground">Choisissez un nouveau mot de passe sécurisé.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Nouveau mot de passe
            </Label>
            <Input type="password" placeholder="Min. 8 caractères avec majuscule, chiffre, spécial" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <Label>Confirmer le mot de passe</Label>
            <Input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {confirm && password !== confirm && (
              <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 h-11" disabled={loading || !passwordSchema.safeParse(password).success || password !== confirm}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mettre à jour"}
          </Button>
        </form>
      </div>
    </div>
  );
}
