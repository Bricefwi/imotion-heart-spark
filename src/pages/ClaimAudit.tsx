import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Sparkles, LogIn, UserPlus } from "lucide-react";

type ClaimPreview = {
  email: string;
  external_id: string | null;
  expires_at: string;
  user_exists: boolean;
  preview: {
    company_name: string | null;
    website_url: string | null;
    score: number | null;
    summary: string | null;
  };
};

export default function ClaimAudit() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"idle" | "verifying" | "stored" | "error" | "redeeming" | "redeemed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimPreview | null>(null);

  const token = searchParams.get("token");

  // Step 1: Verify the token publicly and store the claim
  useEffect(() => {
    if (!token || status !== "idle") return;
    (async () => {
      setStatus("verifying");
      try {
        const { data, error: invErr } = await supabase.functions.invoke(
          "claim-lovelib-token",
          { body: { token } },
        );
        if (invErr) throw invErr;
        if (!data?.ok) throw new Error(data?.error ?? "verify_failed");
        setClaim(data as ClaimPreview);
        // Persist for post-login redemption
        sessionStorage.setItem("pendingAuditClaimEmail", (data as ClaimPreview).email);
        sessionStorage.setItem("redirectPath", "/client/lovelib-audit");
        setStatus("stored");
      } catch (e: any) {
        setError(e?.message ?? "Token invalide");
        setStatus("error");
      }
    })();
  }, [token, status]);

  // Step 2: If user is already logged in, auto-redeem
  useEffect(() => {
    if (status !== "stored" || !user) return;
    (async () => {
      setStatus("redeeming");
      try {
        const { data, error: rpcErr } = await supabase.rpc("redeem_pending_audits");
        if (rpcErr) throw rpcErr;
        const claimed = (data as { claimed?: number })?.claimed ?? 0;
        if (claimed === 0) {
          setError("Aucun audit en attente trouvé pour votre compte.");
          setStatus("error");
          return;
        }
        setStatus("redeemed");
      } catch (e: any) {
        setError(e?.message ?? "Échec de la récupération");
        setStatus("error");
      }
    })();
  }, [status, user]);

  if (!token) {
    return (
      <div className="container max-w-xl py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Lien invalide : token manquant.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-16 space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Audit lovelib
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Récupération de votre audit</h1>
        <p className="text-muted-foreground">
          Votre audit marketing va être rattaché à votre compte Clarivi.
        </p>
      </div>

      {(status === "verifying" || status === "redeeming" || authLoading) && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {status === "redeeming" ? "Liaison à votre compte…" : "Vérification du lien sécurisé…"}
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ?? "Erreur inconnue"}. Demandez un nouveau lien depuis lovelib.
          </AlertDescription>
        </Alert>
      )}

      {(status === "stored" || status === "redeeming") && claim && !user && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Audit reconnu
              {claim.preview.score !== null && (
                <Badge className="ml-1 bg-gradient-to-r from-primary to-secondary text-white">
                  Score {claim.preview.score}/100
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Pour <strong>{claim.email}</strong>
              {claim.preview.company_name && <> — {claim.preview.company_name}</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {claim.preview.summary && (
              <p className="text-sm text-muted-foreground line-clamp-3">{claim.preview.summary}</p>
            )}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {claim.user_exists
                  ? "Connectez-vous avec cet email pour finaliser la récupération."
                  : "Créez votre compte Clarivi avec cet email pour récupérer automatiquement votre audit."}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 flex-wrap">
              {claim.user_exists ? (
                <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white">
                  <Link to={`/login?email=${encodeURIComponent(claim.email)}`}>
                    <LogIn className="h-4 w-4 mr-2" /> Me connecter
                  </Link>
                </Button>
              ) : (
                <Button asChild className="bg-gradient-to-r from-primary to-secondary text-white">
                  <Link to={`/register?email=${encodeURIComponent(claim.email)}`}>
                    <UserPlus className="h-4 w-4 mr-2" /> Créer mon compte
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to={`/login?email=${encodeURIComponent(claim.email)}`}>Autre option</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Lien valable jusqu'au {new Date(claim.expires_at).toLocaleString("fr-FR")}.
            </p>
          </CardContent>
        </Card>
      )}

      {status === "redeemed" && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Audit ajouté à votre compte
            </CardTitle>
            <CardDescription>
              Vous pouvez maintenant le rattacher à un projet pour enrichir la phase de découverte.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate("/client/audits")}
              className="bg-gradient-to-r from-primary to-secondary text-white"
            >
              Voir mes audits <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/client/lovelib-audit")}>
              Lier à un projet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
