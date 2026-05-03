import { useAuth } from "@/hooks/useAuth";
import { useClient360 } from "@/hooks/useClient360";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { getMarketingAuditUrl } from "@/lib/marketing-url";
import {
  FolderKanban, FileText, MessageSquare, Euro, RefreshCw, ExternalLink,
  CheckCircle2, AlertCircle, Sparkles, TrendingUp, Target, Globe, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { UnifiedTimeline } from "@/components/client/UnifiedTimeline";
import { CrossSellRecommendations, CrossKpis } from "@/components/client/CrossSellRecommendations";

function SourceBadge({ status }: { status: "ok" | "error" | "loading" | "unavailable" }) {
  const map = {
    ok: { label: "Connecté", icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    error: { label: "Erreur", icon: AlertCircle, cls: "bg-destructive/10 text-destructive border-destructive/20" },
    loading: { label: "Chargement…", icon: RefreshCw, cls: "bg-muted text-muted-foreground border-border" },
    unavailable: { label: "Indisponible", icon: AlertCircle, cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const it = map[status];
  return (
    <Badge variant="outline" className={`gap-1 ${it.cls}`}>
      <it.icon className={`h-3 w-3 ${status === "loading" ? "animate-spin" : ""}`} />
      {it.label}
    </Badge>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard360() {
  const { user, profile } = useAuth();
  const { data, loading, refresh } = useClient360(user?.id);

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  const fmtEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const lastAudit = data.lovelibAudits[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Vue 360°
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Bonjour {profile?.full_name?.split(" ")[0] ?? "👋"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Toute votre activité Clarivi (BUILD) et IMOTION Marketing en un seul endroit.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2 self-start md:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Source health bar */}
      <Card className="mb-8 border-dashed">
        <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-muted-foreground">Sources agrégées :</span>
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5" /> Clarivi BUILD <SourceBadge status={data.sources.clarivi} />
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5" /> Audits Marketing <SourceBadge status={data.sources.lovelibAudits} />
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" /> KPIs Live Marketing <SourceBadge status={data.sources.lovelibLive} />
          </span>
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading && !data.clarivi ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <Kpi icon={FolderKanban} label="Projets actifs" value={data.clarivi?.activeProjectsCount ?? 0} hint="Clarivi BUILD" />
            <Kpi icon={FileText} label="Documents" value={fmt(data.clarivi?.documentsCount ?? 0)} hint="CDC, devis, contrats" />
            <Kpi icon={MessageSquare} label="Messages IA" value={fmt(data.clarivi?.messagesCount ?? 0)} hint="Discovery avec Marc" />
            <Kpi
              icon={Euro}
              label="Estimations"
              value={fmtEur(data.clarivi?.totalEstimatedBudget ?? 0)}
              hint="Cumul devis en cours"
            />
          </>
        )}
      </div>

      {/* KPIs croisés Marketing × Build */}
      <div className="mb-6">
        <CrossKpis clarivi={data.clarivi} audits={data.lovelibAudits} />
      </div>

      {/* Recommandations cross-sell */}
      <div className="mb-6">
        <CrossSellRecommendations
          userId={user?.id}
          clarivi={data.clarivi}
          audits={data.lovelibAudits}
        />
      </div>

      {/* Timeline unifiée Marketing + Build */}
      <div className="mb-6">
        <UnifiedTimeline
          loading={loading}
          clarivi={data.clarivi}
          audits={data.lovelibAudits}
          activities={data.activities}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clarivi: Projects */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  Vos projets Clarivi
                </CardTitle>
                <CardDescription>Source : <code className="text-xs">clarivi.projects</code></CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to="/client/projects">Tout voir</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)
              ) : data.clarivi?.projects.length ? (
                data.clarivi.projects.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    to={`/client/projects/${p.id}/conversation`}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.code ?? "—"} · Phase {p.current_phase ?? 1}/7
                        {p.last_activity_at && (
                          <> · {formatDistanceToNow(new Date(p.last_activity_at), { addSuffix: true, locale: fr })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">{p.overall_progress ?? 0}%</span>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${p.overall_progress ?? 0}%` }}
                          />
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize text-xs">{p.status}</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Aucun projet pour le moment.
                  <div className="mt-3">
                    <Button asChild size="sm">
                      <Link to="/client/projects/new">Démarrer un projet</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Lovelib: Marketing audits */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                Marketing
              </CardTitle>
              <CardDescription>Source : <code className="text-xs">lovelib.marketing_audits</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-32" />
              ) : lastAudit ? (
                <>
                  <div className="rounded-lg border border-border/60 p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dernier audit</span>
                      <Badge variant={lastAudit.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {lastAudit.status}
                      </Badge>
                    </div>
                    {lastAudit.score !== null && (
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {lastAudit.score}
                        </span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                    )}
                    {lastAudit.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{lastAudit.summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(lastAudit.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>

                  {data.lovelibAudits.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      + {data.lovelibAudits.length - 1} autre{data.lovelibAudits.length > 2 ? "s" : ""} audit{data.lovelibAudits.length > 2 ? "s" : ""}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-6 text-center">
                  <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Pas encore d'audit marketing. <br />C'est gratuit et ça prend 3 minutes.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-primary to-secondary text-white"
                  >
                    <a href={getMarketingAuditUrl({ userId: user?.id })} target="_blank" rel="noreferrer">
                      Faire l'audit gratuit <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}

              {/* Live KPIs section */}
              {data.lovelibLive && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> KPIs Live
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded border border-border/60 p-2">
                        <p className="text-xs text-muted-foreground">Visiteurs/mois</p>
                        <p className="font-semibold">{fmt(data.lovelibLive.monthly_visitors)}</p>
                      </div>
                      <div className="rounded border border-border/60 p-2">
                        <p className="text-xs text-muted-foreground">Leads (30j)</p>
                        <p className="font-semibold">{fmt(data.lovelibLive.leads_30d)}</p>
                      </div>
                      <div className="rounded border border-border/60 p-2">
                        <p className="text-xs text-muted-foreground">Campagnes</p>
                        <p className="font-semibold">{data.lovelibLive.campaigns_active}</p>
                      </div>
                      <div className="rounded border border-border/60 p-2">
                        <p className="text-xs text-muted-foreground">Conversion</p>
                        <p className="font-semibold">{(data.lovelibLive.conversion_rate * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Errors footer */}
      {Object.keys(data.errors).length > 0 && (
        <Card className="mt-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm space-y-1">
            <p className="font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Sources en erreur
            </p>
            {Object.entries(data.errors).map(([k, v]) => (
              <p key={k} className="text-xs text-muted-foreground">
                <code>{k}</code> — {v}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
