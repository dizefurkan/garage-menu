import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { getTenantCacheTags } from "@/lib/cache/revalidation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

function getBaseUrl(): string {
  // On Vercel production, use the production domain
  if (process.env.VERCEL_ENV === "production") {
    return "https://garage-menu.vercel.app";
  }

  // On Vercel preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local development
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  return "http://localhost:3000";
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
  let restaurantName = "Menu";

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("name")
        .eq("slug", slug)
        .single();

      if (tenant?.name) {
        restaurantName = tenant.name;
      }
    } catch (error) {
      console.warn("[generateMetadata] Failed to load tenant name:", error);
    }
  }

  return {
    title: restaurantName,
    description: "Browse our menu",
    alternates: {
      canonical: `${baseUrl}/menu/${slug}/${lang}`,
      languages: {
        en: `${baseUrl}/menu/${slug}/en`,
        tr: `${baseUrl}/menu/${slug}/tr`,
      },
    },
  };
}

// Allow routes not in generateStaticParams to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Minimal fallback - just EN
  const minimalFallback = [{ slug: "garage-chocolate-croissant", lang: "en" }];

  console.log("[generateStaticParams] Starting...");

  try {
    // Only attempt if environment variables are available
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.warn(
        "[generateStaticParams] Credentials missing - using minimal fallback"
      );
      return minimalFallback;
    }

    console.log("[generateStaticParams] Creating Supabase client...");

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all tenants with their languages
    console.log("[generateStaticParams] Fetching tenants...");
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("slug, languages");

    if (error) {
      console.error("[generateStaticParams] Supabase error:", error);
      console.warn(
        "[generateStaticParams] Using minimal fallback due to error"
      );
      return minimalFallback;
    }

    if (!tenants || tenants.length === 0) {
      console.warn(
        "[generateStaticParams] No tenants found - using minimal fallback"
      );
      return minimalFallback;
    }

    // Generate params for all tenant/language combinations
    const params = tenants.flatMap((tenant: any) => {
      // Safely parse languages - could be array or JSON string
      let languages = [];
      if (tenant.languages) {
        if (Array.isArray(tenant.languages)) {
          languages = tenant.languages;
        } else if (typeof tenant.languages === "string") {
          try {
            languages = JSON.parse(tenant.languages);
          } catch {
            languages = ["en"];
          }
        }
      } else {
        languages = ["en"];
      }

      return languages.map((lang: string) => ({
        slug: tenant.slug,
        lang: lang,
      }));
    });

    console.log(
      `[generateStaticParams] Generated ${params.length} routes from ${tenants.length} tenants`
    );

    // Ensure garage-chocolate-croissant is fully pre-generated with all its languages
    const allParams = [...params];

    // Find garage tenant's languages
    const garageTenant = tenants.find(
      (t: any) => t.slug === "garage-chocolate-croissant"
    );
    if (garageTenant) {
      // Get all configured languages for garage tenant
      let garageLanguages = [];
      if (garageTenant.languages) {
        if (Array.isArray(garageTenant.languages)) {
          garageLanguages = garageTenant.languages;
        } else if (typeof garageTenant.languages === "string") {
          try {
            garageLanguages = JSON.parse(garageTenant.languages);
          } catch {
            garageLanguages = ["en"];
          }
        }
      } else {
        garageLanguages = ["en"];
      }

      // Check each language and add if missing
      for (const lang of garageLanguages) {
        const exists = params.some(
          (p) => p.slug === "garage-chocolate-croissant" && p.lang === lang
        );
        if (!exists) {
          console.log(
            `[generateStaticParams] Adding ${lang} fallback for garage-chocolate-croissant`
          );
          allParams.push({ slug: "garage-chocolate-croissant", lang });
        }
      }
    } else {
      // Garage tenant not in DB, use minimal fallback
      console.warn("[generateStaticParams] Garage tenant not found in DB");
      allParams.push({ slug: "garage-chocolate-croissant", lang: "en" });
    }

    return allParams;
  } catch (error) {
    console.error("[generateStaticParams] Exception:", error);
    console.warn(
      "[generateStaticParams] Using minimal fallback due to exception"
    );
    return minimalFallback;
  }
}

