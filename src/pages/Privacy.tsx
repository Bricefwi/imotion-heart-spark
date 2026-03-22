import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function Privacy() {
  return (
    <div className="py-20">
      <SEOHead
        title="Politique de confidentialité"
        description="Politique de confidentialité d'IMOTION Creator Studio : données collectées, finalités, droits RGPD, cookies et transferts internationaux."
        canonical="/confidentialite"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Confidentialité", url: "/confidentialite" },
        ])}
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

          {/* ── 1. RESPONSABLE DU TRAITEMENT ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Responsable du traitement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le responsable du traitement des données personnelles collectées sur la plateforme <strong>IMOTION Creator Studio</strong> est :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-none pl-0 space-y-1 mt-3">
              <li><strong>IMOTION Conseil</strong> — SAS en cours d'immatriculation</li>
              <li>Siège social : [Adresse à compléter]</li>
              <li>Email du DPO : contact@imotion-conseils.fr</li>
            </ul>
          </section>

          {/* ── 2. BASE LÉGALE ET FINALITÉS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. Base légale et finalités des traitements</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément à l'article 6 du RGPD, les traitements de données personnelles reposent sur les bases légales suivantes :
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-muted-foreground border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Finalité</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Base légale</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3">Création et gestion de compte</td>
                    <td className="p-3">Exécution du contrat (Art. 6.1.b)</td>
                    <td className="p-3">Durée du compte + 3 ans</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Fourniture du service (conversations IA, documents)</td>
                    <td className="p-3">Exécution du contrat (Art. 6.1.b)</td>
                    <td className="p-3">Durée du compte + 1 an</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Facturation et paiement</td>
                    <td className="p-3">Obligation légale (Art. 6.1.c)</td>
                    <td className="p-3">10 ans (obligation comptable)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Newsletter et communications marketing</td>
                    <td className="p-3">Consentement (Art. 6.1.a)</td>
                    <td className="p-3">Jusqu'au retrait du consentement + 3 ans</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Amélioration du service et analytics</td>
                    <td className="p-3">Intérêt légitime (Art. 6.1.f)</td>
                    <td className="p-3">25 mois maximum</td>
                  </tr>
                  <tr>
                    <td className="p-3">Sécurité et prévention des fraudes</td>
                    <td className="p-3">Intérêt légitime (Art. 6.1.f)</td>
                    <td className="p-3">12 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 3. DONNÉES COLLECTÉES ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Données personnelles collectées</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous collectons les catégories de données suivantes, selon le principe de minimisation (Art. 5.1.c RGPD) :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone (optionnel).</li>
              <li><strong>Données professionnelles :</strong> nom de l'entreprise, poste, secteur d'activité, taille de l'entreprise, site web.</li>
              <li><strong>Données de projet :</strong> objectifs, budget estimé, planning, outils utilisés, concurrents, notes de projet.</li>
              <li><strong>Données de conversation :</strong> messages échangés avec l'IA, synthèses, cahiers des charges générés.</li>
              <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, appareil, pages consultées, horodatages.</li>
              <li><strong>Données de paiement :</strong> traitées exclusivement par notre prestataire Stripe (certifié PCI-DSS). IMOTION Conseil ne stocke aucune donnée bancaire.</li>
            </ul>
          </section>

          {/* ── 4. SOUS-TRAITANTS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. Sous-traitants et destinataires</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément à l'article 28 du RGPD, nous faisons appel aux sous-traitants suivants, tous liés par des clauses contractuelles types (CCT) ou des garanties équivalentes :
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-muted-foreground border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Sous-traitant</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Finalité</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Localisation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3">Supabase (via Lovable Cloud)</td>
                    <td className="p-3">Hébergement, base de données, authentification</td>
                    <td className="p-3">UE (Allemagne / Irlande)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Google (Gemini API)</td>
                    <td className="p-3">Intelligence artificielle conversationnelle</td>
                    <td className="p-3">UE / USA (CCT)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Stripe</td>
                    <td className="p-3">Traitement des paiements</td>
                    <td className="p-3">UE / USA (CCT + PCI-DSS)</td>
                  </tr>
                  <tr>
                    <td className="p-3">Lovable</td>
                    <td className="p-3">Hébergement de l'application</td>
                    <td className="p-3">UE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers à des fins commerciales ou publicitaires.
            </p>
          </section>

          {/* ── 5. TRANSFERTS HORS UE ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Transferts de données hors Union européenne</h2>
            <p className="text-muted-foreground leading-relaxed">
              Certains sous-traitants peuvent traiter des données aux États-Unis. Ces transferts sont encadrés par :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li>Le EU-US Data Privacy Framework (décision d'adéquation de la Commission européenne du 10 juillet 2023) pour les sous-traitants certifiés ;</li>
              <li>Les Clauses Contractuelles Types (CCT) adoptées par la Commission européenne (décision 2021/914) ;</li>
              <li>Des mesures techniques complémentaires (chiffrement en transit et au repos).</li>
            </ul>
          </section>

          {/* ── 6. DROITS DES UTILISATEURS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément aux articles 15 à 22 du RGPD et aux articles 48 à 56 de la loi Informatique et Libertés, vous disposez des droits suivants :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>Droit d'accès (Art. 15) :</strong> obtenir la confirmation du traitement de vos données et en recevoir une copie.</li>
              <li><strong>Droit de rectification (Art. 16) :</strong> corriger les données inexactes ou incomplètes.</li>
              <li><strong>Droit à l'effacement (Art. 17) :</strong> obtenir la suppression de vos données dans les conditions prévues par la loi (« droit à l'oubli »).</li>
              <li><strong>Droit à la limitation (Art. 18) :</strong> limiter le traitement de vos données dans certains cas.</li>
              <li><strong>Droit à la portabilité (Art. 20) :</strong> recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.</li>
              <li><strong>Droit d'opposition (Art. 21) :</strong> vous opposer au traitement de vos données fondé sur l'intérêt légitime.</li>
              <li><strong>Droit de retirer votre consentement :</strong> à tout moment, sans affecter la licéité du traitement fondé sur le consentement avant son retrait.</li>
              <li><strong>Directives post-mortem :</strong> conformément à l'article 85 de la loi Informatique et Libertés, vous pouvez définir des directives relatives au sort de vos données après votre décès.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Pour exercer vos droits :</strong> envoyez un email à <a href="mailto:contact@imotion-conseils.fr" className="text-primary underline hover:no-underline">contact@imotion-conseils.fr</a> avec une copie d'une pièce d'identité. Nous nous engageons à répondre dans un délai d'un mois, conformément à l'article 12 du RGPD.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>Réclamation :</strong> Vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">www.cnil.fr</a> — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
            </p>
          </section>

          {/* ── 7. SÉCURITÉ ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">7. Mesures de sécurité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément à l'article 32 du RGPD, IMOTION Conseil met en œuvre les mesures techniques et organisationnelles suivantes pour garantir un niveau de sécurité adapté au risque :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>Chiffrement :</strong> toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256).</li>
              <li><strong>Authentification :</strong> mots de passe hachés avec bcrypt, support de l'authentification à deux facteurs (2FA).</li>
              <li><strong>Contrôle d'accès :</strong> politiques de sécurité au niveau des lignes (Row Level Security), principe du moindre privilège.</li>
              <li><strong>Sauvegardes :</strong> sauvegardes automatiques quotidiennes avec rétention de 30 jours.</li>
              <li><strong>Journalisation :</strong> logs d'accès et d'activité pour détection d'intrusion.</li>
              <li><strong>Tests de sécurité :</strong> audits réguliers et mises à jour de sécurité continues.</li>
            </ul>
          </section>

          {/* ── 8. COOKIES ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">8. Politique de cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le Site utilise exclusivement des cookies de fonctionnement (dits « cookies techniques » ou « strictement nécessaires »), exemptés de consentement conformément à l'article 82 de la loi Informatique et Libertés et aux lignes directrices de la CNIL du 1er octobre 2020 :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><strong>Cookie de session :</strong> maintien de l'authentification (durée : session).</li>
              <li><strong>Cookie de préférences :</strong> thème d'affichage, langue (durée : 1 an).</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Aucun cookie de mesure d'audience, de publicité, de profilage ou de réseau social n'est déposé. En cas d'évolution, un bandeau de consentement conforme sera déployé.
            </p>
          </section>

          {/* ── 9. DONNÉES DES MINEURS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">9. Données des mineurs</h2>
            <p className="text-muted-foreground leading-relaxed">
              La Plateforme est destinée à un usage professionnel et n'est pas conçue pour les personnes de moins de 16 ans. Conformément à l'article 8 du RGPD et à l'article 45 de la loi Informatique et Libertés, nous ne collectons pas sciemment de données de mineurs. Si nous découvrons qu'un mineur a créé un compte, celui-ci sera supprimé dans les meilleurs délais.
            </p>
          </section>

          {/* ── 10. VIOLATION DE DONNÉES ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">10. Notification de violation de données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément aux articles 33 et 34 du RGPD, en cas de violation de données à caractère personnel susceptible d'engendrer un risque élevé pour les droits et libertés des personnes concernées :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li>La CNIL sera notifiée dans un délai de 72 heures ;</li>
              <li>Les personnes concernées seront informées dans les meilleurs délais ;</li>
              <li>Les mesures correctives nécessaires seront mises en œuvre immédiatement.</li>
            </ul>
          </section>

          {/* ── 11. MODIFICATIONS ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">11. Modifications de la politique</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Conseil se réserve le droit de modifier la présente politique de confidentialité à tout moment. Toute modification substantielle sera notifiée aux utilisateurs par email ou via la Plateforme au moins 30 jours avant son entrée en vigueur. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L'utilisation continue de la Plateforme après notification vaut acceptation de la politique modifiée.
            </p>
          </section>

          {/* ── 12. CONTACT ── */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative à la protection de vos données personnelles :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-none pl-0 space-y-1 mt-3">
              <li><strong>Email :</strong> <a href="mailto:contact@imotion-conseils.fr" className="text-primary underline hover:no-underline">contact@imotion-conseils.fr</a></li>
              <li><strong>Courrier :</strong> IMOTION Conseil — [Adresse à compléter]</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
