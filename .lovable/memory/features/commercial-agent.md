Floating AI commercial agent replacing static FAQ on pricing page

## Architecture
- Edge function: `supabase/functions/commercial-agent/index.ts`
  - Uses Lovable AI gateway with google/gemini-3-flash-preview
  - Streaming SSE responses
  - System prompt = static knowledge + dynamic context from DB
  - Dynamic context fetches: published blog posts (title, excerpt, slug, category, tags), platform stats (users, projects, posts count), site settings
  - Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for read-only data fetching
- Floating bubble: `src/components/FloatingChatAgent.tsx` — visible on all public pages via PublicLayout
- Inline agent: `src/components/landing/PricingAIAgent.tsx` — replaces PricingFAQ on /tarifs page
- PricingFAQ.tsx still exists but is no longer used on the pricing page
- config.toml updated with `[functions.commercial-agent]` verify_jwt = false
