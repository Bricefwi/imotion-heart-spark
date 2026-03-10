import { Outlet, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function PublicLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="md" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              À propos
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button asChild className="gradient-primary border-0">
                <Link to="/client/dashboard">Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Se connecter</Link>
                </Button>
                <Button asChild className="gradient-primary border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <Link to="/register">Démarrer gratuitement</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-3 animate-fade-in">
            <a href="#features" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Fonctionnalités</a>
            <a href="#pricing" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Tarifs</a>
            <a href="#about" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>À propos</a>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" asChild><Link to="/login">Se connecter</Link></Button>
              <Button asChild className="gradient-primary border-0"><Link to="/register">Démarrer</Link></Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground">
                Transformez votre vision en réalité digitale.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">Entreprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IMOTION Conseil. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
