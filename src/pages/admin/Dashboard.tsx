import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, FolderKanban, FileText, Euro, TrendingUp, Activity,
  MessageSquare, Clock, Star, CheckCircle2, XCircle, Eye,
  Search, Filter, ArrowRight, Sparkles, Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Activity as ActivityType } from "@/types/admin";

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clientSearch, setClientSearch] = useState("");

  // ── Data queries ──

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, company_name, company_role, industry, created_at, onboarding_completed, last_seen_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["admin-documents-count"],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("id, doc_type, type, created_at").limit(1000);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["admin-pending-reviews"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as unknown as Array<{
        id: string;
        reviewer_name: string;
        reviewer_company: string | null;
        rating: number;
        review_text: string;
        status: string;
        created_at: string;
      }>;
    },
    enabled: !!user,
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*, profile:profiles!activities_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!user,
  });

  // ── Review moderation ──

  const moderateReview = useMutation({
    mutationFn: async ({ reviewId, action }: { reviewId: string; action: "approved" | "rejected" }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("client_reviews")
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-reviews"] });
      toast.success(action === "approved" ? "Avis approuvé et publié." : "Avis rejeté.");
    },
    onError: () => toast.error("Erreur lors de la modération."),
  });

  // ── KPIs ──

  const activeProjects = projects.filter(p => !["archived", "delivered", "lost"].includes(p.status));
  const cdcGenerated = documents.filter((d) => d.type === "cdc").length;
  const totalPipeline = projects.reduce((sum, p) => sum + (p.estimated_budget_max || 0), 0);
  const totalMessages = projects.reduce((sum, p) => sum + (p.total_messages || 0), 0);
  const onboardedClients = profiles.filter(p => p.onboarding_completed).length;
  const conversionRate = profiles.length > 0
    ? Math.round((projects.filter(p => ["signed", "in_development", "delivered"].includes(p.status)).length / profiles.length) * 100)
    : 0;

  const pendingReviewCount = pendingReviews.filter(r => r.status === "pending").length;

  // ── Client filtering ──

  const filteredClients = profiles.filter(p => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q)
    );
  });

  const statusColors: Record<string, string> = {
    draft: "muted", discovery_active: "info", discovery_completed: "info",
    cdc_ready: "warning", cdc_generated: "warning", proposal_sent: "warning",
    proposal_accepted: "success", signed: "success", in_development: "default",
    delivered: "success", archived: "muted",
  };

  // ── Aggregated data ──
  const topIndustries = profiles.reduce<Record<string, number>>((acc, p) => {
    if (p.industry) acc[p.industry] = (acc[p.industry] || 0) + 1;
    return acc;
  }, {});
  const sortedIndustries = Object.entries(topIndustries).sort(([, a], [, b]) => b - a).slice(0, 4);

  const kpiCards = [
    {
      label: "Pipeline total",
      value: totalPipeline > 0 ? `${(totalPipeline / 1000).toFixed(0)}k€` : "0€",
      icon: Euro,
      gradient: "from-primary/90 to-primary/70",
      textColor: "text-white",
      bgIcon: "text-white/10",
    },
    {
      label: "Projets actifs",
      value: activeProjects.length,
      icon: FolderKanban,
      gradient: "from-secondary/90 to-amber-500/80",
      textColor: "text-white",
      bgIcon: "text-white/10",
      alert: activeProjects.filter(p => p.status === "review_pending").length > 0
        ? `${activeProjects.filter(p => p.status === "review_pending").length} en revue`
        : undefined,
    },
    {
      label: "Taux conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      gradient: "from-emerald-500/90 to-green-600/80",
      textColor: "text-white",
      bgIcon: "text-white/10",
      progress: conversionRate,
    },
    {
      label: "CDC générés",
      value: cdcGenerated,
      icon: FileText,
      gradient: "from-blue-500/90 to-indigo-600/80",
      textColor: "text-white",
      bgIcon: "text-white/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
          <p className="text-muted-foreground mt-1 text-sm">Bienvenue dans votre Tour de Contrôle</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingReviewCount > 0 && (
            <Badge className="bg-secondary text-secondary-foreground text-sm px-3 py-1.5">
              {pendingReviewCount} avis en attente
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/admin/logs">
              <Sparkles className="h-3.5 w-3.5" />
              Diagnostics Système
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero KPI cards — 4 colored gradient cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-5 ${kpi.textColor}`}>
              <kpi.icon className={`absolute top-3 right-3 h-16 w-16 ${kpi.bgIcon}`} />
              <div className="relative z-10">
                <p className="text-sm font-medium opacity-80">{kpi.label}</p>
                <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                {kpi.alert && (
                  <p className="text-xs mt-2 flex items-center gap-1 opacity-90">
                    <Clock className="h-3 w-3" /> {kpi.alert}
                  </p>
                )}
                {kpi.progress !== undefined && (
                  <div className="mt-3">
                    <Progress value={kpi.progress} className="h-1.5 bg-white/20 [&>div]:bg-white" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Utilisateurs", value: profiles.length, icon: Users },
          { label: "En attente", value: projects.filter(p => p.status === "review_pending").length, icon: Clock },
          { label: "Messages", value: totalMessages, icon: MessageSquare },
          { label: "Avis à valider", value: pendingReviewCount, icon: Star },
          { label: "Activités", value: recentActivities.length, icon: Activity },
          { label: "Onboardés", value: onboardedClients, icon: CheckCircle2 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Client list */}
        <Card className="lg:col-span-2 border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              Clients ({profiles.length})
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Rechercher..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 sticky top-0">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Entreprise</th>
                    <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Secteur</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Inscrit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.slice(0, 20).map((client) => (
                    <tr key={client.id} className="border-t border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{client.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {client.company_name || "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {client.industry && (
                          <Badge variant="muted" className="text-[10px]">{client.industry}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={client.onboarding_completed ? "success" : "warning"} className="text-[10px]">
                          {client.onboarding_completed ? "Actif" : "Onboarding"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {client.created_at && format(new Date(client.created_at), "dd/MM/yy", { locale: fr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucun client trouvé.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column — Review moderation */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Star className="h-3.5 w-3.5 text-secondary" />
              </div>
              Avis clients
            </CardTitle>
            {pendingReviewCount > 0 && (
              <Badge variant="warning" className="text-[10px]">{pendingReviewCount} en attente</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 p-3 max-h-[400px] overflow-y-auto">
            {pendingReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucun avis.</p>
            ) : (
              pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-3 rounded-xl border transition-all ${
                    review.status === "pending"
                      ? "border-secondary/30 bg-secondary/5"
                      : review.status === "approved"
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.reviewer_name}</span>
                      {review.reviewer_company && (
                        <span className="text-xs text-muted-foreground">· {review.reviewer_company}</span>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-secondary text-secondary" : "text-muted-foreground/20"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-3">
                    "{review.review_text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/60">
                      {review.created_at && formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: fr })}
                    </span>
                    {review.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => moderateReview.mutate({ reviewId: review.id, action: "approved" })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => moderateReview.mutate({ reviewId: review.id, action: "rejected" })}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeter
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant={review.status === "approved" ? "success" : "destructive"}
                        className="text-[10px]"
                      >
                        {review.status === "approved" ? "Publié" : "Rejeté"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout: Projects list + Client preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent projects */}
        <Card className="lg:col-span-2 border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
              </div>
              Derniers projets
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
              <Link to="/admin/crm">Voir tout <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {projects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 group border-l-2 border-transparent hover:border-primary/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{project.name?.charAt(0) || "P"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground font-mono">{project.code}</span>
                      <Badge
                        variant={(statusColors[project.status] as "default" | "success" | "warning" | "info" | "muted" | "destructive") || "outline"}
                        className="text-[10px] h-5"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {project.estimated_budget_max ? (
                    <p className="text-sm font-semibold">{project.estimated_budget_max.toLocaleString()}€</p>
                  ) : null}
                  <p className="text-[10px] text-muted-foreground/60">
                    {project.created_at && format(new Date(project.created_at), "dd MMM", { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right: Client preferences / aggregated data */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-secondary" />
              </div>
              Préférences clients
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Agrégation des profils</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Top industries */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Top secteurs d'activité</p>
              {sortedIndustries.length > 0 ? (
                <div className="space-y-2">
                  {sortedIndustries.map(([industry, count], i) => {
                    const pct = profiles.length > 0 ? Math.round((count / profiles.length) * 100) : 0;
                    return (
                      <div key={industry} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                          <span className="truncate text-xs">{industry}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="w-16 h-1.5" />
                          <span className="text-xs font-semibold text-primary w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aucune donnée</p>
              )}
            </div>

            <div className="border-t border-border/30 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Onboarding complété</span>
                <span className="text-sm font-bold">{profiles.length > 0 ? Math.round((onboardedClients / profiles.length) * 100) : 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Projets / client</span>
                <span className="text-sm font-bold">{profiles.length > 0 ? (projects.length / profiles.length).toFixed(1) : "0"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total clients</span>
                <span className="text-sm font-bold text-primary">{profiles.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row — Documents + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents overview */}
        <Card className="lg:col-span-2 border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
              </div>
              Documents récents
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">{documents.length} total</Badge>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "CDC", count: documents.filter((d) => d.type === "cdc").length, color: "bg-primary/10 text-primary" },
                { label: "Propositions", count: documents.filter((d) => d.type === "proposal").length, color: "bg-secondary/10 text-secondary" },
                { label: "Devis", count: documents.filter((d) => d.type === "quote").length, color: "bg-emerald-500/10 text-emerald-600" },
                { label: "Autres", count: documents.filter((d) => !["cdc", "proposal", "quote"].includes(d.type)).length, color: "bg-muted text-muted-foreground" },
              ].map((docType) => (
                <div key={docType.label} className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-2xl font-bold">{docType.count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{docType.label}</p>
                </div>
              ))}
            </div>
            {documents.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Derniers générés</p>
                {documents.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-all">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{doc.type}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {doc.created_at && format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-secondary" />
              </div>
              Activité récente
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Dernières actions</p>
          </CardHeader>
          <CardContent className="space-y-1 p-3 max-h-[350px] overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucune activité.</p>
            ) : (
              recentActivities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-all">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug">{activity.description || activity.action}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {(activity as unknown as ActivityType).profile?.full_name || "Système"} · {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row — Client list + Reviews + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list */}
        <Card className="lg:col-span-2 border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              Clients ({profiles.length})
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Rechercher..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 sticky top-0">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Entreprise</th>
                    <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Secteur</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Inscrit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.slice(0, 15).map((client) => (
                    <tr key={client.id} className="border-t border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{client.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{client.company_name || "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {client.industry && <Badge variant="muted" className="text-[10px]">{client.industry}</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={client.onboarding_completed ? "success" : "warning"} className="text-[10px]">
                          {client.onboarding_completed ? "Actif" : "Onboarding"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {client.created_at && format(new Date(client.created_at), "dd/MM/yy", { locale: fr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClients.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucun client trouvé.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review moderation + Activity feed */}
        <div className="space-y-6">
          {/* Reviews */}
          <Card className="border border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Star className="h-3.5 w-3.5 text-secondary" />
                </div>
                Avis clients
              </CardTitle>
              {pendingReviewCount > 0 && (
                <Badge variant="warning" className="text-[10px]">{pendingReviewCount} en attente</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3 p-3 max-h-[250px] overflow-y-auto">
              {pendingReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Aucun avis.</p>
              ) : (
                pendingReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className={`p-3 rounded-xl border transition-all ${
                      review.status === "pending"
                        ? "border-secondary/30 bg-secondary/5"
                        : review.status === "approved"
                        ? "border-green-200 bg-green-50/50"
                        : "border-red-200 bg-red-50/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs">{review.reviewer_name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-2.5 w-2.5 ${s <= review.rating ? "fill-secondary text-secondary" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 line-clamp-2">"{review.review_text}"</p>
                    {review.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-green-600 hover:bg-green-50" onClick={() => moderateReview.mutate({ reviewId: review.id, action: "approved" })}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approuver
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-red-500 hover:bg-red-50" onClick={() => moderateReview.mutate({ reviewId: review.id, action: "rejected" })}>
                          <XCircle className="h-3 w-3 mr-1" /> Rejeter
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={review.status === "approved" ? "success" : "destructive"} className="text-[10px]">
                        {review.status === "approved" ? "Publié" : "Rejeté"}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card className="border border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                </div>
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 max-h-[200px] overflow-y-auto">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Aucune activité.</p>
              ) : (
                recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-all">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug">{activity.description || activity.action}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {(activity as unknown as ActivityType).profile?.full_name || "Système"} · {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
