
-- ============================================
-- TABLE: pricing_config
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  base_price INTEGER NOT NULL,
  price_range_min INTEGER NOT NULL,
  price_range_max INTEGER,
  duration_weeks_min INTEGER NOT NULL,
  duration_weeks_max INTEGER,
  default_features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: pricing_options
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_type TEXT NOT NULL,
  price_amount INTEGER NOT NULL,
  unit_label TEXT,
  applicable_to TEXT[] DEFAULT ARRAY['vitrine', 'ecommerce', 'webapp', 'plateforme'],
  duration_impact_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: pricing_maintenance
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL,
  sla_percentage DECIMAL(5,2) NOT NULL,
  support_response_hours INTEGER,
  evolution_hours_included INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  recommended_for TEXT[],
  is_highlighted BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: document_templates
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  available_variables JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: project_estimates
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  project_type_code TEXT REFERENCES pricing_config(code),
  base_price INTEGER NOT NULL,
  options_total INTEGER DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  discount_reason TEXT,
  final_price INTEGER NOT NULL,
  selected_options JSONB DEFAULT '[]',
  duration_weeks_min INTEGER,
  duration_weeks_max INTEGER,
  recommended_maintenance_code TEXT REFERENCES pricing_maintenance(code),
  complexity_score INTEGER,
  complexity_factors JSONB DEFAULT '[]',
  calculation_inputs JSONB DEFAULT '{}',
  calculation_rules_version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft',
  valid_until DATE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estimates_project ON project_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_current ON project_estimates(project_id, is_current) WHERE is_current = TRUE;

-- ============================================
-- TABLE: generated_documents
-- ============================================
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES project_estimates(id),
  document_type TEXT NOT NULL,
  template_code TEXT REFERENCES document_templates(code),
  document_number TEXT UNIQUE,
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  pdf_storage_path TEXT,
  pdf_url TEXT,
  variables_snapshot JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  requires_signature BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES profiles(id),
  signature_ip TEXT,
  sent_at TIMESTAMPTZ,
  sent_to TEXT[],
  opened_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_docs_project ON generated_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_type ON generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_gen_docs_number ON generated_documents(document_number);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Trigger: mark old estimates as not current
CREATE OR REPLACE FUNCTION public.set_estimate_not_current()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE project_estimates 
  SET is_current = FALSE 
  WHERE project_id = NEW.project_id AND id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER before_insert_estimate
  BEFORE INSERT ON project_estimates
  FOR EACH ROW EXECUTE FUNCTION set_estimate_not_current();

-- Trigger: auto-generate document number
CREATE OR REPLACE FUNCTION public.generate_document_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  prefix := CASE NEW.document_type
    WHEN 'cdc' THEN 'CDC'
    WHEN 'devis' THEN 'DEV'
    WHEN 'contrat' THEN 'CTR'
    WHEN 'facture' THEN 'FAC'
    ELSE 'DOC'
  END;
  
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_number FROM 10 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM generated_documents
  WHERE document_number LIKE prefix || '-' || year_str || '-%';
  
  NEW.document_number := prefix || '-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE TRIGGER set_document_number
  BEFORE INSERT ON generated_documents
  FOR EACH ROW
  WHEN (NEW.document_number IS NULL)
  EXECUTE FUNCTION generate_document_number();

