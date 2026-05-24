
# Plan global — Honnêteté, conformité juridique & refonte visuelle

Objectif : éliminer **tout contenu mensonger ou inventé**, retirer **tous les prix publics** (remplacés par "sur devis personnalisé"), et **unifier le visuel** pour qu'il soit propre, sobre et professionnel.

---

## Axe 1 — Bannir tout contenu Fake (priorité juridique)

### 1.1 Témoignages clients fictifs
**Fichier :** `src/components/landing/TestimonialsSection.tsx`
- Supprime les 3 personas inventés (Marie Dupont / TechVision, Thomas Martin / StartupFlow, Sophie Bernard / DataCorp) + avatars associés.
- Remplace par un **bloc "Premiers clients en cours d'accompagnement"** factuel, OU retire complètement la section du home jusqu'à obtention de vrais témoignages signés.
- Crée un système `client_reviews` déjà modéré (mémoire existante) → n'afficher QUE les avis réels validés en base. Si zéro avis → ne pas afficher la section.

### 1.2 Statistiques inventées
- `MiniPreviewCards.tsx` : supprimer **"98% de clients satisfaits"** → remplacer par "Une méthode structurée en 7 phases".
- Auditer toutes les autres pages (`About`, `StatsSection`, `Solutions`, `Methode`, `CasClients`, `AuditMethodologie`) → retirer chiffres non vérifiables (taux de conversion, "+150 entreprises", "ROI x3", etc.).
- Conserver uniquement des **descripteurs produit factuels** : nombre de phases, durée moyenne d'un audit, type de livrables.

### 1.3 Cas clients / Logos / Études
- `src/pages/marketing/CasClients.tsx` : retirer études fictives → remplacer par page "Bientôt : nos premiers retours d'expérience" ou la retirer de la nav.
- Supprimer logos de marques inventées s'il y en a.

### 1.4 Données de démo dans le Hero
**Fichier :** `src/components/landing/HeroSection.tsx`
- Les cartes mock ("Budget 25–40 k€", "Devis 27 700 €", "Lead A 87/100") sont OK **uniquement si étiquetées clairement "Exemple illustratif"** dans le composant.
- Ajouter un label discret `Exemple` sur la maquette pour éviter toute confusion.

### 1.5 Documents Preview
**Fichier :** `src/components/landing/DocumentsPreview.tsx`
- Même règle : ajouter clairement la mention **"Aperçu — exemple fictif"** sur l'aperçu de CDC/devis qui affiche "27 700 €".

---

## Axe 2 — Supprimer les prix publics

**Principe :** seul un **devis personnalisé** après audit/CDC peut chiffrer un projet. Aucun prix BUILD affiché publiquement.

