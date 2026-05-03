import { Outlet, Link, useLocation } from "react-router-dom";
import { CrossAppSwitcher } from "@/components/cross-app/CrossAppSwitcher";
import { CrossAppOriginBanner } from "@/components/cross-app/CrossAppOriginBanner";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, FolderKanban, FileText, User,
  LogOut, Home, Shield, MessageSquare, Sparkles, Download, Target
} from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const clientNav = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { title: "Vue 360°", url: "/client/360", icon: Sparkles },
  { title: "Projets", url: "/client/projects", icon: FolderKanban },
  { title: "Documents", url: "/client/documents", icon: FileText },
  { title: "Mes audits", url: "/client/audits", icon: Sparkles },
  { title: "Espace marketing", url: "/marketing/dashboard", icon: Target },
  { title: "Audit lovelib", url: "/client/lovelib-audit", icon: Download },
  { title: "Profil", url: "/client/profile", icon: User },
];

function ClientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, roles, signOut } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <Link to="/" className="block px-4 py-5 text-sidebar-foreground" aria-label="Accueil">
        <Logo size="md" showText={!collapsed} markOnly={collapsed} />
      </Link>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {clientNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
                      activeClassName="!bg-[hsl(var(--sidebar-primary)/0.12)] !text-[hsl(var(--sidebar-primary))] font-semibold shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="mx-3 my-2 bg-sidebar-border/40" />}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
                    activeClassName="!bg-[hsl(var(--sidebar-primary)/0.12)] !text-[hsl(var(--sidebar-primary))] font-semibold"
                  >
                    <Home className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="text-[13px]">Site public</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
                      activeClassName="!bg-[hsl(var(--sidebar-primary)/0.12)] !text-[hsl(var(--sidebar-primary))] font-semibold"
                    >
                      <Shield className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-[13px]">Administration</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User section */}
      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20 ring-offset-2 ring-offset-sidebar">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Utilisateur"}
              </p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate">
                {profile?.email}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/50 hover:text-destructive hover:bg-primary/50/10 rounded-[var(--radius-md)] transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" /> {!collapsed && "Déconnexion"}
        </Button>
      </div>
    </Sidebar>
  );
}

export function ClientLayout() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ClientSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b border-border/40 px-5 bg-background/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-200">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <CrossAppSwitcher current="build" size="compact" className="hidden sm:inline-flex" />
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild className="rounded-[var(--radius-md)] text-muted-foreground hover:text-foreground">
                  <Link to="/admin/dashboard">
                    <Shield className="h-4 w-4 mr-1.5" /> Admin
                  </Link>
                </Button>
              )}
              <NotificationCenter />
            </div>
          </header>
          <CrossAppOriginBanner />
          <main className="flex-1 p-4 sm:p-6 bg-muted/20">
            <div className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
