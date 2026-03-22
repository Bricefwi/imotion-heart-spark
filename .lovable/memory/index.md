# Memory: index.md
Updated: now

IMOTION Creator Studio design system, architecture, and project constraints

## Design System
- Primary: HSL 0 68% 51% (#D32F2F red)
- Secondary: HSL 30 100% 49% (#F57C00 orange)
- Gradient: 135deg red→orange
- Fonts: Inter (body), Plus Jakarta Sans (headings/display)
- Border radius: 1rem (16px)
- Logo: gradient square with "IM" text (will be replaced with uploaded logo)

## Architecture
- 4 roles: client, consultant, admin, super_admin (stored in user_roles table)
- 4 layouts: Public, Client, Consultant, Admin
- 7-phase AI conversation system
- Database: profiles, user_roles, projects, conversations, messages, documents, notifications, activities, templates, settings

## Backend
- Lovable Cloud enabled
- AI model: google/gemini-3-flash-preview (via Lovable AI gateway) — switched from gpt-5 for speed
- Realtime enabled for messages and notifications tables
