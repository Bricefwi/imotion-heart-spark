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
import { motion, AnimatePresence, Reorder } from "framer-motion";

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

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
  dragging: { scale: 1.05, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)", zIndex: 50 },
};

const columnVariants = {
  initial: { opacity: 0, y: 10 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

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
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDropTarget(null);
    dragCounterRef.current = {};
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

    const currentStatus = project.status === "discovery_active" ? "discovery" : project.status;
    if (currentStatus === newStatus) {
      setDraggedProjectId(null);
      return;
    }

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
      queryClient.invalidateQueries({ queryKey: ["crm-projects"] });
      const msg = error instanceof Error ? error.message : "Erreur lors du déplacement";
      toast.error(msg);
    }

    setDraggedProjectId(null);
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-2">
      <div className="flex gap-3 min-w-max px-2">
        {projectsByStatus.map((column, colIndex) => (
          <motion.div
            key={column.status}
            custom={colIndex}
            variants={columnVariants}
            initial="initial"
            animate="animate"
            className={cn(
              "w-[280px] shrink-0 rounded-xl border bg-muted/30 transition-colors duration-200",
              dropTarget === column.status && "border-primary/50 bg-primary/5 ring-2 ring-primary/10"
            )}
            onDragEnter={(e) => handleDragEnter(e as unknown as React.DragEvent, column.status)}
            onDragLeave={(e) => handleDragLeave(e as unknown as React.DragEvent, column.status)}
            onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent)}
            onDrop={(e) => handleDrop(e as unknown as React.DragEvent, column.status)}
          >
            {/* Column header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                  animate={dropTarget === column.status ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
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
                <motion.div
                  className="text-[11px] text-muted-foreground text-center py-6 italic"
                  animate={dropTarget === column.status ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  Glissez un projet ici
                </motion.div>
              )}
              <AnimatePresence mode="popLayout">
                {column.projects.map((project, cardIndex) => {
                  const client = project.client as Record<string, string | null> | null;
                  const isDragging = draggedProjectId === project.id;
                  return (
                    <motion.div
                      key={project.id}
                      layout
                      layoutId={project.id}
                      variants={cardVariants}
                      initial="initial"
                      animate={isDragging ? "dragging" : "animate"}
                      exit="exit"
                      transition={{
                        layout: { type: "spring", stiffness: 300, damping: 30 },
                        delay: cardIndex * 0.03,
                        duration: 0.25,
                      }}
                      whileHover={{ y: -2, boxShadow: "0 8px 25px -8px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, project.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm group",
                        isDragging && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs truncate">{project.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{project.code}</p>
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        </motion.div>
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
