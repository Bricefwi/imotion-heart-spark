/**
 * Marketing — Affichage d'un rapport d'audit (rapatrié depuis lovelib).
 *
 * MOCK : la fonction `mkt-audit-html` n'est pas encore migrée.
 * Quand elle le sera, remplacer le mock par :
 *   const r = await fetch(`${VITE_SUPABASE_URL}/functions/v1/mkt-audit-html?report_id=${id}`, { headers })
 *
 * Et `mkt-send-audit-results` pour l'envoi par email.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MOCK_REPORT_HTML = (id: string) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,sans-serif;color:#1f1f1f;max-width:900px;margin:0 auto;padding:48px 32px;line-height:1.6}
  h1{font-size:32px;margin-bottom:8px;color:#D63B1A}
  h2{font-size:22px;margin-top:32px;color:#F08A00;border-bottom:2px solid #F2EDE7;padding-bottom:8px}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;background:#FFE9E1;color:#D63B1A;font-size:12px;font-weight:600}
  .card{border:1px solid #E5E0D8;border-radius:12px;padding:20px;margin:16px 0}
  ul{margin:8px 0 16px 24px}
</style></head><body>
  <span class="badge">APERÇU — STRUCTURE TYPE</span>
  <h1>Structure type d'un rapport d'audit</h1>
  <p style="color:#666">Document fictif à but illustratif. Le rapport réel sera construit à partir de vos données.</p>

  <h2>Synthèse exécutive</h2>
  <div class="card">
    <p>Présentation des axes analysés (SEO technique, performance, conversion, contenu) avec un score qualitatif par axe.</p>
    <ul>
      <li>SEO technique — couverture, indexation, structure.</li>
      <li>Performance — Core Web Vitals, mobile, perçu utilisateur.</li>
      <li>Conversion — clarté du parcours, CTA, friction.</li>
    </ul>
  </div>

  <h2>Scénarios d'amélioration</h2>
  <div class="card"><strong>Ambitieux</strong> — Refonte complète, périmètre large, transformation en profondeur.</div>
  <div class="card"><strong>Raisonné</strong> — Optimisation ciblée du funnel et des conversions.</div>
  <div class="card"><strong>Opportuniste</strong> — Quick wins SEO et CRO à court terme.</div>
  <div class="card"><strong>Mix</strong> — Combinaison étalée selon vos priorités.</div>
  <p style="font-size:13px;color:#666"><em>Les chiffrages et impacts sont systématiquement personnalisés en fonction de votre contexte et présentés dans un devis dédié.</em></p>

  <h2>Plan d'action prioritaire</h2>
  <ol>
    <li>Priorisation des actions à fort impact / faible effort.</li>
    <li>Optimisation des performances mobiles.</li>
    <li>Renforcement des preuves sociales (avis vérifiés, références).</li>
    <li>Simplification du parcours de conversion.</li>
  </ol>

  <p style="margin-top:48px;color:#888;font-size:13px;text-align:center">
    Aperçu généré le ${new Date().toLocaleDateString("fr-FR")} — IMOTION Marketing
  </p>
</body></html>`;

export default function MarketingAuditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    // TODO(mkt-audit-html): remplacer par l'appel à l'edge function migrée.
    const t = setTimeout(() => {
      setHtml(MOCK_REPORT_HTML(id));
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [id]);

  const handleSendEmail = async () => {
    setSending(true);
    // TODO(mkt-send-audit-results): supabase.functions.invoke('mkt-send-audit-results', { body: { reportId: id } })
    setTimeout(() => {
      toast({ title: "Rapport envoyé", description: "L'email part dans la file (mock)." });
      setSending(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted">
      <div className="bg-background border-b h-16 flex items-center justify-between px-6 shadow-sm z-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <div className="font-bold text-lg">Aperçu du rapport</div>
        <Button onClick={handleSendEmail} disabled={sending} variant="flame" className="gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Envoyer au client
        </Button>
      </div>
      <div className="flex-1 overflow-hidden p-4 md:p-8">
        <iframe
          title="Audit Report"
          srcDoc={html || ""}
          className="w-full h-full bg-background shadow-2xl rounded-lg"
          style={{ border: "none", display: "block", margin: "0 auto", maxWidth: 1000 }}
        />
      </div>
    </div>
  );
}
