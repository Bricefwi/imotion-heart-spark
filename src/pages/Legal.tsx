import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function Legal() {
  return (
    <div className="py-20">
      <SEOHead
        title="Mentions légales"
        description="Mentions légales d'IMOTION Creator Studio : éditeur, hébergeur, propriété intellectuelle, responsabilité et droit applicable."
        canonical="/mentions-legales"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Mentions légales", url: "/mentions-legales" },
        ])}
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Mentions légales</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

          {/* ── 1. ÉDITEUR ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Éditeur du site</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site <strong>IMOTION Creator Studio</strong> (ci-après « le Site » ou « la Plateforme ») est édité par :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-none pl-0 space-y-1 mt-3">
              <li><strong>Raison sociale :</strong> IMOTION Conseil — SAS en cours d'immatriculation</li>
              <li><strong>Siège social :</strong> [Adresse à compléter]</li>
              <li><strong>Capital social :</strong> [À compléter] €</li>
              <li><strong>RCS / SIRET :</strong> En cours d'immatriculation</li>
              <li><strong>Numéro TVA intracommunautaire :</strong> En cours d'attribution</li>
              <li><strong>Directeur de la publication :</strong> [Nom du représentant légal à compléter]</li>
              <li><strong>Email :</strong> contact@imotion-conseils.fr</li>
              <li><strong>Téléphone :</strong> [À compléter]</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3 text-sm italic">
              Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), les mentions ci-dessus seront complétées dès l'immatriculation de la société.
            </p>
          </section>

          {/* ── 2. HÉBERGEMENT ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. Hébergement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le Site est hébergé par :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-none pl-0 space-y-1 mt-3">
              <li><strong>Lovable</strong> — https://lovable.dev</li>
              <li>Infrastructure : Supabase (serveurs UE — Allemagne / Irlande)</li>
              <li>Les données sont hébergées au sein de l'Union européenne, conformément au RGPD.</li>
            </ul>
          </section>

          {/* ── 3. ACTIVITÉ ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Activité</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Creator Studio est une plateforme SaaS (Software as a Service) de conseil en transformation digitale. Elle propose des services d'accompagnement à la définition de projets numériques, incluant la génération de cahiers des charges, propositions techniques et suivi de projet assistés par intelligence artificielle.
            </p>
          </section>

          {/* ── 4. PROPRIÉTÉ INTELLECTUELLE ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément aux articles L.111-1 et suivants du Code de la propriété intellectuelle, l'ensemble des éléments composant le Site — incluant sans limitation les textes, images, graphismes, logos, icônes, sons, logiciels, bases de données, algorithmes d'intelligence artificielle, interfaces, architecture et code source — sont la propriété exclusive d'IMOTION Conseil ou font l'objet d'une autorisation d'utilisation.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, de ces éléments, quel que soit le moyen ou le procédé utilisé, est strictement interdite sans l'autorisation écrite préalable d'IMOTION Conseil. Toute exploitation non autorisée sera constitutive d'une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Les marques, logos et noms de domaine associés à IMOTION Conseil et IMOTION Creator Studio constituent des signes distinctifs protégés. Leur utilisation sans autorisation est prohibée au sens des articles L.713-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </section>

          {/* ── 5. CONTENUS GÉNÉRÉS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Contenus générés par l'IA</h2>
            <p className="text-muted-foreground leading-relaxed">
              La Plateforme utilise des technologies d'intelligence artificielle pour assister les utilisateurs dans la définition de leurs projets. Les contenus générés par l'IA (cahiers des charges, synthèses, recommandations) constituent des outils d'aide à la décision et ne sauraient engager la responsabilité d'IMOTION Conseil quant à leur exactitude, exhaustivité ou adéquation à une situation particulière.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L'utilisateur reste seul responsable de la validation, de l'utilisation et de l'exploitation des contenus générés via la Plateforme.
            </p>
          </section>

          {/* ── 6. LIMITATION DE RESPONSABILITÉ ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Limitation de responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Conseil s'efforce de fournir un service de qualité et de maintenir l'accessibilité du Site. Toutefois, IMOTION Conseil ne saurait être tenu responsable :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li>De toute interruption temporaire du service pour maintenance, mise à jour ou cas de force majeure ;</li>
              <li>Des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utilisation du Site ;</li>
              <li>Des décisions prises par l'utilisateur sur la base des informations ou contenus fournis par la Plateforme ;</li>
              <li>Du contenu des sites tiers accessibles via des liens hypertextes présents sur le Site ;</li>
              <li>De la perte de données résultant d'une utilisation non conforme de la Plateforme ;</li>
              <li>Des erreurs, omissions ou inexactitudes dans les contenus générés par l'intelligence artificielle.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              En tout état de cause, la responsabilité d'IMOTION Conseil au titre des présentes est limitée au montant des sommes effectivement versées par l'utilisateur au cours des douze (12) derniers mois précédant l'événement en cause.
            </p>
          </section>

          {/* ── 7. DONNÉES PERSONNELLES ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">7. Protection des données personnelles</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le traitement des données personnelles collectées via le Site est soumis au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée (Loi Informatique et Libertés). Pour plus de détails, consultez notre <a href="/confidentialite" className="text-primary underline hover:no-underline">Politique de confidentialité</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>Délégué à la protection des données (DPO) :</strong> contact@imotion-conseils.fr
            </p>
          </section>

          {/* ── 8. COOKIES ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément à la directive européenne 2009/136/CE et aux recommandations de la CNIL, le Site utilise exclusivement des cookies strictement nécessaires au fonctionnement du service (authentification, session, préférences). Ces cookies sont exemptés de consentement conformément à l'article 82 de la loi Informatique et Libertés.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Aucun cookie publicitaire, de profilage ou de suivi tiers n'est déposé. Si cette politique venait à évoluer, un bandeau de consentement conforme aux exigences de la CNIL serait mis en place préalablement.
            </p>
          </section>

          {/* ── 9. CONDITIONS GÉNÉRALES DE VENTE ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">9. Conditions générales de vente (CGV)</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'utilisation des services payants de la Plateforme (abonnements SaaS) est soumise aux Conditions Générales de Vente, acceptées par l'utilisateur lors de la souscription. Les principales dispositions incluent :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>Objet :</strong> Fourniture d'un accès à la plateforme IMOTION Creator Studio sous forme d'abonnement mensuel ou annuel.</li>
              <li><strong>Prix :</strong> Les prix sont indiqués en euros TTC. IMOTION Conseil se réserve le droit de modifier ses tarifs, toute modification étant notifiée 30 jours avant son entrée en vigueur.</li>
              <li><strong>Droit de rétractation :</strong> Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenu numérique exécuté immédiatement avec l'accord du consommateur. Toutefois, un délai de 14 jours de rétractation est accordé à compter de la souscription si le service n'a pas été utilisé.</li>
              <li><strong>Résiliation :</strong> L'utilisateur peut résilier son abonnement à tout moment depuis son espace client. La résiliation prend effet à la fin de la période de facturation en cours.</li>
              <li><strong>Médiation :</strong> En cas de litige, le consommateur peut recourir gratuitement au service de médiation de la consommation. Le médiateur désigné sera communiqué dès l'immatriculation de la société.</li>
            </ul>
          </section>

          {/* ── 10. LOI APPLICABLE ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">10. Loi applicable et juridiction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, compétence est attribuée aux tribunaux compétents du ressort du siège social d'IMOTION Conseil, sauf disposition légale contraire applicable aux consommateurs (article R.631-3 du Code de la consommation).
            </p>
          </section>

          {/* ── 11. CRÉDITS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">11. Crédits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conception et développement : IMOTION Conseil<br />
              Illustrations : générées par intelligence artificielle (Flux)<br />
              Icônes : Lucide Icons (licence ISC)
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
