import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ConsultantLeads() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">Prospects qualifiés par l'IA</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            En cours de reconstruction
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            La vue <code>jobs_admin_view</code> a été retirée. Cette page sera réécrite
            sur <code>projects</code> + scoring IA (Lot 5).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
