export default function Privacy() {
  return (
    <div className="py-20">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Politique de confidentialité</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Collecte des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Creator Studio collecte uniquement les données nécessaires au fonctionnement du service : nom, adresse email, informations de projet. Ces données sont collectées lors de l'inscription et de l'utilisation de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Utilisation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont utilisées exclusivement pour fournir et améliorer nos services. Elles ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Conservation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont conservées pendant la durée de votre utilisation du service et supprimées dans un délai de 30 jours après la clôture de votre compte.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément au RGPD, vous disposez des droits suivants : accès, rectification, suppression, portabilité et opposition. Pour exercer vos droits, contactez-nous à contact@imotion.io.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Sécurité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, modification ou destruction.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
