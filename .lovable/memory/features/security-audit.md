Security audit performed on 2026-03-10. All findings addressed.

## RLS Fixes Applied
- newsletter_subscribers: removed public SELECT (was exposing all emails to unauthenticated users)
- settings: restricted SELECT to authenticated users only (was exposing billing config, AI params)
- blog_editorial_calendar: restricted SELECT to admin/consultant roles (was exposing unpublished strategy)
- templates: restricted SELECT to authenticated users only (was exposing proprietary prompts)
- conversations: added missing UPDATE policy for project members
- contact_messages: new table with INSERT for anon+authenticated, ALL for admins only

## Auth Hardening
- Password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char (enforced via zod)
- Visual password strength indicator on Register and ResetPassword pages
- Input validation with zod on registration (name, email, password)

## Edge Function Security
- ai-chat: added project ownership verification (client_id OR consultant_id OR admin role)
- ai-chat: added input validation (UUID format, message length limits 5000 chars, array size limit 100)
- ai-chat: added input sanitization (sanitizeString) and anti-prompt-injection rules in system prompt
- ai-chat: hardened AI response parsing (type checks, value clamping, array slicing)
- ai-chat: error messages no longer leak internal details
- generate-document: already had auth + ownership checks ✓

## Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Dependencies
- jspdf upgraded 2.5.2 → 4.2.0 (critical vulns fixed)
- html2pdf.js upgraded 0.10.2 → 0.14.0 (high vuln fixed)
