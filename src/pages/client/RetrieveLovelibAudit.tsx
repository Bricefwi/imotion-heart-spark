import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Download, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Loader2, Link2 } from "lucide-react";
import { getMarketingBaseUrl } from "@/lib/marketing-url";

type ProjectRow = { id: string; name: string; code: string | null; status: string };

type HydratedAudit = {
  audit_id: string;
  external_id: string | null;
  company_name: string | null;
  website_url: string | null;
  score: number | null;
  summary: string | null;
};

export default function RetrieveLovelibAudit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = useState<string>(searchParams.get("project") ?? "");
  const [loading, setLoading] = useState(false);
  const [payloadText, setPayloadText] = useState("");
  const [externalId, setExternalId] = useState("");
  const [lastResult, setLastResult] = useState<{ audit_id: string; project_id: string } | null>(null);

  // Token hydration state
  const [tokenStatus, setTokenStatus] = useState<"idle" | "verifying" | "ok" | "error">("idle");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState<HydratedAudit | null>(null);

  const lovelibUrl = `${getMarketingBaseUrl()}/audit?return_to=clarivi`;

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Auto-redeem any pending audit claims tied to this user's email
      try {
        const { data } = await supabase.rpc("redeem_pending_audits");
        const claimed = (data as { claimed?: number; audits?: any[] })?.claimed ?? 0;
        if (claimed > 0) {
          sessionStorage.removeItem("pendingAuditClaimEmail");
          toast({
            title: `${claimed} audit${claimed > 1 ? "s" : ""} récupéré${claimed > 1 ? "s" : ""}`,
            description: "Vos audits lovelib sont maintenant dans votre compte.",
          });
        }
      } catch { /* silent */ }

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code, status")
        .or(`client_id.eq.${user.id},consultant_id.eq.${user.id}`)
        .order("last_activity_at", { ascending: false });
      if (error) {
        toast({ title: "Erreur", description: "Impossible de charger vos projets.", variant: "destructive" });
        return;
      }
      setProjects(data ?? []);
      if (!projectId && data && data.length > 0) setProjectId(data[0].id);
    })();
  }, [user]);

  // Auto-hydrate from ?token=...
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || !user || tokenStatus !== "idle") return;
    (async () => {
      setTokenStatus("verifying");
      setTokenError(null);
      try {
        const { data, error } = await supabase.functions.invoke(
          "verify-lovelib-token",
          { body: { token } },
        );
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error ?? "verify_failed");
        setHydrated({
          audit_id: data.audit_id,
          external_id: data.external_id ?? null,
          company_name: data.company_name ?? null,
          website_url: data.website_url ?? null,
          score: data.score ?? null,
          summary: data.summary ?? null,
        });
        setExternalId(data.external_id ?? "");
        setTokenStatus("ok");
        toast({
          title: "Audit récupéré",
          description: "Choisissez le projet auquel l'associer.",
        });
        // Strip token from URL (keep ?project=…)
        const next = new URLSearchParams(searchParams);
        next.delete("token");
        setSearchParams(next, { replace: true });
      } catch (e: any) {
        setTokenStatus("error");
        setTokenError(e?.message ?? "Token invalide");
        toast({
          title: "Token invalide",
          description: e?.message ?? "Lien expiré ou signature incorrecte.",
          variant: "destructive",
        });
      }
    })();
  }, [user, searchParams, tokenStatus]);

  async function linkHydratedAudit() {
    if (!hydrated || !projectId) return;
    setLoading(true);
    try {
      // Lien direct via la table audit_to_project_links (RLS ok: linked_by = auth.uid())
      const { error } = await supabase.from("audit_to_project_links").insert({
        audit_id: hydrated.audit_id,
        project_id: projectId,
        linked_by: user!.id,
        note: "Lié via token signé",
      });
      if (error) throw error;
      setLastResult({ audit_id: hydrated.audit_id, project_id: projectId });
      toast({ title: "Audit associé", description: "L'audit est maintenant rattaché à votre projet." });
    } catch (e: any) {
      toast({
        title: "Échec",
        description: e?.message ?? "Impossible de lier cet audit.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function mergePayload(rawPayload: unknown) {
    if (!projectId) {
      toast({ title: "Projet requis", description: "Choisissez un projet de destination.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("merge_marketing_into_project", {
        _project_id: projectId,
        _audit_payload: rawPayload as any,
      });
      if (error) throw error;
      const result = data as { ok: boolean; audit_id: string; project_id: string };
      setLastResult({ audit_id: result.audit_id, project_id: result.project_id });
      toast({
        title: "Audit fusionné",
        description: "Votre audit marketing a été rattaché au projet.",
      });
    } catch (e: any) {
      toast({
        title: "Échec de la fusion",
        description: e?.message ?? "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePastePayload() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      toast({
        title: "JSON invalide",
        description: "Vérifiez le format du payload copié depuis lovelib.",
        variant: "destructive",
      });
      return;
    }
    await mergePayload(parsed);
  }

  async function handleByExternalId() {
    if (!externalId.trim()) {
      toast({ title: "Identifiant manquant", description: "Collez l'ID de votre audit lovelib.", variant: "destructive" });
      return;
    }
    // Minimal payload — la RPC fait l'upsert sur (user_id, external_id)
    await mergePayload({
      external_id: externalId.trim(),
      summary: "Audit récupéré via identifiant lovelib",
      recommendations: [],
      full_payload: { source: "manual_link", external_id: externalId.trim() },
    });
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Récupérer mon audit lovelib</h1>
          <p className="text-muted-foreground mt-2">
            Importez votre audit marketing gratuit lovelib dans un projet Clarivi pour enrichir automatiquement la phase de découverte.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> 100% gratuit
        </Badge>
      </div>

      {/* Token verification banner */}
      {tokenStatus === "verifying" && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Vérification du token lovelib en cours…</AlertDescription>
        </Alert>
      )}

      {tokenStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lien invalide ou expiré : <code className="text-xs">{tokenError}</code>. Demandez un nouveau lien depuis lovelib.
          </AlertDescription>
        </Alert>
      )}

      {tokenStatus === "ok" && hydrated && !lastResult && (
        <Card className="border-green-500/40 bg-gradient-to-br from-green-500/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Audit lovelib récupéré
              {hydrated.score !== null && (
                <Badge className="ml-1 bg-gradient-to-r from-primary to-secondary text-white">
                  Score {hydrated.score}/100
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {hydrated.company_name || hydrated.website_url || "Audit anonyme"}
              {hydrated.summary && <span className="block mt-1 line-clamp-2">{hydrated.summary}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cet audit est maintenant disponible dans votre compte. Liez-le à un projet pour qu'il enrichisse automatiquement la phase de découverte.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={linkHydratedAudit}
                disabled={loading || !projectId}
                className="bg-gradient-to-r from-primary to-secondary text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Liaison…</>
                ) : (
                  <><Link2 className="h-4 w-4 mr-2" /> Lier au projet sélectionné</>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/client/audits/${hydrated.audit_id}`}>
                  Voir le détail <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Pas encore d'audit ?
          </CardTitle>
          <CardDescription>
            Lancez votre audit marketing gratuit sur lovelib (5 min). À la fin, revenez ici pour le rattacher à votre projet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white">
            <a href={lovelibUrl} target="_blank" rel="noopener noreferrer">
              Ouvrir lovelib <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projet de destination</CardTitle>
          <CardDescription>L'audit sera fusionné dans la découverte de ce projet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous n'avez aucun projet.{" "}
                <Link to="/client/projects/new" className="underline font-medium">
                  Créez-en un d'abord
                </Link>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Label htmlFor="project">Projet</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Choisissez un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `${p.code} — ` : ""}
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importer l'audit</CardTitle>
          <CardDescription>Choisissez la méthode qui correspond à ce que lovelib vous a fourni.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payload">
                <Download className="h-4 w-4 mr-2" /> Payload JSON
              </TabsTrigger>
              <TabsTrigger value="id">Identifiant audit</TabsTrigger>
            </TabsList>

            <TabsContent value="payload" className="space-y-3 pt-4">
              <Label htmlFor="payload">Collez ici le JSON exporté depuis lovelib</Label>
              <Textarea
                id="payload"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                placeholder={`{\n  "external_id": "audit_xxx",\n  "score": 72,\n  "summary": "...",\n  "recommendations": [...]\n}`}
                rows={10}
                className="font-mono text-xs"
              />
              <Button
                onClick={handlePastePayload}
                disabled={loading || !projectId || !payloadText.trim()}
                className="w-full"
              >
                {loading ? "Fusion en cours…" : "Fusionner dans le projet"}
              </Button>
            </TabsContent>

            <TabsContent value="id" className="space-y-3 pt-4">
              <Label htmlFor="external-id">Identifiant lovelib</Label>
              <Input
                id="external-id"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="audit_abc123…"
              />
              <p className="text-xs text-muted-foreground">
                Si vous êtes connecté avec le même email sur lovelib, l'audit sera retrouvé automatiquement.
              </p>
              <Button
                onClick={handleByExternalId}
                disabled={loading || !projectId || !externalId.trim()}
                className="w-full"
              >
                {loading ? "Liaison en cours…" : "Lier cet audit"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {lastResult && (
        <Alert className="border-green-500/40 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
            <span>Audit fusionné avec succès dans votre projet.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/client/projects/${lastResult.project_id}/conversation`)}
            >
              Ouvrir la découverte <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* CTA contextuel : prochaine étape après fusion d'audit */}
      {lastResult && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-secondary/5 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-primary" />
              Prochaine étape : transformer l'audit en projet concret
            </CardTitle>
            <CardDescription>
              Marc va exploiter les insights de votre audit pour structurer une discovery ciblée et générer un cahier des charges sur-mesure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate(`/client/projects/${lastResult.project_id}/conversation`)}
              className="bg-gradient-to-r from-primary to-secondary text-white"
            >
              Démarrer la discovery avec Marc <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate(`/client/audits/${lastResult.audit_id}`)}>
              Revoir l'audit en détail
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
