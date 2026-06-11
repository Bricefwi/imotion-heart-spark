import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionalDocument } from "@/components/ProfessionalDocument";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, RotateCcw } from "lucide-react";

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

// Champs proposés dans le formulaire (label FR + valeurs d'exemple)
const VAR_FIELDS: { key: string; label: string; placeholder: string; type?: string }[] = [
  { key: "client_name", label: "Nom du client", placeholder: "Jean Dupont" },
  { key: "client_company", label: "Société cliente", placeholder: "Acme SARL" },
  { key: "client_email", label: "Email client", placeholder: "jean@acme.fr", type: "email" },
  { key: "project_name", label: "Nom du projet", placeholder: "Plateforme E-commerce IA" },
  { key: "project_code", label: "Code projet", placeholder: "IM-2603-4789" },
  { key: "project_description", label: "Description projet", placeholder: "Refonte plateforme…" },
  { key: "date", label: "Date", placeholder: "12 juin 2026" },
  { key: "consultant_name", label: "Consultant", placeholder: "Marc Delaunay" },
  { key: "amount", label: "Montant", placeholder: "24 500 €" },
  { key: "duration", label: "Durée", placeholder: "12 semaines" },
  { key: "document_name", label: "Nom document", placeholder: "Cahier des Charges" },
  { key: "document_url", label: "URL document", placeholder: "https://app.imotion-conseils.fr/…" },
];

const DEFAULT_VARS: Record<string, string> = {
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

function interpolate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export default function TemplatesPreview() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [vars, setVars] = useState<Record<string, string>>(DEFAULT_VARS);

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
  const rendered = useMemo(
    () => (current ? interpolate(current.content, vars) : ""),
    [current, vars]
  );

  // Détecte les variables réellement utilisées dans le template courant
  const usedKeys = useMemo(() => {
    if (!current) return new Set<string>();
    const re = /\{\{\s*(\w+)\s*\}\}/g;
    const set = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(current.content)) !== null) set.add(m[1]);
    return set;
  }, [current]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-[1600px]">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Prévisualisation des templates</h1>
        <p className="text-sm text-muted-foreground">
          Saisis les variables — le rendu se met à jour en temps réel avant génération PDF.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_300px_1fr] gap-4">
        {/* Sidebar templates */}
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

        {/* Formulaire variables */}
        <Card className="p-4 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Variables</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVars(DEFAULT_VARS)}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Réinit.
            </Button>
          </div>
          <div className="space-y-3">
            {VAR_FIELDS.map((f) => {
              const isUsed = usedKeys.has(f.key);
              return (
                <div key={f.key} className="space-y-1">
                  <Label
                    htmlFor={`var-${f.key}`}
                    className={`text-xs flex items-center gap-1.5 ${
                      isUsed ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {f.label}
                    {isUsed && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" title="Utilisé dans ce template" />
                    )}
                  </Label>
                  <Input
                    id={`var-${f.key}`}
                    type={f.type ?? "text"}
                    value={vars[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setVars((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    maxLength={500}
                    className="h-8 text-sm"
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            Le point coloré indique les variables présentes dans le template sélectionné.
          </p>
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
                  {rendered}
                </pre>
              </Card>
            ) : (
              <ProfessionalDocument
                content={rendered}
                documentName={TYPE_LABELS[current.type] ?? current.name}
                projectName={vars.project_name}
                projectCode={vars.project_code}
                clientName={vars.client_name}
                clientCompany={vars.client_company}
                date={vars.date}
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
  );
}
