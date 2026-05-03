import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Copy, CheckCheck, Send, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function NewAuditLink() {
  const navigate = useNavigate();
  const { agency, subscription } = useAgency();
  const [prospectEmail, setProspectEmail] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ audit_url: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isQuotaReached = subscription && subscription.plan !== "agency"
    && subscription.audits_used >= subscription.audits_quota;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-link-create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prospect_email: prospectEmail || undefined,
            prospect_name: prospectName || undefined,
            expires_in_days: expiresInDays,
          }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Erreur lors de la création");

      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.audit_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isQuotaReached) {
    return (
      <div className="container py-8 max-w-lg">
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <div className="font-semibold mb-1">Quota d'audits atteint</div>
            <div>Vous avez utilisé {subscription.audits_used}/{subscription.audits_quota} audits ce mois.</div>
            <Link to="/app/billing" className="underline font-medium mt-1 inline-block">
              Upgrader votre plan →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-lg">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link to="/app/audits">
          <ArrowLeft className="size-4 mr-1" /> Retour
        </Link>
      </Button>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle>Créer un lien d'audit</CardTitle>
            <CardDescription>
              Envoyez ce lien à votre prospect. Il démarrera un audit conversationnel brandé à votre agence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du prospect (optionnel)</Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email du prospect (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.fr"
                  value={prospectEmail}
                  onChange={(e) => setProspectEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si renseigné, un email d'invitation lui sera envoyé automatiquement.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Validité du lien</Label>
                <select
                  id="expires"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Création…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Créer le lien
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCheck className="size-5" /> Lien créé !
            </CardTitle>
            <CardDescription>
              Partagez ce lien avec votre prospect. L'audit dure ~6 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={result.audit_url} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyUrl}>
                {copied ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                Créer un autre lien
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/app/audits">Voir mes audits</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
