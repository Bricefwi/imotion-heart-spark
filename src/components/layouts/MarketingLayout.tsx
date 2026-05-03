/**
 * MarketingLayout — layout dédié à la branche MARKETING (lovelib fusionné).
 * Réutilise les mêmes briques (header, switcher, footer) que PublicLayout
 * pour garantir la cohérence visuelle et fonctionnelle entre BUILD et MARKETING.
 *
 * Toutes les routes /marketing/* passent par ce layout.
 */
import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { CrossAppSwitcher } from "@/components/cross-app/CrossAppSwitcher";
import { CrossAppOriginBanner } from "@/components/cross-app/CrossAppOriginBanner";
import { CrossAppFooterBridge } from "@/components/cross-app/CrossAppFooterBridge";

const marketingNav = [
  { label: "Audit gratuit", to: "/marketing/audit-gratuit" },
  { label: "Méthode", to: "/marketing/methode" },
  { label: "Cas clients", to: "/marketing/cas-clients" },
  { label: "Veille IA", to: "/marketing/veille" },
  { label: "Blog", to: "/marketing/blog" },
];

export function MarketingLayout() {
  const { user, profile, roles, signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/marketing" || pathname === "/marketing/";

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={
          isHome
            ? "absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-transparent"
            : "sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        }
      >
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/marketing"
            className={`flex items-center group ${isHome ? "text-white" : ""}`}
            aria-label="IMOTION Marketing — Accueil"
          >
            <Logo size="md" showText tone={isHome ? "light" : "auto"} />
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {marketingNav.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/marketing"}
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
                    isHome
                      ? isActive ? "text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                      : isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <CrossAppSwitcher current="marketing" size="compact" />
            <LanguageSelector />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200 p-0.5">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                        {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[120px] truncate">{profile?.full_name || user.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-[var(--radius-lg)] shadow-lg border-border/50">
                  <DropdownMenuItem asChild className="rounded-[var(--radius-sm)]">
                    <Link to="/marketing/dashboard">Mon espace marketing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-[var(--radius-sm)]">
                    <Link to="/client/dashboard">{t("nav.mySpace")}</Link>
                  </DropdownMenuItem>
                  {roles.includes("admin") && (
                    <DropdownMenuItem asChild className="rounded-[var(--radius-sm)]">
                      <Link to="/admin/dashboard" className="text-primary font-medium">{t("nav.admin")}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="text-destructive rounded-[var(--radius-sm)]">
                    <LogOut className="h-4 w-4 mr-2" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild className={`rounded-[var(--radius-md)] ${isHome ? "text-white/80 hover:text-white hover:bg-white/10" : ""}`}>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild variant="flame">
                  <Link to="/marketing/audit-gratuit">Audit gratuit</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`p-2 rounded-[var(--radius-md)] transition-colors ${
                isHome ? "text-white hover:bg-white/10" : "hover:bg-muted/50"
              }`}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl p-4 space-y-1 animate-fade-in">
            {marketingNav.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm font-medium py-2.5 px-3 rounded-[var(--radius-md)] hover:bg-muted/50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border/30">
              <CrossAppSwitcher current="marketing" size="full" />
            </div>
          </div>
        )}
      </header>

      <CrossAppOriginBanner />

      <main className="flex-1">
        <Outlet />
      </main>

      <CrossAppFooterBridge current="marketing" />
    </div>
  );
}
