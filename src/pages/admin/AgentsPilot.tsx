import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function AdminAgentsPilot() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pilotage agents IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Modèle, prompt, kill-switch par agent
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            En cours de reconstruction
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Cette page est en cours de migration vers la nouvelle couche d'orchestration
            (tables <code>agent_config</code>, <code>agent_runs</code>, <code>project_events</code>).
          </p>
          <p>Sera réactivée au Lot 4 de la refonte.</p>
        </CardContent>
      </Card>
    </div>
  );
}
