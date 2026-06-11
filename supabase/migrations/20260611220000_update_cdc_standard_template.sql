-- Le template cdc-standard (is_default = true) court-circuitait buildDocumentPrompt() V3.
-- On le désactive comme template par défaut pour que la génération utilise le prompt V3 enrichi.
-- Le template reste disponible en admin pour consultation et sélection manuelle.
UPDATE templates SET is_default = false WHERE code = 'cdc-standard';

-- Mise à jour du contenu avec la structure V3 (9 chapitres) et toutes les variables disponibles.
-- Ce contenu sert de prompt enrichi quand le template est sélectionné manuellement.
UPDATE templates SET
  template_content = $TEMPLATE$
# GÉNÉRATION CDC — {{project_name}}

> **Instructions de génération** : À partir des données client ci-dessous, génère un Cahier des Charges COMPLET de 4500 à 7000 mots, structuré en 9 chapitres, en Markdown professionnel. Minimum 5 verbatim clients entre guillemets. Distingue FAITS CLIENT vs PRÉCONISATIONS IMOTION. Ne jamais inventer de concurrents ou statistiques.

---

## CONTEXTE CLIENT

| Champ | Valeur |
|---|---|
| Entreprise | {{client_company}} |
| Contact | {{client_name}} — {{client_role}} |
| Secteur | {{client_industry}} |
| Taille | {{client_size}} |
| Email | {{client_email}} |
| Téléphone | {{client_phone}} |
| Site actuel | {{client_website}} |
| LinkedIn | {{social_linkedin}} |
| Budget | {{budget_min}}€ – {{budget_max}}€ HT |
| Deadline | {{desired_deadline}} |
| Phase discovery | {{current_phase}} |
| Score qualification | {{qualification_score}} |

---

## DONNÉES DE DÉCOUVERTE COLLECTÉES

```json
{{discovery_data}}
```

---

## HISTORIQUE DES ÉCHANGES CLIENT (7 phases)

{{conversation_context}}

---

## DOCUMENT À PRODUIRE

Génère le CDC complet ci-dessous, en respectant scrupuleusement la structure et les instructions de chaque chapitre.

# Cahier des Charges — {{project_name}}

> Document confidentiel établi pour **{{client_company}}** ({{client_name}}, {{client_role}}) | Réf. {{project_code}} | {{document.date}}

---

## Chapitre 1 — Contexte & Objectifs Stratégiques

### 1.1 Présentation de {{client_company}}
[Synthèse stratégique en 3-4 paragraphes : secteur, marché, positionnement actuel, taille, enjeux. Exploiter {{client_industry}}, {{client_size}}, les échanges phase 1.]

### 1.2 Origine du besoin & déclencheur
[Déclencheur précis du projet, douleurs actuelles, opportunité identifiée. Citer 2+ verbatim client.]

### 1.3 Objectifs SMART du projet

| Objectif | Indicateur | Cible | Horizon |
|---|---|---|---|
| [Objectif 1] | [KPI] | [Valeur] | [Date] |
| [Objectif 2] | [KPI] | [Valeur] | [Date] |
| [Objectif 3] | [KPI] | [Valeur] | [Date] |

### 1.4 Périmètre du projet
[Ce qui est inclus / exclu. Frontières claires du périmètre.]

---

## Chapitre 2 — Identité de Marque & Direction Artistique

