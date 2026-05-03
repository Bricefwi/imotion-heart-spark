import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bug, KeyRound, Cookie, AlertTriangle, CheckCircle2, XCircle,
  Loader2, Sparkles, ArrowRight, Eye, ExternalLink, Trash2, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

type Diag = { level: "ok" | "warn" | "error"; code: string; message: string };
type DebugResp = {
  secret: { configured: boolean; source: string; fingerprint: string | null };
  header?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
  signature_valid?: boolean;
  expires_in_seconds?: number | null;
  issued_seconds_ago?: number | null;
  db_record?: {
    jti: string; user_id: string; email: string;
    expires_at: string; consumed_at: string | null;
    consumed_ip?: string | null; consumed_ua?: string | null;
  };
  verdict: "ok" | "warn" | "fail";
  diagnostics: Diag[];
};

type CookieInfo = { name: string; value: string; preview: string };

function readCookies(): CookieInfo[] {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const eq = c.indexOf("=");
      const name = eq === -1 ? c : c.slice(0, eq);
      const value = eq === -1 ? "" : decodeURIComponent(c.slice(eq + 1));
      return { name, value, preview: value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value };
    });
}

function levelBadge(level: Diag["level"]) {
  if (level === "ok") return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />OK</Badge>;
  if (level === "warn") return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />WARN</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1"><XCircle className="h-3 w-3" />ERR</Badge>;
}

const SSO_RELATED_KEYWORDS = ["sb-", "supabase", "session", "auth", "lovelib", "bridge", "sso"];

