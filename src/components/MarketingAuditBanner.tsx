import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Radar, Sparkles, X, Plus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "marketing_audit_banner_dismissed";

interface OrphanAudit {
  id: string;
  company_name: string | null;
  website_url: string | null;
  score: number | null;
  summary: string | null;
  recommendations: any;
  user_id: string;
  created_at: string;
}

export function MarketingAuditBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === "1"
  );
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Audits complétés sans liaison projet
  const { data: orphans = [] } = useQuery({
    queryKey: ["client-orphan-audits", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: allAudits, error } = await supabase
        .from("marketing_audits")
        .select("id, company_name, website_url, score, summary, recommendations, user_id, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) return [];
      if (!allAudits || allAudits.length === 0) return [];

      const auditIds = allAudits.map((a) => a.id);
      const { data: links } = await supabase
        .from("audit_to_project_links")
        .select("audit_id")
        .in("audit_id", auditIds);
      const linkedIds = new Set((links || []).map((l) => l.audit_id));
      return allAudits.filter((a) => !linkedIds.has(a.id)) as OrphanAudit[];
    },
    enabled: !!user?.id,
  });

  // Projets existants du client
  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects-for-audit", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code, status")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  const audit = useMemo(() => orphans[0], [orphans]);

  const linkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!audit) throw new Error("No audit");
      const { data, error } = await supabase.rpc("merge_marketing_into_project", {
        _project_id: projectId,
        _audit_payload: {
          external_id: audit.id,
          company_name: audit.company_name,
          website_url: audit.website_url,
          score: audit.score,
          summary: audit.summary,
          recommendations: audit.recommendations,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Audit rattaché à votre projet");
      queryClient.invalidateQueries({ queryKey: ["client-orphan-audits"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error("Échec du rattachement", { description: err.message });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!audit || !user) throw new Error("No audit");
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          client_id: user.id,
          name: audit.company_name
            ? `Projet ${audit.company_name}`
            : "Mon nouveau projet",
          status: "draft",
          discovery_data: {
            marketing_audit: {
              audit_id: audit.id,
              score: audit.score,
              summary: audit.summary,
              recommendations: audit.recommendations,
              source: "client_self_conversion",
              received_at: new Date().toISOString(),
            },
          },
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("audit_to_project_links").insert({
        audit_id: audit.id,
        project_id: project.id,
        linked_by: user.id,
        note: "Auto-création depuis bandeau dashboard client",
      });
      return project;
    },
    onSuccess: (project) => {
      toast.success("Projet créé avec votre audit");
      queryClient.invalidateQueries({ queryKey: ["client-orphan-audits"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      setOpen(false);
      navigate(`/client/projects/${project.id}/conversation`);
    },
    onError: (err: any) => {
      toast.error("Échec de la création", { description: err.message });
    },
  });

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (dismissed || !audit) return null;

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 mb-4">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="rounded-full bg-gradient-to-br from-primary to-secondary p-2 shrink-0">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">
                Votre audit marketing est prêt
                {audit.company_name ? ` pour ${audit.company_name}` : ""}
              </h3>
              {audit.score != null && (
                <Badge variant="secondary">Score : {audit.score}/100</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {audit.summary || "On a retrouvé un audit que vous avez réalisé sur imotion-conseils.fr. Récupérez-le pour démarrer un projet structuré."}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button
                size="sm"
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Transformer en projet
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Plus tard
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleDismiss}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Récupérer votre audit marketing</DialogTitle>
            <DialogDescription>
              Choisissez de l'attacher à un projet existant ou d'en créer un nouveau.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {projects.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Projet existant
                </label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un projet…" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code ? `[${p.code}] ` : ""}{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {projects.length > 0 && (
              <Button
                variant="outline"
                disabled={!selectedProjectId || linkMutation.isPending}
                onClick={() => linkMutation.mutate(selectedProjectId)}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Lier au projet
              </Button>
            )}
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="bg-gradient-to-r from-primary to-secondary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un nouveau projet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
