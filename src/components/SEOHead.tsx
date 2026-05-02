import { useEffect } from "react";
import { PROD_APP_URL } from "@/lib/app-url";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

// Canonical/SEO base must always be the production app domain so search
// engines never index lovable.app preview URLs.
const BASE_URL = PROD_APP_URL;
const DEFAULT_IMAGE = `${PROD_APP_URL}/favicon.png`;

export function SEOHead({
  title,
  description,
  canonical,
  type = "website",
  image,
  noindex = false,
  jsonLd,
}: SEOHeadProps): null {
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
  contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: "contact@imotion-conseils.fr", availableLanguage: "French" },
  sameAs: [] as string[],
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

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment fonctionne la génération du cahier des charges ?",
      acceptedAnswer: { "@type": "Answer", text: "Notre consultant IA vous guide à travers une conversation structurée en 7 phases. Il pose des questions précises sur votre projet et génère automatiquement un cahier des charges professionnel." }
    },
    {
      "@type": "Question",
      name: "Est-ce vraiment gratuit ?",
      acceptedAnswer: { "@type": "Answer", text: "Oui, la génération du cahier des charges est 100% gratuite, sans engagement et sans carte bancaire. La réalisation de votre projet démarre à partir de 5 000€." }
    },
    {
      "@type": "Question",
      name: "Combien de temps faut-il pour générer un CDC ?",
      acceptedAnswer: { "@type": "Answer", text: "En moyenne, une session de découverte complète prend environ 45 minutes. Votre progression est sauvegardée automatiquement." }
    },
    {
      "@type": "Question",
      name: "Mes données sont-elles sécurisées ?",
      acceptedAnswer: { "@type": "Answer", text: "Vos données sont hébergées en Union européenne conformément au RGPD. L'accès est protégé par Row Level Security." }
    },
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
