import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionalDocument } from "@/components/ProfessionalDocument";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface Template {
  id: string;
  name: string;
  slug: string;
  type: string;
  content: string;
}

const TYPE_LABELS: Record<string, string> = {
  cdc: "Cahier des Charges",
  proposal: "Proposition Commerciale",
  contract: "Contrat",
  pv_reception: "PV de Réception",
  tech_recommendation: "Reco Technique & Prompt",
  pricing: "Devis / Tarification",
  email: "Email",
  system_prompt: "System Prompt IA",
};

const SAMPLE_VARS: Record<string, string> = {
  client_name: "Jean Dupont",
  client_company: "Acme SARL",
  client_email: "jean.dupont@acme.fr",
  project_name: "Plateforme E-commerce IA",
  project_code: "IM-2603-4789",
  project_description: "Refonte complète de la plateforme avec assistant IA intégré",
  date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
  consultant_name: "Marc Delaunay",
  amount: "24 500 €",
  duration: "12 semaines",
  document_name: "Cahier des Charges",
  document_url: "https://app.imotion-conseils.fr/client/documents/xxx",
};

function interpolate(content: string): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`);
}

export default function TemplatesPreview() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, slug, type, content")
        .eq("is_active", true)
        .order("type");
      if (!error && data) {
        setTemplates(data);
        if (data.length > 0) setSelected(data[0].id);
      }
      setLoading(false);
    })();
  }, []);

  const current = templates.find((t) => t.id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Prévisualisation des templates — Clarivi Admin</title>
      </Helmet>
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Prévisualisation des templates</h1>
          <p className="text-sm text-muted-foreground">
            Rendu final de chaque template professionnel avec le nouveau logo, avant génération PDF.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <Card className="p-3 h-fit lg:sticky lg:top-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              Templates ({templates.length})
            </h2>
            <nav className="flex flex-col gap-1 mt-1">
              {templates.map((t) => {
                const isActive = t.id === selected;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={`flex items-start gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{TYPE_LABELS[t.type] ?? t.type}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{t.name}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Preview */}
          <section>
            {current ? (
              current.type === "email" || current.type === "system_prompt" ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <h2 className="text-lg font-semibold">{current.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Type : {TYPE_LABELS[current.type]} · Slug : {current.slug}
                      </p>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/40 p-4 rounded-md max-h-[70vh] overflow-auto">
                    {interpolate(current.content)}
                  </pre>
                </Card>
              ) : (
                <ProfessionalDocument
                  content={interpolate(current.content)}
                  documentName={TYPE_LABELS[current.type] ?? current.name}
                  projectName={SAMPLE_VARS.project_name}
                  projectCode={SAMPLE_VARS.project_code}
                  clientName={SAMPLE_VARS.client_name}
                  clientCompany={SAMPLE_VARS.client_company}
                  date={SAMPLE_VARS.date}
                  status="draft"
                />
              )
            ) : (
              <Card className="p-12 text-center text-muted-foreground">
                Aucun template sélectionné
              </Card>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
