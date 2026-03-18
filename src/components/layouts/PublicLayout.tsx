import { Outlet, Link } from "react-router-dom";
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

export function PublicLayout() {
  const { user, profile, roles, signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: t("nav.features"), to: "/fonctionnalites" },
    { label: t("nav.pricing"), to: "/tarifs" },
    { label: t("nav.blog"), to: "/blog" },
    { label: t("nav.about"), to: "/a-propos" },
    { label: t("nav.contact"), to: "/contact" },
    { label: t("nav.faq"), to: "/faq" },
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
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Légal dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none">
                {t("nav.legal")}
                <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                {legalLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="w-full">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                  <Link to={roles.includes("admin") ? "/admin/dashboard" : roles.includes("consultant") ? "/consultant/dashboard" : "/client/dashboard"}>
                    {t("nav.mySpace")}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                      <Avatar className="h-9 w-9 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                        <AvatarFallback className="gradient-primary text-white text-xs font-bold">
                          {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium max-w-[120px] truncate">{profile?.full_name || user.email}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link to="/client/dashboard" className="flex items-center gap-2">
                        {t("nav.mySpace")}
                      </Link>
                    </DropdownMenuItem>
                    {roles.includes("consultant") && (
                      <DropdownMenuItem asChild>
                        <Link to="/consultant/dashboard" className="flex items-center gap-2">
                          {t("nav.consultantSpace")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {roles.includes("admin") && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="flex items-center gap-2 text-primary font-medium">
                          {t("nav.admin")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild className="gradient-primary border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-3 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm font-medium py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {/* Legal links on mobile */}
            <div className="border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("nav.legal")}</p>
              {legalLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-sm font-medium py-1.5 text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {user ? (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-white text-xs">{(profile?.full_name || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{profile?.full_name || user.email}</span>
                </div>
                <Link to="/client/dashboard" className="block text-sm py-2 font-medium" onClick={() => setMobileOpen(false)}>
                  {t("nav.mySpace")}
                </Link>
                {roles.includes("consultant") && (
                  <Link to="/consultant/dashboard" className="block text-sm py-2 font-medium" onClick={() => setMobileOpen(false)}>
                    {t("nav.consultantSpace")}
                  </Link>
                )}
                {roles.includes("admin") && (
                  <Link to="/admin/dashboard" className="block text-sm py-2 font-medium text-primary" onClick={() => setMobileOpen(false)}>
                    {t("nav.admin")}
                  </Link>
                )}
                <button onClick={signOut} className="block text-sm py-2 text-destructive">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" asChild><Link to="/login">{t("nav.login")}</Link></Button>
                <Button asChild className="gradient-primary border-0"><Link to="/register">{t("nav.register")}</Link></Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <FloatingChatAgent />

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">{t("footer.product")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/fonctionnalites" className="hover:text-foreground transition-colors">{t("nav.features")}</Link></li>
                <li><Link to="/tarifs" className="hover:text-foreground transition-colors">{t("nav.pricing")}</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">{t("nav.blog")}</Link></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors">{t("nav.faq")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">{t("footer.company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/a-propos" className="hover:text-foreground transition-colors">{t("nav.about")}</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">{t("nav.contact")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">{t("nav.legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/mentions-legales" className="hover:text-foreground transition-colors">{t("nav.legalNotice")}</Link></li>
                <li><Link to="/cgu" className="hover:text-foreground transition-colors">{t("nav.cgu")}</Link></li>
                <li><Link to="/cgv" className="hover:text-foreground transition-colors">{t("nav.cgv")}</Link></li>
                <li><Link to="/confidentialite" className="hover:text-foreground transition-colors">{t("nav.privacy")}</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground transition-colors">{t("nav.cookies")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IMOTION Creator Studio. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
