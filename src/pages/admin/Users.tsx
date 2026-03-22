import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield, Loader2, MoreHorizontal, Phone, Globe, Building2, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SupabaseError } from "@/types/admin";
import { logAuditEvent } from "@/lib/audit-log";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleColors: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  admin: "destructive",
  super_admin: "destructive",
  consultant: "default",
  client: "secondary",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  consultant: "Consultant",
  client: "Client",
};

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: usersWithRoles = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get all roles
      const { data: roles } = await supabase.from("user_roles").select("*");
      const roleMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      // Get project counts
      const { data: projects } = await supabase.from("projects").select("client_id");
      const projectCounts = new Map<string, number>();
      projects?.forEach((p) => {
        projectCounts.set(p.client_id, (projectCounts.get(p.client_id) || 0) + 1);
      });

      return (profiles || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) || ["client"],
        projectCount: projectCounts.get(p.id) || 0,
      }));
    },
    enabled: !!user,
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "consultant" | "client" | "super_admin" });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      logAuditEvent({
        action: "user_role_changed",
        description: `Rôle changé en "${variables.newRole}" pour l'utilisateur ${variables.userId}`,
        userId: user?.id,
        importance: "high",
        metadata: { targetUserId: variables.userId, newRole: variables.newRole },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Rôle mis à jour");
    },
    onError: (error: SupabaseError) => toast.error(error.message),
  });

  const filtered = usersWithRoles.filter((u) => {
    if (roleFilter !== "all" && !u.roles.includes(roleFilter)) return false;
    const searchLower = search.toLowerCase();
    if (search &&
      !(u.full_name || "").toLowerCase().includes(searchLower) &&
      !u.email.toLowerCase().includes(searchLower) &&
      !(u.company_name || "").toLowerCase().includes(searchLower)
    ) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm mt-1">{usersWithRoles.length} utilisateurs au total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Rôle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="consultant">Consultant</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((userItem) => {
            const mainRole = userItem.roles[0] || "client";
            return (
              <Card key={userItem.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <Avatar className="h-11 w-11 shrink-0 mt-0.5">
                        <AvatarFallback className={`text-sm font-bold ${mainRole === "admin" || mainRole === "super_admin" ? "gradient-primary text-white" : mainRole === "consultant" ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
                          {(userItem.full_name || userItem.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{userItem.full_name || "Sans nom"}</p>
                          <Badge variant={roleColors[mainRole] || "secondary"} className="text-[10px]">
                            {mainRole === "admin" && <Shield className="h-2.5 w-2.5 mr-0.5" />}
                            {roleLabels[mainRole] || mainRole}
                          </Badge>
                          {userItem.onboarding_completed ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Onboardé
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                              <Clock className="h-2.5 w-2.5 mr-0.5" /> En cours
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{userItem.email}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {userItem.company_name && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" /> {userItem.company_name}
                              {userItem.company_role && <span className="text-muted-foreground/60">· {userItem.company_role}</span>}
                            </span>
                          )}
                          {userItem.phone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {userItem.phone}
                            </span>
                          )}
                          {userItem.website && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" /> {userItem.website}
                            </span>
                          )}
                          {userItem.industry && (
                            <Badge variant="outline" className="text-[10px]">{userItem.industry}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{userItem.projectCount} projet{userItem.projectCount !== 1 ? "s" : ""}</span>
                          {userItem.last_seen_at && (
                            <span className="text-[10px] text-muted-foreground/60">
                              Vu {formatDistanceToNow(new Date(userItem.last_seen_at), { addSuffix: true, locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => changeRole.mutate({ userId: userItem.id, newRole: "client" })}>
                          Définir Client
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole.mutate({ userId: userItem.id, newRole: "consultant" })}>
                          Définir Consultant
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole.mutate({ userId: userItem.id, newRole: "admin" })}>
                          Définir Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
