/**
 * CrossSellRecommendations
 * ------------------------
 * Recommandations IA dérivées localement de l'état Clarivi+lovelib :
 * - audit faible + projet BUILD → accompagnement marketing
 * - projet livré → audit / plan croissance marketing
 * - audit fort sans projet → discovery BUILD
 * - aucun audit → audit gratuit (loss leader)
 * - audit + projet en discovery → fusionner audit dans discovery
 */
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight, ExternalLink, Target, Rocket, TrendingUp, Link as LinkIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getMarketingAuditUrl } from "@/lib/marketing-url";
import type { ClariviSnapshot, LovelibAudit } from "@/hooks/useClient360";

type RecKind = "marketing" | "build" | "bridge";

interface Recommendation {
  id: string;
  kind: RecKind;
  priority: 1 | 2 | 3;
  title: string;
  body: string;
  cta: { label: string; href: string; external?: boolean };
}

interface Props {
  userId?: string;
  clarivi: ClariviSnapshot | null;
  audits: LovelibAudit[];
}

const KIND_META: Record<RecKind, { icon: typeof Target; tint: string; label: string }> = {
  marketing: { icon: Target, tint: "from-secondary/15 to-secondary/5 border-secondary/20", label: "Marketing" },
  build: { icon: Rocket, tint: "from-primary/15 to-primary/5 border-primary/20", label: "Build" },
  bridge: { icon: LinkIcon, tint: "from-primary/10 to-secondary/10 border-border", label: "Synergie" },
};

export function CrossSellRecommendations({ userId, clarivi, audits }: Props) {
  const recs = useMemo<Recommendation[]>(() => {
    const list: Recommendation[] = [];
    const projects = clarivi?.projects ?? [];
    const activeProjects = projects.filter(
      (p) => !["completed", "archived", "cancelled"].includes(p.status),
    );
    const completedProjects = projects.filter((p) => p.status === "completed");
    const lastAudit = audits[0];
    const bestScore = audits.reduce<number | null>(
      (max, a) => (a.score !== null && (max === null || a.score > max) ? a.score : max),
      null,
    );

    // 1. Aucun audit → CTA audit gratuit
    if (audits.length === 0) {
      list.push({
        id: "no-audit",
        kind: "marketing",
        priority: 1,
        title: "Lancez votre audit marketing gratuit",
        body: "3 minutes pour découvrir les angles morts de votre acquisition. Le résultat alimente automatiquement votre brief BUILD.",
        cta: {
          label: "Faire l'audit gratuit",
          href: getMarketingAuditUrl({ userId }),
          external: true,
        },
      });
    }

    // 2. Audit faible + projet BUILD actif → accompagnement marketing
    if (lastAudit?.score !== null && (lastAudit?.score ?? 100) < 65 && activeProjects.length > 0) {
      list.push({
        id: "low-score-active-build",
        kind: "marketing",
        priority: 1,
        title: "Sécurisez le ROI de votre projet en cours",
        body: `Votre score marketing est de ${lastAudit?.score}/100. Sans plan d'acquisition, le futur site risque de ne pas générer le pipeline attendu.`,
        cta: {
          label: "Demander une stratégie marketing",
          href: getMarketingAuditUrl({ userId, path: "/strategy" }),
          external: true,
        },
      });
    }

    // 3. Audit présent + aucun projet → discovery BUILD
    if (audits.length > 0 && projects.length === 0) {
      list.push({
        id: "audit-no-project",
        kind: "build",
        priority: 1,
        title: "Transformez votre audit en projet concret",
        body: "Vous avez un diagnostic marketing. L'étape suivante : 30 minutes avec Marc pour cadrer le projet digital qui adresse les recommandations.",
        cta: { label: "Démarrer la discovery", href: "/client/projects/new" },
      });
    }

    // 4. Projet livré → cross-sell marketing croissance
    if (completedProjects.length > 0) {
      list.push({
        id: "build-done-growth",
        kind: "marketing",
        priority: 2,
        title: "Activez la croissance post-livraison",
        body: "Votre site est en ligne. Un plan d'acquisition (SEO, paid, contenu) est ce qui sépare un site d'une machine à leads.",
        cta: {
          label: "Planifier ma croissance",
          href: getMarketingAuditUrl({ userId, path: "/growth" }),
          external: true,
        },
      });
    }

    // 5. Audit + projet en discovery → bridge fusion
    const projectInDiscovery = activeProjects.find(
      (p) => p.status === "discovery" || (p.current_phase ?? 0) <= 3,
    );
    if (lastAudit && projectInDiscovery) {
      list.push({
        id: "bridge-merge",
        kind: "bridge",
        priority: 2,
        title: "Fusionnez votre audit dans la discovery",
        body: `Le contexte de "${projectInDiscovery.name}" peut être pré-rempli avec votre audit. Marc gagnera 2 phases.`,
        cta: {
          label: "Ouvrir la discovery",
          href: `/client/projects/${projectInDiscovery.id}/conversation`,
        },
      });
    }

    // 6. Audit fort + aucun projet actif → upsell premium build
    if (bestScore !== null && bestScore >= 75 && activeProjects.length === 0) {
      list.push({
        id: "high-score-build",
        kind: "build",
        priority: 3,
        title: "Capitalisez sur vos fondamentaux solides",
        body: `Score ${bestScore}/100 : vos bases marketing sont saines. C'est le bon moment pour un projet ambitieux (refonte, plateforme, app).`,
        cta: { label: "Cadrer un nouveau projet", href: "/client/projects/new" },
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [clarivi, audits, userId]);

  if (recs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Recommandations cross-sell
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Suggérées par votre profil 360°
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recs.map((r) => {
          const meta = KIND_META[r.kind];
          const Icon = meta.icon;
          return (
            <div
              key={r.id}
              className={`relative rounded-lg border p-4 bg-gradient-to-br ${meta.tint} flex flex-col`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-md bg-background/70 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                {r.priority === 1 && (
                  <Badge className="text-[10px] bg-gradient-to-r from-primary to-secondary text-white border-0">
                    Prioritaire
                  </Badge>
                )}
              </div>
              <p className="font-semibold text-sm leading-snug">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-1 flex-1">{r.body}</p>
              <div className="mt-3">
                {r.cta.external ? (
                  <Button asChild size="sm" variant="default" className="bg-foreground text-background hover:bg-foreground/90">
                    <a href={r.cta.href} target="_blank" rel="noreferrer">
                      {r.cta.label} <ExternalLink className="ml-1.5 h-3 w-3" />
                    </a>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="default" className="bg-foreground text-background hover:bg-foreground/90">
                    <Link to={r.cta.href}>
                      {r.cta.label} <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function CrossKpis({
  clarivi,
  audits,
}: {
  clarivi: ClariviSnapshot | null;
  audits: LovelibAudit[];
}) {
  const auditsCount = audits.length;
  const projectsCount = clarivi?.projects.length ?? 0;
  const conversionRate = auditsCount > 0 ? Math.round((projectsCount / auditsCount) * 100) : 0;
  const avgScore = useMemo(() => {
    const scored = audits.filter((a) => a.score !== null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length);
  }, [audits]);

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Score marketing moyen
          </p>
          <p className="text-2xl font-bold mt-1">{avgScore !== null ? `${avgScore}/100` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{auditsCount} audit{auditsCount > 1 ? "s" : ""}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Audit → Projet
          </p>
          <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {conversionRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Taux de conversion cross</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Synergie 360°
          </p>
          <p className="text-2xl font-bold mt-1">
            {auditsCount + projectsCount}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Marketing + Build combinés
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