### 2.1 Brief créatif
[Synthèse de l'identité voulue, tonalité, émotions-clés de la marque. Citer références visuelles mentionnées.]

### 2.2 Système de couleurs recommandé

| Rôle | Couleur | Code HEX | Usage |
|---|---|---|---|
| Primaire | [Nom] | #XXXXXX | CTA, titres, éléments forts |
| Secondaire | [Nom] | #XXXXXX | Accents, illustrations |
| Neutre | [Nom] | #XXXXXX | Textes, fonds |
| Alerte | [Nom] | #XXXXXX | Erreurs, notifications |

**PRÉCONISATION IMOTION** : [Justification du choix de palette basé sur l'identité de marque]

### 2.3 Typographie recommandée
[Police principale (titres) + secondaire (corps). Grille typographique complète.]

### 2.4 Direction artistique photographique & illustrative
[Photo vs illustration vs les deux. Style photographique, cadrage, ambiance. Types d'illustrations si applicable. Citer préférences exprimées par le client.]

### 2.5 Ton éditorial & voix de marque
[Registre de langage, vouvoiement/tutoiement, style rédactionnel, mots à éviter/privilégier.]

### 2.6 Système de design recommandé
[Design system recommandé (ex: Tailwind + shadcn, Material, custom). Justification selon le stack et les besoins.]

---

## Chapitre 3 — Cibles & Positionnement

### 3.1 Personas détaillés

**Persona 1 — [Nom/Archétype]**
[Âge, profession, comportements digitaux, motivations, frustrations, citation-type. Basé sur les échanges client.]

**Persona 2 — [Nom/Archétype]**
[Idem pour le second segment cible.]

### 3.2 Proposition de valeur par cible

| Persona | Problème principal | Solution apportée | Différenciateur clé |
|---|---|---|---|
| [Persona 1] | [Problème] | [Solution] | [Différenciateur] |
| [Persona 2] | [Problème] | [Solution] | [Différenciateur] |

### 3.3 Parcours client (Customer Journey)
[Étapes clés du parcours : Découverte → Considération → Décision → Fidélisation. Points de contact digitaux à chaque étape.]

### 3.4 Positionnement marché
[Synthèse du positionnement différenciant dans son secteur.]

---

## Chapitre 4 — Fonctionnalités & User Stories

### 4.1 Tableau MoSCoW

| Fonctionnalité | Priorité | Complexité | User Story |
|---|---|---|---|
| [Feature 1] | MUST | [H/M/L] | En tant que [persona], je veux [action] pour [bénéfice] |
| [Feature 2] | SHOULD | [H/M/L] | [User story] |
| [Feature 3] | COULD | [H/M/L] | [User story] |
| [Feature 4] | WON'T | - | [Hors périmètre] |

### 4.2 Tableau des automatisations & intégrations

| Automatisation | Outil recommandé | Déclencheur | Action | Valeur ajoutée |
|---|---|---|---|---|
| [Auto 1] | [n8n/Make/Zapier] | [Trigger] | [Action] | [Gain] |
| [Auto 2] | [CRM/outil] | [Trigger] | [Action] | [Gain] |

### 4.3 Intégrations tierces
[Liste des intégrations nécessaires : CRM, paiement, analytics, email marketing, etc.]

---

## Chapitre 5 — Spécifications Techniques

### 5.1 Architecture recommandée
[Stack no-code/low-code/code. Justification de chaque choix technologique.]

### 5.2 Hébergement & infrastructure
[Hébergement, CDN, domaine, certificats SSL, sauvegardes.]

### 5.3 Design system & composants
[Bibliothèque UI choisie, grille responsive, breakpoints, tokens de design.]

### 5.4 Accessibilité (WCAG)
[Niveau cible : WCAG AA minimum. Contraste, navigation clavier, alt texts, ARIA.]

### 5.5 SEO technique
[Structure d'URL, sitemap, métadonnées, Core Web Vitals, performance cible (LCP < 2.5s).]

### 5.6 Sécurité & conformité RGPD
[Gestion des données, consentement cookies, politique de confidentialité, droits RGPD.]

---

## Chapitre 6 — Contenu & Médias

### 6.1 Inventaire des contenus existants

| Contenu | Disponible | Format | Qualité | Action requise |
|---|---|---|---|---|
| Logo | [Oui/Non] | [Format] | [Qualité] | [Action] |
| Photos | [Oui/Non] | [Format] | [Qualité] | [Action] |
| Textes | [Oui/Non] | [Format] | [Qualité] | [Action] |
| Vidéos | [Oui/Non] | [Format] | [Qualité] | [Action] |

### 6.2 Plan de production des contenus
[Qui produit quoi : client vs IMOTION. Planning de livraison des contenus.]

### 6.3 Architecture éditoriale
[Structure des pages, hiérarchie des contenus, stratégie de maillage interne.]

### 6.4 Spécifications médias
[Formats images (WebP, PNG, JPEG), résolutions, poids max, ratio vidéo, formats audio si applicable.]

---

## Chapitre 7 — Concurrence & Benchmarks

> **RÈGLE ANTI-HALLUCINATION** : N'analyser QUE les concurrents explicitement nommés par le client dans les échanges. Pour toute entreprise non citée, utiliser [A confirmer lors du cadrage].

### 7.1 Concurrents identifiés par le client
[Analyse de chaque concurrent cité : positionnement, forces, faiblesses, ce qu'il faut faire mieux.]

### 7.2 Grille de benchmarking

| Critère | {{client_company}} (actuel) | Concurrent 1 | Concurrent 2 | Objectif projet |
|---|---|---|---|---|
| [Critère 1] | [Note/10] | [Note/10] | [Note/10] | [Cible] |
| [Critère 2] | [Note/10] | [Note/10] | [Note/10] | [Cible] |

### 7.3 Opportunités de différenciation
[Ce que le marché ne fait pas encore et que ce projet peut apporter.]

---

## Chapitre 8 — Budget & Planning

### 8.1 Planning de réalisation

| Semaine | Phase | Livrables | Responsable |
|---|---|---|---|
| S1-S2 | Cadrage & design | Maquettes UX, wireframes | IMOTION |
| S3-S4 | Design UI | Charte graphique, prototypes | IMOTION |
| S5-S8 | Développement | Intégration, fonctionnalités | IMOTION |
| S9-S10 | Tests & recette | QA, corrections, formation | IMOTION + {{client_company}} |
| S11 | Mise en production | Déploiement, monitoring | IMOTION |

### 8.2 RACI

| Activité | {{client_company}} | IMOTION | Prestataires tiers |
|---|---|---|---|
| Validation maquettes | A | R | - |
| Fourniture contenus | R | A | - |
| Développement | I | R | C |
| Recette finale | A | R | - |

### 8.3 Matrice des risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Retard livraison contenus client | Élevée | Fort | Planning de livraison contractualisé |
| Dérive du périmètre | Moyenne | Fort | Protocole d'avenant formalisé |
| Indisponibilité API tierce | Faible | Moyen | Fournisseur alternatif identifié |
| Dépassement budget | Faible | Fort | Points de suivi bi-hebdomadaires |
| Retard validation client | Moyenne | Moyen | SLA de validation sous 5 jours ouvrés |

### 8.4 Échéancier de paiement

| Jalon | % | Montant HT | Déclencheur |
|---|---|---|---|
| Acompte | 30% | [Montant]€ | Signature du contrat |
| Validation maquettes | 20% | [Montant]€ | Validation phase design |
| Recette | 35% | [Montant]€ | Validation des tests |
| Mise en production | 15% | [Montant]€ | Livraison finale |

---

## Chapitre 9 — Livrables, Gouvernance & Prochaines Étapes

### 9.1 Liste des livrables contractuels
[Liste complète et précise de tout ce qui sera livré.]

### 9.2 Conditions de recette
[Critères objectifs de validation : fonctionnels, techniques, visuels. Protocole de réserves et délais de correction.]

### 9.3 KPIs de succès (à 6 mois)

| KPI | Valeur actuelle | Objectif | Méthode de mesure |
|---|---|---|---|
| [KPI 1] | [Valeur] | [Cible] | [Outil] |
| [KPI 2] | [Valeur] | [Cible] | [Outil] |

### 9.4 Prochaines étapes immédiates

1. **Signature du contrat et de ce CDC** — délai : 5 jours ouvrés
2. **Versement de l'acompte** — déclencheur de démarrage
3. **Kick-off de projet** — réunion de lancement (à planifier)
4. **Fourniture des éléments par {{client_company}}** : [liste des éléments attendus]
5. **Livraison des premières maquettes** — selon planning

### 9.5 Clause de confidentialité
Ce document et son contenu sont strictement confidentiels. Toute reproduction ou diffusion à des tiers est soumise à l'accord écrit d'IMOTION Creator Studio.

---

*Document élaboré par IMOTION Creator Studio | www.imotion-conseils.fr | {{document.date}}*
$TEMPLATE$,
  available_variables = '[
    {"name": "project_name", "description": "Nom du projet", "default_value": ""},
    {"name": "project_code", "description": "Référence projet", "default_value": ""},
    {"name": "client_name", "description": "Nom complet du client", "default_value": ""},
    {"name": "client_company", "description": "Nom de l entreprise cliente", "default_value": ""},
    {"name": "client_role", "description": "Fonction/rôle du contact", "default_value": ""},
    {"name": "client_industry", "description": "Secteur d activité", "default_value": ""},
    {"name": "client_size", "description": "Taille de l entreprise", "default_value": ""},
    {"name": "client_email", "description": "Email du client", "default_value": ""},
    {"name": "client_phone", "description": "Téléphone du client", "default_value": ""},
    {"name": "client_website", "description": "Site web actuel du client", "default_value": ""},
    {"name": "social_linkedin", "description": "LinkedIn du client", "default_value": ""},
    {"name": "budget_min", "description": "Budget minimum HT", "default_value": ""},
    {"name": "budget_max", "description": "Budget maximum HT", "default_value": ""},
    {"name": "desired_deadline", "description": "Deadline souhaitée", "default_value": ""},
    {"name": "current_phase", "description": "Phase discovery actuelle", "default_value": ""},
    {"name": "qualification_score", "description": "Score de qualification", "default_value": ""},
    {"name": "discovery_data", "description": "Données de découverte JSON", "default_value": "{}"},
    {"name": "conversation_context", "description": "Historique des échanges par phase", "default_value": ""},
    {"name": "document.date", "description": "Date du document", "default_value": ""}
  ]'::json
WHERE code = 'cdc-standard';
