export default function Legal() {
  return (
    <div className="py-20">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Mentions légales</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Éditeur du site</h2>
            <p className="text-muted-foreground leading-relaxed">
              IMOTION Conseil<br />
              Plateforme IMOTION Creator Studio<br />
              Email : contact@imotion.io
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Hébergement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le site est hébergé par Lovable (https://lovable.dev).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, marques) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Protection des données personnelles</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ce droit, contactez-nous à l'adresse : contact@imotion.io.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ce site utilise des cookies strictement nécessaires au fonctionnement du service. Aucun cookie publicitaire ou de suivi n'est utilisé.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
