import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plug, Webhook, Mail, MessageSquare, CreditCard, BarChart3,
  Calendar, Database, Lock, ExternalLink, CheckCircle2,
} from "lucide-react";

const integrations = [
  {
    name: "Supabase",
    description: "Base de données, authentification et stockage fichiers",
    icon: Database,
    status: "connected" as const,
    category: "Infrastructure",
  },
  {
    name: "Stripe",
    description: "Paiements en ligne, abonnements et facturation automatique",
    icon: CreditCard,
    status: "planned" as const,
    category: "Paiement",
  },
  {
    name: "Resend",
    description: "Envoi d'emails transactionnels et newsletters",
    icon: Mail,
    status: "connected" as const,
    category: "Communication",
  },
  {
    name: "Slack",
    description: "Notifications en temps réel et alertes équipe",
    icon: MessageSquare,
    status: "planned" as const,
    category: "Communication",
  },
  {
    name: "Webhooks",
    description: "Endpoints personnalisés pour intégrations tierces",
    icon: Webhook,
    status: "planned" as const,
    category: "API",
  },
  {
    name: "Google Analytics",
    description: "Suivi du trafic et comportement utilisateur",
    icon: BarChart3,
    status: "planned" as const,
    category: "Analytics",
  },
  {
    name: "Calendly",
    description: "Prise de rendez-vous automatisée avec les clients",
    icon: Calendar,
    status: "planned" as const,
    category: "Productivité",
  },
  {
    name: "OAuth Google",
    description: "Connexion sociale avec compte Google",
    icon: Lock,
    status: "connected" as const,
    category: "Authentification",
  },
];

const statusConfig = {
  connected: { label: "Connecté", variant: "success" as const, icon: CheckCircle2 },
  planned: { label: "Bientôt", variant: "outline" as const, icon: Plug },
};

export default function AdminIntegrations() {
  const connected = integrations.filter(i => i.status === "connected");
  const planned = integrations.filter(i => i.status === "planned");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Intégrations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connectez vos outils pour automatiser votre workflow
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {connected.length} active{connected.length > 1 ? "s" : ""} / {integrations.length} total
        </Badge>
      </div>

      {/* Connected */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Actives</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connected.map((integration) => {
            const cfg = statusConfig[integration.status];
            return (
              <Card key={integration.name} className="border border-emerald-200/50 bg-emerald-50/30 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <integration.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <Badge variant={cfg.variant} className="text-[10px]">
                      <cfg.icon className="h-2.5 w-2.5 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{integration.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{integration.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-[10px]">{integration.category}</Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      Configurer <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Planned */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Prochainement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planned.map((integration) => {
            const cfg = statusConfig[integration.status];
            return (
              <Card key={integration.name} className="border-0 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      <integration.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge variant={cfg.variant} className="text-[10px]">
                      {cfg.label}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{integration.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{integration.description}</p>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-[10px]">{integration.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
