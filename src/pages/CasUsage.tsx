import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, ShoppingBag, Users, Workflow } from "lucide-react";

/**
 * Cas d'usage publics i-MOTION Conseil — exemples illustratifs anonymisés.
 * Aucun chiffre client, témoignage ou nom d'entreprise réel n'est affiché
 * (cf. memory/constraints/commercial-honesty).
 */
const CAS = [
  {
    icon: Building2,
    secteur: "Cabinet de conseil B2B",
    besoin: "Site vitrine crédible + prise de rendez-vous qualifiée",
    approche:
      "Cadrage du parcours décideur, refonte de l'argumentaire et mise en place d'un tunnel de prise de RDV connecté au CRM.",
    livrables: ["Cahier des charges", "Maquettes validées", "Site responsive", "Intégration CRM"],
  },
  {
    icon: ShoppingBag,
    secteur: "Commerce indépendant",
    besoin: "Vendre en ligne sans refondre toute l'organisation",
    approche:
      "Diagnostic du stock et des flux logistiques, choix d'une stack NoCode adaptée, formation de l'équipe avant ouverture.",
    livrables: ["Audit logistique", "Boutique en ligne", "Formation 2 jours", "Suivi 30 jours"],
  },
  {
    icon: Workflow,
    secteur: "Cabinet d'expertise",
    besoin: "Automatiser la collecte de pièces clients",
    approche:
      "Mapping des étapes manuelles, conception d'un portail client sécurisé, mise en place d'automatisations supervisées.",
    livrables: ["Cartographie process", "Portail client", "Automatisations", "Documentation interne"],
  },
  {
    icon: Users,
    secteur: "Association",
    besoin: "Gérer les adhésions et la communication",
    approche:
      "Choix d'outils open source et NoCode raisonnables, intégration des paiements en ligne, formation des bénévoles.",
    livrables: ["Espace adhérents", "Paiement en ligne", "Newsletter", "Tableau de bord"],
  },
] as const;

export default function CasUsage() {
  return (
    <>
      <Helmet>
        <title>Cas d'usage — i-MOTION Conseil</title>
        <meta
          name="description"
          content="Exemples de missions IA & NoCode menées par le cabinet i-MOTION Conseil : sites professionnels, automatisations, portails clients."
        />
        <link rel="canonical" href="https://app.imotion-conseils.fr/cas-usage" />
      </Helmet>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Cas d'usage
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Ce que nous savons faire, concrètement
          </h1>
          <p className="text-muted-foreground text-lg">
            Exemples représentatifs de missions menées par le cabinet. Les profils
            d'entreprises sont volontairement anonymisés. Aucune statistique ni
            témoignage n'est affiché tant qu'il n'est pas vérifiable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {CAS.map(({ icon: Icon, secteur, besoin, approche, livrables }) => (
            <Card key={secteur} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">{secteur}</Badge>
                </div>
                <CardTitle className="text-xl">{besoin}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{approche}</p>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Livrables type
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {livrables.map((l) => (
                      <li
                        key={l}
                        className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                      >
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-muted-foreground">
            Votre besoin ne ressemble à aucun de ces exemples ? C'est normal,
            chaque mission est cadrée individuellement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="flame">
              <Link to="/diagnostic">
                Démarrer un diagnostic gratuit <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Échanger avec un consultant</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
