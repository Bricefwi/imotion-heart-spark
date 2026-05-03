import { Outlet, Link, useLocation } from "react-router-dom";
import { CrossAppSwitcher } from "@/components/cross-app/CrossAppSwitcher";
import { CrossAppOriginBanner } from "@/components/cross-app/CrossAppOriginBanner";
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
import { LayoutDashboard, Users, Settings, Plug, ScrollText, LogOut, Shield, FileText, BookOpen, Radar, BarChart3, Globe, ExternalLink, ChevronRight, Home, Bell, Check, CheckCheck, Inbox, Sun, Moon, RefreshCw, Activity, Target } from "lucide-react";
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
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    error: "bg-destructive/10 text-destructive",
    document: "bg-primary/10 text-primary",
    project: "bg-secondary/10 text-secondary",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-[var(--radius-md)] text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-glow animate-pulse-dot">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-[var(--radius-lg)] shadow-xl border-border/50" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
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
            <div className="divide-y divide-border/40">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/50 cursor-pointer ${
                    !notif.is_read ? "bg-primary/[0.03]" : ""
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
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse-dot" />
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/50 mt-1">
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

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badge?: "NEW" | "AI" | "SOON";
}

interface SidebarGroupDef {
  label: string;
  items: NavItem[];
}

const sidebarGroups: SidebarGroupDef[] = [
  {
    label: "Modules Principaux",
    items: [
      { title: "Vue d'ensemble", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Tower Control", url: "/admin/crm", icon: Radar, badge: "NEW" },
      { title: "Marketing Leads", url: "/admin/marketing-leads", icon: Inbox, badge: "NEW" },
      { title: "Vue Marketing", url: "/marketing/dashboard", icon: Target, badge: "NEW" },
      { title: "Analytiques", url: "/admin/analytics", icon: BarChart3, badge: "NEW" },
    ],
  },
  {
    label: "Croissance",
    items: [
      { title: "Utilisateurs", url: "/admin/users", icon: Users },
      { title: "Blog", url: "/admin/blog", icon: BookOpen },
      { title: "Templates", url: "/admin/templates", icon: FileText },
    ],
  },
  {
    label: "Outils IA",
    items: [
      { title: "Diagnostics", url: "/admin/logs", icon: ScrollText, badge: "AI" },
    ],
  },
  {
    label: "Système",
    items: [
      { title: "Paramètres", url: "/admin/settings", icon: Settings },
      { title: "Intégrations", url: "/admin/integrations", icon: Plug },
      { title: "Sync Queue", url: "/admin/sync-queue", icon: RefreshCw },
      { title: "Santé opérations", url: "/admin/operations-health", icon: Activity, badge: "NEW" },
      { title: "Actions programmées", url: "/admin/scheduled-actions", icon: Activity },
      { title: "Bridge Secret", url: "/admin/bridge-secret", icon: Shield },
      { title: "Debug SSO", url: "/admin/sso-debug", icon: ScrollText },
    ],
  },
];

const badgeStyles: Record<string, string> = {
  NEW: "bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full",
  AI: "bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
  SOON: "bg-muted text-muted-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-full",
};

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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      {/* Logo Flux — suit text-sidebar-foreground via tone=auto */}
      <div className="px-4 py-5 text-sidebar-foreground">
        <Logo size="md" showText={!collapsed} markOnly={collapsed} />
      </div>

      <SidebarContent className="px-2">
        {sidebarGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/30 uppercase text-[10px] tracking-[0.1em] px-3 mb-1">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
                        activeClassName="!bg-[hsl(var(--sidebar-primary)/0.12)] !text-[hsl(var(--sidebar-primary))] font-semibold shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]"
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && (
                          <span className="flex items-center gap-2 flex-1 text-[13px]">
                            {item.title}
                            {item.badge && (
                              <span className={badgeStyles[item.badge]}>{item.badge}</span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Navigation links */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/30 uppercase text-[10px] tracking-[0.1em] px-3 mb-1">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200">
                    <Globe className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="text-[13px]">Voir le site</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/client/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200">
                    <ExternalLink className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="text-[13px]">Espace client</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20 ring-offset-2 ring-offset-sidebar">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-semibold">
                  {profile?.full_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-[11px] text-sidebar-foreground/40">Administrateur</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-primary/50/10 rounded-[var(--radius-md)] transition-all duration-200">
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
  "sync-queue": "Sync Queue",
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
      <BreadcrumbList className="text-[13px]">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors duration-150">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator className="text-muted-foreground/30" />}
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={item.path}>
            {item.isLast ? (
              <BreadcrumbPage className="font-medium text-foreground">
                {item.label}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link to={item.path} className="text-muted-foreground/60 hover:text-foreground transition-colors duration-150">{item.label}</Link>
                </BreadcrumbLink>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator className="text-muted-foreground/30" />}
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
          {/* Premium Header — 64px, backdrop-blur on scroll */}
          <header className="h-16 flex items-center gap-4 border-b border-border/40 px-5 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-200">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

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
                  className="whitespace-nowrap rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-all duration-200"
                  activeClassName="bg-primary/10 text-primary font-semibold"
                >
                  {item.title}
                </NavLink>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <CrossAppSwitcher current="build" size="compact" className="hidden md:inline-flex" />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-[var(--radius-md)] text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Basculer le theme</span>
              </Button>
              <NotificationDropdown unreadCount={unreadCount} />
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-2 rounded-[var(--radius-md)] border-primary/15 text-primary hover:bg-primary/8 hover:text-primary hover:border-primary/25 transition-all duration-200">
                <Link to="/">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Retour au site</span>
                </Link>
              </Button>
            </div>
          </header>
          <CrossAppOriginBanner />

          {/* Main content with page transition */}
          <main className="flex-1 p-6 bg-muted/20">
            <div className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
