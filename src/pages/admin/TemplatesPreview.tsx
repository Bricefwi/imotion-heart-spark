import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionalDocument } from "@/components/ProfessionalDocument";
import { EmailPreview } from "@/components/EmailPreview";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

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

// Schémas zod par clé — appliqués uniquement si la variable est utilisée dans le template
const VAR_SCHEMAS: Record<string, z.ZodString> = {
  client_name: z.string().trim().min(2, "Nom trop court").max(100),
  client_company: z.string().trim().min(2, "Société requise").max(150),
  client_email: z.string().trim().email("Email invalide").max(255),
  project_name: z.string().trim().min(3, "Nom de projet trop court").max(150),
  project_code: z
    .string()
    .trim()
    .regex(/^[A-Z]{2,5}-\d{3,4}-\d{3,5}$/, "Format attendu : IM-2603-4789"),
  project_description: z.string().trim().min(10, "Description trop courte").max(1000),
  date: z
    .string()
    .trim()
    .min(6, "Date requise")
    .regex(/\d/, "La date doit contenir un chiffre"),
  consultant_name: z.string().trim().min(2).max(100),
  amount: z
    .string()
    .trim()
    .regex(/^[\d\s.,]+\s?[€$]?$/, "Format attendu : 24 500 €"),
  duration: z.string().trim().min(2).max(50),
  document_name: z.string().trim().min(2).max(150),
  document_url: z.string().trim().url("URL invalide").max(500),
};

interface ValidationIssue {
  key: string;
  label: string;
  message: string;
  type: "missing" | "format";
}

function validateVars(
  usedKeys: Set<string>,
  vars: Record<string, string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const f of VAR_FIELDS) {
    if (!usedKeys.has(f.key)) continue;
    const value = vars[f.key] ?? "";
    if (!value.trim()) {
      issues.push({ key: f.key, label: f.label, message: "Champ obligatoire", type: "missing" });
      continue;
    }
    const schema = VAR_SCHEMAS[f.key];
    if (schema) {
      const res = schema.safeParse(value);
      if (!res.success) {
        issues.push({
          key: f.key,
          label: f.label,
          message: res.error.issues[0]?.message ?? "Format invalide",
          type: "format",
        });
      }
    }
  }
  return issues;
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

  const issues = useMemo(() => validateVars(usedKeys, vars), [usedKeys, vars]);
  const issueByKey = useMemo(() => {
    const map = new Map<string, ValidationIssue>();
    issues.forEach((i) => map.set(i.key, i));
    return map;
  }, [issues]);
  const missingCount = issues.filter((i) => i.type === "missing").length;
  const formatCount = issues.filter((i) => i.type === "format").length;
  const isValid = issues.length === 0;

  // Bloque l'export PDF si la validation échoue (capture phase intercepte avant ProfessionalDocument)
  const handleExportCapture = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest?.("[data-pdf-export]")) return;
    if (!isValid) {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Impossible de générer le PDF", {
        description: `${issues.length} variable(s) à corriger avant l'export.`,
      });
    }
  };

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
              const issue = issueByKey.get(f.key);
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
                      <span className="text-destructive font-semibold" aria-label="obligatoire">
                        *
                      </span>
                    )}
                    {isUsed && !issue && vars[f.key]?.trim() && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
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
                    aria-invalid={!!issue}
                    className={`h-8 text-sm ${
                      issue ? "border-destructive focus-visible:ring-destructive/30" : ""
                    }`}
                  />
                  {issue && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {issue.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            <span className="text-destructive font-semibold">*</span> variables obligatoires dans ce template.
          </p>
        </Card>

        {/* Preview */}
        <section onClickCapture={handleExportCapture}>
          {current && usedKeys.size > 0 && (
            <Alert
              variant={isValid ? "default" : "destructive"}
              className={`mb-4 ${isValid ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20" : ""}`}
            >
              {isValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle className={isValid ? "text-emerald-800 dark:text-emerald-300" : ""}>
                {isValid
                  ? "Toutes les variables sont valides — prêt pour l'export PDF"
                  : `${issues.length} variable(s) à corriger avant l'export PDF`}
              </AlertTitle>
              {!isValid && (
                <AlertDescription>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {issues.map((i) => (
                      <li key={i.key}>
                        <strong>{i.label}</strong>{" "}
                        <span className="opacity-80">— {i.message}</span>
                      </li>
                    ))}
                  </ul>
                  {(missingCount > 0 || formatCount > 0) && (
                    <p className="mt-2 text-[11px] opacity-80">
                      {missingCount} manquante(s) · {formatCount} format invalide
                    </p>
                  )}
                </AlertDescription>
              )}
            </Alert>
          )}
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
              <div className={!isValid ? "[&_[data-pdf-export]]:opacity-50" : ""}>
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
              </div>
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
