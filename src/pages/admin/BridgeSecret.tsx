import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, KeyRound,
  RefreshCw, ShieldCheck, ExternalLink, Sparkles, XCircle, Loader2
} from "lucide-react";
import { toast } from "sonner";

type StatusResp = {
  configured: boolean;
  length: number;
  strong: boolean;
  fingerprint: string | null;
  project_url: string;
};
type GenerateResp = { candidate: string; length: number; hint: string };
type SelfTestResp = { ok: boolean; step: string; error?: string; jti?: string };

async function callFn<T>(action: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-bridge-secret", {
    body: { action },
  });
  if (error) throw error;
  return data as T;
}

export default function BridgeSecret() {
  const [candidate, setCandidate] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const statusQ = useQuery({
    queryKey: ["bridge-secret-status"],
    queryFn: () => callFn<StatusResp>("status"),
    refetchInterval: 30000,
  });

  const genMut = useMutation({
    mutationFn: () => callFn<GenerateResp>("generate"),
    onSuccess: (d) => {
      setCandidate(d.candidate);
      setReveal(true);
      setAcknowledged(false);
      toast.success("Nouveau secret généré (non sauvegardé)");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: () => callFn<SelfTestResp>("selftest"),
    onSuccess: (d) => {
      if (d.ok) toast.success("Pont OK : signature + vérification réussies");
      else toast.error(`Échec self-test (${d.step}) : ${d.error || "mismatch"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async (val: string, label = "Copié") => {
    try {
      await navigator.clipboard.writeText(val);
      toast.success(label);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const cloudSecretsUrl = "https://lovable.dev/projects/63a5fc40-b3d7-4f5f-a065-34e429e33aec/settings/secrets";

  return (
    <div className="space-y-6 p-1 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Bridge Secret</h1>
            <Badge variant="outline" className="text-[10px]">Admin only</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Gère <code className="text-xs bg-muted px-1.5 py-0.5 rounded">LOVELIB_BRIDGE_SECRET</code>,
            le secret HMAC partagé entre Clarivi et lovelib pour signer les jetons SSO et webhooks.
          </p>
        </div>
      </div>

      {/* Security warning */}
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Manipulation sensible</AlertTitle>
        <AlertDescription className="text-xs">
          Pour des raisons de sécurité, le secret n'est <strong>jamais affiché en clair</strong> côté serveur,
          même aux admins. Cette page peut <strong>générer une nouvelle valeur candidate</strong> que vous devez
          coller manuellement dans les secrets des deux projets, puis lancer un self-test.
        </AlertDescription>
      </Alert>

      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> État actuel
          </CardTitle>
          <CardDescription>Vérification de la configuration côté Clarivi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusQ.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : statusQ.error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{(statusQ.error as Error).message}</AlertDescription>
            </Alert>
          ) : statusQ.data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  label="Configuré"
                  value={statusQ.data.configured ? "Oui" : "Non"}
                  tone={statusQ.data.configured ? "success" : "danger"}
                  icon={statusQ.data.configured ? CheckCircle2 : XCircle}
                />
                <Field
                  label="Force"
                  value={statusQ.data.strong ? `Forte (${statusQ.data.length} car.)` : `Faible (${statusQ.data.length} car.)`}
                  tone={statusQ.data.strong ? "success" : "danger"}
                  icon={statusQ.data.strong ? ShieldCheck : AlertTriangle}
                />
                <Field
                  label="Empreinte"
                  value={statusQ.data.fingerprint || "—"}
                  tone="default"
                  mono
                />
              </div>
              <p className="text-xs text-muted-foreground">
                L'empreinte est les 2 premiers et 2 derniers caractères. Comparez-la côté lovelib pour vérifier que les deux apps utilisent bien la <strong>même</strong> valeur.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => statusQ.refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir
                </Button>
                <Button
                  size="sm"
                  onClick={() => testMut.mutate()}
                  disabled={testMut.isPending || !statusQ.data.configured}
                  className="gap-2"
                >
                  {testMut.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Sparkles className="h-3.5 w-3.5" />}
                  Self-test (signe + vérifie)
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Générer un nouveau secret</CardTitle>
          <CardDescription>
            48 octets aléatoires (base64url, ~64 caractères). La valeur n'est pas sauvegardée automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className="gap-2 bg-gradient-to-r from-primary to-secondary text-white"
          >
            {genMut.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            Générer une nouvelle valeur
          </Button>

          {candidate && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label className="text-xs flex items-center justify-between">
                  <span>Valeur candidate (ne sera plus affichée après rafraîchissement)</span>
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {reveal ? "Masquer" : "Afficher"}
                  </button>
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={reveal ? candidate : "•".repeat(Math.min(64, candidate.length))}
                    className="font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(candidate, "Secret copié dans le presse-papier")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">Étapes d'installation</AlertTitle>
                <AlertDescription className="text-xs space-y-2 mt-2">
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>
                      <strong>Clarivi</strong> — Ouvrir{" "}
                      <a href={cloudSecretsUrl} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">
                        Lovable Cloud → Secrets <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      et mettre à jour <code className="bg-muted px-1 rounded">LOVELIB_BRIDGE_SECRET</code> avec la valeur ci-dessus.
                    </li>
                    <li>
                      <strong>lovelib</strong> — Ouvrir le projet <em>lovelib-spyglass</em> → Secrets et coller la <strong>même valeur exacte</strong> dans <code className="bg-muted px-1 rounded">LOVELIB_BRIDGE_SECRET</code>.
                    </li>
                    <li>
                      Revenir ici, cliquer <strong>Rafraîchir</strong> puis <strong>Self-test</strong> pour confirmer que les empreintes correspondent.
                    </li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="ack"
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="ack" className="text-xs cursor-pointer">
                  J'ai copié et collé le secret dans les deux projets, je peux fermer cette vue.
                </Label>
              </div>
              {acknowledged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCandidate(null); setReveal(false); setAcknowledged(false); statusQ.refetch(); }}
                >
                  Effacer la valeur de l'écran
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Self-test result */}
      {testMut.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {testMut.data.ok
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <XCircle className="h-4 w-4 text-destructive" />}
              Résultat self-test
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><strong>Statut :</strong> {testMut.data.ok ? "OK" : "Échec"}</p>
            <p><strong>Étape :</strong> {testMut.data.step}</p>
            {testMut.data.jti && <p><strong>JTI :</strong> <code className="text-xs">{testMut.data.jti}</code></p>}
            {testMut.data.error && <p className="text-destructive"><strong>Erreur :</strong> {testMut.data.error}</p>}
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">
              Le self-test ne valide que <strong>Clarivi</strong>. Pour valider la chaîne complète, demandez à
              lovelib d'appeler <code>consume-bridge-token</code> avec un jeton fraîchement émis par
              <code> issue-bridge-token</code>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label, value, tone = "default", mono, icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
  mono?: boolean;
  icon?: typeof CheckCircle2;
}) {
  const cls =
    tone === "success" ? "text-emerald-600 dark:text-emerald-400" :
    tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`flex items-center gap-1.5 font-medium ${cls} ${mono ? "font-mono text-sm" : ""}`}>
        {Icon && <Icon className="h-4 w-4" />}
        {value}
      </div>
    </div>
  );
}
