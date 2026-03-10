import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, PenLine } from "lucide-react";

const demoDocuments = [
  { id: "1", name: "Cahier des charges - Refonte E-commerce", type: "cdc", status: "review", version: 2, updatedAt: "12 mars 2026", requiresSignature: false },
  { id: "2", name: "Proposition commerciale v1", type: "proposal", status: "sent", version: 1, updatedAt: "10 mars 2026", requiresSignature: true },
  { id: "3", name: "Contrat de prestation", type: "contract", status: "draft", version: 1, updatedAt: "8 mars 2026", requiresSignature: true },
];

const typeLabels: Record<string, string> = { cdc: "CDC", proposal: "Devis", contract: "Contrat" };
const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "outline" },
  review: { label: "En révision", variant: "secondary" },
  sent: { label: "Envoyé", variant: "default" },
  signed: { label: "Signé", variant: "default" },
};

export default function ClientDocuments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">Tous vos documents projets</p>
      </div>

      <div className="grid gap-4">
        {demoDocuments.map((doc) => {
          const status = statusLabels[doc.status] || statusLabels.draft;
          return (
            <Card key={doc.id} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{doc.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{typeLabels[doc.type] || doc.type}</Badge>
                      <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                      <span className="text-xs text-muted-foreground">v{doc.version} · {doc.updatedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  {doc.requiresSignature && (
                    <Button size="sm" className="gradient-primary border-0">
                      <PenLine className="h-3.5 w-3.5 mr-1" /> Signer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
