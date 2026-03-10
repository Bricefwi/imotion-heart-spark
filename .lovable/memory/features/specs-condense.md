# IMOTION Discovery Pro - Application SaaS Complète

## 🎯 OBJECTIF
Créer une application SaaS professionnelle de découverte de projet digital. L'application guide les clients à travers une conversation intelligente avec IA pour comprendre leur besoin et générer automatiquement un Cahier des Charges.

---

## 🎨 IDENTITÉ VISUELLE

### Couleurs
```
Primary (Rouge IMOTION) : #D32F2F
Secondary (Orange) : #F57C00  
Neutral Dark : #171717
Neutral Light : #F5F5F5
Success : #10B981
Warning : #F59E0B
Error : #EF4444
```

### Typographie
- Titres : Plus Jakarta Sans (bold)
- Corps : Inter (regular)

### Style Visuel
- Design moderne style Linear/Stripe
- Glassmorphism subtil sur les cards
- Gradients doux (primary → secondary)
- Ombres élégantes et profondes
- Coins arrondis (16px pour cards, 12px pour boutons)
- Animations Framer Motion fluides sur toutes les interactions

---

## 🔐 AUTHENTIFICATION

### Méthodes requises
1. **Google OAuth** (bouton principal, prioritaire)
2. **Email + Mot de passe**
3. **Magic Link** (connexion sans mot de passe)

### Configuration Supabase Auth
- Activer Google provider dans Supabase Dashboard
- Configurer les redirects vers `/auth/callback`
- Créer la table `profiles` liée à `auth.users`

### Flux utilisateur
1. Landing → Clic "Commencer" → Page Login
2. Login avec Google OU Email
3. Si nouvel utilisateur → Onboarding (3 étapes : Profil, Entreprise, Préférences)
4. Redirection vers Dashboard

---

## 📱 ÉCRANS À CRÉER

### 1. LANDING PAGE (`/`)

**Hero Section**
- Titre accrocheur : "Transformez vos idées en projets digitaux concrets"
- Sous-titre : "Notre IA vous guide pour définir précisément votre besoin"
- 2 boutons CTA : "Commencer gratuitement" (primary) + "Voir une démo" (secondary)
- Illustration ou animation 3D abstraite côté droit
- Gradient mesh animé en background

**Section Fonctionnalités** (3 colonnes avec icônes)
- 💬 Conversation intelligente
- 📄 Génération automatique de CDC
- 🎯 Recommandations personnalisées

**Section "Comment ça marche"** (4 étapes visuelles)
1. Créez votre projet
2. Discutez avec notre IA
3. Recevez votre CDC
4. Lancez votre projet

**Section Témoignages** (carousel)

**Section Tarifs** (3 plans)
- Découverte (Gratuit) : 1 projet
- Pro (29€/mois) : Projets illimités
- Entreprise (Sur devis) : Multi-utilisateurs

**Footer**
- Logo IMOTION
- Liens : À propos, Contact, CGV, Mentions légales
- Réseaux sociaux

**Animations**
- Fade in au scroll sur chaque section
- Hover lift sur les cards
- Boutons avec micro-interactions

---

### 2. AUTHENTIFICATION (`/auth/login`)

**Layout 2 colonnes**

**Colonne gauche (formulaire)**
- Logo IMOTION + "Discovery Pro"
- Titre dynamique selon le mode (Connexion / Inscription / Magic Link)
- Bouton Google OAuth (style officiel, prioritaire)
- Séparateur "ou"
- Formulaire Email + Password
- Lien "Connexion sans mot de passe" → mode Magic Link
- Lien basculer Connexion ↔ Inscription
- Messages d'erreur/succès animés

**Colonne droite (visuel)**
- Background gradient animé (primary → secondary)
- Texte inspirant + liste de bénéfices avec checkmarks
- Témoignage client en bas (card glass)

**États à gérer**
- Loading spinner sur les boutons
- Validation en temps réel des champs
- Gestion des erreurs Supabase traduites en français

