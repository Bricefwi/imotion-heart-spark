

# Plan d'implémentation - Parties 5, 6, 7

J'ai analysé les 4 documents uploadés. Voici ce que je vais implémenter en priorité, en adaptant les specs au contexte Lovable Cloud.

## Ce qui est faisable maintenant

### 1. Conversation IA fonctionnelle (Edge Function + Lovable AI)
Les docs mentionnent Claude API, mais on va utiliser **Lovable AI** (google/gemini-3-flash-preview) qui ne nécessite pas de clé API. Cela inclut :
- Edge function `ai-chat` qui gère la conversation avec le système de prompts des 7 phases (tel que décrit dans Part 7)
- Extraction de données structurées des réponses (sentiment, intent, extracted_data, phase_progress)
- Progression automatique entre phases
- Connexion du frontend `ProjectConversation.tsx` aux vrais appels API + sauvegarde en base

### 2. Composants UI avancés (Part 6)
- `PhaseProgress` : composant avec points et labels pour les 7 phases (remplace la barre simple actuelle)
- `StatsCard` : composant réutilisable avec icone, valeur, trend
- `ChatInput` amélioré : auto-resize textarea, gestion pièces jointes
- `TypingIndicator` amélioré avec animation framer-motion

### 3. Connexion données réelles (remplacer les données démo)
- Client Dashboard : requêtes vers `projects`, `notifications`, `activities`
- Consultant Dashboard : requêtes avec filtres, stats agrégées
- Liste projets : données réelles depuis la table `projects`
- Création de projet : formulaire fonctionnel qui insère en base

### 4. Notifications temps réel
- Composant `NotificationCenter` avec badge compteur
- Écoute Supabase Realtime sur la table `notifications`
- Marquage lu/non-lu

### 5. Workflows internes (Part 5 - adapté en Edge Functions)
- Trigger sur création de projet : créer notification + log activité
- Trigger sur nouveau message : mettre à jour `total_messages` et `last_activity_at` du projet

## Ce qui nécessite des clés API externes (à configurer plus tard)
- Anthropic/Claude (conversation alternative)
- Perplexity (enrichissement contextuel)
- N8N webhooks
- Stripe (paiements)
- Yousign (signatures)
- Resend (emails)
- Notion, Canva MCP

## Ordre d'exécution
1. Edge function `ai-chat` + connexion conversation frontend
2. Composants UI avancés (PhaseProgress, StatsCard, NotificationCenter)
3. Connexion données réelles dans les dashboards
4. Création de projet fonctionnelle
5. Notifications realtime

