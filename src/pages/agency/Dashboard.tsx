import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Plus, FileText, TrendingUp, Users, Zap, AlertTriangle, CheckCircle2,
} from "lucide-react";

interface AuditRow {
  id: string;
  prospect_name: string | null;
  prospect_email: string | null;
  status: string;
  lead_grade: string | null;
  quality_score: number | null;
  llm_cost_eur: number | null;
  created_at: string;
  completed_at: string | null;
}

const GRADE_STYLES: Record<string, React.CSSProperties> = {
  A: { background: "hsl(var(--imo-coral-100))", color: "hsl(var(--imo-coral-700))" },
  B: { background: "hsl(var(--imo-amber-100))", color: "hsl(var(--imo-amber-700))" },
  C: { background: "hsl(var(--imo-ink-100))",   color: "hsl(var(--imo-ink-600))"   },
  D: { background: "hsl(var(--imo-danger-500) / 0.12)", color: "hsl(var(--imo-danger-500))" },
};

function LeadGradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
      style={GRADE_STYLES[grade] ?? {}}
    >
      {grade}
    </span>
  );
}

export default function AgencyDashboard() {
  const { agency, subscription, isLoading } = useAgency();
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(true);

  useEffect(() => {
    if (!agency) return;
    supabase
      .from("audits")
      .select("id, prospect_name, prospect_email, status, lead_grade, quality_score, llm_cost_eur, created_at, completed_at")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setAudits((data ?? []) as AuditRow[]);
        setAuditsLoading(false);
      });
  }, [agency]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const completedAudits = audits.filter((a) => a.status === "completed");
  const quotaPercent = subscription
    ? Math.round((subscription.audits_used / subscription.audits_quota) * 100)
    : 0;
  const isTrialExpiringSoon = subscription?.status === "trialing" && subscription.trial_ends_at
    ? (new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000 < 3
    : false;

  const totalCost = audits.reduce((acc, a) => acc + (Number(a.llm_cost_eur) || 0), 0);

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agency?.name ?? "Dashboard"}</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de vos audits IA</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/app/audits/new">
            <Plus className="size-4" />
            Nouveau lien d'audit
          </Link>
        </Button>
      </div>

      {/* Trial warning */}
      {isTrialExpiringSoon && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Votre essai gratuit expire dans moins de 3 jours. <Link to="/app/billing" className="underline font-medium">Passer à un plan payant →</Link></span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="size-3.5" /> Audits ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription?.audits_used ?? 0}</div>
            <div className="text-xs text-muted-foreground">/ {subscription?.audits_quota ?? 5} inclus</div>
            <Progress value={quotaPercent} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="size-3.5" /> Audits complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAudits.length}</div>
            <div className="text-xs text-muted-foreground">sur {audits.length} démarrés</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-3.5" /> Leads A/B
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedAudits.filter((a) => a.lead_grade === "A" || a.lead_grade === "B").length}
            </div>
            <div className="text-xs text-muted-foreground">sur {completedAudits.length} complétés</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="size-3.5" /> Coût LLM total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toFixed(2)} €</div>
            <div className="text-xs text-muted-foreground">~{audits.length > 0 ? (totalCost / audits.length).toFixed(2) : "0.00"} €/audit</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent audits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Derniers audits</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/audits">Voir tous</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {auditsLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Chargement…</div>
          ) : audits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm mb-4">Aucun audit pour l'instant.</p>
              <Button asChild size="sm">
                <Link to="/app/audits/new">Créer votre premier lien d'audit</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {audits.map((audit) => (
                <Link
                  key={audit.id}
                  to={`/app/audits/${audit.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {audit.prospect_name ?? audit.prospect_email ?? "Prospect anonyme"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(audit.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <LeadGradeBadge grade={audit.lead_grade} />
                    <Badge
                      variant={audit.status === "completed" ? "default" : audit.status === "in_progress" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {audit.status === "completed" ? "Complété"
                        : audit.status === "in_progress" ? "En cours"
                        : audit.status === "abandoned" ? "Abandonné"
                        : "Échoué"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
