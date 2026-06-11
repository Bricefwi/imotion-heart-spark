import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, DollarSign, AlertTriangle, CheckCircle2, XCircle, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const PLAN_PRICES: Record<string, number> = {
  starter: 79,
  pro:     199,
  agency:  399,
  trial:   0,
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  pro:     "bg-[hsl(var(--imo-coral-600)/0.12)] text-[hsl(var(--imo-coral-700))]",
  agency:  "bg-[hsl(var(--imo-amber-500)/0.12)] text-[hsl(var(--imo-amber-700))]",
  trial:   "bg-muted text-muted-foreground",
};

interface Subscription {
  id: string;
  agency_id: string;
  plan: string;
  status: string;
  audits_used: number;
  audits_quota: number;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

interface Agency {
  id: string;
  name: string;
  contact_email: string;
  created_at: string;
}

export default function AdminBilling() {
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agency_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Subscription[];
    },
    refetchInterval: 60000,
  });

  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      const { data } = await supabase.from("agencies").select("id, name, contact_email, created_at");
      return (data ?? []) as Agency[];
    },
  });

  // LLM cost from jobs
  const { data: llmCost = 0 } = useQuery<number>({
    queryKey: ["admin-llm-cost-month"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("jobs")
        .select("cost_eur")
        .gte("created_at", startOfMonth.toISOString());
      return (data ?? []).reduce((sum, j) => sum + (j.cost_eur ?? 0), 0);
    },
    refetchInterval: 300000,
  });

  // MRR
  const mrr = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const trialSubs  = subscriptions.filter((s) => s.plan === "trial");
  const failedSubs = subscriptions.filter((s) => s.status === "past_due" || s.status === "unpaid");

  const marginEur   = mrr - llmCost;
  const marginPct   = mrr > 0 ? (marginEur / mrr) * 100 : 0;

  // Plan distribution for chart
  const planDist = Object.entries(
    subscriptions.reduce((acc, s) => {
      if (s.status === "active") acc[s.plan] = (acc[s.plan] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([plan, count]) => ({ plan, count, mrr: count * (PLAN_PRICES[plan] ?? 0) }));

  // Monthly MRR history (from subscriptions created_at, mock growth)
  const agencyById = Object.fromEntries(agencies.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">MRR & Facturation</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenus, marges LLM et santé des abonnements</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "MRR",          value: `${mrr} €`,             icon: DollarSign,  color: "text-[hsl(var(--imo-coral-600))]", sub: `${activeSubs.length} abonnés actifs` },
          { label: "ARR projeté",  value: `${mrr * 12} €`,        icon: TrendingUp,  color: "text-emerald-600",                 sub: "×12 MRR" },
          { label: "Marge brute",  value: `${marginEur.toFixed(0)} €`, icon: Zap,    color: marginEur >= 0 ? "text-emerald-600" : "text-destructive", sub: `${marginPct.toFixed(1)} %` },
          { label: "Coût LLM/mois",value: `${llmCost.toFixed(2)} €`, icon: AlertTriangle, color: "text-amber-600",            sub: "Ce mois" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`font-bold text-2xl tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Distribution plans */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribution par plan</CardTitle>
          </CardHeader>
          <CardContent>
            {planDist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun abonné actif</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={planDist} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    formatter={(v, name) => [`${v}${name === "mrr" ? " €" : ""}`, name === "mrr" ? "MRR" : "Abonnés"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--imo-coral-600))" radius={[4, 4, 0, 0]} name="count" />
                  <Bar dataKey="mrr"   fill="hsl(var(--imo-amber-500))" radius={[4, 4, 0, 0]} name="mrr" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Alertes & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failedSubs.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{failedSubs.length} paiement(s) échoué(s)</p>
                  <p className="text-xs text-muted-foreground">Contacter les agences concernées</p>
                </div>
              </div>
            )}
            {trialSubs.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">{trialSubs.length} agence(s) en trial</p>
                  <p className="text-xs text-muted-foreground">Opportunités de conversion</p>
                </div>
              </div>
            )}
            {mrr === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border">
                <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Aucun abonné payant — activez Stripe pour suivre le MRR</p>
              </div>
            )}
            {mrr > 0 && failedSubs.length === 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">Tous les paiements sont à jour ✓</p>
              </div>
            )}

            {/* Seuil rentabilité */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Seuil de rentabilité (120 €/mois)</span>
                <span className="font-mono tabular-nums">{Math.min(mrr, 120)} / 120 €</span>
              </div>
              <Progress value={Math.min((mrr / 120) * 100, 100)} className="h-1.5" />
              {mrr >= 120
                ? <p className="text-xs text-emerald-600 mt-1">✓ Seuil atteint</p>
                : <p className="text-xs text-muted-foreground mt-1">{(120 - mrr)} € manquants (~{Math.ceil((120 - mrr) / 79)} client(s) Starter)</p>
              }
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Liste des abonnements */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Abonnements ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun abonnement</p>
          ) : (
            <div className="divide-y divide-border/40">
              {subscriptions.slice(0, 20).map((sub) => {
                const agency = agencyById[sub.agency_id];
                const quotaPct = sub.audits_quota > 0 ? (sub.audits_used / sub.audits_quota) * 100 : 0;
                return (
                  <div key={sub.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{agency?.name ?? sub.agency_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground truncate">{agency?.contact_email ?? ""}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${PLAN_COLORS[sub.plan] ?? ""}`}>
                      {sub.plan}
                    </Badge>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono tabular-nums font-semibold">
                        {PLAN_PRICES[sub.plan] ?? 0} €
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {sub.audits_used}/{sub.audits_quota} audits
                      </p>
                    </div>
                    <div className="w-16 shrink-0">
                      <Progress value={Math.min(quotaPct, 100)} className={`h-1 ${quotaPct > 80 ? "[&>div]:bg-amber-500" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