export default function SsoDebug() {
  const [token, setToken] = useState("");
  const [cookies, setCookies] = useState<CookieInfo[]>([]);
  const [storage, setStorage] = useState<{ key: string; preview: string }[]>([]);
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const refreshLocal = async () => {
    setCookies(readCookies());
    try {
      const items: { key: string; preview: string }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!SSO_RELATED_KEYWORDS.some((kw) => k.toLowerCase().includes(kw))) continue;
        const v = localStorage.getItem(k) ?? "";
        items.push({ key: k, preview: v.length > 60 ? `${v.slice(0, 30)}…${v.slice(-20)}` : v });
      }
      setStorage(items);
    } catch { /* ignore */ }
    try {
      setRedirectPath(sessionStorage.getItem("redirectPath"));
    } catch { /* ignore */ }
    const { data } = await supabase.auth.getSession();
    setSessionExists(!!data.session);
  };

  useEffect(() => { void refreshLocal(); }, []);

  const debugMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-sso-debug", {
        body: { token: token.trim() || undefined },
      });
      if (error) throw error;
      return data as DebugResp;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const issueMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("issue-bridge-token", {
        body: { ttl: 60 },
      });
      if (error) throw error;
      return data as { token: string; expires_at: string };
    },
    onSuccess: (d) => {
      setToken(d.token);
      toast.success("Token bridge émis (60s)");
    },
    onError: (e: Error) => toast.error(`Émission échouée : ${e.message}`),
  });

  const sessionStorageRedirectClear = () => {
    try { sessionStorage.removeItem("redirectPath"); setRedirectPath(null); toast.success("redirectPath effacé"); }
    catch { toast.error("Impossible d'écrire dans sessionStorage"); }
  };

  const ssoCookies = useMemo(
    () => cookies.filter((c) => SSO_RELATED_KEYWORDS.some((kw) => c.name.toLowerCase().includes(kw))),
    [cookies],
  );

  const verdictBanner = (() => {
    const d = debugMut.data;
    if (!d) return null;
    if (d.verdict === "ok") return (
      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertTitle>Token valide</AlertTitle>
        <AlertDescription className="text-xs">Toutes les vérifications passent. Si la redirection échoue côté lovelib, regardez les cookies et CORS de l'app cible.</AlertDescription>
      </Alert>
    );
    if (d.verdict === "warn") return (
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Token utilisable avec avertissements</AlertTitle>
        <AlertDescription className="text-xs">Voir détails ci-dessous.</AlertDescription>
      </Alert>
    );
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Token rejeté — redirection impossible</AlertTitle>
        <AlertDescription className="text-xs">
          Cause probable : {d.diagnostics.find((x) => x.level === "error")?.message}
        </AlertDescription>
      </Alert>
    );
  })();

  return (
    <div className="space-y-6 p-1 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bug className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Console debug SSO</h1>
          <Badge variant="outline" className="text-[10px]">Admin only</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Inspecter les cookies, valider un token bridge et diagnostiquer pourquoi une redirection cross-app échoue.
        </p>
      </div>

      {/* Local session / cookies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cookie className="h-4 w-4" /> Session & cookies (navigateur)
          </CardTitle>
          <CardDescription>État local visible depuis cet onglet (pas le serveur).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Session Supabase" value={sessionExists === null ? "—" : sessionExists ? "Présente" : "Absente"} tone={sessionExists ? "success" : "danger"} />
            <Field label="Cookies SSO détectés" value={String(ssoCookies.length)} tone={ssoCookies.length ? "success" : "default"} />
            <Field label="redirectPath" value={redirectPath || "—"} mono />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={refreshLocal} className="gap-2">
              <Eye className="h-3.5 w-3.5" /> Rafraîchir
            </Button>
            {redirectPath && (
              <Button variant="outline" size="sm" onClick={sessionStorageRedirectClear} className="gap-2">
                <Trash2 className="h-3.5 w-3.5" /> Effacer redirectPath
              </Button>
            )}
          </div>

          {ssoCookies.length > 0 && (
            <div>
              <Label className="text-xs">Cookies pertinents</Label>
              <div className="mt-1.5 rounded-md border bg-muted/30 p-2 space-y-1 max-h-48 overflow-auto">
                {ssoCookies.map((c) => (
                  <div key={c.name} className="flex items-start justify-between gap-2 text-xs">
                    <code className="font-mono font-medium shrink-0">{c.name}</code>
                    <code className="font-mono text-muted-foreground truncate">{c.preview || "(vide)"}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {storage.length > 0 && (
            <div>
              <Label className="text-xs">localStorage (clés liées SSO)</Label>
              <div className="mt-1.5 rounded-md border bg-muted/30 p-2 space-y-1 max-h-48 overflow-auto">
                {storage.map((s) => (
                  <div key={s.key} className="flex items-start justify-between gap-2 text-xs">
                    <code className="font-mono font-medium shrink-0">{s.key}</code>
                    <code className="font-mono text-muted-foreground truncate">{s.preview || "(vide)"}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token validator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Valider un token bridge
          </CardTitle>
          <CardDescription>
            Collez le token reçu par lovelib (ou émettez-en un nouveau) pour analyse complète.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Token (header.payload.signature)</Label>
            <Textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="font-mono text-xs min-h-[100px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => debugMut.mutate()}
              disabled={debugMut.isPending}
              className="gap-2 bg-gradient-to-r from-primary to-secondary text-white"
            >
              {debugMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Analyser
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => issueMut.mutate()}
              disabled={issueMut.isPending}
              className="gap-2"
            >
              {issueMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              Émettre un token de test
            </Button>
            {token && (
              <Button size="sm" variant="ghost" onClick={() => setToken("")} className="gap-2">
                <Trash2 className="h-3.5 w-3.5" /> Vider
              </Button>
            )}
          </div>

          {verdictBanner}

          {debugMut.data && (
            <div className="space-y-4 pt-2">
              {/* Secret summary */}
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                <Field label="Secret actif" value={debugMut.data.secret.source} tone={debugMut.data.secret.configured ? "success" : "danger"} icon={ShieldCheck} />
                <Field label="Empreinte secret" value={debugMut.data.secret.fingerprint || "—"} mono />
                <Field
                  label="Signature"
                  value={debugMut.data.signature_valid === undefined ? "—" : debugMut.data.signature_valid ? "Valide" : "Invalide"}
                  tone={debugMut.data.signature_valid ? "success" : "danger"}
                />
              </div>

              {/* Diagnostics list */}
              <div>
                <Label className="text-xs mb-2 block">Diagnostics</Label>
                <div className="rounded-md border divide-y">
                  {debugMut.data.diagnostics.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 text-xs">
                      {levelBadge(d.level)}
                      <div className="min-w-0">
                        <code className="text-muted-foreground text-[10px]">{d.code}</code>
                        <p className="mt-0.5">{d.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decoded payload */}
              {(debugMut.data.header || debugMut.data.payload) && (
                <div className="grid gap-3 md:grid-cols-2">
                  <DecodedBlock title="Header" data={debugMut.data.header} />
                  <DecodedBlock title="Payload" data={debugMut.data.payload} extra={
                    debugMut.data.expires_in_seconds !== null && debugMut.data.expires_in_seconds !== undefined
                      ? `expires_in=${debugMut.data.expires_in_seconds}s`
                      : undefined
                  } />
                </div>
              )}

              {/* DB record */}
              {debugMut.data.db_record && (
                <div>
                  <Label className="text-xs mb-2 block">Enregistrement BDD (one-shot tracking)</Label>
                  <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                    <Row k="jti" v={debugMut.data.db_record.jti} mono />
                    <Row k="user_id" v={debugMut.data.db_record.user_id} mono />
                    <Row k="email" v={debugMut.data.db_record.email} />
                    <Row k="expires_at" v={debugMut.data.db_record.expires_at} />
                    <Row k="consumed_at" v={debugMut.data.db_record.consumed_at || "—"} tone={debugMut.data.db_record.consumed_at ? "danger" : "success"} />
                    {debugMut.data.db_record.consumed_ip && <Row k="consumed_ip" v={debugMut.data.db_record.consumed_ip} mono />}
                    {debugMut.data.db_record.consumed_ua && <Row k="consumed_ua" v={debugMut.data.db_record.consumed_ua} />}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Causes courantes d'échec de redirection</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <Cause label="signature_mismatch" desc="lovelib utilise un secret différent — utilisez la page Bridge Secret pour comparer les empreintes." />
          <Cause label="expired" desc="TTL ≤ 60s. Émettre puis consommer immédiatement." />
          <Cause label="already_consumed" desc="L'utilisateur a double-cliqué ou rafraîchi la page de redirection. Réémettre un nouveau token." />
          <Cause label="jti_unknown" desc="Token signé par une autre instance Clarivi (clone, environnement de test)." />
          <Cause label="redirectPath manquant" desc="Vérifier que sessionStorage.setItem('redirectPath', …) est bien appelé avant de partir vers lovelib." />
          <Separator className="my-2" />
          <a href="/admin/bridge-secret" className="text-primary inline-flex items-center gap-1">
            Aller à Bridge Secret <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, value, tone = "default", mono, icon: Icon,
}: {
  label: string; value: string;
  tone?: "default" | "success" | "danger";
  mono?: boolean;
  icon?: typeof CheckCircle2;
}) {
  const cls = tone === "success" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] uppercase text-muted-foreground mb-1">{label}</div>
      <div className={`flex items-center gap-1.5 font-medium text-sm ${cls} ${mono ? "font-mono" : ""}`}>
        {Icon && <Icon className="h-4 w-4" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function DecodedBlock({ title, data, extra }: { title: string; data: unknown; extra?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs font-semibold">{title}</Label>
        {extra && <span className="text-[10px] text-muted-foreground">{extra}</span>}
      </div>
      <ScrollArea className="max-h-48">
        <pre className="text-[11px] font-mono whitespace-pre-wrap break-all">
          {data ? JSON.stringify(data, null, 2) : "—"}
        </pre>
      </ScrollArea>
    </div>
  );
}

function Row({ k, v, mono, tone }: { k: string; v: string; mono?: boolean; tone?: "success" | "danger" }) {
  const cls = tone === "danger" ? "text-destructive" : tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "";
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground text-[10px] uppercase shrink-0">{k}</span>
      <span className={`${mono ? "font-mono" : ""} ${cls} truncate text-right`}>{v}</span>
    </div>
  );
}

function Cause({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded shrink-0">{label}</code>
      <span>{desc}</span>
    </div>
  );
}
