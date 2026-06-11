import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { RefreshCw, GitBranch, ExternalLink, AlertCircle, CheckCircle2, GitCommit, Clock } from "lucide-react";

interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
}

const STORAGE_KEY = "admin.github-sync.repo";
const LAST_CHECK_KEY = "admin.github-sync.last-check";

const GithubSync = () => {
  const [repo, setRepo] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [branch, setBranch] = useState<string>("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(() => localStorage.getItem(LAST_CHECK_KEY));

  const fetchCommits = useCallback(async () => {
    if (!repo || !repo.includes("/")) {
      setError("Renseigne le dépôt au format owner/repo (ex: imotion/clarivi).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=10`;
      const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `GitHub API: ${res.status}`);
      }
      const data: GithubCommit[] = await res.json();
      setCommits(data);
      const now = new Date().toISOString();
      setLastCheck(now);
      localStorage.setItem(LAST_CHECK_KEY, now);
      localStorage.setItem(STORAGE_KEY, repo);
      toast.success("Synchronisation vérifiée depuis GitHub");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      toast.error(`Échec de la vérification : ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [repo, branch]);

  useEffect(() => {
    if (repo) fetchCommits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = commits[0];
  const latestDate = latest ? new Date(latest.commit.author.date) : null;
  const ageMinutes = latestDate ? Math.round((Date.now() - latestDate.getTime()) / 60000) : null;

  return (
    <>
      <Helmet>
        <title>GitHub Sync — Admin Clarivi</title>
        <meta name="description" content="État de la synchronisation entre le dépôt GitHub et Lovable." />
      </Helmet>

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
          <Button onClick={fetchCommits} disabled={loading} size="lg" className="bg-gradient-to-r from-primary to-secondary">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branche</Label>
              <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value.trim())} />
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
                  <div className="text-sm mt-1">{latest.author?.login ?? latest.commit.author.name}</div>
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
                        <span className="font-mono">{c.sha.slice(0, 8)}</span> · {c.author?.login ?? c.commit.author.name} ·{" "}
                        {new Date(c.commit.author.date).toLocaleString("fr-FR")}
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
            <p>Cette page interroge l'API publique GitHub pour lire les derniers commits de ton dépôt. Elle ne déclenche pas la sync Lovable elle-même (qui est automatique côté plateforme).</p>
            <p>Si le dernier commit ici est plus récent que ce que tu vois dans l'éditeur Lovable, attends 30 s puis recharge ; sinon reconnecte l'app GitHub via le menu <strong>+ → GitHub → Manage</strong>.</p>
          </AlertDescription>
        </Alert>
      </main>
    </>
  );
};

export default GithubSync;
