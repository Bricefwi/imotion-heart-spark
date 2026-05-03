/**
 * Génère :
 *   - public/sitemap.xml          (sitemap fusionné Clarivi + ex-lovelib, URLs canoniques app.imotion-conseils.fr)
 *   - public/lovelib-redirects.json (mapping consommé par l'origine lovelib pour émettre les vrais 301)
 *
 * Lancement : `bun scripts/generate-sitemap.ts`
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  APP_ORIGIN,
  CLARIVI_PUBLIC_ROUTES,
  LEGACY_ORIGIN,
  LOVELIB_REDIRECTS,
} from "../src/config/lovelibRedirects";

const today = new Date().toISOString().slice(0, 10);

// ── Sitemap fusionné ─────────────────────────────────────────────────
const urls = CLARIVI_PUBLIC_ROUTES.map(
  (r) => `  <url>
    <loc>${APP_ORIGIN}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`,
).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(resolve("public/sitemap.xml"), sitemap, "utf-8");
console.log(`✓ sitemap.xml — ${CLARIVI_PUBLIC_ROUTES.length} URLs`);

// ── Mapping legacy → 301 (consommé par le worker / nginx lovelib) ────
const mapping = {
  generatedAt: new Date().toISOString(),
  source: LEGACY_ORIGIN,
  target: APP_ORIGIN,
  rules: LOVELIB_REDIRECTS.map(({ from, to, code }) => ({
    from,
    to: `${APP_ORIGIN}${to}`,
    code,
  })),
};
writeFileSync(
  resolve("public/lovelib-redirects.json"),
  JSON.stringify(mapping, null, 2),
  "utf-8",
);
console.log(`✓ lovelib-redirects.json — ${mapping.rules.length} règles`);
