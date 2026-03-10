import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { FolderKanban, FileText, Euro, MessageSquare, Clock, ArrowRight, Plus } from "lucide-react";

const phaseLabels = ["Accueil", "Besoin", "Vision", "Écosystème", "Contraintes", "Décision", "Validation"];

export default function ClientDashboard() {
  const { profile } = useAuth();

  // Demo data - will be replaced with real queries
  const stats = {
    activeProjects: 2,
    pendingSignatures: 1,
    totalBudget: 15000,
  };

  const currentProject = {
    id: "demo",
    name: "Refonte site e-commerce",
    code: "IM-2603-0042",
    currentPhase: 3,
    overallProgress: 35,
    status: "discovery_active",
    lastActivity: "Il y a 2 heures",
    newMessages: 3,
  };

  const recentActivities = [
    { action: "Message IA reçu", time: "Il y a 2h", icon: MessageSquare },
    { action: "Document CDC généré", time: "Hier", icon: FileText },
    { action: "Nouveau projet créé", time: "Il y a 3 jours", icon: FolderKanban },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Bonjour {profile?.full_name?.split(" ")[0] || "!"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Voici un aperçu de vos projets.</p>
        </div>
        <Button asChild className="gradient-primary border-0">
          <Link to="/client/projects/new"><Plus className="mr-2 h-4 w-4" /> Nouveau projet</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Projets actifs", value: stats.activeProjects, icon: FolderKanban, color: "text-primary" },
          { label: "Documents à signer", value: stats.pendingSignatures, icon: FileText, color: "text-secondary", badge: stats.pendingSignatures > 0 },
          { label: "Budget total estimé", value: `${stats.totalBudget.toLocaleString("fr-FR")} €`, icon: Euro, color: "text-muted-foreground" },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  {stat.badge && <Badge variant="destructive" className="text-[10px] px-1.5">Action requise</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current project */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className="gradient-primary border-0 text-[11px]">En cours</Badge>
                <span className="text-xs text-muted-foreground">{currentProject.code}</span>
              </div>
              <CardTitle className="font-display text-xl">{currentProject.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phase progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Phase {currentProject.currentPhase}/7 : {phaseLabels[currentProject.currentPhase - 1]}</span>
                  <span className="text-muted-foreground">{currentProject.overallProgress}%</span>
                </div>
                <Progress value={currentProject.overallProgress} className="h-2" />
              </div>
              {/* Phase dots */}
              <div className="flex gap-1.5">
                {phaseLabels.map((label, i) => (
                  <div
                    key={label}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i + 1 < currentProject.currentPhase
                        ? "gradient-primary"
                        : i + 1 === currentProject.currentPhase
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                    title={label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {currentProject.lastActivity}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {currentProject.newMessages} nouveaux messages</span>
              </div>
            </CardContent>
            <CardFooter className="gap-3 pt-0">
              <Button asChild className="gradient-primary border-0">
                <Link to={`/client/projects/${currentProject.id}/conversation`}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Continuer la conversation
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/client/documents"><FileText className="mr-2 h-4 w-4" /> Voir les documents</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <activity.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
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
