

# IMOTION Discovery Pro — Plan d'implémentation complet

## 1. Design System & Fondations
- Configurer le thème IMOTION dans Tailwind : couleurs primaires (rouge #D32F2F), secondaires (orange #F57C00), neutres, sémantiques
- Importer les polices **Inter** (corps) et **Plus Jakarta Sans** (titres) via Google Fonts
- Créer le composant **Logo** (en code pour l'instant, à remplacer par le fichier logo uploadé)
- Personnaliser les composants shadcn/ui : boutons gradient, cards arrondies (16px), inputs stylisés
- Définir les styles de base : boutons primary/secondary/accent, cards, inputs

## 2. Layout & Navigation
- **Layout public** : header avec logo, navigation (Fonctionnalités, Tarifs, À propos), boutons Se connecter / Démarrer
- **Layout client** : sidebar avec navigation (Dashboard, Projets, Documents, Profil)
- **Layout consultant** : sidebar étendue (Dashboard, Projets, Clients, Analytics, Templates)
- **Layout admin** : sidebar admin (Dashboard, Utilisateurs, Paramètres, Intégrations, Logs)
- Navigation responsive mobile-first

## 3. Pages publiques
- **Landing Page** : hero section avec CTA, 3 colonnes fonctionnalités, social proof (stats, témoignages), section tarifs (Découverte/Standard/Premium), CTA final, footer
- **Page Tarifs** détaillée

## 4. Authentification (Lovable Cloud / Supabase)
- Page **Connexion** : split-screen (formulaire à gauche, illustration gradient à droite), Google OAuth + email/mot de passe
- Page **Inscription** : formulaire multi-étapes avec informations professionnelles
- Page **Mot de passe oublié** + page **Reset password**
- Gestion des sessions avec `onAuthStateChange`

## 5. Base de données (Lovable Cloud)
- Table **profiles** : infos personnelles, professionnelles, préférences, onboarding, tracking
- Table **user_roles** (séparée) : rôles client/consultant/admin/super_admin avec fonction `has_role` security definer
- Table **projects** : statuts, phases 1-7, discovery_data JSONB, qualification, données financières
- Table **conversations** : sessions de conversation par projet
- Table **messages** : contenu, rôle, données extraites IA, sentiment, pièces jointes
- Table **documents** : CDC, devis, contrats, stockage, signature
- Table **notifications** : multicanal, types variés
- Table **activities** : log d'activité
- Table **templates** : modèles de documents
- Table **settings** : configuration système
- **RLS policies** complètes pour chaque table
- **Fonctions SQL** : generate_project_code, update_updated_at triggers, calculate_project_progress, create_notification, log_activity

## 6. Espace Client
- **Dashboard client** : carte de bienvenue, 3 stats cards (projets actifs, documents à signer, budget), projet en cours avec progression des phases, activité récente, prochaines étapes
- **Création de projet** : formulaire guidé avec génération de code unique
- **Liste des projets** avec filtres et statuts
- **Interface de conversation IA** : bulles de messages stylisées (user rouge, assistant blanc, consultant orange), indicateur de frappe, suggestions de réponses, barre de progression des 7 phases, boutons pièce jointe / micro / pause / demander un appel
- **Vue documents** : liste des documents liés au projet

## 7. Espace Consultant
- **Dashboard consultant** : 5 stats globales, projets prioritaires, tâches en attente, activité temps réel, tunnel de conversion
- **Liste projets** avec filtres avancés, badges priorité/statut, score de qualification
- **Vue projet détaillée** avec onglets : Conversation (mode intervention), Synthèse, Documents, Notes internes, Historique
- **Panneau latéral** : infos client, progression détaillée, qualification éditable, actions rapides (Générer CDC / Devis / Contrat, Relancer client, Exporter)

## 8. Espace Admin
- **Dashboard admin** : métriques système
- **Gestion des utilisateurs** : liste, rôles, activation/désactivation
- **Configuration système** : paramètres entreprise, configuration IA, tarification, notifications
- **Gestion des templates** de documents
- **Logs d'activité** système

## 9. Système de conversation IA (7 phases)
- Structure des 7 phases : Accueil → Exploration besoin → Vision → Écosystème → Contraintes → Profil décisionnel → Synthèse & Validation
- Progression automatique entre phases
- Extraction de données structurées des réponses
- Suggestions de réponses contextuelles
- Sauvegarde temps réel des messages

## 10. Notifications
- Notifications in-app temps réel (Supabase Realtime)
- Centre de notifications avec badge compteur
- Types : message reçu, statut projet changé, document prêt, signature requise, rappel

## 11. Routing complet
- `/` — Landing page
- `/login`, `/register`, `/forgot-password`, `/reset-password` — Auth
- `/client/dashboard`, `/client/projects`, `/client/projects/:id/conversation` — Client
- `/consultant/dashboard`, `/consultant/projects`, `/consultant/projects/:id` — Consultant
- `/admin/dashboard`, `/admin/users`, `/admin/settings` — Admin
- Routes protégées par rôle

> **Note** : Veuillez uploader votre fichier logo IMOTION pour que je puisse l'intégrer. Les intégrations externes (Claude AI, Perplexity, N8N, Stripe, Yousign) seront préparées côté interface mais nécessiteront une configuration API séparée.

