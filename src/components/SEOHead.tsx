import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_URL = "https://imotion-heart-spark.lovable.app";
const DEFAULT_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b6b931c8-bcbc-4f31-a991-88af67fdb02e/id-preview-c1d46a11--63a5fc40-b3d7-4f5f-a065-34e429e33aec.lovable.app-1773187132931.png";

export function SEOHead({
  title,
  description,
  canonical,
  type = "website",
  image,
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title.includes("IMOTION") ? title : `${title} | IMOTION Creator Studio`;
  const fullCanonical = canonical ? `${BASE_URL}${canonical}` : undefined;
  const ogImage = image || DEFAULT_IMAGE;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Meta tags
    const metas: Record<string, string> = {
      description,
      "og:title": fullTitle,
      "og:description": description,
      "og:type": type,
      "og:image": ogImage,
      "twitter:card": "summary_large_image",
      "twitter:title": fullTitle,
      "twitter:description": description,
      "twitter:image": ogImage,
    };

    if (noindex) metas.robots = "noindex, nofollow";

    Object.entries(metas).forEach(([key, value]) => {
      const isOg = key.startsWith("og:") || key.startsWith("twitter:");
      const attr = isOg ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    });

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (fullCanonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute("href", fullCanonical);
    } else {
      canonicalEl?.remove();
    }

    // JSON-LD
    const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    // Remove old page-level LD
    document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove());
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-ld", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-ld]').forEach(el => el.remove());
    };
  }, [fullTitle, description, type, ogImage, fullCanonical, noindex, jsonLd]);

  return null;
}

// Reusable schemas
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "IMOTION Creator Studio",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.png`,
  description: "Plateforme IA qui transforme vos idées en projets digitaux concrets via une conversation guidée.",
  contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: "French" },
  sameAs: [],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "IMOTION Creator Studio",
  url: BASE_URL,
  description: "Générez votre cahier des charges gratuitement grâce à l'IA conversationnelle.",
  inLanguage: "fr-FR",
};

export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "IMOTION Creator Studio",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Cahier des charges gratuit" },
  description: "Plateforme IA de découverte de projets digitaux : conversation guidée en 7 phases pour générer un cahier des charges professionnel.",
  featureList: [
    "Conversation IA en 7 phases",
    "Génération automatique de CDC",
    "Estimation budgétaire",
    "Export PDF professionnel",
  ],
};

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}
