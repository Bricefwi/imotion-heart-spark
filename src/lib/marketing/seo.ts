/**
 * Marketing SEO helper - branche /marketing/* (rapatriée depuis lovelib).
 * URL canonique : domaine officiel imotion-conseils.fr (cf. mem://tech/domains.md).
 */
import { getMarketingUrl } from "@/lib/marketing-url";

interface SEOParams {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function buildSEO({ title, description, url, image }: SEOParams) {
  const canonical = getMarketingUrl(url);
  return {
    title,
    description,
    canonical,
    image: image || `${getMarketingUrl("/")}/og-image.jpg`,
  };
}