async function getMenuData(slug: string, lang: string) {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/public/menu?slug=${slug}&lang=${lang}`;

    console.log(`[getMenuData] Fetching from: ${url}`);

    // Use tag-based revalidation so mutations can invalidate the cache
    // Include tags for both products and categories since menu displays both
    const tags = [
      ...getTenantCacheTags(slug, "products"),
      ...getTenantCacheTags(slug, "categories"),
    ];

    // Remove duplicates
    const uniqueTags = [...new Set(tags)];
    console.log(`[getMenuData] Using cache tags:`, uniqueTags);

    const response = await fetch(url, {
      next: {
        tags: uniqueTags,
        revalidate: 60, // 60-second ISR fallback for on-demand routes
      },
    });

    console.log(`[getMenuData] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[getMenuData] API error ${response.status}: ${errorText.slice(0, 100)}`
      );
      // Parse error response to get available languages if available
      try {
        const errorData = JSON.parse(errorText);
        return { error: true, errorData };
      } catch {
        return null;
      }
    }

    const data = await response.json();
    console.log(`[getMenuData] Success: Got data for slug=${slug}`);
    return data;
  } catch (error) {
    console.error(`[getMenuData] Exception:`, error);
    return null;
  }
}

export default async function MenuPage({ params }: Props) {
  const { slug, lang } = await params;

  console.log("[MenuPage] Rendering for:", { slug, lang });

  // Get menu data from API
  console.log("[MenuPage] Fetching menu data...");
  const data = await getMenuData(slug, lang);

  if (!data) {
    console.log("[MenuPage] No data returned, returning notFound");
    notFound();
  }

  // If API returned an error with available languages, redirect to default language
  if (data.error && data.errorData?.availableLanguages) {
    const availableLanguages = data.errorData.availableLanguages;
    console.log(
      `[MenuPage] Language ${lang} not available. Fetching default language...`
    );

    try {
      const baseUrl = getBaseUrl();
      const defaultLangResponse = await fetch(
        `${baseUrl}/api/public/default-language?slug=${slug}`
      );
      if (defaultLangResponse.ok) {
        const defaultLangData = await defaultLangResponse.json();
        const defaultLanguage =
          defaultLangData.defaultLanguage || availableLanguages[0] || "en";
        console.log(
          `[MenuPage] Redirecting to default language: ${defaultLanguage}`
        );
        redirect(`/menu/${slug}/${defaultLanguage}`);
      }
    } catch (e) {
      console.error(
        "[MenuPage] Error fetching default language, using first available:",
        e
      );
    }

    redirect(`/menu/${slug}/${availableLanguages[0] || "en"}`);
  }

  if (data.error) {
    console.log("[MenuPage] API error, returning notFound");
    notFound();
  }

  console.log("[MenuPage] Data received, rendering page");
  const { tenant, categories, products } = data;
  const configuredMenuLanguages = Array.isArray(tenant.menu_languages)
    ? tenant.menu_languages
    : Array.isArray(tenant.languages)
      ? tenant.languages
      : [];
  const shouldShowLanguageSwitcher = configuredMenuLanguages.length >= 2;

  // Extract theme config with fallbacks
  const themeConfig = (tenant.theme_config as any) || {};
  const primaryColor = themeConfig.primary || "#000000";
  const secondaryColor = themeConfig.secondary || "#FFFFFF";

  return (
    <div
      className="min-h-screen bg-white"
      style={
        {
          "--primary-color": primaryColor,
          "--secondary-color": secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* Analytics Tracker */}
      <AnalyticsTracker tenantSlug={slug} />

      {/* Header */}
      <Header
        tenant={tenant}
        primaryColor={primaryColor}
        currentLang={lang}
        showLanguageSwitcher={shouldShowLanguageSwitcher}
        menuLanguages={configuredMenuLanguages}
      />

      {/* Mobile Floating Language Button */}
      {shouldShowLanguageSwitcher && (
        <MobileLanguageButton
          currentLang={lang}
          menuLanguages={configuredMenuLanguages}
          slug={slug}
        />
      )}

      {/* Category Navigation */}
      <CategoryNav categories={categories} products={products} />

      {/* Mobile Floating Button */}
      <MobileCategoryButton categories={categories} products={products} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories with Products */}
        {categories && categories.length > 0 ? (
          <div className="space-y-12">
            {categories.map((category: any) => {
              const categoryProducts = products.filter(
                (p: any) => p.category_id === category.id
              );
              if (categoryProducts.length === 0) return null;

              return (
                <CategorySection
                  key={category.id}
                  id={category.id}
                  category={category}
                  products={categoryProducts}
                  primaryColor={primaryColor}
                  lang={lang}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No categories available</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer tenant={tenant} />
    </div>
  );
}

// Header Component
function Header({
  tenant,
  primaryColor,
  currentLang,
  showLanguageSwitcher,
  menuLanguages,
}: {
  tenant: any;
  primaryColor: string;
  currentLang: string;
  showLanguageSwitcher: boolean;
  menuLanguages: string[];
}) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-12 w-auto object-contain"
              />
            )}
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ color: primaryColor }}
              >
                {tenant.name}
              </h1>
              {tenant.description && (
                <p className="text-sm text-gray-600">{tenant.description}</p>
              )}
            </div>
          </div>

          {showLanguageSwitcher && (
            <div className="hidden md:block">
              <LanguageSwitcher
                currentLang={currentLang}
                compact
                languages={menuLanguages}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Category Navigation (Desktop)
function CategoryNav({
  categories,
  products,
}: {
  categories: any[];
  products: any[];
}) {
  if (!categories || categories.length === 0) return null;

  const getProductCount = (categoryId: string) => {
    return products.filter((p: any) => p.category_id === categoryId).length;
  };

  return (
    <nav className="hidden md:block sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((cat: any) => {
            const count = getProductCount(cat.id);
            return (
              <a
                key={cat.id}
                href={`#category-${cat.id}`}
                className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors hover:bg-gray-100"
                style={{
                  color: "currentColor",
                  borderBottom: "2px solid transparent",
                }}
              >
                {cat.name} <span className="text-gray-500">({count})</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Mobile Floating Category Button
function MobileCategoryButton({
  categories,
  products,
}: {
  categories: any[];
  products: any[];
}) {
  if (!categories || categories.length === 0) return null;

  const getProductCount = (categoryId: string) => {
    return products.filter((p: any) => p.category_id === categoryId).length;
  };

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-40">
      <details className="group">
        <summary className="list-none cursor-pointer bg-black text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
          <span className="text-xl">☰</span>
        </summary>
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl p-4 min-w-[240px]">
          <ul className="space-y-2">
            {categories.map((cat: any) => {
              const count = getProductCount(cat.id);
              return (
                <li key={cat.id}>
                  <a
                    href={`#category-${cat.id}`}
                    className="block px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    {cat.name} <span className="text-gray-500">({count})</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </details>
    </div>
  );
}

// Mobile Floating Language Button
function MobileLanguageButton({
  currentLang,
  menuLanguages,
  slug,
}: {
  currentLang: string;
  menuLanguages: string[];
  slug: string;
}) {
  const getLanguageLabel = (languageCode: string) => {
    try {
      const normalizedCode = languageCode.toLowerCase();
      const baseLanguage = normalizedCode.split("-")[0];
      const displayNames = new Intl.DisplayNames([normalizedCode], {
        type: "language",
      });
      return displayNames.of(baseLanguage) || languageCode.toUpperCase();
    } catch {
      return languageCode.toUpperCase();
    }
  };

  return (
    <div className="md:hidden fixed bottom-6 left-6 z-40">
      <details className="group">
        <summary className="list-none cursor-pointer bg-white/20 backdrop-blur-md text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow border border-white/30">
          <span className="text-xl">🌐</span>
        </summary>
        <div className="absolute bottom-16 left-0 bg-white rounded-2xl shadow-2xl p-3 min-w-40 border border-gray-100">
          <ul className="space-y-1">
            {menuLanguages.map((language) => {
              const isActive = language === currentLang;

              return (
                <li key={language}>
                  <a
                    href={`/menu/${slug}/${language}`}
                    className={`block px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? "bg-gray-100 text-black"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {getLanguageLabel(language)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </details>
    </div>
  );
}

// Category Section
function CategorySection({
  id,
  category,
  products,
  primaryColor,
  lang,
}: {
  id: string;
  category: any;
  products: any[];
  primaryColor: string;
  lang: string;
}) {
  return (
    <section id={`category-${id}`} className="scroll-mt-32">
      <h2
        className="sticky top-0 z-20 bg-white py-4 mb-8 pb-4 border-b-2 text-2xl sm:text-3xl font-bold"
        style={{ borderColor: primaryColor, color: primaryColor }}
      >
        {category.name}{" "}
        <span className="text-gray-400 text-lg">({products.length})</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryId={id}
            primaryColor={primaryColor}
            lang={lang}
          />
        ))}
      </div>
    </section>
  );
}

// "Allergens" in all supported menu languages (aria-label for the chip list)
const ALLERGENS_LABELS: Record<string, string> = {
  en: "Allergens",
  tr: "Alerjenler",
  de: "Allergene",
  fr: "Allergènes",
  es: "Alérgenos",
  it: "Allergeni",
  pt: "Alergénios",
  ja: "アレルゲン",
  zh: "过敏原",
  ru: "Аллергены",
  ar: "مسببات الحساسية",
};

// Product Card Component
function ProductCard({
  product,
  categoryId,
  primaryColor,
  lang,
}: {
  product: any;
  categoryId: string;
  primaryColor: string;
  lang: string;
}) {
  return (
    <div
      className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
      data-product-id={product.id}
      data-category-id={categoryId}
    >
      {/* Image */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">🍽️</div>
              <p className="text-xs text-gray-400">No image</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg line-clamp-2 text-gray-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Allergens */}
        {product.allergens?.length > 0 && (
          <ul
            className="flex flex-wrap gap-1.5"
            aria-label={ALLERGENS_LABELS[lang] || ALLERGENS_LABELS.en}
          >
            {product.allergens.map((allergen: any) => (
              <li
                key={allergen.code}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
              >
                <span aria-hidden="true">{allergen.emoji}</span>
                {allergen.name}
              </li>
            ))}
          </ul>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {product.price}
            {product.currency && (
              <span className="text-sm ml-1">{product.currency}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// SVG Icon Components
function AddressIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 384 512"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"></path>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"></path>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="none" d="M0 0h24v24H0V0z"></path>
      <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0-8 4.99L4 6h16zm0 12H4V8l8 5 8-5v10z"></path>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 448 512"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 448 512"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 448 512"
      className="w-5 h-5 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
    </svg>
  );
}

// Footer Component
function Footer({ tenant }: { tenant: any }) {
  // contact_info is already an object from the API
  const contactInfo = tenant.contact_info || {};

  console.log("[Footer] tenant.contact_info:", tenant.contact_info);
  console.log("[Footer] contactInfo:", contactInfo);

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Restaurant Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{tenant.name}</h3>
            <div className="space-y-3">
              {contactInfo.address && (
                <p className="text-sm text-gray-600 flex items-start gap-3">
                  <AddressIcon />
                  <span>{contactInfo.address}</span>
                </p>
              )}
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone.replace(/\s/g, "")}`}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-3"
                >
                  <PhoneIcon />
                  <span>{tenant.phone}</span>
                </a>
              )}
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-3"
                >
                  <EmailIcon />
                  <span>{contactInfo.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(contactInfo.instagram ||
            contactInfo.facebook ||
            contactInfo.tiktok ||
            contactInfo.whatsapp) && (
            <div>
              <h3 className="font-bold text-lg mb-4">Follow Us</h3>
              <div className="space-y-2">
                {contactInfo.facebook && (
                  <a
                    href={
                      contactInfo.facebook.startsWith("http")
                        ? contactInfo.facebook
                        : `https://facebook.com/${contactInfo.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <FacebookIcon />
                    <span>Facebook</span>
                  </a>
                )}
                {contactInfo.instagram && (
                  <a
                    href={
                      contactInfo.instagram.startsWith("http")
                        ? contactInfo.instagram
                        : `https://instagram.com/${contactInfo.instagram.replace(/@/g, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <InstagramIcon />
                    <span>{contactInfo.instagram}</span>
                  </a>
                )}
                {contactInfo.tiktok && (
                  <a
                    href={
                      contactInfo.tiktok.startsWith("http")
                        ? contactInfo.tiktok
                        : `https://tiktok.com/@${contactInfo.tiktok.replace(/@/g, "")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <TikTokIcon />
                    <span>{contactInfo.tiktok}</span>
                  </a>
                )}
                {contactInfo.whatsapp && (
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Hours */}
          {contactInfo.hours && (
            <div>
              <h3 className="font-bold text-lg mb-4">Hours</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {contactInfo.hours}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
