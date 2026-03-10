import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { FolderKanban, MessageSquare, Clock, Euro, TrendingUp, ArrowRight, CircleDot } from "lucide-react";

const stats = [
  { label: "Projets actifs", value: "12", icon: FolderKanban, change: "+2" },
  { label: "En conversation", value: "5", icon: MessageSquare, change: "" },
  { label: "À valider", value: "3", icon: Clock, change: "" },
  { label: "Pipeline", value: "45 000 €", icon: Euro, change: "+15%" },
  { label: "Taux conversion", value: "68%", icon: TrendingUp, change: "+5%" },
];

const priorityProjects = [
  { id: "1", name: "Refonte E-commerce Luxe", client: "Marie Dupont", phase: 5, progress: 72, priority: "urgent", budget: "15-25k€" },
  { id: "2", name: "App mobile RH", client: "Thomas Martin", phase: 3, progress: 40, priority: "high", budget: "8-12k€" },
  { id: "3", name: "Dashboard Analytics", client: "Sophie Bernard", phase: 2, progress: 20, priority: "medium", budget: "5-8k€" },
];

const priorityColors: Record<string, string> = {
  urgent: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export default function ConsultantDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard Consultant</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                {stat.change && <span className="text-[11px] text-green-600 font-medium">{stat.change}</span>}
              </div>
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority projects */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-base">Projets prioritaires</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/consultant/projects">Voir tous <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/consultant/projects/${project.id}`} className="font-medium text-sm truncate hover:text-primary transition-colors">
                      {project.name}
                    </Link>
                    <Badge variant={priorityColors[project.priority] as any} className="text-[10px] shrink-0">
                      {project.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{project.client}</span>
                    <span>Phase {project.phase}/7</span>
                    <span>{project.budget}</span>
                  </div>
                  <Progress value={project.progress} className="h-1 mt-2" />
                </div>
                <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Link to={`/consultant/projects/${project.id}`}><ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="font-display text-base">Activité temps réel</CardTitle>
              <CircleDot className="h-3 w-3 text-green-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { text: "Marie Dupont a répondu à la phase 5", time: "Il y a 5 min", type: "message" },
              { text: "Nouveau projet créé par Thomas Martin", time: "Il y a 23 min", type: "project" },
              { text: "CDC validé pour App mobile RH", time: "Il y a 1h", type: "document" },
              { text: "Sophie Bernard a démarré la conversation", time: "Il y a 2h", type: "message" },
              { text: "Contrat signé - Projet CRM Industrie", time: "Il y a 4h", type: "success" },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                  activity.type === "success" ? "bg-green-500" : activity.type === "message" ? "bg-primary" : "bg-secondary"
                }`} />
                <div>
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
