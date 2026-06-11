-- 1. Étendre les types autorisés
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_type_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_type_check
  CHECK (type = ANY (ARRAY[
    'cdc','proposal','contract','email','sms','notification',
    'pv_reception','tech_recommendation','pricing','system_prompt'
  ]));

-- 2. Insertion des 8 templates par défaut
INSERT INTO public.templates (name, slug, type, category, is_active, is_default, tags, variables, content) VALUES
(
  'Cahier des Charges — Standard', 'cdc-standard', 'cdc', 'document', true, true,
  ARRAY['cdc','discovery','standard'],
  '[{"name":"project_name","description":"Nom du projet","default_value":""},{"name":"client_company","description":"Société","default_value":""}]'::jsonb,
$body$# Cahier des Charges — {{project_name}}

> Document de cadrage fonctionnel et technique élaboré à l'issue de la phase de découverte conversationnelle menée avec **{{client_company}}**.

## 1. Contexte du projet

### 1.1 Présentation du client
{{client_company}} — secteur d'activité, taille, marché.

### 1.2 Origine du besoin
Décrire le déclencheur, les douleurs actuelles et les opportunités identifiées.

### 1.3 Objectifs stratégiques
- Objectif business principal
- Objectifs secondaires
- Indicateurs de succès attendus (KPIs)

## 2. Besoin exprimé

### 2.1 Vision cible
Description en une phrase de la solution idéale.

### 2.2 Utilisateurs cibles
| Persona | Rôle | Volume estimé | Niveau technique |
|---------|------|---------------|------------------|
| — | — | — | — |

### 2.3 Parcours utilisateur principal
Étapes clés du parcours de l'utilisateur dans la solution.

## 3. Périmètre fonctionnel

### 3.1 Fonctionnalités prioritaires (MUST HAVE)
- F1 — …
- F2 — …
- F3 — …

### 3.2 Fonctionnalités secondaires (SHOULD HAVE)
- …

### 3.3 Hors périmètre (WON'T HAVE — v1)
- …

## 4. Exigences non fonctionnelles

| Domaine | Exigence |
|---------|----------|
| Performance | Temps de chargement < 2 s |
| Disponibilité | 99,5 % |
| Sécurité | Conformité RGPD, chiffrement at-rest et in-transit |
| Accessibilité | WCAG 2.1 niveau AA |
| Compatibilité | Chrome, Safari, Firefox, Edge — mobile & desktop |

## 5. Contraintes
- **Budget** : indicatif communiqué
- **Délais** : jalon de mise en production souhaité
- **Techniques** : intégrations imposées, stack legacy
- **Légales / réglementaires** : RGPD, secteur régulé

## 6. Livrables attendus
1. Application web responsive
2. Documentation technique et utilisateur
3. Sources versionnées (Git)
4. Procès-verbal de réception

## 7. Critères de réception
- Tous les MUST HAVE livrés et testés
- Recette utilisateur signée
- Documentation à jour

## 8. Annexes
- Glossaire
- Sources de la phase de découverte (transcript IA)
- Maquettes de référence
$body$
),
(
  'Proposition Commerciale — 3 Options', 'proposal-3-options', 'proposal', 'document', true, true,
  ARRAY['proposition','commerciale','standard'],
  '[{"name":"client_name","description":"Contact","default_value":""},{"name":"client_company","description":"Société","default_value":""}]'::jsonb,
$body$# Proposition Commerciale — {{project_name}}

**À l'attention de** : {{client_name}} — {{client_company}}
**Référence** : {{project_code}}
**Date** : {{date}}

---

## 1. Synthèse de votre besoin
À partir de notre échange de découverte, voici ce que nous avons compris :

> *Reformulation en 2-3 phrases du problème et de la vision cible.*

## 2. Notre approche
IMOTION Cabinet Conseil vous accompagne en **3 phases structurées** :
1. **Cadrage** — alignement stratégique et CDC détaillé
2. **Build** — conception, développement, recette
3. **Run** — mise en production, formation, support

## 3. Trois options pour avancer

### 🥉 Option ESSENTIEL
**Périmètre** : MVP fonctionnel couvrant les besoins prioritaires.
**Inclus** :
- CDC validé
- Développement des fonctionnalités MUST HAVE
- Recette + mise en ligne
- 30 jours de garantie

> Tarification communiquée sur devis personnalisé.

### 🥈 Option CONFORT
**Périmètre** : MVP + fonctionnalités SHOULD HAVE + accompagnement renforcé.
**Inclus** :
- Tout l'option Essentiel
- Fonctionnalités secondaires
- Formation utilisateurs
- 90 jours de garantie + 5 h de support

> Tarification communiquée sur devis personnalisé.

### 🥇 Option PREMIUM
**Périmètre** : solution complète + run managé.
**Inclus** :
- Tout l'option Confort
- Run managé 6 mois
- Itérations produit incluses
- Astreinte business hours

> Tarification communiquée sur devis personnalisé.

## 4. Notre méthode
- **Découverte conversationnelle IA** — nous extrayons votre vrai besoin
- **Pilotage transparent** — dashboard client en temps réel
- **Livraisons incrémentales** — vous voyez le produit grandir

## 5. Prochaines étapes
1. Validation de l'option retenue
2. Signature du devis détaillé
3. Kick-off sous 5 jours ouvrés

> Cette proposition est valable **30 jours**. Pour toute question : contact@imotion-conseils.fr
$body$
),
(
  'Contrat de Prestation — Droit Français', 'contract-fr-standard', 'contract', 'document', true, true,
  ARRAY['contrat','juridique','fr'],
  '[{"name":"client_company","description":"Raison sociale","default_value":""},{"name":"client_siret","description":"SIRET","default_value":""}]'::jsonb,
$body$# Contrat de Prestation de Services

**Entre les soussignés :**

**IMOTION Conseil**, ci-après dénommée « le Prestataire »,
représentée par son représentant légal dûment habilité,

**ET**

**{{client_company}}**, SIRET {{client_siret}}, ci-après dénommée « le Client »,
représentée par {{client_name}} dûment habilité(e),

**Il a été convenu ce qui suit :**

## Article 1 — Objet
Le présent contrat a pour objet la réalisation par le Prestataire, pour le compte du Client, de la prestation intitulée **« {{project_name}} »** (référence {{project_code}}), conformément au Cahier des Charges annexé.

## Article 2 — Durée
Le contrat prend effet à compter de sa date de signature et s'étend jusqu'à la signature du Procès-Verbal de Réception.

## Article 3 — Prix et modalités de paiement
3.1 Le prix forfaitaire de la prestation est fixé au devis signé par les Parties.
3.2 Modalités de règlement :
- 30 % à la signature
- 40 % à mi-parcours validé
- 30 % à la livraison finale signée

3.3 Tout retard de paiement entraîne une indemnité forfaitaire de 40 € (art. L. 441-10 C. com.) et des intérêts de retard au taux BCE majoré de 10 points.

## Article 4 — Obligations du Prestataire
Le Prestataire s'engage à exécuter sa mission avec **diligence et compétence** (obligation de moyens). Confidentialité garantie.

## Article 5 — Obligations du Client
Le Client s'engage à fournir toutes les informations, accès et validations nécessaires dans les délais convenus.

## Article 6 — Propriété intellectuelle
6.1 Les livrables développés spécifiquement deviennent la propriété pleine et entière du Client après paiement intégral.
6.2 Le Prestataire conserve la propriété de ses outils, méthodologies et briques génériques préexistantes.

## Article 7 — Confidentialité
Chacune des Parties conserve confidentielles toutes informations échangées, pendant la durée du contrat et **3 ans après son terme**.

## Article 8 — RGPD
Les Parties se conforment au Règlement (UE) 2016/679. Un DPA est signé en annexe si le Prestataire traite des données personnelles pour le compte du Client.

## Article 9 — Garantie
Le Prestataire garantit la conformité des livrables au CDC pendant **3 mois** à compter de la signature du PV de Réception.

## Article 10 — Responsabilité
La responsabilité du Prestataire est limitée au montant total HT effectivement perçu au titre du présent contrat.

## Article 11 — Résiliation
En cas de manquement grave, résiliation possible **30 jours** après mise en demeure restée infructueuse, par LRAR.

## Article 12 — Droit applicable
Le présent contrat est régi par le **droit français**. Tribunaux compétents : ressort du siège social du Prestataire, après tentative de conciliation amiable.

---

**Fait à ____________, le ____________, en deux exemplaires originaux.**

| Pour le Prestataire | Pour le Client |
|---------------------|----------------|
| IMOTION Conseil     | {{client_company}} |
| Signature :         | Signature :    |
$body$
),
(
  'Procès-Verbal de Réception', 'pv-reception-standard', 'pv_reception', 'document', true, true,
  ARRAY['pv','reception','recette'],
  '[{"name":"project_name","description":"Projet","default_value":""}]'::jsonb,
$body$# Procès-Verbal de Réception

**Projet** : {{project_name}}
**Référence** : {{project_code}}
**Date de réception** : {{date}}

## 1. Parties présentes
- **Prestataire** : IMOTION Conseil, représenté par {{consultant_name}}
- **Client** : {{client_company}}, représenté par {{client_name}}

## 2. Objet de la réception
Le présent procès-verbal a pour objet de constater la livraison et la conformité des prestations exécutées dans le cadre du projet **{{project_name}}**, conformément au Cahier des Charges signé entre les Parties.

## 3. Livrables réceptionnés

| # | Livrable | Statut | Commentaire |
|---|----------|--------|-------------|
| 1 | Application web déployée en production | ✅ Conforme | URL : … |
| 2 | Code source (dépôt Git) | ✅ Conforme | Accès transmis |
| 3 | Documentation technique | ✅ Conforme | — |
| 4 | Documentation utilisateur | ✅ Conforme | — |
| 5 | Formation utilisateurs | ✅ Réalisée | … participants |

## 4. Tests de recette
- ✅ Tous les cas d'usage critiques sont fonctionnels
- ✅ Les exigences non fonctionnelles (performance, sécurité, accessibilité) sont respectées
- ✅ Aucune anomalie bloquante ou majeure n'est ouverte

## 5. Réserves éventuelles

| # | Description | Criticité | Délai de levée |
|---|-------------|-----------|----------------|
| — | Aucune réserve | — | — |

## 6. Décision
☐ **Réception prononcée SANS réserve**
☐ Réception prononcée AVEC réserves listées ci-dessus
☐ Réception refusée — motifs détaillés en annexe

## 7. Garantie
La période de garantie contractuelle de **3 mois** commence à courir à compter de la date du présent PV.

---

**Fait à ____________, le {{date}}**, en deux exemplaires originaux.

| Pour le Prestataire | Pour le Client |
|---------------------|----------------|
| {{consultant_name}} | {{client_name}} |
| Signature :         | Signature :    |
$body$
),
(
  'Reco Technique & Prompt Build', 'tech-reco-standard', 'tech_recommendation', 'document', true, true,
  ARRAY['tech','stack','prompt','build'],
  '[{"name":"project_name","description":"Projet","default_value":""}]'::jsonb,
$body$# Recommandation Technique & Prompts de Build — {{project_name}}

> Document stratégique : choix de stack, architecture cible, planning macro, ressources, outillage IA et prompts prêts à l'emploi pour démarrer le développement.

## 1. Synthèse exécutive
- **Type de produit** : (SaaS B2B / app mobile / outil interne…)
- **Complexité estimée** : Faible / Moyenne / Élevée
- **Stack recommandée** : React + Vite + TypeScript + Supabase
- **Hébergement** : Vercel (front) + Supabase Cloud (back)
- **Effort estimé** : … jours/homme

## 2. Stack technique recommandée

### Frontend
| Brique | Choix | Justification |
|--------|-------|---------------|
| Framework | React 18 | Écosystème mature |
| Build | Vite | Vitesse de build et HMR |
| Langage | TypeScript strict | Réduction des bugs runtime |
| UI | Tailwind + shadcn/ui | Cohérence + vitesse |
| State | React Query | Gestion cache serveur |

### Backend & données
| Brique | Choix | Justification |
|--------|-------|---------------|
| BaaS | Supabase | Postgres + Auth + Storage + Edge Functions |
| Sécurité | RLS PostgreSQL | Sécurité au niveau ligne |
| Auth | Supabase Auth (Google OAuth + email) | Conformité RGPD |

### IA & LLM
| Usage | Modèle | Coût |
|-------|--------|------|
| Conversation découverte | GPT-5 via gateway | $ |
| Extraction structurée | Gemini 2.5 Flash | $ |
| Génération de contenu | Claude / GPT-5 | $$ |

## 3. Architecture cible

```
React UI ──▶ Edge Function ──▶ AI Gateway
   │              │
   ▼              ▼
Supabase Postgres + RLS
```

## 4. Planning macro

| Phase | Durée | Livrables |
|-------|-------|-----------|
| 1. Cadrage | 1 semaine | CDC validé |
| 2. Design | 1-2 semaines | Maquettes Figma |
| 3. Build MVP | 4-8 semaines | Application déployée |
| 4. Recette | 1-2 semaines | PV signé |
| 5. Run | continu | TMA + évolutions |

## 5. Ressources nécessaires
- 1 Product Owner côté Client
- 1 Tech Lead côté Prestataire
- 1 Designer (temps partiel)
- 1 à 2 développeurs full-stack

## 6. Outils IA / LLM recommandés
- **Lovable** — génération UI React + Supabase
- **Cursor / Claude Code** — refactoring & tests
- **GitHub Copilot** — autocomplétion
- **v0.dev** — prototypage rapide

## 7. Prompts de Build prêts à l'emploi

### 7.1 Prompt global

```
Tu es un architecte logiciel senior. Tu construis {{project_name}}.
Stack : React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase.
Contraintes : mobile-first, RGPD, RLS sur toutes les tables.
Tu livres : code TypeScript strict, tests Vitest, documentation Markdown.
Tu refuses : any, styles inline, composants UI from scratch si shadcn existe.
```

### 7.2 Prompt par fonctionnalité

```
Implémente la fonctionnalité [NOM] :
- User story : En tant que [rôle], je veux [action] afin de [bénéfice].
- Critères d'acceptation : […]
- Schéma de données : […]
- États UI obligatoires : chargement, vide, erreur.
- Tests : 1 cas nominal + 1 cas d'erreur minimum.
```

### 7.3 Prompt PRD

```
Génère une spec PRD pour [FONCTIONNALITÉ] couvrant :
1. Problème résolu et personas concernés
2. Parcours utilisateur détaillé
3. Règles métier et edge cases
4. Maquettes basse-fidélité (ASCII)
5. KPI de succès
```

## 8. Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Performances LLM | Moyenne | Élevé | Cache + streaming |
| Coût API IA | Élevée | Moyen | Quotas + fallback modèles |
| Adoption utilisateurs | Moyenne | Élevé | Tests utilisateurs en continu |
$body$
),
(
  'Devis — Tarification Détaillée', 'pricing-detailed', 'pricing', 'document', true, true,
  ARRAY['devis','tarification','pricing'],
  '[{"name":"client_company","description":"Société","default_value":""}]'::jsonb,
$body$# Devis — {{project_name}}

**Émis pour** : {{client_company}}
**Référence devis** : DEV-{{project_code}}
**Date d'émission** : {{date}}
**Validité** : 30 jours

## 1. Identification

| Émetteur | Bénéficiaire |
|----------|--------------|
| IMOTION Conseil | {{client_company}} |
| contact@imotion-conseils.fr | {{client_name}} |

## 2. Détail de la prestation

| # | Désignation | Quantité | Unité | Montant HT |
|---|-------------|---------:|-------|-----------:|
| 1 | Phase de cadrage — Cahier des Charges | 1 | forfait | sur devis |
| 2 | Design UX/UI | 1 | forfait | sur devis |
| 3 | Développement MVP (MUST HAVE) | 1 | forfait | sur devis |
| 4 | Recette + mise en production | 1 | forfait | sur devis |
| 5 | Formation utilisateurs | 1 | session | sur devis |
| 6 | Garantie 3 mois | 1 | inclus | inclus |

> Les montants sont communiqués dans le devis personnalisé adressé séparément après validation du périmètre.

## 3. Récapitulatif financier

| | Montant |
|---|--------:|
| **Total HT** | À chiffrer |
| TVA 20 % | À chiffrer |
| **Total TTC** | À chiffrer |

## 4. Modalités de paiement
- **30 %** à la signature du devis
- **40 %** à la validation de la recette intermédiaire
- **30 %** à la signature du PV de Réception

Règlement par virement bancaire sous **30 jours** à compter de la date de facture.

## 5. Conditions
- Devis valable **30 jours** à compter de la date d'émission
- Toute prestation hors périmètre fera l'objet d'un avenant
- Conditions générales de vente disponibles sur demande

## 6. Acceptation

> **Bon pour accord — date et signature précédées de la mention « Lu et approuvé » :**

| Pour le Prestataire | Pour le Client |
|---------------------|----------------|
| IMOTION Conseil     | {{client_company}} |
| Signature :         | Signature :    |
$body$
),
(
  'Email — Envoi document client', 'email-document-sent', 'email', 'communication', true, true,
  ARRAY['email','document','transactionnel'],
  '[{"name":"client_name","description":"Prénom","default_value":""},{"name":"document_name","description":"Nom du document","default_value":""},{"name":"document_url","description":"Lien","default_value":""}]'::jsonb,
$body$**Objet** : Votre {{document_name}} est disponible — {{project_name}}

---

Bonjour {{client_name}},

J'espère que vous allez bien.

Votre **{{document_name}}** pour le projet *{{project_name}}* est prêt et vous est transmis ci-joint.

### 📄 Ce que vous trouverez
- Le document complet, formaté et prêt à signer
- Le récapitulatif des éléments clés discutés ensemble
- Les prochaines étapes proposées

### ✅ Actions attendues de votre côté
1. **Relisez le document** (15 minutes)
2. **Notez vos questions ou remarques** dans votre espace projet
3. **Validez ou demandez une révision** depuis votre dashboard

> 👉 [Accéder à mon espace projet]({{document_url}})

### 📅 Prochaines étapes
Une fois votre validation reçue, nous démarrons la phase suivante sous **48 h ouvrées**.

Pour toute question, répondez simplement à cet email ou prenez rendez-vous via votre espace.

À très vite,

**{{consultant_name}}**
IMOTION Cabinet Conseil
📧 contact@imotion-conseils.fr
🌐 imotion-conseils.fr

---
*Cet email a été envoyé automatiquement par votre espace IMOTION Creator Studio. Vous le recevez car vous êtes le contact principal du projet {{project_name}} ({{project_code}}).*
$body$
),
(
  'System Prompt — Marc Delaunay (Consultant IA)', 'system-prompt-marc', 'system_prompt', 'ai', true, true,
  ARRAY['ia','prompt','marc','consultant'],
  '[]'::jsonb,
$body$# System Prompt — Marc Delaunay, Consultant IMOTION

## 🎯 Identité
Tu es **Marc Delaunay**, consultant senior chez **IMOTION Cabinet Conseil**.
Tu as 15 ans d'expérience dans la transformation digitale des PME et ETI françaises.
Tu es connu pour ta capacité à transformer un besoin flou en projet clair, chiffré et réalisable.

## 🧠 Personnalité
- **Professionnel et chaleureux** — jamais condescendant
- **Expert sans jargon** — tu vulgarises sans simplifier à outrance
- **Pragmatique** — tu ramènes toujours au business et au ROI
- **Honnête** — tu sais dire "non, ce n'est pas le bon moment" si nécessaire
- **Curieux** — tu poses la bonne question, pas la question évidente

## 🗣️ Style de communication
- Vouvoie le client par défaut, sauf s'il te tutoie en premier
- Phrases courtes, idées claires
- Une question à la fois, jamais en rafale
- Reformule régulièrement pour valider ta compréhension
- Utilise des exemples concrets tirés de ton expérience

## 📋 Mission
Tu mènes une **conversation de découverte en 7 phases** :
1. **Accueil** — créer la confiance, comprendre qui est en face
2. **Besoin** — détecter le vrai problème derrière la demande
3. **Vision** — projeter la situation idéale dans 12-24 mois
4. **Écosystème** — utilisateurs, équipes, outils existants
5. **Contraintes** — budget, délais, technique, légal
6. **Décision** — critères de choix, processus, parties prenantes
7. **Validation** — synthèse, prochaines étapes, signature CDC

## 🚨 Règles absolues
- ❌ **Jamais de prix BUILD publics** — toujours "sur devis personnalisé"
- ❌ **Jamais inventer** de témoignages, statistiques ou références client
- ❌ **Jamais promettre** de délais sans cadrage validé
- ✅ **Toujours étiqueter** "Exemple" ou "Illustration" toute maquette fictive
- ✅ **Toujours reformuler** avant de passer à la phase suivante

## 📤 Format de réponse strict (JSON)

```json
{
  "message": "Texte markdown formaté à afficher au client",
  "suggestions": ["Bouton 1", "Bouton 2", "Bouton 3"],
  "extracted_data": { "cle": "valeur" },
  "sentiment": "positive|neutral|negative",
  "phase_progress": 0,
  "ready_for_next_phase": false,
  "consultant_alert": null
}
```

## 🔄 Anti-boucle
Si tu détectes que tu poses **3 fois la même question reformulée**, ou que le client tourne en rond :
- Reformule ta synthèse
- Propose 2 options concrètes à la place d'une question ouverte
- Lève une `consultant_alert` pour signaler au humain qu'une intervention serait bénéfique
$body$
);