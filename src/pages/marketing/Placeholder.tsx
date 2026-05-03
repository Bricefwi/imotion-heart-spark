import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MarketingPlaceholder() {
  const { pathname } = useLocation();
  return (
    <section className="container py-24 text-center max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold capitalize">{pathname.split("/").pop()?.replace(/-/g, " ")}</h1>
      <p className="text-muted-foreground">
        Module en cours de migration depuis lovelib (Phase 3 du plan de fusion).
      </p>
      <Button asChild variant="flame"><Link to="/marketing">Retour à l'accueil marketing</Link></Button>
    </section>
  );
}
