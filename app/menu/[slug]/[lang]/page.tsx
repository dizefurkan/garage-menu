import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { getTenantCacheTags } from "@/lib/cache/revalidation";

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

  return {
    title: `Menu | ${slug}`,
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
  // Hardcoded fallback for main menu
  const fallbackParams = [
    { slug: "garage-chocolate-croissant", lang: "en" },
    { slug: "garage-chocolate-croissant", lang: "tr" },
  ];

  console.log("[generateStaticParams] Starting...");

  try {
    // Only attempt if environment variables are available
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.warn(
        "[generateStaticParams] Credentials missing - using fallback"
      );
      return fallbackParams;
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
      console.warn("[generateStaticParams] Using fallback due to error");
      return fallbackParams;
    }

    if (!tenants || tenants.length === 0) {
      console.warn("[generateStaticParams] No tenants found - using fallback");
      return fallbackParams;
    }

    // Generate params for all tenant/language combinations
    const params = tenants.flatMap((tenant: any) => {
      const languages = tenant.languages || ["en"];
      return languages.map((lang: string) => ({
        slug: tenant.slug,
        lang: lang,
      }));
    });

    console.log(
      `[generateStaticParams] Generated ${params.length} routes from ${tenants.length} tenants`
    );

    // Always include fallback to ensure garage-chocolate-croissant/en exists
    const allParams = [...params];
    const hasGarage = params.some(
      (p) => p.slug === "garage-chocolate-croissant"
    );
    if (!hasGarage) {
      console.log("[generateStaticParams] Adding hardcoded fallback to params");
      allParams.push(...fallbackParams);
    }

    return allParams;
  } catch (error) {
    console.error("[generateStaticParams] Exception:", error);
    console.warn("[generateStaticParams] Using fallback due to exception");
    return fallbackParams;
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
      next: { tags: uniqueTags },
    });

    console.log(`[getMenuData] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[getMenuData] API error ${response.status}: ${errorText.slice(0, 100)}`
      );
      return null;
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

  // Validate language
  if (!["en", "tr"].includes(lang)) {
    console.log("[MenuPage] Invalid language, returning notFound");
    notFound();
  }

  // Get menu data from API
  console.log("[MenuPage] Fetching menu data...");
  const data = await getMenuData(slug, lang);

  if (!data) {
    console.log("[MenuPage] No data returned, returning notFound");
    notFound();
  }

  console.log("[MenuPage] Data received, rendering page");
  const { tenant, categories, products } = data;

  // Extract theme config with fallbacks
  const themeConfig = (tenant.theme_config as any) || {};
  const primaryColor = themeConfig.primary || "#000000";

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        {tenant.logo_url && (
          <img
            src={tenant.logo_url}
            alt={tenant.name}
            style={{ height: "80px", marginBottom: "1rem" }}
          />
        )}
        <h1 style={{ color: primaryColor, margin: "0 0 0.5rem 0" }}>
          {tenant.name}
        </h1>
        {tenant.description && (
          <p style={{ color: "#666", margin: "0" }}>{tenant.description}</p>
        )}
      </header>

      {/* Categories */}
      <div style={{ marginBottom: "2rem" }}>
        {categories && categories.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                style={{
                  padding: "0.5rem 1rem",
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: "white",
                  color: primaryColor,
                  cursor: "pointer",
                  borderRadius: "4px",
                  fontWeight: "500",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {products && products.length > 0 ? (
          products.map((product: any) => (
            <div
              key={product.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: "100%", height: "150px", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  No image
                </div>
              )}
              <div style={{ padding: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                  {product.name}
                </h3>
                {product.description && (
                  <p
                    style={{
                      margin: "0.5rem 0",
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    {product.description}
                  </p>
                )}
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: primaryColor,
                  }}
                >
                  {product.price} {product.currency}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No products available</p>
        )}
      </div>
    </main>
  );
}
