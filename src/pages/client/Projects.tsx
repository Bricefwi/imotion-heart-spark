import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, Clock } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  discovery_active: { label: "En découverte", variant: "default" },
  discovery_completed: { label: "Découverte terminée", variant: "secondary" },
  cdc_ready: { label: "CDC prêt", variant: "secondary" },
  proposal_sent: { label: "Proposition envoyée", variant: "default" },
  signed: { label: "Signé", variant: "default" },
};

const demoProjects = [
  { id: "1", name: "Refonte site e-commerce", code: "IM-2603-0042", status: "discovery_active", currentPhase: 3, overallProgress: 35, updatedAt: "Il y a 2h" },
  { id: "2", name: "Application mobile RH", code: "IM-2603-0018", status: "cdc_ready", currentPhase: 7, overallProgress: 100, updatedAt: "Il y a 3 jours" },
  { id: "3", name: "Dashboard analytics", code: "IM-2602-0099", status: "draft", currentPhase: 1, overallProgress: 0, updatedAt: "Il y a 1 semaine" },
];

export default function ClientProjects() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground text-sm mt-1">{demoProjects.length} projets</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/client/projects/new"><Plus className="mr-2 h-4 w-4" /> Nouveau projet</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {demoProjects.map((project) => {
          const status = statusLabels[project.status] || statusLabels.draft;
          return (
            <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display font-semibold text-lg">{project.name}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{project.code}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {project.updatedAt}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={project.overallProgress} className="h-1.5 flex-1 max-w-xs" />
                      <span className="text-xs text-muted-foreground">Phase {project.currentPhase}/7</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/client/projects/${project.id}/conversation`}>
                      Ouvrir <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
