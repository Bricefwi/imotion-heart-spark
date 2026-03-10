Blog system with auto-generation via CRON (pg_cron, 1st & 15th of each month at 9h)

## Tables
- blog_posts: slug, title, excerpt, content (markdown), category, tags, view_count, is_published
- blog_editorial_calendar: 26 articles planned for 2026, status tracking
- newsletter_subscribers: email subscription

## Categories
- expression-besoin, image-identite, strategie, cas-clients, outils

## Edge Function
- generate-blog-post: uses Lovable AI (gemini-3-flash) with tool calling for structured output
- Auth: CRON_SECRET or admin JWT
- Generates up to 2 articles per run from editorial calendar

## Routes
- /blog - Article list with category filters, search, sidebar (newsletter + popular)
- /blog/:slug - Article detail with TOC, reading progress, share, related articles

## Landing Integration
- BlogPreviewSection shows 3 latest published articles on landing page

## CRON
- pg_cron job: generate-blog-posts-biweekly (0 9 1,15 * *)
- Secret: CRON_SECRET
