import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, GitBranch, ExternalLink, AlertCircle, CheckCircle2, GitCommit, Clock } from "lucide-react";

interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string } | null;
  };
  author: { login: string; avatar_url: string } | null;
}

type GithubRateLimit = {
  limit: string | null;
  remaining: string | null;
  reset: string | null;
};

type GithubRepoCandidate = {
  fullName: string;
  defaultBranch: string | null;
  htmlUrl: string | null;
};

type GithubSyncResponse = {
  ok?: boolean;
  error?: "github_error" | "network_error" | "invalid_repo" | "invalid_json" | "forbidden" | "invalid_session" | "missing_authorization" | "method_not_allowed" | "backend_not_configured";
  status?: number;
  message?: string;
  repo?: string;
  branch?: string;
  commits?: GithubCommit[];
  checkedAt?: string;
  rateLimit?: GithubRateLimit;
  tokenConfigured?: boolean;
  repoDefaultBranch?: string | null;
  branchAutoDetected?: boolean;
  candidateRepos?: GithubRepoCandidate[];
};

const STORAGE_KEY = "admin.github-sync.repo";
const BRANCH_KEY = "admin.github-sync.branch";
const LAST_CHECK_KEY = "admin.github-sync.last-check";

const normalizeRepo = (input: string): string | null => {
  if (!input) return null;
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return `${parts[0]}/${parts[1]}`;
};

const getGithubErrorMessage = (response: GithubSyncResponse): string => {
  if (response.status === 404) {
    if (response.message) return response.message;
    return `Dépôt ou branche introuvable (${response.repo ?? "dépôt"}@${response.branch ?? "branche"}). Si le dépôt est privé, ajoute un secret backend GITHUB_TOKEN pour autoriser la lecture.`;
  }
  if (response.status === 403) {
    return response.tokenConfigured
      ? "GitHub refuse la requête avec le token configuré. Vérifie ses droits ou sa limite de requêtes."
      : "Limite GitHub atteinte en accès anonyme. Ajoute un secret backend GITHUB_TOKEN ou réessaie plus tard.";
  }
  if (response.error === "network_error") {
    return `Le backend n'arrive pas à joindre GitHub : ${response.message ?? "erreur réseau inconnue"}.`;
  }
  if (response.error === "forbidden") return "Accès refusé : cette vérification est réservée aux administrateurs.";
  if (response.error === "invalid_session" || response.error === "missing_authorization") return "Session expirée : reconnecte-toi puis relance la vérification.";
  return response.message ?? "GitHub n'a pas renvoyé de réponse exploitable.";
};

