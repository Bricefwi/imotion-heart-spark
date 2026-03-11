import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye, MessageSquare, Euro, Clock, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface KanbanProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  current_phase: number | null;
  overall_progress: number | null;
  total_messages: number | null;
  proposal_amount: number | null;
  estimated_budget_max: number | null;
  last_activity_at: string | null;
  priority: string | null;
  client: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
}

interface KanbanColumn {
  status: string;
  label: string;
  color: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { status: "draft", label: "Brouillon", color: "hsl(var(--muted-foreground))" },
  { status: "discovery", label: "Découverte", color: "hsl(var(--secondary))" },
  { status: "review_pending", label: "En revue", color: "hsl(45,100%,50%)" },
  { status: "cdc_ready", label: "CDC prêt", color: "hsl(200,80%,50%)" },
  { status: "proposal", label: "Proposition", color: "hsl(200,80%,50%)" },
  { status: "negotiation", label: "Négociation", color: "hsl(280,60%,55%)" },
  { status: "signed", label: "Signé", color: "hsl(145,63%,42%)" },
  { status: "in_progress", label: "En cours", color: "hsl(200,80%,50%)" },
  { status: "completed", label: "Terminé", color: "hsl(145,63%,42%)" },
];

interface KanbanBoardProps {
  projects: KanbanProject[];
  onClientClick: (id: string) => void;
}

export function KanbanBoard({ projects, onClientClick }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const projectsByStatus = KANBAN_COLUMNS.map((col) => ({
    ...col,
    projects: projects.filter((p) => {
      if (col.status === "discovery") {
        return p.status === "discovery" || p.status === "discovery_active";
      }
      return p.status === col.status;
    }),
  }));

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", projectId);
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedProjectId(null);
    setDropTarget(null);
    dragCounterRef.current = {};
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    dragCounterRef.current[status] = (dragCounterRef.current[status] || 0) + 1;
    setDropTarget(status);
  };

  const handleDragLeave = (_e: React.DragEvent, status: string) => {
    dragCounterRef.current[status] = (dragCounterRef.current[status] || 0) - 1;
    if (dragCounterRef.current[status] <= 0) {
      dragCounterRef.current[status] = 0;
      if (dropTarget === status) setDropTarget(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDropTarget(null);
    dragCounterRef.current = {};

    const projectId = e.dataTransfer.getData("text/plain");
    if (!projectId) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Skip if same status
    const currentStatus = project.status === "discovery_active" ? "discovery" : project.status;
    if (currentStatus === newStatus) {
      setDraggedProjectId(null);
      return;
    }

    // Optimistic update
    queryClient.setQueryData(["crm-projects"], (old: KanbanProject[] | undefined) =>
      old?.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (error) throw error;

      toast.success(`Projet déplacé vers "${KANBAN_COLUMNS.find((c) => c.status === newStatus)?.label}"`);
      queryClient.invalidateQueries({ queryKey: ["crm-projects"] });
    } catch (error: unknown) {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ["crm-projects"] });
      const msg = error instanceof Error ? error.message : "Erreur lors du déplacement";
      toast.error(msg);
    }

    setDraggedProjectId(null);
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-2">
      <div className="flex gap-3 min-w-max px-2">
        {projectsByStatus.map((column) => (
          <div
            key={column.status}
            className={cn(
              "w-[280px] shrink-0 rounded-xl border bg-muted/30 transition-colors",
              dropTarget === column.status && "border-primary/50 bg-primary/5"
            )}
            onDragEnter={(e) => handleDragEnter(e, column.status)}
            onDragLeave={(e) => handleDragLeave(e, column.status)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="font-semibold text-xs">{column.label}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {column.projects.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[120px]">
              {column.projects.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-6 italic">
                  Glissez un projet ici
                </div>
              )}
              {column.projects.map((project) => {
                const client = project.client as Record<string, string | null> | null;
                return (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group",
                      draggedProjectId === project.id && "opacity-50 scale-95"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{project.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{project.code}</p>
                      </div>
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {client?.full_name && (
                      <button
                        className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (client?.id) onClientClick(client.id);
                        }}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="gradient-primary text-primary-foreground text-[8px]">
                            {client.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{client.full_name}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="h-3 w-3" />
                        {project.total_messages || 0}
                      </span>
                      {(project.proposal_amount || project.estimated_budget_max) ? (
                        <span className="flex items-center gap-0.5 font-medium text-foreground">
                          <Euro className="h-3 w-3" />
                          {((project.proposal_amount || project.estimated_budget_max || 0) / 1000).toFixed(0)}k
                        </span>
                      ) : null}
                      {project.last_activity_at && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(project.last_activity_at), { locale: fr })}
                        </span>
                      )}
                    </div>

                    <Progress value={project.overall_progress || 0} className="h-1 mt-2" />

                    <div className="mt-2 flex justify-end">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" asChild>
                        <Link to={`/consultant/projects/${project.id}`}>
                          <Eye className="h-3 w-3 mr-1" /> Voir
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
