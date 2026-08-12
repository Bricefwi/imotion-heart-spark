import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { FloatingChatAgent } from "@/components/FloatingChatAgent";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { CrossAppSwitcher } from "@/components/cross-app/CrossAppSwitcher";
import { CrossAppOriginBanner } from "@/components/cross-app/CrossAppOriginBanner";
import { CrossAppFooterBridge } from "@/components/cross-app/CrossAppFooterBridge";

export function PublicLayout() {
  const { user, profile, roles, signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  // Home page : header transparent dark overlay (matches hero ink dark)
  const isHome = pathname === "/";

  const navLinks = [
    { label: "Diagnostic gratuit", to: "/diagnostic" },
    { label: "Méthode", to: "/methode" },
    { label: "Offres", to: "/offres" },
    { label: "Cas d'usage", to: "/cas-usage" },
    { label: "Contact", to: "/contact" },
  ];

  const legalLinks = [
    { label: t("nav.legalNotice"), to: "/mentions-legales" },
    { label: t("nav.cgu"), to: "/cgu" },
    { label: t("nav.cgv"), to: "/cgv" },
    { label: t("nav.privacy"), to: "/confidentialite" },
    { label: t("nav.cookies"), to: "/cookies" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — Brand v2 (compact 64px). Transparent dark overlay on home, glass on other pages. */}
      <header
        className={
          isHome
            ? "absolute top-0 left-0 right-0 z-50 border-b border-white/10 bg-transparent"
            : "sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        }
      >
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/"
            className={`flex items-center group ${isHome ? "text-white" : ""}`}
            aria-label="i-MOTION Conseil — Accueil"
          >
            <Logo size="md" showText tone={isHome ? "light" : "auto"} />
          </Link>

          {/* Desktop nav with active underline */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
                    isHome
                      ? isActive
                        ? "text-white"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                      : isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  } after:content-[''] after:absolute after:left-3 after:right-3 after:bottom-1 after:h-[2px] after:rounded-full after:bg-imo-coral-600 after:transition-transform after:duration-200 ${
                    "after:scale-x-0"
                  } ${isActive ? "after:!scale-x-100" : "hover:after:scale-x-50"}`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Légal dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-200 ${
                  isHome
                    ? "text-white/70 hover:text-white hover:bg-white/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {t("nav.legal")}
                <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px] rounded-[var(--radius-lg)] shadow-lg border-border/50">
                {legalLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild className="rounded-[var(--radius-sm)]">
                    <Link to={link.to} className="w-full">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <CrossAppSwitcher current="build" size="compact" />
            <LanguageSelector />
            {user ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="rounded-[var(--radius-md)]">
                  <Link to={roles.includes("admin") ? "/admin/dashboard" : roles.includes("consultant") ? "/consultant/dashboard" : "/client/dashboard"}>
                    {t("nav.mySpace")}
                  </Link>
                </Button>
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
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-[var(--radius-lg)] shadow-lg border-border/50">
                    <DropdownMenuItem asChild className="rounded-[var(--radius-sm)]">
                      <Link to="/client/dashboard" className="flex items-center gap-2">
                        {t("nav.mySpace")}
                      </Link>
                    </DropdownMenuItem>
                    {roles.includes("consultant") && (
                      <DropdownMenuItem asChild className="rounded-[var(--radius-sm)]">
                        <Link to="/consultant/dashboard" className="flex items-center gap-2">
                          {t("nav.consultantSpace")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {roles.includes("admin") && (
                      <DropdownMenuItem asChild className="rounded-[var(--radius-sm)]">
                        <Link to="/admin/dashboard" className="flex items-center gap-2 text-primary font-medium">
                          {t("nav.admin")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={signOut} className="text-destructive rounded-[var(--radius-sm)]">
                      <LogOut className="h-4 w-4 mr-2" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className={`rounded-[var(--radius-md)] ${
                    isHome ? "text-white/80 hover:text-white hover:bg-white/10" : ""
                  }`}
                >
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle — cible tactile ≥ 44px (p-3) + état annoncé aux lecteurs d'écran */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation"}
              className={`p-3 rounded-[var(--radius-md)] transition-colors ${
                isHome
                  ? "text-white hover:bg-white/10"
                  : "hover:bg-muted/50"
              }`}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div id="mobile-nav" className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl p-4 space-y-1 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm font-medium py-2.5 px-3 rounded-[var(--radius-md)] hover:bg-muted/50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {/* Legal links on mobile */}
            <div className="border-t border-border/30 pt-3 mt-2">
              <p className="section-header px-3 mb-2">{t("nav.legal")}</p>
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-sm font-medium py-2 px-3 rounded-[var(--radius-md)] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="space-y-1 pt-3 border-t border-border/30">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">{(profile?.full_name || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{profile?.full_name || user.email}</span>
                </div>
                <Link to="/client/dashboard" className="block text-sm py-2.5 px-3 rounded-[var(--radius-md)] font-medium hover:bg-muted/50" onClick={() => setMobileOpen(false)}>
                  {t("nav.mySpace")}
                </Link>
                {roles.includes("consultant") && (
                  <Link to="/consultant/dashboard" className="block text-sm py-2.5 px-3 rounded-[var(--radius-md)] font-medium hover:bg-muted/50" onClick={() => setMobileOpen(false)}>
                    {t("nav.consultantSpace")}
                  </Link>
                )}
                {roles.includes("admin") && (
                  <Link to="/admin/dashboard" className="block text-sm py-2.5 px-3 rounded-[var(--radius-md)] font-medium text-primary hover:bg-primary/5" onClick={() => setMobileOpen(false)}>
                    {t("nav.admin")}
                  </Link>
                )}
                <button onClick={signOut} className="block w-full text-left text-sm py-2.5 px-3 rounded-[var(--radius-md)] text-destructive hover:bg-destructive/5">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-3 px-3">
                <Button variant="outline" asChild className="rounded-[var(--radius-md)]"><Link to="/login">{t("nav.login")}</Link></Button>
                <Button asChild><Link to="/register">{t("nav.register")}</Link></Button>
              </div>
            )}
          </div>
        )}
      </header>

      <CrossAppOriginBanner />

      <main className="flex-1">
        <Outlet />
      </main>

      <FloatingChatAgent />

      <CrossAppFooterBridge current="build" />

      {/* Premium Footer */}
      <footer className="border-t border-border/30 bg-muted/20">
        <div className="container py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <Logo size="md" showText />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">{t("footer.product")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/diagnostic" className="hover:text-foreground transition-colors duration-150">Diagnostic gratuit</Link></li>
                <li><Link to="/methode" className="hover:text-foreground transition-colors duration-150">Méthode</Link></li>
                <li><Link to="/offres" className="hover:text-foreground transition-colors duration-150">Offres</Link></li>
                <li><Link to="/cas-usage" className="hover:text-foreground transition-colors duration-150">Cas d'usage</Link></li>
                <li><Link to="/cabinet" className="hover:text-foreground transition-colors duration-150">Cabinet IA supervisé</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">{t("footer.company")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/a-propos" className="hover:text-foreground transition-colors duration-150">{t("nav.about")}</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors duration-150">{t("nav.contact")}</Link></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors duration-150">{t("nav.faq")}</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors duration-150">{t("nav.blog")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">{t("nav.legal")}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/mentions-legales" className="hover:text-foreground transition-colors duration-150">{t("nav.legalNotice")}</Link></li>
                <li><Link to="/cgu" className="hover:text-foreground transition-colors duration-150">{t("nav.cgu")}</Link></li>
                <li><Link to="/cgv" className="hover:text-foreground transition-colors duration-150">{t("nav.cgv")}</Link></li>
                <li><Link to="/confidentialite" className="hover:text-foreground transition-colors duration-150">{t("nav.privacy")}</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground transition-colors duration-150">{t("nav.cookies")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 mt-10 pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} i-MOTION Conseil. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
