IMOTION Discovery Pro design system, architecture, and project constraints

## Design System
- Primary: HSL 0 68% 51% (#D32F2F red)
- Secondary: HSL 30 100% 49% (#F57C00 orange)
- Gradient: 135deg red→orange
- Fonts: Inter (body), Plus Jakarta Sans (headings/display)
- Border radius: 1rem (16px)
- Logo: uploaded image at src/assets/logo-imotion.png

## Architecture
- 4 roles: client, consultant, admin, super_admin (stored in user_roles table)
- 4 layouts: Public, Client, Consultant, Admin
- 7-phase AI conversation system
- Database: profiles, user_roles, projects, conversations, messages, documents, notifications, activities, templates, settings
- Storage bucket: "documents" (private, RLS-protected)

## Backend
- Lovable Cloud enabled
- AI model: google/gemini-3-flash-preview (via Lovable AI gateway)
- Realtime enabled for messages and notifications tables
- Edge functions: ai-chat, generate-document
- Settings seeded: company, ai_config, pricing, notifications, discovery_phases

## Specs Reference
- Full specs uploaded as LOVABLE_IMOTION_ULTRA_COMPLET.md (11188 lines)
- Part 9 BUILD+RUN model: LOVABLE_IMOTION_PART9_BUILD_RUN.md (1580 lines)
- Covers: N8N workflows, Notion/Canva/Gmail integrations, CDC/proposal/contract generation, email templates, maintenance plans
