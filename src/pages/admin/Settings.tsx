import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Brain, CreditCard, Bell } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Configuration du système</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="h-3.5 w-3.5 mr-1" /> Entreprise</TabsTrigger>
          <TabsTrigger value="ai"><Brain className="h-3.5 w-3.5 mr-1" /> IA</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-3.5 w-3.5 mr-1" /> Tarification</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Informations entreprise</CardTitle>
              <CardDescription>Configurer les informations de votre entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom commercial</Label><Input defaultValue="IMOTION Conseil" /></div>
                <div className="space-y-2"><Label>Raison sociale</Label><Input defaultValue="IMOTION Conseil SARL" /></div>
                <div className="space-y-2"><Label>Email de contact</Label><Input defaultValue="contact@imotion.fr" /></div>
                <div className="space-y-2"><Label>Site web</Label><Input defaultValue="https://imotion.fr" /></div>
              </div>
              <Button className="gradient-primary border-0">Sauvegarder</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Configuration IA</CardTitle>
              <CardDescription>Paramètres du moteur d'IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Modèle</Label><Input defaultValue="google/gemini-3-flash-preview" /></div>
                <div className="space-y-2"><Label>Max tokens</Label><Input type="number" defaultValue="4096" /></div>
                <div className="space-y-2"><Label>Température</Label><Input type="number" step="0.1" defaultValue="0.7" /></div>
              </div>
              <Button className="gradient-primary border-0">Sauvegarder</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Tarification</CardTitle>
              <CardDescription>Gérer les plans et tarifs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Découverte", price: "Gratuit" },
                { name: "Standard", price: "500 €" },
                { name: "Premium", price: "Sur devis" },
              ].map((plan) => (
                <div key={plan.name} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.price}</p>
                  </div>
                  <Button variant="outline" size="sm">Modifier</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Notifications</CardTitle>
              <CardDescription>Configurer les canaux de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Notifications email", desc: "Envoyer des emails pour les événements importants" },
                { label: "Notifications push", desc: "Notifications push dans le navigateur" },
                { label: "Notifications SMS", desc: "Alertes SMS pour les actions urgentes" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
