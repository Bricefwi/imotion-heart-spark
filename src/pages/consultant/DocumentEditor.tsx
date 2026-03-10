import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Save, FileText, Loader2, RefreshCw, Check, ChevronDown, ChevronUp, Eye, Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ProfessionalDocument } from "@/components/ProfessionalDocument";

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
  rawHeader: string;
}

function parseMarkdownSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  let contentLines: string[] = [];

  const flush = () => {
    if (current) {
      current.content = contentLines.join("\n").trim();
      sections.push(current);
    }
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      flush();
      const level = match[1].length;
      const title = match[2].replace(/[*_`]/g, "").trim();
      const id = title.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ]+/gi, "-").replace(/-+$/, "");
      current = { id, title, level, content: "", rawHeader: line };
      contentLines = [];
    } else {
      contentLines.push(line);
    }
  }
  flush();

  return sections;
}

function sectionsToMarkdown(sections: Section[]): string {
  return sections.map((s) => `${s.rawHeader}\n\n${s.content}`).join("\n\n");
}

export default function ConsultantDocumentEditor() {
  const { id: documentId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  const { data: document, isLoading: docLoading } = useQuery({
    queryKey: ["consultant-document", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });

  const { data: project } = useQuery({
    queryKey: ["project-for-doc-edit", document?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:profiles!projects_client_id_fkey(full_name, company_name)")
        .eq("id", document!.project_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!document?.project_id,
  });

  // Parse sections from document content on first load
  if (document && !sectionsLoaded) {
    const parsed = parseMarkdownSections(document.description || "");
    if (parsed.length > 0) {
      setSections(parsed);
    }
    setSectionsLoaded(true);
  }

  const toggleCollapse = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startEdit = (section: Section) => {
    setEditingSection(section.id);
    setEditBuffer(section.content);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditBuffer("");
  };

  const applyEdit = () => {
    if (!editingSection) return;
    setSections((prev) =>
      prev.map((s) => (s.id === editingSection ? { ...s, content: editBuffer } : s))
    );
    setEditingSection(null);
    setEditBuffer("");
    toast.success("Section modifiée");
  };

  const regenerateSection = useCallback(async (section: Section) => {
    if (!document || !project) return;
    setRegeneratingSection(section.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          projectId: document.project_id,
          type: document.type,
          regenerateSection: section.title,
          sectionContext: section.content,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la régénération");
      }

      const result = await response.json();
      const newContent = result.content || "";

      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, content: newContent } : s))
      );
      toast.success(`Section "${section.title}" régénérée`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la régénération");
    } finally {
      setRegeneratingSection(null);
    }
  }, [document, project]);

  const saveDocument = useCallback(async () => {
    if (!document || sections.length === 0) return;
    setSaving(true);

    try {
      const fullContent = sectionsToMarkdown(sections);
      const { error } = await supabase
        .from("documents")
        .update({
          description: fullContent,
          version: (document.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["consultant-document", documentId] });
      queryClient.invalidateQueries({ queryKey: ["project-documents"] });
      toast.success("Document sauvegardé");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }, [document, sections, documentId, queryClient]);

  if (docLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Document introuvable</p>
      </div>
    );
  }

  const client = project?.client as any;
  const fullMarkdown = sectionsToMarkdown(sections);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/consultant/projects/${document.project_id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold truncate">{document.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{document.type}</Badge>
              <Badge variant="secondary" className="text-[10px]">v{document.version}</Badge>
              <span className="text-xs text-muted-foreground">
                {sections.length} section{sections.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <Pencil className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            {previewMode ? "Editer" : "Apercu"}
          </Button>
          <Button
            size="sm"
            className="gradient-primary border-0"
            onClick={saveDocument}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {previewMode ? (
        <ProfessionalDocument
          content={fullMarkdown}
          documentName={document.name}
          projectName={project?.name}
          projectCode={project?.code || undefined}
          clientName={client?.full_name}
          clientCompany={client?.company_name}
          version={document.version || 1}
          date={document.created_at ? format(new Date(document.created_at), "dd MMMM yyyy", { locale: fr }) : undefined}
          status={document.status || "draft"}
        />
      ) : (
        <div className="space-y-3">
          {sections.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Ce document ne contient pas de sections structurées (titres Markdown).
                </p>
              </CardContent>
            </Card>
          ) : (
            sections.map((section) => {
              const isEditing = editingSection === section.id;
              const isRegenerating = regeneratingSection === section.id;
              const isCollapsed = collapsedSections.has(section.id);

              return (
                <Card
                  key={section.id}
                  className={`border shadow-sm transition-all ${
                    isEditing ? "ring-2 ring-primary/30 border-primary/20" : "border-border"
                  }`}
                >
                  {/* Section header */}
                  <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => !isEditing && toggleCollapse(section.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{
                            background: section.level === 1
                              ? "linear-gradient(135deg, hsl(0 68% 51%), hsl(30 100% 49%))"
                              : section.level === 2
                              ? "hsl(30 100% 49%)"
                              : "hsl(0 0% 60%)",
                          }}
                        >
                          H{section.level}
                        </div>
                        <CardTitle className="text-sm font-semibold truncate">
                          {section.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => regenerateSection(section)}
                          disabled={isRegenerating || isEditing}
                          title="Regenerer cette section avec l'IA"
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                        {isEditing ? (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={cancelEdit}>
                              Annuler
                            </Button>
                            <Button size="sm" className="h-7 px-2 text-xs gradient-primary border-0" onClick={applyEdit}>
                              <Check className="h-3 w-3 mr-1" /> Valider
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => startEdit(section)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {!isEditing && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleCollapse(section.id)}>
                            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Section content */}
                  {!isCollapsed && (
                    <CardContent className="pt-0 px-4 pb-4">
                      {isEditing ? (
                        <Textarea
                          value={editBuffer}
                          onChange={(e) => setEditBuffer(e.target.value)}
                          rows={Math.min(25, Math.max(6, editBuffer.split("\n").length + 2))}
                          className="font-mono text-xs leading-relaxed resize-y"
                          placeholder="Contenu Markdown de la section..."
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                          {section.content.length > 800
                            ? section.content.substring(0, 800) + "..."
                            : section.content || "(Section vide)"}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
