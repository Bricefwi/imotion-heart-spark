/**
 * Marketing — Démarrer un nouvel audit (rapatrié de lovelib `ClientNewProject.tsx`).
 *
 * MOCK : la fonction `mkt-validate-company-siret` n'est pas encore migrée.
 * On simule la validation côté client (regex 14 chiffres + stub SIRENE).
 * TODO: supabase.functions.invoke('mkt-validate-company-siret', { body: { siret } })
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompanyData {
  legal_name: string;
  siren: string;
  city: string;
  address: string;
  postal_code: string;
  activity?: string;
}

export default function MarketingNewAudit() {
  const [siret, setSiret] = useState("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleValidateSiret = async () => {
    if (siret.length !== 14) {
      toast({ title: "SIRET invalide", description: "Le SIRET doit contenir 14 chiffres.", variant: "destructive" });
      return;
    }
    setValidating(true);
    // TODO(mkt-validate-company-siret): call edge fn
    setTimeout(() => {
      const mock: CompanyData = {
        legal_name: "Entreprise (démo) " + siret.slice(0, 4),
        siren: siret.slice(0, 9),
        city: "Paris",
        address: "12 rue de la Démo",
        postal_code: "75001",
        activity: "Conseil en stratégie digitale",
      };
      setCompanyData(mock);
      setValidated(true);
      setValidating(false);
      toast({ title: "Entreprise validée", description: `${mock.legal_name} – ${mock.city}` });
    }, 800);
  };

  const handleStart = async () => {
    if (!validated || !companyData) return;
    setSubmitting(true);
    // TODO: créer dans mkt_companies + mkt_audits puis rediriger vers la conversation Marc
    setTimeout(() => {
      toast({ title: "Audit créé (mock)", description: "Migration des fns marketing nécessaire pour finaliser." });
      navigate("/marketing/account/audits");
    }, 600);
  };

  return (
    <>
      <Helmet><title>Nouvel audit – IMOTION Marketing</title></Helmet>
      <main className="container py-12 max-w-2xl">
        <h1 className="text-4xl font-bold mb-3">
          Nouvel <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">audit</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Identifiez votre entreprise pour démarrer l'audit conversationnel avec Marc.
        </p>

        <Card className="p-6 space-y-6">
          <div>
            <Label htmlFor="siret" className="text-base font-semibold mb-2 block">SIRET de l'entreprise</Label>
            <p className="text-sm text-muted-foreground mb-4">14 chiffres pour identifier votre entreprise dans la base SIRENE.</p>
            <div className="flex gap-3">
              <Input
                id="siret"
                value={siret}
                onChange={(e) => setSiret(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678901234"
                maxLength={14}
                disabled={validated}
                className="font-mono"
              />
              <Button onClick={handleValidateSiret} disabled={validating || validated || siret.length !== 14} variant="flame">
                {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {validated ? <><CheckCircle className="mr-2 h-4 w-4" /> Validé</> : "Valider"}
              </Button>
            </div>
          </div>

          {validated && companyData && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg">{companyData.legal_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {companyData.address}, {companyData.postal_code} {companyData.city}
                  </p>
                  {companyData.activity && (
                    <p className="text-sm text-muted-foreground mt-1">Activité : {companyData.activity}</p>
                  )}
                </div>
              </div>
              <Button onClick={handleStart} disabled={submitting} variant="flame" className="w-full mt-4" size="lg">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Démarrer l'audit conversationnel
              </Button>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Audit conversationnel avec IA</p>
              <p className="text-muted-foreground">
                Une fois validée, nos agents IA vous poseront des questions ciblées pour construire
                un diagnostic complet et des recommandations stratégiques personnalisées.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
