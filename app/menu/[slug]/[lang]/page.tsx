import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

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

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all tenants with their languages
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("slug, languages");

    if (error || !tenants) {
      console.error("[generateStaticParams] Error:", error);
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

    return params;
  } catch (error) {
    console.error("[generateStaticParams] Error:", error);
    return fallbackParams;
  }
}

async function getMenuData(slug: string, lang: string) {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/public/menu?slug=${slug}&lang=${lang}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.error(
        `[getMenuData] API returned ${response.status} for ${slug}/${lang}`
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[getMenuData] Error for ${slug}/${lang}:`, error);
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

  const { tenant, categories, products } = data;

  // Extract theme config with fallbacks
  const themeConfig = (tenant.theme_config as any) || {};
  const primaryColor = themeConfig.primary || "#000000";

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
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
                  No  image
                </div>
              )}
              <div style={{ padding: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
                  {product.name}
                </h3>
                {product.description && (
                  <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
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
