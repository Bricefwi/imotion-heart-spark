/**
 * UnifiedTimeline
 * ---------------
 * Fusionne audits marketing (lovelib) + projets Clarivi + activités
 * dans une seule frise chronologique sans rupture entre les deux mondes.
 */
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Target, FileText, MessageSquare, Sparkles, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { ClariviSnapshot, LovelibAudit } from "@/hooks/useClient360";

type TrackKind = "marketing" | "build" | "doc" | "message" | "activity";

export interface TimelineActivity {
  id: string;
  action: string;
  description: string | null;
  created_at: string;
  project_id: string | null;
}

interface TimelineItem {
  id: string;
  kind: TrackKind;
  title: string;
  subtitle?: string;
  date: string;
  href?: string;
  badge?: string;
}

const META: Record<
  TrackKind,
  { label: string; icon: typeof Target; dot: string; tint: string }
> = {
  marketing: {
    label: "Marketing",
    icon: Target,
    dot: "bg-secondary",
    tint: "bg-secondary/10 text-secondary border-secondary/20",
  },
  build: {
    label: "Build",
    icon: FolderKanban,
    dot: "bg-primary",
    tint: "bg-primary/10 text-primary border-primary/20",
  },
  doc: {
    label: "Document",
    icon: FileText,
    dot: "bg-foreground/40",
    tint: "bg-muted text-foreground/80 border-border",
  },
  message: {
    label: "Discovery",
    icon: MessageSquare,
    dot: "bg-foreground/30",
    tint: "bg-muted text-foreground/80 border-border",
  },
  activity: {
    label: "Activité",
    icon: Activity,
    dot: "bg-foreground/30",
    tint: "bg-muted text-foreground/80 border-border",
  },
};

interface Props {
  loading: boolean;
  clarivi: ClariviSnapshot | null;
  audits: LovelibAudit[];
  activities?: TimelineActivity[];
  limit?: number;
}

export function UnifiedTimeline({ loading, clarivi, audits, activities = [], limit = 12 }: Props) {
  const items = useMemo<TimelineItem[]>(() => {
    const out: TimelineItem[] = [];

    for (const p of clarivi?.projects ?? []) {
      out.push({
        id: `project-${p.id}`,
        kind: "build",
        title: p.name,
        subtitle: `${p.code ?? "—"} · Phase ${p.current_phase ?? 1}/7 · ${p.overall_progress ?? 0}%`,
        date: p.last_activity_at ?? p.created_at ?? new Date().toISOString(),
        href: `/client/projects/${p.id}/conversation`,
        badge: p.status,
      });
    }

    for (const a of audits) {
      out.push({
        id: `audit-${a.id}`,
        kind: "marketing",
        title: a.company_name ? `Audit marketing — ${a.company_name}` : "Audit marketing",
        subtitle: a.score !== null ? `Score ${a.score}/100${a.summary ? ` · ${a.summary}` : ""}` : a.summary ?? undefined,
        date: a.completed_at ?? a.created_at,
        href: "/client/my-audits",
        badge: a.status,
      });
    }

    for (const ac of activities) {
      out.push({
        id: `act-${ac.id}`,
        kind: "activity",
        title: ac.description ?? ac.action,
        subtitle: ac.action,
        date: ac.created_at,
        href: ac.project_id ? `/client/projects/${ac.project_id}` : undefined,
      });
    }

    return out
      .filter((i) => i.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [clarivi, audits, activities, limit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Timeline unifiée
        </CardTitle>
        <CardDescription>
          Audits marketing et projets BUILD dans la même frise — sans rupture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun événement pour le moment.
          </p>
        ) : (
          <ol className="relative border-l border-border/60 ml-3 space-y-5">
            {items.map((it) => {
              const meta = META[it.kind];
              const Icon = meta.icon;
              const Inner = (
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`gap-1 text-[10px] ${meta.tint}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                    {it.badge && (
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {it.badge}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(it.date), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="font-medium mt-1 truncate">{it.title}</p>
                  {it.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{it.subtitle}</p>
                  )}
                </div>
              );

              return (
                <li key={it.id} className="ml-4 relative">
                  <span
                    className={`absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background ${meta.dot}`}
                    aria-hidden
                  />
                  {it.href ? (
                    <Link
                      to={it.href}
                      className="flex items-start gap-3 rounded-md p-2 -m-2 hover:bg-muted/40 transition-colors"
                    >
                      {Inner}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 p-2 -m-2">{Inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
