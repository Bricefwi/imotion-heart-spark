import { Outlet, Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LayoutDashboard, Users, Settings, Plug, ScrollText, LogOut, Shield, FileText, BookOpen, Radar, BarChart3, Globe, ExternalLink, ChevronRight, Home, Bell, Check, CheckCheck, Inbox, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

function useUnreadNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-unread-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

function useRecentNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-recent-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

const isInternalUrl = (url: string) => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
};

function NotificationDropdown({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useRecentNotifications();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-unread-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-unread-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-notifications"] });
      toast.success("Toutes les notifications marquees comme lues");
    },
  });

  const typeStyles: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-600",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    error: "bg-destructive/10 text-destructive",
    document: "bg-primary/10 text-primary",
    project: "bg-secondary/10 text-secondary",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead.mutate(notif.id);
                    if (notif.link && isInternalUrl(notif.link)) {
                      setOpen(false);
                      window.location.href = notif.link;
                    }
                  }}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${typeStyles[notif.type] || "bg-muted text-muted-foreground"}`}>
                    {notif.type === "info" ? "i" : notif.type === "success" ? "ok" : notif.type === "warning" ? "!" : notif.type?.charAt(0)?.toUpperCase() || "N"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${!notif.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      {notif.created_at
                        ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

const adminNav = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Tower Control", url: "/admin/crm", icon: Radar },
  { title: "Analytiques", url: "/admin/analytics", icon: BarChart3 },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Blog", url: "/admin/blog", icon: BookOpen },
  { title: "Templates", url: "/admin/templates", icon: FileText },
  { title: "Paramètres", url: "/admin/settings", icon: Settings },
  { title: "Intégrations", url: "/admin/integrations", icon: Plug },
  { title: "Logs", url: "/admin/logs", icon: ScrollText },
];

const adminQuickNav = [
  { title: "Dashboard", url: "/admin/dashboard" },
  { title: "CRM", url: "/admin/crm" },
  { title: "Analytics", url: "/admin/analytics" },
  { title: "Users", url: "/admin/users" },
  { title: "Blog", url: "/admin/blog" },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotifications();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4">
        <Logo size="sm" showText={!collapsed} />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-wider">
            {!collapsed && <><Shield className="inline h-3 w-3 mr-1" />Administration</>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                      activeClassName="bg-primary/15 text-sidebar-primary font-semibold shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))] !text-sidebar-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick links */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <Globe className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Voir le site</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/client/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <ExternalLink className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Espace client</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {profile?.full_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-xs text-sidebar-foreground/50">Administrateur</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground/60">
          <LogOut className="h-4 w-4 mr-2" /> {!collapsed && "Déconnexion"}
        </Button>
      </div>
    </Sidebar>
  );
}

// Mapping des routes vers les libellés de breadcrumb
const breadcrumbLabels: Record<string, string> = {
  "admin": "Admin",
  "dashboard": "Dashboard",
  "crm": "CRM",
  "analytics": "Analytiques",
  "users": "Utilisateurs",
  "blog": "Blog",
  "templates": "Templates",
  "settings": "Paramètres",
  "integrations": "Intégrations",
  "logs": "Logs",
  "projects": "Projets",
};

function BreadcrumbNavigation() {
  const location = useLocation();

  // Parse le pathname, skip the "admin" prefix (already shown as fixed Home link)
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const subSegments = pathSegments.slice(1); // Remove "admin"

  // Build breadcrumb items from sub-segments only
  const breadcrumbItems = subSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 2).join("/");
    const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === subSegments.length - 1;
    return { label, path, isLast };
  });

  // If no sub-segments (just /admin), show Dashboard
  if (breadcrumbItems.length === 0) {
    breadcrumbItems.push({
      label: "Dashboard",
      path: "/admin/dashboard",
      isLast: true,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={item.path}>
            {item.isLast ? (
              <BreadcrumbPage className="font-medium text-foreground">
                {item.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link to={item.path}>{item.label}</Link>
                </BreadcrumbLink>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadNotifications();
  const { theme, setTheme } = useTheme();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-4 border-b px-4 bg-background">
            <SidebarTrigger />

            {/* Breadcrumb contextuel */}
            <div className="hidden sm:flex items-center">
              <BreadcrumbNavigation />
            </div>

            {/* Quick nav - visible uniquement sur mobile/tablette */}
            <div className="flex sm:hidden items-center gap-1 overflow-x-auto flex-1">
              {adminQuickNav.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-all duration-200"
                  activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                >
                  {item.title}
                </NavLink>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Basculer le theme</span>
              </Button>
              <NotificationDropdown unreadCount={unreadCount} />
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-2 rounded-lg border-primary/20 text-primary hover:bg-primary/10 hover:text-primary">
                <Link to="/">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Retour au site</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

