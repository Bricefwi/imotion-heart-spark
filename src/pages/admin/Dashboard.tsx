import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, FolderKanban, FileText, Euro, TrendingUp, Activity,
  MessageSquare, Clock, Star, CheckCircle2, XCircle, Eye,
  Search, Filter, ArrowRight,
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
      const { data } = await supabase.from("documents").select("id, doc_type, created_at").limit(1000);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["admin-pending-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("client_reviews" as string)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as Array<{
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
      const { error } = await supabase
        .from("client_reviews" as string)
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
  const cdcGenerated = documents.filter(d => d.doc_type === "cdc").length;
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

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Administration</h1>
            <p className="text-white/60 mt-2 text-sm max-w-md">Vue d'ensemble et pilotage de la plateforme.</p>
          </div>
          {pendingReviewCount > 0 && (
            <Badge className="bg-secondary text-secondary-foreground text-sm px-3 py-1.5">
              {pendingReviewCount} avis en attente
            </Badge>
          )}
        </div>
      </div>

      {/* KPIs grid — 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard label="Utilisateurs" value={profiles.length} icon={Users} />
        <StatsCard label="Projets actifs" value={activeProjects.length} icon={FolderKanban} />
        <StatsCard label="CDC générés" value={cdcGenerated} icon={FileText} />
        <StatsCard label="Pipeline" value={totalPipeline > 0 ? `${(totalPipeline / 1000).toFixed(0)}k€` : "0€"} icon={Euro} />
        <StatsCard label="Taux conversion" value={`${conversionRate}%`} icon={TrendingUp} />
        <StatsCard label="Onboardés" value={`${onboardedClients}/${profiles.length}`} icon={CheckCircle2} />
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

      {/* Bottom row — Projects + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-3 bg-gradient-to-r from-muted/40 to-transparent">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
              </div>
              Projets récents
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/consultant/projects">Voir tous</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {projects.slice(0, 5).map((project, i) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
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
                <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-2">
                  {project.created_at && formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}
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
          <CardContent className="space-y-1 p-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune activité.</p>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-200"
                >
                  <div className="relative mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{activity.description || activity.action}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      <span className="font-medium text-muted-foreground/80">{(activity as unknown as ActivityType).profile?.full_name || "Système"}</span>
                      {" · "}
                      {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