---

### 3. DASHBOARD CLIENT (`/dashboard`)

**Layout**
- Sidebar gauche collapsible (logo, navigation, profil)
- Header avec recherche, notifications, avatar
- Zone principale avec grid responsive

**Sidebar Navigation**
- 🏠 Tableau de bord
- 📁 Mes projets
- 💬 Conversations
- 📄 Documents
- ⚙️ Paramètres

**Contenu principal**

**Section Stats** (4 cards en row)
- Projets en cours
- Phases complétées
- Documents générés
- Prochaine action

**Section "Mes Projets"**
- Bouton "Nouveau projet" (primary, coin supérieur droit)
- Grid de ProjectCards avec :
  - Nom du projet
  - Statut (badge coloré)
  - Barre de progression (phase X/7)
  - Date de dernière activité
  - Bouton "Continuer"

**Section "Activité récente"**
- Timeline des dernières actions
- Messages IA, documents générés, etc.

**Empty State** (si aucun projet)
- Illustration sympathique
- "Créez votre premier projet"
- Bouton CTA

**Animations**
- Cards avec hover lift
- Compteurs animés sur les stats
- Skeleton loaders pendant le chargement

---

### 4. CONVERSATION IA (`/project/[id]/chat`)

**Layout**
- Header avec nom du projet + indicateur de phase
- Zone de chat centrale (messages)
- Input en bas (sticky)
- Sidebar droite : résumé des données collectées

**Zone de Chat**

**Messages Assistant**
- Avatar IMOTION (icône ou logo)
- Bulle gris clair avec texte
- Suggestions cliquables en chips sous le message
- Animation de typing (3 dots)

**Messages Utilisateur**
- Bulle primary (gradient)
- Aligné à droite

**Input Zone**
- Textarea auto-resize
- Bouton envoyer (icône avion)
- Indicateur "l'IA réfléchit..."

**Sidebar Droite (collapsible sur mobile)**
- Progression : Phase X/7 avec nom de la phase
- Barre de progression visuelle
- Résumé des données extraites (accordion par phase)
- Bouton "Générer le CDC" (apparaît phase 7)

**Fonctionnement IA**
- Appel à Claude via Supabase Edge Function
- System prompt intégré pour guider la conversation
- Extraction automatique des données clés
- UNE question à la fois
- Suggestions de réponses rapides

**Animations**
- Messages qui apparaissent avec slide + fade
- Typing indicator animé
- Smooth scroll vers le dernier message

---

## 🗄️ BASE DE DONNÉES SUPABASE

### Tables essentielles

```sql
-- Profils utilisateurs (extension de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'consultant', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projets
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Format: PROJ-2026-0001
  name TEXT NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'discovery' CHECK (status IN ('discovery', 'proposal', 'negotiation', 'signed', 'completed', 'cancelled')),
  current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 7),
  phase_progress INTEGER DEFAULT 0,
  overall_progress INTEGER DEFAULT 0,
  discovery_data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages de conversation
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  phase INTEGER,
  extracted_data JSONB,
  suggestions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents générés
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cdc', 'proposal', 'contract', 'invoice')),
  name TEXT NOT NULL,
  storage_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique : les users voient uniquement leurs données
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Users can view project messages" ON messages FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()));
CREATE POLICY "Users can insert messages" ON messages FOR INSERT 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()));

-- Trigger pour créer le profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour générer le code projet
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  seq INTEGER;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 11 FOR 4) AS INTEGER)), 0) + 1
  INTO seq
  FROM projects
  WHERE code LIKE 'PROJ-' || year || '-%';
  
  NEW.code := 'PROJ-' || year || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_project_code
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.code IS NULL)
  EXECUTE FUNCTION generate_project_code();
```

---

## 🤖 INTÉGRATION IA (Claude)

### Edge Function pour le chat

