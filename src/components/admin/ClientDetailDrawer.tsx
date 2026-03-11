import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail, Phone, Building2, Globe, Calendar, MessageSquare,
  FileText, FolderKanban, Activity, Target, Clock, Euro,
  TrendingUp, User, Star, BarChart3,
} from "lucide-react";

interface ClientDetailDrawerProps {
  profileId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function computeScore(profile: any, projects: any[], messages: any[]): number {
  let score = 0;
  if (profile?.company_name) score += 10;
  if (profile?.phone) score += 5;
  if (profile?.website) score += 5;
  if (profile?.industry) score += 5;
  if (profile?.onboarding_completed) score += 15;
  score += Math.min(projects.length * 10, 30);
  const signed = projects.filter((p: any) => ["signed", "completed", "delivered"].includes(p.status));
  score += signed.length * 10;
  score += Math.min(messages.length, 20);
  return Math.min(score, 100);
}

export function ClientDetailDrawer({ profileId, open, onOpenChange }: ClientDetailDrawerProps) {
  const { data: profile } = useQuery({
    queryKey: ["client-detail", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", profileId).single();
      return data;
    },
    enabled: !!profileId && open,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase.from("projects").select("*").eq("client_id", profileId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profileId && open,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["client-messages-count", profileId],
    queryFn: async () => {
      if (!profileId || projects.length === 0) return [];
      const projectIds = projects.map((p: any) => p.id);
      const { data } = await supabase.from("messages").select("id, created_at, role, project_id").in("project_id", projectIds).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!profileId && open && projects.length > 0,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["client-documents", profileId],
    queryFn: async () => {
      if (!profileId || projects.length === 0) return [];
      const projectIds = projects.map((p: any) => p.id);
      const { data } = await supabase.from("documents").select("*").in("project_id", projectIds).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profileId && open && projects.length > 0,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["client-activities", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase.from("activities").select("*").eq("user_id", profileId).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!profileId && open,
  });

  if (!profile) return null;

  const score = computeScore(profile, projects, messages);
  const totalBudget = projects.reduce((s: number, p: any) => s + (p.contract_amount || p.proposal_amount || p.estimated_budget_max || 0), 0);
  const activeProjects = projects.filter((p: any) => !["archived", "lost", "cancelled"].includes(p.status));
  const daysSinceLastSeen = profile.last_seen_at
    ? Math.floor((Date.now() - new Date(profile.last_seen_at).getTime()) / 86400000)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">
                {profile.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-xl">{profile.full_name || "Sans nom"}</SheetTitle>
              {profile.company_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" /> {profile.company_name}
                  {profile.company_role && <span className="opacity-60">· {profile.company_role}</span>}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "outline"} className={score >= 70 ? "gradient-primary border-0" : ""}>
                  <Star className="h-3 w-3 mr-1" /> Score: {score}/100
                </Badge>
                {daysSinceLastSeen !== null && daysSinceLastSeen > 14 && (
                  <Badge variant="destructive" className="text-[10px]">Inactif {daysSinceLastSeen}j</Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{profile.phone}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {profile.industry && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{profile.industry}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>Inscrit {profile.created_at ? format(new Date(profile.created_at), "dd MMM yyyy", { locale: fr }) : "—"}</span>
          </div>
          {profile.last_seen_at && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Vu {formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true, locale: fr })}</span>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{projects.length}</p>
              <p className="text-[10px] text-muted-foreground">Projets</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{messages.length}</p>
              <p className="text-[10px] text-muted-foreground">Messages</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{documents.length}</p>
              <p className="text-[10px] text-muted-foreground">Docs</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{totalBudget > 0 ? `${(totalBudget / 1000).toFixed(0)}k` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">Budget €</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="mb-4" />

        <Tabs defaultValue="projects" className="space-y-3">
          <TabsList className="w-full">
            <TabsTrigger value="projects" className="flex-1 text-xs">Projets</TabsTrigger>
            <TabsTrigger value="documents" className="flex-1 text-xs">Documents</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1 text-xs">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun projet.</p>
            ) : (
              projects.map((project: any) => (
                <Card key={project.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{project.code}</span>
                          <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Phase {project.current_phase || 1}/7
                        </div>
                        <Progress value={project.overall_progress || 0} className="h-1 w-20 mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun document.</p>
            ) : (
              documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} · {doc.status || "brouillon"}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yy", { locale: fr }) : ""}
                  </span>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune activité enregistrée.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-border" />
                {activities.map((act: any) => (
                  <div key={act.id} className="flex gap-3 relative pb-4">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">{act.description || act.action}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {act.created_at ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: fr }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
