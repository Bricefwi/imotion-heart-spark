import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function CGV() {
  return (
    <div className="py-20">
      <SEOHead
        title="Conditions Générales de Vente (CGV)"
        description="Conditions générales de vente d'IMOTION Creator Studio. Tarifs, paiement, livraison, droit de rétractation et garanties."
        canonical="/cgv"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "CGV", url: "/cgv" },
        ])}
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Conditions Générales de Vente</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Objet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales de Vente (ci-après « CGV ») s'appliquent à toute souscription aux services payants proposés par <strong>IMOTION Conseil</strong> via la plateforme IMOTION Creator Studio. Elles complètent les Conditions Générales d'Utilisation (CGU) accessibles à l'adresse <a href="/cgu" className="text-primary underline hover:no-underline">/cgu</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Conformément aux articles L.111-1 et suivants du Code de la consommation, les présentes CGV sont communiquées à tout Client préalablement à toute souscription.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. Services proposés</h2>
            <p className="text-muted-foreground leading-relaxed">IMOTION Creator Studio propose les services suivants :</p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>Découverte & CDC (Gratuit) :</strong> conversation guidée par IA pour la définition du projet et génération d'un cahier des charges professionnel. Ce service est entièrement gratuit et sans engagement.</li>
              <li><strong>BUILD — Réalisation :</strong> développement sur-mesure du projet digital (design, développement, tests, déploiement). Le périmètre, le budget et le planning sont définis dans une proposition commerciale personnalisée.</li>
              <li><strong>RUN — Maintenance :</strong> abonnement mensuel comprenant hébergement, maintenance corrective et préventive, mises à jour de sécurité, monitoring et support.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Prix</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les prix sont indiqués en euros (€), toutes taxes comprises (TTC) pour les clients consommateurs et hors taxes (HT) pour les clients professionnels. La TVA applicable est celle en vigueur au jour de la facturation.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              IMOTION Conseil se réserve le droit de modifier ses tarifs à tout moment. Toute modification sera notifiée au Client au moins 30 jours avant son entrée en vigueur. Les tarifs applicables sont ceux en vigueur au jour de la commande.
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>BUILD :</strong> devis personnalisé basé sur le cahier des charges. Les prix « à partir de » affichés sur le site sont indicatifs et correspondent à des projets simples.</li>
              <li><strong>RUN :</strong> abonnement mensuel dont les tarifs sont détaillés sur la page <a href="/tarifs" className="text-primary underline hover:no-underline">Tarifs</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. Commande et acceptation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Toute commande de service BUILD fait l'objet d'une proposition commerciale détaillée, comprenant le périmètre fonctionnel, le budget, le planning et les conditions de paiement. La commande est validée par l'acceptation écrite (signature électronique) de la proposition par le Client.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Pour les services RUN, la souscription est effectuée en ligne via la Plateforme et prend effet immédiatement après le paiement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Paiement</h2>
            <p className="text-muted-foreground leading-relaxed">Le paiement s'effectue par les moyens suivants :</p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li>Carte bancaire (via Stripe, certifié PCI-DSS) ;</li>
              <li>Virement bancaire (pour les projets BUILD).</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>BUILD :</strong> le paiement est échelonné selon les modalités définies dans la proposition commerciale (typiquement : 30% à la commande, 40% à mi-parcours, 30% à la livraison).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>RUN :</strong> le paiement est prélevé mensuellement à la date anniversaire de la souscription.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              En cas de retard de paiement, des pénalités seront appliquées conformément à l'article L.441-10 du Code de commerce : taux BCE majoré de 10 points, plus une indemnité forfaitaire de 40€ pour frais de recouvrement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Délais de livraison</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les délais de livraison sont indicatifs et définis dans la proposition commerciale. IMOTION Conseil s'engage à informer le Client de tout retard prévisible. Un retard de livraison ne saurait donner lieu à des dommages et intérêts, sauf accord contractuel spécifique.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              La livraison est effectuée par la mise à disposition du projet sur l'environnement de production convenu. Un procès-verbal de recette est établi à la livraison.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">7. Droit de rétractation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément à l'article L.221-18 du Code de la consommation, le Client consommateur dispose d'un délai de 14 jours calendaires à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motif.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>Exception :</strong> conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas à la fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé avec l'accord préalable et exprès du consommateur et pour lequel il a renoncé à son droit de rétractation.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Pour exercer le droit de rétractation, le Client doit adresser sa demande par email à contact@imotion-conseils.fr ou par courrier postal au siège social d'IMOTION Conseil. Le remboursement sera effectué dans les 14 jours suivant la réception de la demande.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">8. Garanties</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Garantie légale de conformité</strong> (articles L.217-4 et suivants du Code de la consommation) : IMOTION Conseil garantit que les services fournis sont conformes à la description donnée dans la proposition commerciale.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>Garantie contractuelle BUILD :</strong> une période de garantie de 3 mois est incluse après la livraison, couvrant la correction des anomalies bloquantes et majeures signalées pendant cette période.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">9. Résiliation</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>RUN :</strong> le Client peut résilier son abonnement à tout moment depuis son espace client ou par email. La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement partiel n'est effectué pour la période entamée.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>BUILD :</strong> en cas de résiliation en cours de projet, les travaux réalisés restent acquis et les sommes versées pour les phases terminées ne sont pas remboursables.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">10. Responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              La responsabilité d'IMOTION Conseil est limitée au montant total des sommes versées par le Client pour le service concerné au cours des 12 derniers mois. IMOTION Conseil ne saurait être tenu responsable des dommages indirects (perte de chiffre d'affaires, perte de clientèle, atteinte à l'image).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">11. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Sauf accord contraire, les droits de propriété intellectuelle sur les livrables BUILD sont cédés au Client au paiement intégral du prix, conformément aux articles L.131-1 et suivants du Code de la propriété intellectuelle. La cession porte sur les droits de reproduction, représentation et adaptation, pour le monde entier et pour la durée légale de protection.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              IMOTION Conseil conserve le droit de mentionner le projet à titre de référence commerciale, sauf opposition écrite du Client.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">12. Médiation et litiges</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément aux articles L.611-1 et suivants du Code de la consommation, en cas de litige non résolu à l'amiable, le Client consommateur peut recourir gratuitement au service de médiation de la consommation. Le médiateur désigné sera communiqué dès l'immatriculation de la société.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              La plateforme de règlement en ligne des litiges de la Commission européenne est accessible à l'adresse : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">https://ec.europa.eu/consumers/odr</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Les présentes CGV sont régies par le droit français. En cas de litige, compétence est attribuée aux tribunaux du siège social d'IMOTION Conseil, sauf disposition légale contraire.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
