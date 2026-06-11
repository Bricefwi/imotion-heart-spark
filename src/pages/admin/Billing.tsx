import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function AdminBilling() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivi des coûts IA et abonnements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            En cours de reconstruction
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Les tables <code>agencies</code>, <code>agency_subscriptions</code> et{" "}
            <code>jobs</code> ont été retirées lors du nettoyage Paperclip. Cette page
            sera réécrite sur <code>agent_runs.cost_eur</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
