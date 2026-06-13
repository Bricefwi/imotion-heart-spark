## Objectif
Résoudre le blocage de publication persistant en distinguant clairement :
- un problème de projet/code,
- un problème de configuration de publication,
- un incident d’infrastructure Lovable,
- ou un décalage Preview vs Live / cache CDN.

## Plan d’action proposé

### 1. Vérifier l’état réel du projet publié
- Contrôler les URLs connues : Preview, URL publiée Lovable, éventuels domaines personnalisés.
- Vérifier les paramètres de publication : visibilité publique/privée, slug publié, état du badge si pertinent.
- Comparer ce qui est servi en Preview vs ce qui est servi en Live pour confirmer si Live pointe encore vers une ancienne version.

### 2. Faire les préchecks obligatoires avant toute publication
- Vérifier les métadonnées du site : title, description, Open Graph/Twitter, favicon, canonical.
- Vérifier le scan sécurité récent pour s’assurer qu’aucune faille critique ne bloque la publication.
- Vérifier l’état Lovable Cloud du backend, car un backend en redémarrage peut provoquer des erreurs confuses côté déploiement/fonctions.

### 3. Lancer une publication via l’API interne Lovable
- Utiliser l’outil interne de publication qui contourne le bouton UI.
- Capturer le résultat exact : succès planifié, URL retournée, ou erreur réelle si la publication échoue.
- Si l’outil réussit, annoncer que la publication est planifiée et vérifier ensuite si Live se met à jour.

### 4. Si la publication réussit mais Live reste ancien
- Inspecter si le problème vient du cache navigateur/CDN ou d’un mauvais environnement.
- Vérifier si la version publiée correspond au bon commit/front.
- Tester avec un accès direct à l’URL publiée et, si nécessaire, conseiller un hard refresh ou une fenêtre privée uniquement après preuve.

### 5. Si l’API interne échoue aussi
- Produire un bloc prêt à copier-coller pour le support Lovable avec :
  - URL Preview,
  - URL publiée,
  - description du symptôme,
  - heure de tentative,
  - résultat API interne,
  - confirmation que le build/scans projet ne bloquent pas.
- Ouvrir les actions utiles : historique projet et documentation troubleshooting.

## Ce que je ne ferai pas sans validation
- Pas de rollback automatique.
- Pas de modification de code tant que le problème est identifié comme publication/infrastructure.
- Pas de changement de visibilité publique/privée sans accord explicite.