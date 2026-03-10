import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check, X } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
