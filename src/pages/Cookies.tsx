import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function Cookies() {
  return (
    <div className="py-20">
      <SEOHead
        title="Politique de cookies"
        description="Politique de cookies d'IMOTION Creator Studio. Cookies utilisés, finalités, gestion des préférences et conformité RGPD/CNIL."
        canonical="/cookies"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Cookies", url: "/cookies" },
        ])}
      />
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">Politique de cookies</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Qu'est-ce qu'un cookie ?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite (préférences de langue, identifiants de session, etc.).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              La réglementation applicable aux cookies est définie par la directive européenne 2009/136/CE (dite « directive ePrivacy »), transposée en droit français par l'article 82 de la loi n° 78-17 du 6 janvier 1978 (Informatique et Libertés), et complétée par les lignes directrices de la CNIL du 1er octobre 2020.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. Cookies utilisés sur la Plateforme</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Creator Studio utilise <strong>exclusivement des cookies strictement nécessaires</strong> au fonctionnement du service. Ces cookies sont exemptés de consentement conformément à l'article 82 de la loi Informatique et Libertés.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-muted-foreground border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Nom</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Finalité</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Durée</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3 font-mono text-xs">sb-*-auth-token</td>
                    <td className="p-3">Authentification et maintien de session</td>
                    <td className="p-3">Session / 1 an</td>
                    <td className="p-3">Strictement nécessaire</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 font-mono text-xs">i18nextLng</td>
                    <td className="p-3">Préférence de langue de l'utilisateur</td>
                    <td className="p-3">1 an</td>
                    <td className="p-3">Strictement nécessaire</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">theme</td>
                    <td className="p-3">Préférence de thème (clair/sombre)</td>
                    <td className="p-3">1 an</td>
                    <td className="p-3">Strictement nécessaire</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Cookies tiers</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Aucun cookie tiers n'est déposé</strong> sur la Plateforme. Nous n'utilisons pas de :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li>Cookies publicitaires ou de ciblage ;</li>
              <li>Cookies de réseaux sociaux (Facebook, Twitter, LinkedIn, etc.) ;</li>
              <li>Cookies de mesure d'audience (Google Analytics, Matomo, etc.) ;</li>
              <li>Cookies de profilage ou de suivi cross-site.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Si cette politique venait à évoluer (ajout de cookies d'analyse par exemple), un bandeau de consentement conforme aux recommandations de la CNIL serait mis en place préalablement, offrant un choix granulaire par catégorie de cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. Gestion des cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vous pouvez à tout moment configurer votre navigateur pour accepter ou refuser les cookies. Cependant, le refus des cookies strictement nécessaires peut empêcher le bon fonctionnement de la Plateforme (authentification, préférences).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">Voici les liens de gestion des cookies pour les principaux navigateurs :</p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-2 mt-3">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Stockage local (localStorage)</h2>
            <p className="text-muted-foreground leading-relaxed">
              En complément des cookies, la Plateforme utilise le stockage local du navigateur (localStorage) pour mémoriser vos préférences utilisateur (langue, thème). Ce stockage ne contient aucune donnée personnelle identifiable et reste strictement sur votre appareil.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative à notre politique de cookies :
            </p>
            <ul className="text-muted-foreground leading-relaxed list-none pl-0 space-y-1 mt-3">
              <li><strong>Email :</strong> <a href="mailto:contact@imotion-conseils.fr" className="text-primary underline hover:no-underline">contact@imotion-conseils.fr</a></li>
              <li><strong>CNIL :</strong> <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">www.cnil.fr</a></li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
