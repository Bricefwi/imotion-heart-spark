Document generation pipeline with 8 deliverable types

## Document Types
1. `cdc` - Cahier des Charges (CDC)
2. `conseil_technique` - Conseil Technique Stratégique (stack, archi, planning, ressources, outils IA/LLM)
3. `build_prompts` - Prompts de Build (prompt global Claude Opus, prompts par composant Lovable/Cursor, multi-agent orchestré, specs PRD)
4. `tech_recommendation` - Recommandation Technique & Prompt (legacy, combines both above)
5. `pricing` - Proposition Tarifaire Détaillée (3 options)
6. `contract_fr` - Contrat de Prestation (droit français)
7. `pv_reception` - Procès-Verbal de Réception
8. `proposal` - Proposition Commerciale

## Generation Flow
- CDC et Conseil Technique et Prompts Build sont générés en parallèle après la découverte
- Edge function: supabase/functions/generate-document/index.ts
- Helpers: supabase/functions/generate-document/helpers.ts
- Admin UI: src/pages/admin/ProjectDetail.tsx (pipeline cards + tabs)
- Model used: openai/gpt-5 via Lovable AI Gateway
