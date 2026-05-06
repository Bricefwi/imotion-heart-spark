import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Euro, MessageSquare, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Audit {
  id: string;
  prospect_name: string | null;
  prospect_email: string | null;
  status: string;
  lead_grade: string | null;
  quality_score: number | null;
  llm_cost_eur: number | null;
  discovery_data: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  current_phase: number;
}

interface AuditMessage {
  id: string;
  role: string;
  content: string;
  agent_name: string | null;
  phase: number | null;
  created_at: string;
}

interface AuditDocument {
  id: string;
  doc_type: string;
  content_md: string;
  quality_score: number | null;
  created_at: string;
}

const GRADE_STYLES: Record<string, React.CSSProperties> = {
  A: { background: "hsl(var(--imo-coral-100))", color: "hsl(var(--imo-coral-700))" },
  B: { background: "hsl(var(--imo-amber-100))", color: "hsl(var(--imo-amber-700))" },
  C: { background: "hsl(var(--imo-ink-100))",   color: "hsl(var(--imo-ink-600))"   },
  D: { background: "hsl(var(--imo-danger-500) / 0.12)", color: "hsl(var(--imo-danger-500))" },
};

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [messages, setMessages] = useState<AuditMessage[]>([]);
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const sb = supabase as any;
    Promise.all([
      sb.from("audits").select("*").eq("id", id).single(),
      sb.from("audit_messages").select("*").eq("audit_id", id).in("role", ["user", "assistant"]).order("created_at"),
      sb.from("audit_documents").select("*").eq("audit_id", id).order("created_at"),
    ]).then(([auditRes, msgRes, docRes]) => {
      if (auditRes.data) setAudit(auditRes.data as Audit);
      setMessages((msgRes.data ?? []) as AuditMessage[]);
      setDocuments((docRes.data ?? []) as AuditDocument[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">Audit introuvable.</p>
        <Button asChild className="mt-4">
          <Link to="/app/audits">Retour aux audits</Link>
        </Button>
      </div>
    );
  }

  const cdc = documents.find((d) => d.doc_type === "cdc");
  const quote = documents.find((d) => d.doc_type === "quote");

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/app/audits">
            <ArrowLeft className="size-4 mr-1" /> Retour
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            {audit.prospect_name ?? audit.prospect_email ?? "Prospect anonyme"}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {new Date(audit.started_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {audit.lead_grade && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                style={GRADE_STYLES[audit.lead_grade] ?? {}}
              >
                Lead {audit.lead_grade}
              </span>
            )}
            <Badge variant={audit.status === "completed" ? "default" : "secondary"} className="text-xs">
              {audit.status === "completed" ? "Complété"
                : audit.status === "in_progress" ? "En cours"
                : "Abandonné"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {audit.quality_score && <span>Score : <strong>{audit.quality_score}/100</strong></span>}
          {audit.llm_cost_eur && <span>Coût LLM : <strong>{Number(audit.llm_cost_eur).toFixed(2)} €</strong></span>}
        </div>
      </div>

      <Tabs defaultValue={cdc ? "cdc" : "conversation"}>
        <TabsList>
          <TabsTrigger value="cdc" className="gap-1.5">
            <FileText className="size-3.5" /> CDC
          </TabsTrigger>
          <TabsTrigger value="quote" className="gap-1.5">
            <Euro className="size-3.5" /> Devis
          </TabsTrigger>
          <TabsTrigger value="conversation" className="gap-1.5">
            <MessageSquare className="size-3.5" /> Conversation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cdc">
          {cdc ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Cahier des charges</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" /> Exporter PDF
                </Button>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{cdc.content_md}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                {audit.status === "completed"
                  ? "CDC non disponible pour cet audit."
                  : "L'audit doit être complété pour générer le CDC."}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quote">
          {quote ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Devis estimatif</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" /> Exporter PDF
                </Button>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{quote.content_md}</ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                {audit.status === "completed"
                  ? "Devis non disponible pour cet audit."
                  : "L'audit doit être complété pour générer le devis."}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conversation">
          <Card>
            <CardContent className="pt-6 space-y-3 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">Aucun message.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.agent_name && msg.role === "assistant" && (
                        <div className="text-xs opacity-60 mb-1">{msg.agent_name}</div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
