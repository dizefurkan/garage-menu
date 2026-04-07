import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoriesNav } from "./categories-nav";
import { Footer } from "@/components/Footer";
import { formatPrice } from "@/lib/utils/currency";

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

interface Props {
  params: Promise<{
    slug: string;
    lang: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = getBaseUrl();

  return {
    title: `Menu | ${slug}`,
    description: "Browse our menu",
    alternates: {
      canonical: `${baseUrl}/${slug}/${lang}`,
      languages: {
        en: `${baseUrl}/${slug}/en`,
        tr: `${baseUrl}/${slug}/tr`,
      },
    },
  };
}

async function getMenuData(slug: string, lang: string) {
  try {
    const baseUrl = getBaseUrl();
    console.log("[getMenuData] Using baseUrl:", baseUrl);
    const response = await fetch(
      `${baseUrl}/api/public/menu?slug=${slug}&lang=${lang}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("[getMenuData] Error:", error);
    return null;
  }
}

export default async function MenuPage({ params }: Props) {
  const { slug, lang } = await params;

  // Validate language
  if (!["en", "tr"].includes(lang)) {
    notFound();
  }

  // Get menu data from API
  const data = await getMenuData(slug, lang);
  if (!data) {
    notFound();
  }

  const tenant = data.tenant;
  const { categories, products } = data;

  // Extract theme config with fallbacks
  const themeConfig = (tenant.theme_config as any) || {};
  const primaryColor = themeConfig.primary || "#000000";
  const secondaryColor = themeConfig.secondary || "#FFFFFF";
  const accentColor = themeConfig.accent || "#808080";

  const themeStyles = `
    :root {
      --color-primary: ${primaryColor};
      --color-secondary: ${secondaryColor};
      --color-accent: ${accentColor};
    }
  `;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white flex flex-col">
      <style>{themeStyles}</style>
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm z-40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {tenant.logo_url && (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-14 w-auto mb-3 rounded-lg"
                />
              )}
              <div>
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {tenant.name}
                </h1>
                {tenant.description && (
                  <p className="mt-2 text-base sm:text-lg text-slate-600 font-normal max-w-xl">
                    {tenant.description}
                  </p>
                )}
              </div>
            </div>

            {/* Language Switcher - Only show if multiple languages */}
            {tenant.languages && tenant.languages.length > 1 && (
              <div className="flex gap-2">
                {tenant.languages?.map((language: string) => (
                  <a
                    key={language}
                    href={`/${slug}/${language}`}
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      lang === language
                        ? "text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    style={
                      lang === language
                        ? { backgroundColor: primaryColor }
                        : undefined
                    }
                  >
                    {language === "en" ? "🇬🇧" : language === "tr" ? "🇹🇷" : ""}{" "}
                    {language.toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex-1 w-full">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-600 font-medium">
              Menu coming soon
            </p>
          </div>
        ) : (
          <>
            {/* Categories Navigation */}
            <CategoriesNav
              categories={categories}
              primaryColor={primaryColor}
            />

            {/* Categories & Products */}
            <Suspense
              fallback={
                <div className="text-center py-20 text-slate-600">
                  Loading menu...
                </div>
              }
            >
              {categories.map((category: any) => {
                const categoryProducts = products.filter(
                  (p: any) => p.category_id === category.id
                );

                if (categoryProducts.length === 0) return null;

                return (
                  <section
                    key={category.id}
                    id={`category-${category.id}`}
                    className="mb-16"
                  >
                    <div className="mb-8">
                      <h2
                        className="text-3xl font-bold pb-3 border-b-2 inline-block"
                        style={{
                          color: primaryColor,
                          borderColor: primaryColor,
                        }}
                      >
                        {category.name}
                        <span className="ml-3 text-lg opacity-75">
                          ({category.productCount})
                        </span>
                      </h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryProducts.map((product: any) => (
                        <div
                          key={product.id}
                          className="group overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                          {product.image ? (
                            <div className="relative w-full overflow-hidden bg-slate-100">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video w-full bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                              <span className="text-slate-400 text-sm">
                                No image
                              </span>
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-lg text-slate-900 line-clamp-2 flex-1">
                                {product.name}
                              </h3>
                              <span
                                className="font-bold text-lg whitespace-nowrap ml-2"
                                style={{ color: primaryColor }}
                              >
                                {formatPrice(
                                  product.price,
                                  product.currency,
                                  lang === "tr" ? "tr-TR" : "en-US"
                                )}
                              </span>
                            </div>
                            {product.description && (
                              <p className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </Suspense>
          </>
        )}
      </main>

      {/* Footer with Contact Information */}
      <Footer
        contactInfo={tenant.contactInfo || {}}
        restaurantName={tenant.name}
        primaryColor={primaryColor}
      />
    </div>
  );
}
