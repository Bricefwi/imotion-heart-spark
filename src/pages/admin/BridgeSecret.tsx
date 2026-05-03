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
  RefreshCw, ShieldCheck, ExternalLink, Sparkles, XCircle, Loader2,
  ArrowRight, GitCompareArrows
} from "lucide-react";
import { toast } from "sonner";

type SecretBlock = { name: string; configured: boolean; fingerprint: string | null; length: number };
type StatusResp = {
  active: { source: "primary" | "fallback" | "none"; name: string | null; fingerprint: string | null; length: number; strong: boolean };
  primary: SecretBlock;
  fallback: SecretBlock;
  drift_between_local: boolean;
  recommendation: "promote_fallback" | "align_or_remove_fallback" | "configure_primary" | "ok";
  project_url: string;
};
type GenerateResp = { candidate: string; length: number; hint: string };
type SelfTestResp = { ok: boolean; step: string; error?: string; jti?: string; source?: string; fingerprint?: string };
type CompareResp = {
  primary: { local: string | null; remote: string | null; match: boolean };
  fallback: { local: string | null; remote: string | null; match: boolean };
};

async function callFn<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-bridge-secret", {
    body: { action, ...extra },
  });
  if (error) throw error;
  return data as T;
}

const CLOUD_SECRETS_URL =
  "https://lovable.dev/projects/63a5fc40-b3d7-4f5f-a065-34e429e33aec/settings/secrets";

