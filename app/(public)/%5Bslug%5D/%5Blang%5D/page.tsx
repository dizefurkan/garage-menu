/**
 * Public Menu Page - SSR with i18n
 * @path app/(public)/[slug]/[lang]/page.tsx
 *
 * Features:
 * - Server-side rendering (SSR) for SEO
 * - Dynamic routes based on tenant slug + language
 * - Fetches published products/categories
 * - Supports multiple languages
 * - Responsive design with Tailwind
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/auth/server";
import { getPublishedCategories, getPublishedProducts } from "@/lib/db/queries";
import {
  generateMenuMetadata,
  generateHrefLangLinks,
} from "@/lib/seo/metadata";
import { themeConfigToCss } from "@/lib/themes/types";
import Image from "next/image";

type Props = {
  params: Promise<{
    slug: string;
    lang: "en" | "tr";
  }>;
};

// ============================================================================
// METADATA GENERATION (for SEO)
// ============================================================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  return generateMenuMetadata(slug, lang, lang);
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================
export default async function MenuPage({ params }: Props) {
  const { slug, lang } = await params;

  // 1. Fetch tenant
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    notFound();
  }

  // 2. Validate language
  if (!tenant.languages.includes(lang)) {
    notFound();
  }

  // 3. Fetch categories and products
  const categories = await getPublishedCategories(tenant.id);
  const products = await getPublishedProducts(tenant.id, lang);

  // 4. Apply theme CSS
  const themeStyles = themeConfigToCss(tenant.theme_config ?? {});

  return (
    <div
      className="min-h-screen bg-secondary text-primary"
      style={
        {
          "--color-primary": tenant.theme_config?.primary ?? "#000",
          "--color-secondary": tenant.theme_config?.secondary ?? "#fff",
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <header className="border-b border-primary/10 bg-secondary py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between">
            <div>
              {tenant.logo_url && (
                <Image
                  src={tenant.logo_url}
                  alt={tenant.name}
                  width={48}
                  height={48}
                  className="mb-2 rounded"
                />
              )}
              <h1
                className="text-4xl font-bold"
                style={{ color: tenant.theme_config?.primary }}
              >
                {tenant.name}
              </h1>
              {tenant.description && (
                <p className="mt-2 text-sm opacity-70">{tenant.description}</p>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex gap-2">
              {tenant.languages.map((l) => (
                <a
                  key={l}
                  href={`/${slug}/${l}`}
                  className={`rounded px-3 py-1 text-sm transition ${
                    l === lang
                      ? "bg-primary text-secondary"
                      : "border border-primary text-primary hover:bg-primary hover:text-secondary"
                  }`}
                >
                  {l.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl opacity-50">No categories available yet</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => {
              // Get translation for current language
              const categoryTrans = category.category_translations?.find(
                (t) => t.language_code === lang
              );

              if (!categoryTrans) return null;

              // Filter products for this category
              const categoryProducts = products.filter(
                (p) => p.category_id === category.id
              );

              return (
                <section key={category.id}>
                  <h2
                    className="mb-6 text-2xl font-bold"
                    style={{ color: tenant.theme_config?.primary }}
                  >
                    {categoryTrans.name}
                  </h2>

                  {categoryProducts.length === 0 ? (
                    <p className="opacity-50">No products in this category</p>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {categoryProducts.map((product) => {
                        // Get translation for current language
                        const productTrans = product.product_translations?.find(
                          (t) => t.language_code === lang
                        );

                        if (!productTrans) return null;

                        return (
                          <div
                            key={product.id}
                            className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm hover:shadow-md transition"
                          >
                            {/* Image */}
                            {product.image_url && (
                              <div className="relative h-48 w-full">
                                <Image
                                  src={product.image_url}
                                  alt={productTrans.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="p-4">
                              <div className="mb-2 flex items-start justify-between">
                                <h3 className="font-semibold text-lg">
                                  {productTrans.name}
                                </h3>
                                <span
                                  className="font-bold"
                                  style={{
                                    color: tenant.theme_config?.primary,
                                  }}
                                >
                                  {product.price} {product.currency}
                                </span>
                              </div>

                              {productTrans.description && (
                                <p className="text-sm opacity-70">
                                  {productTrans.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-secondary py-6">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm opacity-50">
          <p>
            © {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// GENERATE STATIC PARAMS (for better performance)
// This pre-builds routes for all tenants + languages at build time
// ============================================================================
export async function generateStaticParams() {
  // TODO: In production, fetch all active tenants from database
  // For now, return empty array to use ISR (Incremental Static Regeneration)
  return [];
}