const GithubSync = () => {
  const [repo, setRepo] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [branch, setBranch] = useState<string>(() => localStorage.getItem(BRANCH_KEY) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(() => localStorage.getItem(LAST_CHECK_KEY));
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);
  const [detectedDefaultBranch, setDetectedDefaultBranch] = useState<string | null>(null);
  const [suggestedRepo, setSuggestedRepo] = useState<GithubRepoCandidate | null>(null);

  const fetchCommits = useCallback(async (opts?: { autoBranch?: boolean }) => {
    const cleaned = normalizeRepo(repo);
    if (!cleaned) {
      setError("Format invalide. Utilise owner/repo (ex: Bricefwi/imotion-heart-spark) ou colle l'URL GitHub complète.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const branchToSend = opts?.autoBranch ? "" : branch;
      const { data, error: invokeError } = await supabase.functions.invoke<GithubSyncResponse>("github-sync-status", {
        body: { repo: cleaned, branch: branchToSend },
      });
      if (invokeError) throw new Error(invokeError.message);

      // Toujours mémoriser la branche par défaut détectée, même en cas d'erreur
      if (data?.repoDefaultBranch) {
        setDetectedDefaultBranch(data.repoDefaultBranch);
        if (!branch || data.branchAutoDetected) {
          setBranch(data.repoDefaultBranch);
          localStorage.setItem(BRANCH_KEY, data.repoDefaultBranch);
        }
      }

      const firstCandidate = data?.candidateRepos?.[0] ?? null;
      setSuggestedRepo(firstCandidate);

      if (!data?.ok || !data.commits) throw new Error(getGithubErrorMessage(data ?? { error: "network_error" }));

      setCommits(data.commits);
      setSuggestedRepo(null);
      setTokenConfigured(Boolean(data.tokenConfigured));
      if (data.branch) {
        setBranch(data.branch);
        localStorage.setItem(BRANCH_KEY, data.branch);
      }
      const now = data.checkedAt ?? new Date().toISOString();
      setLastCheck(now);
      localStorage.setItem(LAST_CHECK_KEY, now);
      localStorage.setItem(STORAGE_KEY, cleaned);
      setRepo(cleaned);
      toast.success(
        data.branchAutoDetected
          ? `Branche détectée automatiquement : ${data.branch}`
          : "Synchronisation vérifiée depuis GitHub"
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      toast.error(`Échec de la vérification : ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [repo, branch]);

  useEffect(() => {
    if (repo) fetchCommits({ autoBranch: !branch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = commits[0];
  const latestDate = latest?.commit.author?.date ? new Date(latest.commit.author.date) : null;
  const ageMinutes = latestDate ? Math.round((Date.now() - latestDate.getTime()) / 60000) : null;

  return (
    <>


      <main className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitBranch className="h-7 w-7 text-primary" />
              GitHub Sync
            </h1>
            <p className="text-muted-foreground">
              Vérifie le dernier commit publié sur GitHub et compare avec l'état de Lovable.
            </p>
          </div>
          <Button onClick={() => fetchCommits()} disabled={loading} size="lg" className="bg-gradient-to-r from-primary to-secondary">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Vérifier depuis GitHub
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration du dépôt</CardTitle>
            <CardDescription>
              Les informations sont stockées localement dans ton navigateur. Aucune clé API n'est requise pour les dépôts publics.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_200px]">
            <div className="space-y-2">
              <Label htmlFor="repo">Dépôt (owner/repo)</Label>
              <Input
                id="repo"
                placeholder="imotion-conseils/clarivi"
                value={repo}
                onChange={(e) => setRepo(e.target.value.trim())}
              />
              {suggestedRepo && suggestedRepo.fullName !== normalizeRepo(repo) && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setRepo(suggestedRepo.fullName);
                    localStorage.setItem(STORAGE_KEY, suggestedRepo.fullName);
                    if (suggestedRepo.defaultBranch) {
                      setBranch(suggestedRepo.defaultBranch);
                      localStorage.setItem(BRANCH_KEY, suggestedRepo.defaultBranch);
                    }
                  }}
                >
                  Utiliser le dépôt détecté : {suggestedRepo.fullName}
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branche</Label>
              <Input
                id="branch"
                placeholder="auto-détectée"
                value={branch}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setBranch(v);
                  if (v) localStorage.setItem(BRANCH_KEY, v); else localStorage.removeItem(BRANCH_KEY);
                }}
              />
              {detectedDefaultBranch && detectedDefaultBranch !== branch && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setBranch(detectedDefaultBranch);
                    localStorage.setItem(BRANCH_KEY, detectedDefaultBranch);
                  }}
                >
                  Utiliser la branche par défaut : {detectedDefaultBranch}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Impossible de joindre GitHub</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              État de la dernière synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !latest ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : latest ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Dernier commit</div>
                  <div className="font-mono text-sm mt-1">{latest.sha.slice(0, 8)}</div>
                  <div className="text-sm mt-1 line-clamp-2">{latest.commit.message.split("\n")[0]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Auteur</div>
                  <div className="text-sm mt-1">{latest.author?.login ?? latest.commit.author?.name ?? "Auteur inconnu"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{latestDate?.toLocaleString("fr-FR")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Fraîcheur</div>
                  <Badge variant={ageMinutes && ageMinutes < 60 ? "default" : "secondary"} className="mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    il y a {ageMinutes !== null ? (ageMinutes < 60 ? `${ageMinutes} min` : `${Math.round(ageMinutes / 60)} h`) : "—"}
                  </Badge>
                  {lastCheck && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Vérifié : {new Date(lastCheck).toLocaleString("fr-FR")}
                    </div>
                  )}
                  {tokenConfigured !== null && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Accès GitHub : {tokenConfigured ? "token backend" : "public"}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GitCommit className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucune vérification effectuée. Renseigne un dépôt et clique sur « Vérifier depuis GitHub ».</p>
              </div>
            )}
          </CardContent>
        </Card>

        {commits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">10 derniers commits sur {branch}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {commits.map((c) => (
                  <li key={c.sha} className="py-3 flex items-start gap-3">
                    <GitCommit className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.commit.message.split("\n")[0]}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{c.sha.slice(0, 8)}</span> · {c.author?.login ?? c.commit.author?.name ?? "Auteur inconnu"} ·{" "}
                        {c.commit.author?.date ? new Date(c.commit.author.date).toLocaleString("fr-FR") : "date inconnue"}
                      </div>
                    </div>
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Ouvrir sur GitHub"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Comment ça marche ?</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>Cette page interroge GitHub via le backend Lovable Cloud pour éviter le blocage réseau du navigateur. Elle ne déclenche pas la sync Lovable elle-même, qui reste automatique côté plateforme.</p>
            <p>Pour un dépôt privé, configure un secret backend <strong>GITHUB_TOKEN</strong> avec un token GitHub en lecture seule, puis relance la vérification.</p>
          </AlertDescription>
        </Alert>
      </main>
    </>
  );
};

export default GithubSync;