export default function BridgeSecret() {
  const [candidate, setCandidate] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [remotePrimary, setRemotePrimary] = useState("");
  const [remoteFallback, setRemoteFallback] = useState("");

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
      if (d.ok) toast.success(`Self-test OK (source : ${d.source})`);
      else toast.error(`Échec self-test (${d.step}) : ${d.error || "mismatch"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const compareMut = useMutation({
    mutationFn: () => callFn<CompareResp>("compare_fingerprints", {
      primary_fp: remotePrimary || undefined,
      fallback_fp: remoteFallback || undefined,
    }),
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = async (val: string, label = "Copié") => {
    try { await navigator.clipboard.writeText(val); toast.success(label); }
    catch { toast.error("Impossible de copier"); }
  };

  const status = statusQ.data;

  return (
    <div className="space-y-6 p-1 max-w-5xl">
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
            Gestion unifiée du secret HMAC partagé Clarivi ↔ lovelib.
            Priorité : <code className="text-xs bg-muted px-1.5 py-0.5 rounded">LOVELIB_BRIDGE_SECRET</code>,
            fallback automatique sur <code className="text-xs bg-muted px-1.5 py-0.5 rounded">MARKETING_WEBHOOK_SECRET</code>.
          </p>
        </div>
      </div>

      {/* Active source banner */}
      {status && <ActiveSourceBanner status={status} />}

      {/* Two-secret unified view */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Secrets disponibles
          </CardTitle>
          <CardDescription>
            Le système choisit automatiquement la source active selon la priorité ci-dessous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusQ.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : statusQ.error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{(statusQ.error as Error).message}</AlertDescription>
            </Alert>
          ) : status ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SecretCard
                tag="PRIORITAIRE"
                tone="primary"
                isActive={status.active.source === "primary"}
                block={status.primary}
              />
              <SecretCard
                tag="FALLBACK AUTO"
                tone="amber"
                isActive={status.active.source === "fallback"}
                block={status.fallback}
              />
            </div>
          ) : null}

          {status?.drift_between_local && (
            <Alert className="mt-4 border-amber-500/40 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Empreintes locales différentes</AlertTitle>
              <AlertDescription className="text-xs">
                Les deux secrets sont configurés mais ont des valeurs différentes.
                Le système utilise <strong>{status.active.name}</strong>. Si vous voulez utiliser le fallback,
                supprimez d'abord le secret prioritaire dans Lovable Cloud.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => statusQ.refetch()} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir
            </Button>
            <Button
              size="sm"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending || !status?.active.length}
              className="gap-2"
            >
              {testMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Self-test
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={CLOUD_SECRETS_URL} target="_blank" rel="noreferrer">
                Ouvrir Lovable Cloud Secrets <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Générer une nouvelle valeur</CardTitle>
          <CardDescription>
            48 octets aléatoires (~64 caractères base64url). Non sauvegardée — à coller manuellement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className="gap-2 bg-gradient-to-r from-primary to-secondary text-white"
          >
            {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Générer
          </Button>

          {candidate && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs flex items-center justify-between">
                <span>Valeur candidate</span>
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
                <Button type="button" variant="outline" size="icon" onClick={() => copy(candidate, "Secret copié")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm">Procédure</AlertTitle>
                <AlertDescription className="text-xs space-y-1.5 mt-2">
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>
                      Lovable Cloud Clarivi → Secrets → mettre à jour <code className="bg-muted px-1 rounded">LOVELIB_BRIDGE_SECRET</code>
                    </li>
                    <li>
                      Projet lovelib → Secrets → coller la <strong>même valeur exacte</strong> dans <code className="bg-muted px-1 rounded">LOVELIB_BRIDGE_SECRET</code>
                    </li>
                    <li>Rafraîchir cette page, puis lancer un Self-test</li>
                    <li>Comparer les empreintes (section ci-dessous) avec lovelib</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="ack" type="checkbox" checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="ack" className="text-xs cursor-pointer">
                  Secret collé dans les deux projets, je peux effacer la valeur ici.
                </Label>
              </div>
              {acknowledged && (
                <Button variant="outline" size="sm" onClick={() => {
                  setCandidate(null); setReveal(false); setAcknowledged(false); statusQ.refetch();
                }}>
                  Effacer la valeur de l'écran
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cross-app fingerprint comparator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4" /> Comparer avec lovelib
          </CardTitle>
          <CardDescription>
            Demandez à lovelib les empreintes (2 premiers + 2 derniers caractères) de ses secrets, collez-les ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Empreinte lovelib pour LOVELIB_BRIDGE_SECRET</Label>
              <Input
                placeholder="ex: aB…9z"
                value={remotePrimary}
                onChange={(e) => setRemotePrimary(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Empreinte lovelib pour MARKETING_WEBHOOK_SECRET</Label>
              <Input
                placeholder="ex: cD…3x"
                value={remoteFallback}
                onChange={(e) => setRemoteFallback(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <Button size="sm" onClick={() => compareMut.mutate()} disabled={compareMut.isPending} className="gap-2">
            {compareMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
            Comparer
          </Button>

          {compareMut.data && (
            <div className="grid gap-2 sm:grid-cols-2 pt-2">
              <ComparisonRow label="LOVELIB_BRIDGE_SECRET" {...compareMut.data.primary} />
              <ComparisonRow label="MARKETING_WEBHOOK_SECRET" {...compareMut.data.fallback} />
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
            <p><strong>Source utilisée :</strong> <Badge variant="outline">{testMut.data.source}</Badge></p>
            <p><strong>Empreinte :</strong> <code className="text-xs">{testMut.data.fingerprint}</code></p>
            {testMut.data.jti && <p><strong>JTI :</strong> <code className="text-xs">{testMut.data.jti}</code></p>}
            {testMut.data.error && <p className="text-destructive"><strong>Erreur :</strong> {testMut.data.error}</p>}
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">
              Le self-test ne valide que <strong>Clarivi</strong>. Pour valider la chaîne complète,
              demandez à lovelib d'appeler <code>consume-bridge-token</code> avec un jeton fraîchement émis par <code>issue-bridge-token</code>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActiveSourceBanner({ status }: { status: StatusResp }) {
  if (status.recommendation === "configure_primary") {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Aucun secret configuré</AlertTitle>
        <AlertDescription className="text-xs">
          Configurez <code>LOVELIB_BRIDGE_SECRET</code> dans Lovable Cloud Secrets avant d'activer le pont SSO.
        </AlertDescription>
      </Alert>
    );
  }
  if (status.recommendation === "promote_fallback") {
    return (
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="flex items-center gap-2">
          Fallback actif <ArrowRight className="h-3 w-3" /> à promouvoir
        </AlertTitle>
        <AlertDescription className="text-xs">
          Aucun <code>LOVELIB_BRIDGE_SECRET</code> défini. Le pont fonctionne via le fallback{" "}
          <code>MARKETING_WEBHOOK_SECRET</code>. Pour plus de clarté, copiez sa valeur dans <code>LOVELIB_BRIDGE_SECRET</code>
          côté Clarivi <strong>et</strong> côté lovelib.
        </AlertDescription>
      </Alert>
    );
  }
  if (status.recommendation === "align_or_remove_fallback") {
    return (
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Deux secrets divergents</AlertTitle>
        <AlertDescription className="text-xs">
          La source active est <strong>{status.active.name}</strong>. Pour éviter toute confusion,
          supprimez le secret non utilisé ou alignez-les.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert className="border-emerald-500/40 bg-emerald-500/5">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <AlertTitle>Pont opérationnel</AlertTitle>
      <AlertDescription className="text-xs">
        Source active : <strong>{status.active.name}</strong> · Empreinte{" "}
        <code className="text-xs">{status.active.fingerprint}</code>
      </AlertDescription>
    </Alert>
  );
}

function SecretCard({
  tag, tone, isActive, block,
}: {
  tag: string;
  tone: "primary" | "amber";
  isActive: boolean;
  block: SecretBlock;
}) {
  const ring = isActive
    ? tone === "primary" ? "ring-2 ring-primary/60" : "ring-2 ring-amber-500/60"
    : "";
  const tagCls = tone === "primary"
    ? "bg-primary/15 text-primary border-primary/30"
    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";

  return (
    <div className={`rounded-lg border bg-card p-4 ${ring} relative`}>
      {isActive && (
        <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
          ACTIF
        </span>
      )}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className={`text-[9px] font-bold ${tagCls}`}>{tag}</Badge>
        {block.configured
          ? <Badge variant="outline" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />Configuré</Badge>
          : <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground"><XCircle className="h-3 w-3" />Absent</Badge>}
      </div>
      <code className="text-xs font-medium block mb-2 break-all">{block.name}</code>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground text-[10px] uppercase">Empreinte</div>
          <div className="font-mono font-medium">{block.fingerprint || "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-[10px] uppercase">Longueur</div>
          <div className={`font-medium ${block.length >= 32 ? "text-emerald-600" : block.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {block.length || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label, local, remote, match,
}: {
  label: string; local: string | null; remote: string | null; match: boolean;
}) {
  const status = !remote ? "neutral" : match ? "match" : "mismatch";
  const cls =
    status === "match" ? "border-emerald-500/40 bg-emerald-500/5"
    : status === "mismatch" ? "border-destructive/40 bg-destructive/5"
    : "border-border";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-xs font-medium mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Clarivi</div>
          <code className="font-mono">{local || "—"}</code>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">lovelib</div>
          <code className="font-mono">{remote || "—"}</code>
        </div>
      </div>
      {remote && (
        <div className="mt-2 text-xs flex items-center gap-1.5">
          {match
            ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400 font-medium">Identiques</span></>
            : <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive font-medium">Divergent</span></>}
        </div>
      )}
    </div>
  );
}
