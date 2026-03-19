import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Brain, CreditCard, Bell, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SupabaseError } from "@/types/admin";
import { logAuditEvent } from "@/lib/audit-log";

export default function AdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      const map: Record<string, Record<string, unknown>> = {};
      data?.forEach((s) => { map[s.key] = (typeof s.value === 'object' && s.value !== null && !Array.isArray(s.value)) ? s.value as Record<string, unknown> : {}; });
      return map;
    },
    enabled: !!user,
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | boolean | number | Record<string, unknown> }) => {
      const { error } = await supabase
        .from("settings")
        .update({ value, updated_by: user!.id })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      logAuditEvent({
        action: "settings_changed",
        description: `Paramètre "${variables.key}" modifié`,
        userId: user?.id,
        importance: "high",
        metadata: { key: variables.key },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Paramètre sauvegardé");
    },
    onError: (error: SupabaseError) => toast.error(error.message),
  });

  // Local state for forms
  const [company, setCompany] = useState<Record<string, unknown>>({});
  const [aiConfig, setAiConfig] = useState<Record<string, unknown>>({});
  const [pricing, setPricing] = useState<Record<string, unknown>>({});
  const [notifConfig, setNotifConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (settings.company) setCompany(settings.company);
    if (settings.ai_config) setAiConfig(settings.ai_config);
    if (settings.pricing) setPricing(settings.pricing);
    if (settings.notifications) setNotifConfig(settings.notifications);
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                <div className="space-y-2">
                  <Label>Nom commercial</Label>
                  <Input value={company.name || ""} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Raison sociale</Label>
                  <Input value={company.legal_name || ""} onChange={(e) => setCompany({ ...company, legal_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input value={company.siret || ""} onChange={(e) => setCompany({ ...company, siret: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>N° TVA</Label>
                  <Input value={company.tva || ""} onChange={(e) => setCompany({ ...company, tva: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input value={company.contact?.email || ""} onChange={(e) => setCompany({ ...company, contact: { ...company.contact, email: e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>Site web</Label>
                  <Input value={company.contact?.website || ""} onChange={(e) => setCompany({ ...company, contact: { ...company.contact, website: e.target.value } })} />
                </div>
              </div>
              <Button
                className="gradient-primary border-0"
                onClick={() => updateSetting.mutate({ key: "company", value: company })}
                disabled={updateSetting.isPending}
              >
                <Save className="h-4 w-4 mr-2" /> Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Configuration IA</CardTitle>
              <CardDescription>Paramètres du moteur d'intelligence artificielle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  <Input value={aiConfig.model || ""} onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Max tokens</Label>
                  <Input type="number" value={aiConfig.max_tokens || ""} onChange={(e) => setAiConfig({ ...aiConfig, max_tokens: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Température</Label>
                  <Input type="number" step="0.1" min="0" max="2" value={aiConfig.temperature ?? ""} onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })} />
                </div>
              </div>
              <Button
                className="gradient-primary border-0"
                onClick={() => updateSetting.mutate({ key: "ai_config", value: aiConfig })}
                disabled={updateSetting.isPending}
              >
                <Save className="h-4 w-4 mr-2" /> Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Tarification</CardTitle>
              <CardDescription>Paramètres de facturation par défaut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taux horaire (€)</Label>
                  <Input type="number" value={pricing.hourly_rate || ""} onChange={(e) => setPricing({ ...pricing, hourly_rate: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Input value={pricing.currency || ""} onChange={(e) => setPricing({ ...pricing, currency: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Délai de paiement (jours)</Label>
                  <Input type="number" value={pricing.payment_terms || ""} onChange={(e) => setPricing({ ...pricing, payment_terms: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Acompte (%)</Label>
                  <Input type="number" value={pricing.deposit_percentage || ""} onChange={(e) => setPricing({ ...pricing, deposit_percentage: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>TVA (%)</Label>
                  <Input type="number" value={pricing.tax_rate || ""} onChange={(e) => setPricing({ ...pricing, tax_rate: parseInt(e.target.value) })} />
                </div>
              </div>
              <Button
                className="gradient-primary border-0"
                onClick={() => updateSetting.mutate({ key: "pricing", value: pricing })}
                disabled={updateSetting.isPending}
              >
                <Save className="h-4 w-4 mr-2" /> Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-lg">Notifications</CardTitle>
              <CardDescription>Configurer les paramètres de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">Digest quotidien</p>
                  <p className="text-xs text-muted-foreground">Envoyer un récapitulatif quotidien aux consultants</p>
                </div>
                <Switch
                  checked={notifConfig.daily_digest_enabled || false}
                  onCheckedChange={(v) => setNotifConfig({ ...notifConfig, daily_digest_enabled: v })}
                />
              </div>
              <div className="space-y-2">
                <Label>Alerte inactivité (jours)</Label>
                <Input
                  type="number"
                  value={notifConfig.inactivity_alert_days || ""}
                  onChange={(e) => setNotifConfig({ ...notifConfig, inactivity_alert_days: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure du digest</Label>
                <Input
                  type="time"
                  value={notifConfig.daily_digest_time || "09:00"}
                  onChange={(e) => setNotifConfig({ ...notifConfig, daily_digest_time: e.target.value })}
                />
              </div>
              <Button
                className="gradient-primary border-0"
                onClick={() => updateSetting.mutate({ key: "notifications", value: notifConfig })}
                disabled={updateSetting.isPending}
              >
                <Save className="h-4 w-4 mr-2" /> Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