### 2.1 Section Pricing (BUILD)
**Fichiers :** `src/components/landing/PricingSection.tsx`, `src/pages/Pricing.tsx`, `src/components/landing/PricingAIAgent.tsx`, `src/components/landing/PricingFAQ.tsx`
- **Supprimer les 3 plans tarifés Starter 79€ / Pro 199€ / Agency 399€** (ces plans concernent l'app agence white-label, à conserver UNIQUEMENT si c'est bien l'offre SaaS réelle — à confirmer ; sinon supprimer entièrement).
- Remplacer la page `/tarifs` par une page **"Notre approche tarifaire"** qui explique :
  - Le **CDC est 100% gratuit**.
  - Chaque projet BUILD fait l'objet d'un **devis personnalisé** après l'audit.
  - Les facteurs qui influencent le devis (complexité, périmètre, délai).
  - CTA : "Démarrer mon CDC gratuit" → tunnel d'audit.
- Supprimer toute mention "À partir de 5 000 €" (`FAQSection.tsx`, `MiniPreviewCards.tsx`).
- Retirer le RUN "199€/399€/799€" affiché publiquement (ces plans deviennent communiqués en devis).

### 2.2 Mentions de prix dispersées
Auditer et nettoyer :
- `FAQSection.tsx` (réponse "à partir de 5 000€")
- `MiniPreviewCards.tsx` (carte Tarifs)
- `HowItWorksImotion.tsx` ("Pain quantifié €/h", "Coût LLM <2€")
- `marketing/AuditGratuit.tsx`, `marketing/Solutions.tsx`, `marketing/Methode.tsx`, `marketing/AuditReport.tsx`, `marketing/CasClients.tsx`, `marketing/Veille.tsx`
- Tous les `€` non-illustratifs → reformuler en "sur devis" / "selon périmètre".

### 2.3 Navigation
- Renommer le lien nav **"Tarifs" → "Notre approche"** ou **"Comment ça marche"**.
- Mettre à jour le footer en conséquence.

---

## Axe 3 — Refonte visuelle (anti-fouillis)

### 3.1 Diagnostic actuel du home
Trop de sections empilées et redondantes :
`HeroSection` → `HowItWorksImotion` → `DocumentsPreview` → `PricingSection` → `FAQSection` → `CTASectionImotion`
+ doublons (`PricingAIAgent`, `MiniPreviewCards`, `TestimonialsSection`, `StatsSection`, `MarketingTrackSection`, `TrustBar` etc. utilisés ailleurs).

### 3.2 Nouvelle structure home `/` (5 sections max)
1. **Hero** — promesse claire + CTA "Démarrer mon CDC gratuit" + mini-aperçu illustratif clairement étiqueté.
2. **Méthode 7 phases** (refonte de `HowItWorksImotion`) — sobre, sans chiffres inventés.
3. **Aperçu du livrable CDC** (refonte de `DocumentsPreview`) — étiqueté "Exemple".
4. **Les 2 mondes IMOTION** : BUILD + MARKETING (cartes équilibrées, déjà recommandé dans audit précédent).
5. **FAQ + CTA final** fusionnés (sans aucun prix).

### 3.3 Harmonisation graphique
- **Palette stricte** : Coral `#D63B1A` + Amber `#F08A00` + Ink (déjà en mémoire). Bannir le bleu/emerald/amber décoratif éparpillé (`MiniPreviewCards`, `TestimonialsSection`).
- **Typographie** : Inter uniquement (déjà en mémoire).
- **Espaces** : rythme vertical constant (`py-24 md:py-32`), pas de doubles backgrounds.
- **Composants brand** (`EmberCard`, `FlameText`, `Stamp`, `SectionIndex`) utilisés systématiquement.
- Retirer les halos et glows redondants qui créent du bruit visuel.

### 3.4 Cohérence cross-pages
- Pages secondaires (`/fonctionnalites`, `/a-propos`, `/blog`, `/contact`) → même grille, mêmes paddings, mêmes composants brand.
- Footer unifié sans liens "Tarifs" si supprimé.

---

## Axe 4 — Garde-fous & QA

### 4.1 Mémoire projet
- Ajouter règle Core : **"Jamais de prix BUILD affichés publiquement. Jamais de témoignages/stats non vérifiés. Tout contenu illustratif doit être étiqueté 'Exemple'."**
- Mettre à jour `.lovable/memory/removals.md` et `anti-hallucination.md`.

### 4.2 Checklist QA visuelle
- Captures avant/après de : `/`, `/tarifs` (redirection ou refonte), `/fonctionnalites`, `/a-propos`, `/marketing`, `/blog`.
- Validation que zéro `€` apparaît hors mention "Exemple" ou "sur devis".

---

## Section technique (détails impl.)

**Fichiers à éditer :**
- `src/components/landing/TestimonialsSection.tsx` — supprimer ou conditionner aux vrais avis.
- `src/components/landing/MiniPreviewCards.tsx` — retirer stat "98%", retirer mention "5 000€".
- `src/components/landing/PricingSection.tsx` — refonte complète "approche tarifaire" sans prix.
- `src/components/landing/PricingAIAgent.tsx` — supprimer ou refondre.
- `src/components/landing/PricingFAQ.tsx` — réécrire sans prix.
- `src/components/landing/FAQSection.tsx` — retirer "à partir de 5 000€".
- `src/components/landing/HeroSection.tsx` — ajouter label "Exemple" sur la maquette.
- `src/components/landing/DocumentsPreview.tsx` — ajouter label "Exemple fictif".
- `src/components/landing/HowItWorksImotion.tsx` — retirer chiffres €.
- `src/pages/Pricing.tsx` — page "Notre approche" (sans grille tarifaire).
- `src/pages/Index.tsx` — structure simplifiée 5 sections.
- `src/pages/marketing/CasClients.tsx`, `Solutions.tsx`, `Methode.tsx`, `AuditReport.tsx`, `Veille.tsx`, `AuditGratuit.tsx` — purge des chiffres/cas inventés.
- `src/pages/About.tsx`, `StatsSection.tsx` — déjà nettoyés (mémoire), revérifier.
- Layouts `PublicLayout` / `MarketingLayout` — nav + footer mis à jour.

**Aucune migration DB requise.** Travail 100% frontend/contenu.

**Ordre d'exécution suggéré (par sprints courts) :**
1. **Sprint A — Juridique (urgent)** : axes 1.1, 1.2, 2.1, 2.2 (purge fake + prix).
2. **Sprint B — Étiquetage** : axes 1.4, 1.5 (mentions "Exemple").
3. **Sprint C — Refonte home** : axe 3.2 + 3.3.
4. **Sprint D — Pages secondaires + garde-fous** : axes 3.4, 4.

---

## Question avant exécution

Une seule clarification nécessaire :
- Les plans **Starter 79€ / Pro 199€ / Agency 399€** correspondent-ils à une **vraie offre SaaS white-label pour agences** (auquel cas on les garde mais on les déplace sur une page dédiée `/agences`) ou sont-ils également fictifs ? Je préfère confirmer avant de les supprimer définitivement.
