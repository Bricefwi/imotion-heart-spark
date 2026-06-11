import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function AdminOperations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opérations</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoring temps réel des jobs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            En cours de reconstruction
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Les tables <code>jobs</code> / <code>job_events</code> ont été retirées. Cette
            page devient le <strong>Control Tower</strong> branché sur{" "}
            <code>agent_runs</code> et <code>project_events</code> (Lot 3).
          </p>
          <p className="mt-2">
            En attendant, voir <a href="/admin/operations-health" className="underline">Operations Health</a>{" "}
            et <a href="/admin/sync-queue" className="underline">Sync Queue</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
