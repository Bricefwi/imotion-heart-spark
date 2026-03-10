import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, FileText, Download, MessageSquare, Send, Star, Phone, Mail } from "lucide-react";

const phaseLabels = ["Accueil", "Besoin", "Vision", "Écosystème", "Contraintes", "Décision", "Validation"];

export default function ConsultantProjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("conversation");

  // Demo data
  const project = {
    name: "Refonte E-commerce Luxe",
    code: "IM-2603-0042",
    status: "discovery_active",
    currentPhase: 5,
    overallProgress: 72,
    priority: "urgent",
    qualificationScore: 4,
    client: { name: "Marie Dupont", company: "TechVision", email: "marie@techvision.fr", phone: "+33 6 12 34 56 78" },
    budget: { min: 15000, max: 25000 },
    tags: ["e-commerce", "luxe", "refonte"],
  };

  const messages = [
    { role: "assistant", content: "Parlons maintenant de votre écosystème technique. Quels outils utilisez-vous actuellement ?", time: "14:30" },
    { role: "user", content: "Nous utilisons Shopify actuellement, avec Mailchimp pour les emails et un CRM maison.", time: "14:32" },
    { role: "assistant", content: "Intéressant ! Et souhaitez-vous conserver certains de ces outils ou tout migrer ?", time: "14:33" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/consultant/projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-bold">{project.name}</h1>
            <Badge variant="destructive" className="text-[10px]">{project.priority}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{project.code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1" /> Générer CDC</Button>
          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Exporter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="synthesis">Synthèse</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.role !== "user" && (
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="gradient-primary text-[10px] font-bold text-white">IA</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-xl px-4 py-2.5 text-sm max-w-[75%] ${
                        msg.role === "user" ? "gradient-primary text-white" : "bg-muted"
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>{msg.time}</div>
                      </div>
                    </div>
                  ))}
                  {/* Consultant intervention */}
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Intervenir dans la conversation</p>
                    <div className="flex gap-2">
                      <Textarea placeholder="Votre message en tant que consultant..." className="resize-none" rows={2} />
                      <Button size="icon" className="gradient-primary border-0 shrink-0 self-end"><Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="synthesis">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold mb-4">Synthèse du projet</h3>
                  <div className="space-y-4">
                    {phaseLabels.map((phase, i) => (
                      <div key={phase} className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i + 1 < project.currentPhase ? "gradient-primary text-white" :
                          i + 1 === project.currentPhase ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{phase}</p>
                          <p className="text-xs text-muted-foreground">
                            {i + 1 < project.currentPhase ? "Complété" : i + 1 === project.currentPhase ? "En cours" : "À venir"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Aucun document pour le moment.</CardContent></Card>
            </TabsContent>
            <TabsContent value="notes">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Textarea placeholder="Notes internes sur ce projet..." rows={6} />
                  <Button className="mt-3 gradient-primary border-0" size="sm">Sauvegarder</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Historique à venir.</CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="gradient-primary text-white text-sm font-bold">
                    {project.client.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{project.client.name}</p>
                  <p className="text-xs text-muted-foreground">{project.client.company}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {project.client.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {project.client.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <span className="font-display text-3xl font-bold gradient-text">{project.overallProgress}%</span>
              </div>
              <Progress value={project.overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Phase {project.currentPhase}/7</p>
            </CardContent>
          </Card>

          {/* Qualification */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Qualification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < project.qualificationScore ? "fill-secondary text-secondary" : "text-muted"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Budget : {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} €</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-sm">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs"><FileText className="h-3.5 w-3.5 mr-2" />Générer CDC</Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs"><FileText className="h-3.5 w-3.5 mr-2" />Générer Devis</Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs"><Mail className="h-3.5 w-3.5 mr-2" />Relancer client</Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs"><Download className="h-3.5 w-3.5 mr-2" />Exporter</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