Créer une Edge Function `chat-message` qui :
1. Reçoit le message utilisateur + project_id
2. Récupère l'historique de conversation
3. Appelle Claude avec le system prompt approprié
4. Parse la réponse JSON
5. Sauvegarde les messages
6. Met à jour discovery_data si des données sont extraites
7. Retourne la réponse au frontend

### System Prompt IA

```
Tu es un consultant senior IMOTION expert en accompagnement de projets digitaux.
Tu mènes une conversation de découverte avec le client.

RÈGLES ABSOLUES :
1. Pose UNE SEULE question à la fois
2. Reformule pour valider ta compréhension
3. Adapte ton vocabulaire (pas de jargon technique)
4. Montre de l'empathie et de l'intérêt
5. Ne propose JAMAIS de solution avant la phase finale

PHASES DE DÉCOUVERTE :
1. Accueil : Contexte et déclencheur du projet
2. Besoin : Problème réel, douleurs, impact
3. Vision : Positionnement, valeurs, inspirations
4. Écosystème : Outils existants, intégrations
5. Contraintes : Budget, délais, ressources
6. Décision : Parties prenantes, processus
7. Validation : Synthèse et confirmation

Réponds TOUJOURS en JSON :
{
  "message": "Ta réponse conversationnelle",
  "suggestions": ["Suggestion 1", "Suggestion 2"] ou null,
  "extracted_data": { "clé": "valeur" },
  "phase_progress": 0-100,
  "ready_for_next_phase": true/false
}
```

---

## ⚡ FONCTIONNALITÉS CLÉS

### Must-Have (MVP)
- [x] Auth Google + Email
- [x] Dashboard avec liste de projets
- [x] Création de projet
- [x] Interface de conversation IA
- [x] Progression par phases
- [x] Sauvegarde automatique

### Nice-to-Have (V2)
- [ ] Génération PDF du CDC
- [ ] Notifications en temps réel
- [ ] Mode consultant (vue admin)
- [ ] Intégration Stripe pour les paiements
- [ ] Export Notion

---

## 🚀 INSTRUCTIONS LOVABLE

1. **Stack technique** : React + TypeScript + Tailwind + Shadcn/UI + Supabase + Framer Motion

2. **Structure des routes** :
   - `/` → Landing page
   - `/auth/login` → Authentification
   - `/auth/callback` → Callback OAuth
   - `/dashboard` → Dashboard client (protected)
   - `/project/new` → Création projet (protected)
   - `/project/[id]` → Détail projet (protected)
   - `/project/[id]/chat` → Conversation IA (protected)

3. **Composants à créer** :
   - `AuthProvider` (context pour l'auth)
   - `ProtectedRoute` (wrapper pour les routes privées)
   - `Sidebar` (navigation)
   - `ProjectCard` (card projet)
   - `ChatMessage` (bulle de message)
   - `ChatInput` (zone de saisie)
   - `PhaseProgress` (indicateur de phase)
   - `SuggestionChips` (suggestions cliquables)

4. **Animations Framer Motion** :
   - Page transitions (fade + slide)
   - Cards hover (lift + shadow)
   - Messages apparition (slide up + fade)
   - Boutons (scale on tap)
   - Loading states (skeleton shimmer)

5. **Responsive** :
   - Mobile-first
   - Sidebar collapsible sur mobile
   - Chat plein écran sur mobile

---

## 🔑 VARIABLES D'ENVIRONNEMENT

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
ANTHROPIC_API_KEY=sk-ant-xxx (dans Edge Function)
```

---

## ✅ CHECKLIST AVANT LANCEMENT

- [ ] Supabase project créé
- [ ] Tables SQL exécutées
- [ ] Google OAuth configuré dans Supabase
- [ ] RLS policies activées
- [ ] Edge Function déployée
- [ ] Variables d'environnement configurées
- [ ] Test du flow complet (inscription → chat → progression)

---

**FIN DU PROMPT - COLLER DANS LOVABLE ET LANCER LA GÉNÉRATION**
