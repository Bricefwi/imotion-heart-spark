-- Le template 'cdc' basique de document_templates court-circuite le prompt riche
-- défini dans generate-document/index.ts (priorité pricingTemplate ?? template).
-- On le désactive pour que la génération utilise le prompt complet avec
-- l'historique de conversation, les données de découverte et le contexte pricing.
UPDATE document_templates SET is_active = false WHERE code = 'cdc';
