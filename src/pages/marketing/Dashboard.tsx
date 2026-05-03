/**
 * Marketing — Dashboard client (rapatrié depuis lovelib).
 *
 * Monté sous /marketing/account. Adapté au schéma Clarivi :
 *   - profiles.id (= auth.uid()), PAS profiles.user_id
 *   - mkt_audits (anciennement pre_audits) avec colonne `created_by` = profiles.id
 *
 * MOCK : tant que la table mkt_audits n'expose pas la jointure companies,
 * on affiche des stats simulées + on retombe sur 0 audit s'il n'y en a pas.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, FileText, Sparkles, Shield, Clock, Activity, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProfileLite {
  full_name: string | null;
  email: string | null;
  company_name?: string | null;
  company_siret?: string | null;
  company_siren?: string | null;
  company_legal_name?: string | null;
  company_website?: string | null;
  trust_score?: number | null;
  free_audits_used?: number | null;
  account_status?: string | null;
  last_audit_at?: string | null;
}

interface AuditLite {
  id: string;
  url?: string | null;
  status: string;
  confidence?: number | null;
  created_at: string;
}

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [audits, setAudits] = useState<AuditLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // ⚠️ Clarivi : profiles.id = auth.uid() (pas user_id)
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name,email,company_name,company_siret,company_siren,company_legal_name,company_website,trust_score,free_audits_used,account_status,last_audit_at")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(prof as ProfileLite);

        const { data: auditsData } = await supabase
          .from("mkt_audits" as any)
          .select("id,url,status,confidence,created_at")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        const list = (auditsData ?? []) as AuditLite[];
        setAudits(list);

        const completed = list.filter((a) => a.status === "consolidated").length;
        const inProgress = list.filter((a) => ["collecting", "ai_running", "consolidating"].includes(a.status)).length;
        setStats({ total: list.length, completed, inProgress });
      } catch (e) {
        console.error("[mkt/Dashboard] fetch error", e);
        toast.error("Erreur lors du chargement du tableau de bord");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <main className="container py-24 text-center">
        <p className="text-muted-foreground">Chargement de votre tableau de bord…</p>
      </main>
    );
  }

  const freeAuditsRemaining = Math.max(0, 3 - (profile?.free_audits_used ?? 0));
  const trustScore = profile?.trust_score ?? 0;
  const trustColor = trustScore >= 80 ? "text-green-600" : trustScore >= 50 ? "text-yellow-600" : "text-destructive";

  return (
    <>
      <SEOHead title="Mon espace marketing – IMOTION" />

      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bonjour{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace marketing IMOTION.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total audits", value: stats.total, color: "text-foreground" },
            { label: "Terminés", value: stats.completed, color: "text-green-600" },
            { label: "En cours", value: stats.inProgress, color: "text-blue-600" },
            { label: "Audits gratuits", value: `${freeAuditsRemaining}/3`, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Votre entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Raison sociale</p>
                  <p className="font-semibold">{profile?.company_legal_name || profile?.company_name || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">SIRET</p>
                    <p className="font-mono text-xs">{profile?.company_siret || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">SIREN</p>
                    <p className="font-mono text-xs">{profile?.company_siren || "—"}</p>
                  </div>
                </div>
                {profile?.company_website && (
                  <div>
                    <p className="text-muted-foreground">Site web</p>
                    <a href={profile.company_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {profile.company_website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-secondary" /> Statut du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Trust Score</p>
                  <p className={`text-2xl font-bold ${trustColor}`}>{trustScore}/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Statut</p>
                  <Badge>{profile?.account_status ?? "actif"}</Badge>
                </div>
                {profile?.last_audit_at && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Dernier audit : {new Date(profile.last_audit_at).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Vos audits récents
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate("/marketing/account/audits")}>
                  Voir tout
                </Button>
              </div>
              <CardDescription>Les 5 derniers audits que vous avez réalisés.</CardDescription>
            </CardHeader>
            <CardContent>
              {audits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">Aucun audit pour le moment</p>
                  <Button onClick={() => navigate("/marketing/account/new-audit")} variant="flame" className="mt-2">
                    <Sparkles className="mr-2 h-4 w-4" /> Lancer mon premier audit
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {audits.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{a.url || "Audit"}</p>
                          <Badge variant={a.status === "consolidated" ? "default" : "secondary"} className="shrink-0">
                            {a.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {a.status === "consolidated" && (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/marketing/account/audit-report/${a.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="flame" className="w-full h-20 text-lg" onClick={() => navigate("/marketing/account/new-audit")}>
                <Sparkles className="mr-2 h-5 w-5" /> Nouvel audit
              </Button>
              <Button variant="outline" className="w-full h-20 text-lg" onClick={() => navigate("/marketing/account/audits")}>
                <FileText className="mr-2 h-5 w-5" /> Mes rapports
              </Button>
              <Button variant="outline" className="w-full h-20 text-lg" onClick={() => navigate("/contact")}>
                <TrendingUp className="mr-2 h-5 w-5" /> Stratégie & conseil
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
