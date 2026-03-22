import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function CGU() {
  return (
    <div className="py-20">
      <SEOHead
        title="Conditions Générales d'Utilisation (CGU)"
        description="Conditions générales d'utilisation de la plateforme IMOTION Creator Studio. Règles d'accès, droits et obligations des utilisateurs."
        canonical="/cgu"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "CGU", url: "/cgu" },
        ])}
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Objet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme <strong>IMOTION Creator Studio</strong> (ci-après « la Plateforme »), éditée par IMOTION Conseil, SAS en cours d'immatriculation. Toute utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. Définitions</h2>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2">
              <li><strong>« Utilisateur » :</strong> toute personne physique ou morale accédant à la Plateforme, qu'elle soit inscrite ou non.</li>
              <li><strong>« Compte » :</strong> espace personnel créé par l'Utilisateur lors de son inscription.</li>
              <li><strong>« Service » :</strong> l'ensemble des fonctionnalités proposées par la Plateforme, incluant la conversation IA, la génération de cahiers des charges et l'accompagnement projet.</li>
              <li><strong>« Contenu Généré » :</strong> tout document, synthèse ou recommandation produit par l'intelligence artificielle de la Plateforme.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Accès à la Plateforme</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'accès à la Plateforme est ouvert à toute personne majeure disposant d'une adresse email professionnelle valide. L'inscription est gratuite. Certains services peuvent être soumis à un abonnement payant, conformément aux Conditions Générales de Vente.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription, conformément à l'article 1112-1 du Code civil.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. Création et gestion du Compte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Chaque Utilisateur est responsable de la confidentialité de ses identifiants de connexion. Toute activité effectuée depuis son Compte est réputée effectuée par lui. En cas d'utilisation non autorisée, l'Utilisateur doit en informer immédiatement IMOTION Conseil à l'adresse contact@imotion-conseils.fr.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L'Utilisateur peut supprimer son Compte à tout moment depuis les paramètres de son espace personnel ou en contactant le support. La suppression entraîne l'effacement irréversible de l'ensemble des données associées, conformément au droit à l'effacement prévu par l'article 17 du RGPD.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Utilisation du Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'Utilisateur s'engage à utiliser la Plateforme conformément à sa destination et aux lois en vigueur. Il est notamment interdit :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li>D'utiliser la Plateforme à des fins illicites, frauduleuses ou portant atteinte aux droits des tiers ;</li>
              <li>De tenter d'accéder de manière non autorisée aux systèmes informatiques de la Plateforme ;</li>
              <li>De transmettre des virus, malwares ou tout code malveillant ;</li>
              <li>De contourner, désactiver ou interférer avec les fonctionnalités de sécurité ;</li>
              <li>D'utiliser des systèmes automatisés (robots, scrapers) pour accéder au Service sans autorisation ;</li>
              <li>D'usurper l'identité d'un tiers ou fournir des informations fausses ;</li>
              <li>De reproduire, copier ou revendre tout ou partie du Service sans autorisation écrite préalable.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Contenus générés par l'IA</h2>
            <p className="text-muted-foreground leading-relaxed">
              La Plateforme utilise des technologies d'intelligence artificielle pour assister l'Utilisateur. Les Contenus Générés constituent des outils d'aide à la décision et ne se substituent pas à un conseil professionnel (juridique, technique, financier).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              IMOTION Conseil ne garantit pas l'exactitude, l'exhaustivité ou l'adéquation des Contenus Générés à une situation particulière. L'Utilisateur reste seul responsable de l'utilisation qu'il en fait et des décisions qu'il prend sur cette base.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">7. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'ensemble des éléments de la Plateforme (textes, logos, interfaces, algorithmes, code source) sont protégés par le droit de la propriété intellectuelle (articles L.111-1 et suivants du Code de la propriété intellectuelle).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Les Contenus Générés pour l'Utilisateur dans le cadre de son projet (cahiers des charges, synthèses) lui sont concédés sous licence d'utilisation non exclusive et non transférable, pour un usage professionnel uniquement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">8. Disponibilité du Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Conseil s'efforce de maintenir la Plateforme accessible 24h/24, 7j/7. Toutefois, l'accès peut être temporairement suspendu pour maintenance, mise à jour ou en cas de force majeure (article 1218 du Code civil), sans que cela puisse engager la responsabilité d'IMOTION Conseil.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">9. Limitation de responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              La responsabilité d'IMOTION Conseil ne saurait être engagée en cas de dommages indirects (perte de chiffre d'affaires, perte de données, préjudice d'image) résultant de l'utilisation ou de l'impossibilité d'utilisation de la Plateforme. En tout état de cause, la responsabilité d'IMOTION Conseil est limitée au montant des sommes effectivement versées par l'Utilisateur au cours des douze (12) derniers mois.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">10. Données personnelles</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le traitement des données personnelles est régi par notre <a href="/confidentialite" className="text-primary underline hover:no-underline">Politique de confidentialité</a>, établie conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">11. Suspension et résiliation</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Conseil se réserve le droit de suspendre ou supprimer tout Compte en cas de violation des présentes CGU, sans préjudice de tout dommage et intérêt pouvant être réclamé. L'Utilisateur sera notifié par email au moins 7 jours avant la suppression, sauf en cas d'urgence (atteinte à la sécurité, activité frauduleuse).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">12. Modification des CGU</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Conseil se réserve le droit de modifier les présentes CGU à tout moment. Les modifications seront notifiées aux Utilisateurs par email ou via la Plateforme au moins 30 jours avant leur entrée en vigueur. L'utilisation continue de la Plateforme après cette date vaut acceptation des CGU modifiées.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">13. Droit applicable et juridiction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution amiable (médiation), compétence est attribuée aux tribunaux compétents du ressort du siège social d'IMOTION Conseil, sauf disposition d'ordre public contraire applicable aux consommateurs (article R.631-3 du Code de la consommation).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>Médiation :</strong> Conformément à l'article L.612-1 du Code de la consommation, l'Utilisateur consommateur peut recourir gratuitement au service de médiation. Le médiateur désigné sera communiqué dès l'immatriculation de la société.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
