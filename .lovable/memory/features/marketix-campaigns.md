---
name: MARKETIX Campaigns
description: Génération manuelle de campagnes marketing via agent MARKETIX, admin/consultant only
type: feature
---
Table: mkt_marketix_campaigns (RLS admin/super_admin/consultant only — clients pas d'accès).
Edge fn: marketix-generate-campaign (POST, JWT vérifié, rôle requis). Appelle callMistralAgent('marketix', ...) avec prompt JSON strict.
Page: /admin/marketing-campaigns (icône Megaphone, sidebar "Outils IA").
Déclenchement: MANUEL UNIQUEMENT (pas d'auto post-audit). Décision validée 2026-06-12.
Format sortie attendu: JSON {positionning, key_messages, segments, channel_plan, content_calendar, creatives, kpis, next_steps}. Si JSON non parsable → status "ready_unparsed" + raw_response.
Charte respectée: gradient Coral→Amber sur CTA, Inter, pas de prix BUILD ni stats inventées dans le prompt.