-- ============================================
-- FUNCTION: calculate_project_estimate
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_project_estimate(p_project_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project RECORD;
  v_discovery JSONB;
  v_project_type TEXT;
  v_base_price INTEGER;
  v_options_total INTEGER := 0;
  v_complexity INTEGER := 2;
  v_duration_min INTEGER;
  v_duration_max INTEGER;
  v_selected_options JSONB := '[]'::JSONB;
  v_estimate_id UUID;
  v_maintenance_code TEXT;
BEGIN
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  v_discovery := v_project.discovery_data;
  
  IF v_discovery->'phase_2_besoin'->>'has_ecommerce' = 'true' THEN
    v_project_type := 'ecommerce';
  ELSIF v_discovery->'phase_4_ecosysteme'->>'needs_custom_app' = 'true' THEN
    v_project_type := 'webapp';
  ELSIF v_discovery->'phase_5_contraintes'->>'budget_min' IS NOT NULL 
        AND (v_discovery->'phase_5_contraintes'->>'budget_min')::INTEGER >= 25000 THEN
    v_project_type := 'plateforme';
  ELSE
    v_project_type := 'vitrine';
  END IF;
  
  SELECT base_price, duration_weeks_min, duration_weeks_max
  INTO v_base_price, v_duration_min, v_duration_max
  FROM pricing_config WHERE code = v_project_type;
  
  IF v_discovery->'phase_3_vision'->>'is_multilingual' = 'true' THEN
    v_options_total := v_options_total + 800;
    v_selected_options := v_selected_options || '[{"code": "multilingue", "name": "Site multilingue", "price": 800, "quantity": 1}]'::JSONB;
    v_duration_max := v_duration_max + 1;
  END IF;
  
  IF v_discovery->'phase_2_besoin'->>'needs_blog' = 'true' THEN
    v_options_total := v_options_total + 990;
    v_selected_options := v_selected_options || '[{"code": "blog", "name": "Module Blog", "price": 990, "quantity": 1}]'::JSONB;
    v_duration_max := v_duration_max + 1;
  END IF;
  
  IF v_discovery->'phase_4_ecosysteme'->'required_integrations' ? 'crm' THEN
    v_options_total := v_options_total + 990;
    v_selected_options := v_selected_options || '[{"code": "crm_integration", "name": "Intégration CRM", "price": 990, "quantity": 1}]'::JSONB;
    v_duration_max := v_duration_max + 1;
  END IF;
  
  v_complexity := 2;
  IF jsonb_array_length(COALESCE(v_discovery->'phase_4_ecosysteme'->'required_integrations', '[]'::JSONB)) > 3 THEN
    v_complexity := v_complexity + 1;
  END IF;
  IF v_discovery->'phase_5_contraintes'->>'deadline_urgent' = 'true' THEN
    v_complexity := v_complexity + 1;
  END IF;
  
  v_maintenance_code := CASE v_project_type
    WHEN 'vitrine' THEN 'essentiel'
    WHEN 'ecommerce' THEN 'confort'
    WHEN 'webapp' THEN 'confort'
    WHEN 'plateforme' THEN 'premium'
  END;
  
  INSERT INTO project_estimates (
    project_id, project_type_code, base_price, options_total, final_price,
    selected_options, duration_weeks_min, duration_weeks_max,
    recommended_maintenance_code, complexity_score, calculation_inputs, valid_until
  ) VALUES (
    p_project_id, v_project_type, v_base_price, v_options_total,
    v_base_price + v_options_total, v_selected_options, v_duration_min,
    v_duration_max, v_maintenance_code, v_complexity, v_discovery,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO v_estimate_id;
  
  RETURN v_estimate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- RLS Policies (using has_role function)
-- ============================================
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Pricing tables: public read for active items
CREATE POLICY "Anyone can read active pricing config" ON pricing_config FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Anyone can read active pricing options" ON pricing_options FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Anyone can read active pricing maintenance" ON pricing_maintenance FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Anyone can read active document templates" ON document_templates FOR SELECT USING (is_active = TRUE);

-- Admin management
CREATE POLICY "Admins manage pricing config" ON pricing_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pricing options" ON pricing_options FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pricing maintenance" ON pricing_maintenance FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage document templates" ON document_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Estimates: project participants + admins
CREATE POLICY "Project participants read estimates" ON project_estimates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_estimates.project_id AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Generated documents: project participants + admins
CREATE POLICY "Project participants read generated docs" ON generated_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = generated_documents.project_id AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- System/admin can insert estimates and generated documents
CREATE POLICY "Admins manage estimates" ON project_estimates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage generated docs" ON generated_documents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- INSERT INITIAL DATA
-- ============================================
INSERT INTO pricing_config (code, name, description, icon, base_price, price_range_min, price_range_max, duration_weeks_min, duration_weeks_max, default_features, display_order, is_popular) VALUES
('vitrine', 'Site Vitrine', 'Présentez votre activité avec élégance', 'Globe', 2490, 2490, 6000, 3, 5, '["3-5 pages", "Design personnalisé", "Responsive mobile", "SEO de base", "Formulaire contact"]', 1, false),
('ecommerce', 'E-commerce', 'Vendez vos produits en ligne', 'ShoppingCart', 4990, 4990, 15000, 6, 10, '["Catalogue produits", "Paiement sécurisé", "Gestion stocks", "Espace client", "Tableau de bord"]', 2, true),
('webapp', 'Application Web', 'Digitalisez vos processus métier', 'Smartphone', 9990, 9990, 35000, 10, 14, '["Authentification", "Dashboard interactif", "API sur-mesure", "Intégrations", "Multi-utilisateurs"]', 3, false),
('plateforme', 'Plateforme', 'Projets complexes et ambitieux', 'Building2', 25000, 25000, NULL, 16, NULL, '["Architecture scalable", "Multi-tenants", "IA & automatisation", "Intégrations avancées", "Support dédié"]', 4, false);

INSERT INTO pricing_options (code, name, description, category, price_type, price_amount, unit_label, applicable_to, duration_impact_days) VALUES
('design_premium', 'Design Premium', 'Direction artistique poussée, moodboards, 3 propositions', 'design', 'fixed', 1500, NULL, ARRAY['vitrine', 'ecommerce', 'webapp', 'plateforme'], 5),
('pages_supplementaires', 'Pages supplémentaires', 'Au-delà du forfait de base', 'design', 'per_unit', 350, 'par page', ARRAY['vitrine', 'ecommerce'], 2),
('multilingue', 'Site multilingue', 'Gestion de plusieurs langues', 'design', 'per_unit', 800, 'par langue', ARRAY['vitrine', 'ecommerce', 'webapp'], 7),
('blog', 'Module Blog', 'Système de publication d''articles', 'fonctionnalite', 'fixed', 990, NULL, ARRAY['vitrine', 'ecommerce'], 5),
('espace_membre', 'Espace membre', 'Authentification et profils utilisateurs', 'fonctionnalite', 'fixed', 1490, NULL, ARRAY['vitrine'], 7),
('reservation', 'Système de réservation', 'Calendrier et prise de RDV', 'fonctionnalite', 'fixed', 1990, NULL, ARRAY['vitrine', 'webapp'], 10),
('paiement_abonnement', 'Paiements récurrents', 'Gestion des abonnements', 'fonctionnalite', 'fixed', 1490, NULL, ARRAY['ecommerce', 'webapp'], 7),
('marketplace', 'Mode Marketplace', 'Multi-vendeurs', 'fonctionnalite', 'fixed', 4990, NULL, ARRAY['ecommerce'], 21),
('crm_integration', 'Intégration CRM', 'HubSpot, Salesforce, Pipedrive...', 'integration', 'fixed', 990, NULL, ARRAY['vitrine', 'ecommerce', 'webapp'], 5),
('erp_integration', 'Intégration ERP', 'SAP, Odoo, Sage...', 'integration', 'fixed', 2490, NULL, ARRAY['ecommerce', 'webapp', 'plateforme'], 14),
('api_custom', 'API personnalisée', 'Développement d''API sur-mesure', 'integration', 'hourly', 95, 'par heure', ARRAY['webapp', 'plateforme'], 0),
('sso', 'Single Sign-On', 'Connexion unifiée (Google, Microsoft...)', 'integration', 'fixed', 1290, NULL, ARRAY['webapp', 'plateforme'], 5),
('formation_avancee', 'Formation avancée', 'Session de 4h en visio', 'support', 'fixed', 490, NULL, ARRAY['vitrine', 'ecommerce', 'webapp', 'plateforme'], 0),
('accompagnement_lancement', 'Accompagnement lancement', 'Support renforcé 2 semaines', 'support', 'fixed', 990, NULL, ARRAY['ecommerce', 'webapp', 'plateforme'], 0),
('audit_seo', 'Audit SEO complet', 'Analyse et recommandations', 'support', 'fixed', 790, NULL, ARRAY['vitrine', 'ecommerce'], 0);

INSERT INTO pricing_maintenance (code, name, description, monthly_price, sla_percentage, support_response_hours, evolution_hours_included, features, recommended_for, is_highlighted, display_order) VALUES
('essentiel', 'Essentiel', 'Pour les sites vitrines', 199, 99.00, 48, 0, '["Hébergement sécurisé", "Mises à jour de sécurité", "Sauvegarde quotidienne", "Support email 48h"]', ARRAY['vitrine'], false, 1),
('confort', 'Confort', 'Pour les e-commerces et apps', 399, 99.50, 24, 2, '["Hébergement haute dispo", "Mises à jour de sécurité", "Sauvegarde quotidienne", "Support réactif 24h", "2h d''évolutions/mois", "Monitoring 24/7"]', ARRAY['ecommerce', 'webapp'], true, 2),
('premium', 'Premium', 'Pour les plateformes critiques', 799, 99.90, 4, 5, '["Infrastructure dédiée", "Mises à jour prioritaires", "Sauvegarde temps réel", "Support téléphone 4h", "5h d''évolutions/mois", "Account manager dédié"]', ARRAY['webapp', 'plateforme'], false, 3);

-- Insert document templates
INSERT INTO document_templates (code, name, description, template_content, available_variables) VALUES
('cdc', 'Cahier des Charges', 'Template du CDC généré automatiquement', 
'# Cahier des Charges
## {{project.name}}

**Référence** : {{project.code}}
**Date** : {{document.date}}
**Client** : {{client.company_name}} - {{client.full_name}}
**Version** : {{document.version}}

---

## 1. Résumé Exécutif

### Contexte
{{discovery.context}}

### Objectif Principal
{{discovery.main_objective}}

### Type de Projet
**{{estimate.project_type}}** - Budget estimé : **{{estimate.price_range}}**

---

## 2. Analyse du Besoin

### Problématiques Identifiées
{{discovery.pain_points}}

### Impact Business
{{discovery.impact_business}}

---

## 3. Objectifs du Projet

### Objectifs Business
{{discovery.business_objectives}}

### Indicateurs de Succès (KPIs)
{{discovery.kpis}}

---

## 4. Périmètre Fonctionnel

### Fonctionnalités Essentielles
{{scope.must_have}}

### Fonctionnalités Souhaitées
{{scope.nice_to_have}}

---

## 5. Écosystème Technique

### Outils Actuels
{{discovery.current_tools}}

### Intégrations Requises
{{discovery.required_integrations}}

---

## 6. Contraintes

### Budget
- **Fourchette** : {{estimate.price_range}}
- **Estimation** : {{estimate.final_price}}€

### Délais
- **Échéance souhaitée** : {{discovery.deadline}}
- **Durée estimée** : {{estimate.duration_weeks_min}}-{{estimate.duration_weeks_max}} semaines

---

## 7. Estimation Budgétaire

| Poste | Montant |
|-------|---------|
| {{estimate.project_type}} (base) | {{estimate.base_price}}€ |
| Options | {{estimate.options_total}}€ |
| **Total HT** | **{{estimate.final_price}}€** |

### Forfait Maintenance Recommandé
**{{estimate.recommended_maintenance}}** - {{estimate.maintenance_price}}€/mois

---

*Document généré automatiquement par Clarivi le {{document.generated_at}}*',
'["project", "client", "discovery", "estimate", "scope", "document"]'),

('devis', 'Devis', 'Template du devis commercial',
'# DEVIS N° {{document.number}}

**Date** : {{document.date}}
**Validité** : 30 jours

## Destinataire
**{{client.company_name}}**
{{client.full_name}} - {{client.email}}

## Objet : {{project.name}}
Référence projet : {{project.code}}

## Détail de la Prestation

### Phase BUILD - Réalisation

| Désignation | Montant HT |
|-------------|----------|
| {{estimate.project_type}} - Forfait de base | {{estimate.base_price}}€ |
| Options additionnelles | {{estimate.options_total}}€ |
| **Sous-total BUILD** | **{{estimate.build_total}}€** |

### Phase RUN - Maintenance (optionnel)

| Forfait | Prix Mensuel |
|---------|--------------|
| {{estimate.recommended_maintenance}} | {{estimate.maintenance_price}}€/mois |

## Récapitulatif

| | Montant |
|--|---------|
| Total BUILD HT | {{estimate.build_total_after_discount}}€ |
| TVA (20%) | {{estimate.tva_amount}}€ |
| **Total BUILD TTC** | **{{estimate.build_total_ttc}}€** |

## Conditions de Paiement

| Étape | % | Montant |
|-------|---|---------|
| Acompte à la commande | 30% | {{payment.acompte}}€ |
| Validation maquettes | 20% | {{payment.maquettes}}€ |
| Livraison recette | 35% | {{payment.recette}}€ |
| Mise en production | 15% | {{payment.production}}€ |

**Durée estimée** : {{estimate.duration_weeks_min}} à {{estimate.duration_weeks_max}} semaines

---

*Devis généré par Clarivi le {{document.generated_at}}*',
'["project", "client", "estimate", "payment", "document"]'),

('contrat', 'Contrat de Prestation', 'Template du contrat de prestation de services',
'# CONTRAT DE PRESTATION DE SERVICES
## N° {{document.number}}

## ENTRE LES SOUSSIGNÉS

**IMOTION Conseil**
Ci-après dénommée « **Le Prestataire** »

ET

**{{client.company_name}}**
Représentée par {{client.full_name}}, en qualité de {{client.company_role}}
Ci-après dénommée « **Le Client** »

## ARTICLE 1 - OBJET

Le présent contrat a pour objet : **{{project.name}}**
Type de projet : {{estimate.project_type}}

## ARTICLE 2 - DURÉE
**Durée prévisionnelle** : {{estimate.duration_weeks_min}} à {{estimate.duration_weeks_max}} semaines

## ARTICLE 3 - PRIX

| Désignation | Montant HT |
|-------------|------------|
| Développement | {{estimate.final_price}}€ |
| TVA (20%) | {{estimate.tva_amount}}€ |
| **Total TTC** | **{{estimate.total_ttc}}€** |

## ARTICLE 4 - MODALITÉS DE PAIEMENT

| Étape | % | Montant TTC |
|-------|---|-------------|
| Acompte | 30% | {{payment.acompte_ttc}}€ |
| Maquettes validées | 20% | {{payment.maquettes_ttc}}€ |
| Livraison recette | 35% | {{payment.recette_ttc}}€ |
| Mise en production | 15% | {{payment.production_ttc}}€ |

---

*Contrat généré par Clarivi le {{document.generated_at}}*',
'["project", "client", "estimate", "payment", "scope", "discovery", "document"]');
