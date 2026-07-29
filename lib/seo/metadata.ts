/**
 * SEO Metadata Generation Utilities
 * Handles title, description, canonical URLs, hreflang, OpenGraph
 * @path lib/seo/metadata.ts
 */

import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/auth/server";

/**
 * Generate metadata for tenant menu page
 * Used in: app/(public)/[slug]/[lang]/page.tsx
 */
export async function generateMenuMetadata(
  slug: string,
  lang: string,
  locale: "en" | "tr" = "en"
): Promise<Metadata> {
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    return {
      title: "Menu Not Found",
      description: "This menu is not available",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  const canonicalUrl = `${baseUrl}/${slug}/${lang}`;
  const siteName = tenant.name;
  const description =
    tenant.description ||
    // languages is nullable in the schema; the old hand-written types said
    // otherwise, so this would have thrown on a tenant that never set them.
    `Check out the menu from ${tenant.name}. Available in ${(
      tenant.languages ?? []
    ).join(", ")}`;

  return {
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} - Menu`,
    },
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      siteName,
      title: `${siteName} - Menu`,
      description,
      url: canonicalUrl,
      images: tenant.logo_url
        ? [
            {
              url: tenant.logo_url,
              width: 1200,
              height: 630,
              alt: `${siteName} logo`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - Menu`,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${baseUrl}/${slug}/en`,
        tr: `${baseUrl}/${slug}/tr`,
      },
    },
  };
}

/**
 * Generate hreflang tags for alternate language versions
 * Include in page component
 */
export function generateHrefLangLinks(
  slug: string,
  supportedLanguages: string[]
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  return supportedLanguages.map((lang) => ({
    rel: "alternate",
    hrefLang: lang,
    href: `${baseUrl}/${slug}/${lang}`,
  }));
}

/**
 * Generate JSON-LD structured data for menu
 */
export function generateMenuStructuredData(
  slug: string,
  lang: string,
  tenant: { name: string; description?: string; logo_url?: string }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  return {
    "@context": "https://schema.org",
    "@type": "RestaurantMenu",
    name: tenant.name,
    description: tenant.description,
    url: `${baseUrl}/${slug}/${lang}`,
    inLanguage: lang,
    offers: {
      "@type": "AggregateOffer",
      availability: "https://schema.org/InStock",
    },
    image: tenant.logo_url,
  };
}

/**
 * Generate JSON-LD for a product (MenuItem)
 */
export function generateProductStructuredData(product: {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
    },
    image: product.image_url,
  };
}

/**
 * Sitemap generation query
 * Used in: app/(public)/[slug]/[lang]/sitemap.ts
 */
export async function generateSitemapUrls(slug: string, languages: string[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  const urls = languages.map((lang) => ({
    url: `${baseUrl}/${slug}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return urls;
}
