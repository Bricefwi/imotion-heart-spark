/**
 * Marketing — Liste des audits du client (rapatrié de lovelib).
 * Adapté Clarivi : eq('created_by', user.id) sur mkt_audits.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AuditRow {
  id: string;
  url?: string | null;
  domain?: string | null;
  status: string;
  confidence?: number | null;
  created_at: string;
  ai_tier?: string | null;
}

export default function MarketingClientAudits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("mkt_audits" as any)
          .select("id,url,domain,status,confidence,created_at,ai_tier")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setAudits((data ?? []) as unknown as AuditRow[]);
      } catch (e) {
        console.error(e);
        toast.error("Erreur lors du chargement des audits");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Mes audits – IMOTION Marketing" description="Consultez vos audits marketing IMOTION." />
      <main className="container py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Mes audits</h1>
          <Button variant="flame" onClick={() => navigate("/marketing/account/new-audit")}>
            Nouvel audit
          </Button>
        </div>

        <div className="space-y-4">
          {audits.map((a) => (
            <Card key={a.id} className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{a.domain || a.url || "Entreprise"}</h3>
                    <Badge variant={a.status === "consolidated" ? "default" : "secondary"}>{a.status}</Badge>
                    {typeof a.confidence === "number" && a.confidence > 0 && (
                      <Badge variant="outline">
                        Confiance : {a.confidence > 1 ? Math.round(a.confidence) : Math.round(a.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-all">{a.url}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Créé le {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {a.status === "consolidated" && (
                  <Button variant="outline" size="sm" onClick={() => navigate(`/marketing/account/audit-report/${a.id}`)}>
                    <Eye className="h-4 w-4 mr-2" /> Voir le rapport
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {audits.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Aucun audit pour le moment</p>
              <Button variant="flame" onClick={() => navigate("/marketing/account/new-audit")}>
                Démarrer mon premier audit
              </Button>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
