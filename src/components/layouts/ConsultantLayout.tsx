import { Outlet } from "react-router-dom";
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
import { LayoutDashboard, FolderKanban, Users, BarChart3, FileStack, LogOut, Search } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const consultantNav = [
  { title: "Dashboard", url: "/consultant/dashboard", icon: LayoutDashboard },
  { title: "Projets", url: "/consultant/projects", icon: FolderKanban },
  { title: "Clients", url: "/consultant/clients", icon: Users },
  { title: "Analytics", url: "/consultant/analytics", icon: BarChart3 },
  { title: "Templates", url: "/consultant/templates", icon: FileStack },
];

function ConsultantSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <div className="px-4 py-5 text-sidebar-foreground">
        <Logo size="md" showText={!collapsed} markOnly={collapsed} />
      </div>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/30 uppercase text-[10px] tracking-[0.1em] px-3 mb-1">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {consultantNav.map((item) => (
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
      </SidebarContent>
      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20 ring-offset-2 ring-offset-sidebar">
              <AvatarFallback className="bg-gradient-to-br from-secondary to-primary text-white text-xs font-semibold">
                {profile?.full_name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "Consultant"}</p>
              <p className="text-[11px] text-sidebar-foreground/40">Consultant</p>
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

export function ConsultantLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ConsultantSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b border-border/40 px-5 bg-background/80 backdrop-blur-xl sticky top-0 z-10 gap-4 transition-all duration-200">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input placeholder="Rechercher un projet, client..." className="pl-9 w-72 h-9 bg-muted/50 border-transparent hover:border-border focus-visible:bg-background" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CrossAppSwitcher current="build" size="compact" className="hidden sm:inline-flex" />
              <NotificationCenter />
            </div>
          </header>
          <CrossAppOriginBanner />
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
