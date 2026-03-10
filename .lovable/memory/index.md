IMOTION Discovery Pro design system, architecture, and project constraints

## Design System
- Primary: HSL 0 68% 51% (#D32F2F red)
- Secondary: HSL 30 100% 49% (#F57C00 orange)
- Gradient: 135deg red→orange
- Fonts: Inter (body), Plus Jakarta Sans (headings/display)
- Border radius: 1rem (16px)
- Logo: uploaded image at src/assets/logo-imotion.png
- Style: Linear/Stripe modern, glassmorphism subtle, deep shadows, rounded corners

## Architecture
- 4 roles: client, consultant, admin, super_admin (stored in user_roles table)
- 4 layouts: Public, Client, Consultant, Admin
- 7-phase AI conversation system
- Database: profiles, user_roles, projects, conversations, messages, documents, notifications, activities, templates, settings
- Storage bucket: "documents" (private, RLS-protected)

## Auth Methods
- Google OAuth (primary button)
- Email + Password
- Magic Link (passwordless)

## Backend
- Lovable Cloud enabled
- AI model: google/gemini-3-flash-preview (via Lovable AI gateway)
- Realtime enabled for messages and notifications tables
- Edge functions: ai-chat, generate-document
- Settings seeded: company, ai_config, pricing, notifications, discovery_phases

## Illustrations
- Hero: src/assets/hero-illustration.png (isometric dashboard)
- Auth: src/assets/auth-illustration.png (abstract gradient waves)
- Team: src/assets/team-collaboration.jpg (professional photo)
- Process: src/assets/process-steps.png (4-step icons)

## Specs Reference
- Full specs: LOVABLE_IMOTION_ULTRA_COMPLET.md (11188 lines)
- Part 9 BUILD+RUN: LOVABLE_IMOTION_PART9_BUILD_RUN.md (1580 lines)
- Condensed specs: .lovable/memory/features/specs-condense.md (463 lines)
- Google Auth guide: GUIDE_GOOGLE_AUTH_LOVABLE.md
