import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const lang = searchParams.get("lang") || "en";

  console.log(`[API:public/menu] Request: slug=${slug}, lang=${lang}`);

  if (!slug) {
    console.warn("[API:public/menu] Missing slug parameter");
    return Response.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    console.log(`[API:public/menu] Querying tenant with slug: ${slug}`);

    // Get tenant using admin client to bypass RLS
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tenantError) {
      console.error(`[API:public/menu] Tenant query error:`, tenantError);
    }

    if (!tenant) {
      console.warn(`[API:public/menu] Tenant not found for slug: ${slug}`);
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    console.log(`[API:public/menu] Found tenant: ${tenant.name}`);

    // Parse tenant languages - could be array or JSON string
    let tenantLanguages = ["en"];
    if (tenant.languages) {
      if (Array.isArray(tenant.languages)) {
        tenantLanguages = tenant.languages;
      } else if (typeof tenant.languages === "string") {
        try {
          tenantLanguages = JSON.parse(tenant.languages);
        } catch {
          tenantLanguages = ["en"];
        }
      }
    }

    console.log(`[API:public/menu] Tenant languages:`, tenantLanguages);

    // Validate that requested language is in tenant's available languages
    if (!tenantLanguages.includes(lang)) {
      console.warn(
        `[API:public/menu] Language ${lang} not available for tenant ${slug}. Available: ${tenantLanguages.join(", ")}`
      );
      return Response.json(
        {
          error: `Language ${lang} not available`,
          availableLanguages: tenantLanguages,
        },
        { status: 400 }
      );
    }

    // Parse contact_info JSON if it exists
    let contactInfo: any = {};
    if (tenant.contact_info) {
      try {
        contactInfo =
          typeof tenant.contact_info === "string"
            ? JSON.parse(tenant.contact_info)
            : tenant.contact_info;
      } catch (e) {
        console.error("[API:public/menu] Error parsing contact_info:", e);
      }
    }
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from("categories")
      .select("id, category_translations(name, language_code)")
      .eq("tenant_id", tenant.id);

    if (categoriesError) {
      console.error("[API] Categories error:", categoriesError);
      return Response.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Get products with translations
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select(
        "id, category_id, is_available, price, currency, image_url, product_translations(name, description, language_code)"
      )
      .eq("tenant_id", tenant.id)
      .eq("is_available", true);

    if (productsError) {
      console.error("[API] Products error:", productsError);
      return Response.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Process categories
    const processedCategories = (categories || [])
      .map((cat: any) => {
        const translation = cat.category_translations?.find(
          (t: any) => t.language_code === lang
        );
        const productCount = (products || []).filter(
          (prod: any) =>
            prod.category_id === cat.id && prod.is_available === true
        ).length;

        return {
          id: cat.id,
          name: translation?.name || "Unnamed Category",
          productCount,
        };
      })
      .filter((cat: any) => cat.productCount > 0); // Hide categories with no products

    // Process products
    const processedProducts = (products || [])
      .filter((prod: any) => prod.is_available === true)
      .map((prod: any) => {
        const translation = prod.product_translations?.find(
          (t: any) => t.language_code === lang
        );
        return {
          id: prod.id,
          category_id: prod.category_id,
          name: translation?.name || "Unnamed Product",
          description: translation?.description || "",
          image: prod.image_url || null,
          price: prod.price || 0,
          currency: prod.currency || "TRY",
        };
      });

    // Detect available languages from category translations
    const availableLanguages = new Set<string>();
    (categories || []).forEach((cat: any) => {
      cat.category_translations?.forEach((t: any) => {
        if (t.language_code) availableLanguages.add(t.language_code);
      });
    });

    // Fallback to ["en", "tr"] if no translations found
    const languages =
      availableLanguages.size > 0
        ? Array.from(availableLanguages).sort()
        : tenant.languages
          ? Array.isArray(tenant.languages)
            ? tenant.languages
            : JSON.parse(tenant.languages)
          : ["en", "tr"];

    return Response.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        theme_config: tenant.theme_config || {},
        description: tenant.description || undefined,
        phone: tenant.phone || undefined,
        logo_url: tenant.logo_url || undefined,
        menu_languages: tenantLanguages,
        languages: languages, // Available languages for the tenant
        contact_info: {
          address: contactInfo.address || undefined,
          email: contactInfo.email || undefined,
          facebook: contactInfo.facebook || undefined,
          instagram: contactInfo.instagram || undefined,
          tiktok: contactInfo.tiktok || undefined,
          whatsapp: contactInfo.whatsapp || undefined,
        },
      },
      categories: processedCategories,
      products: processedProducts,
    });
  } catch (error) {
    console.error("[API:public/menu] Unexpected error:", error);
    console.error("[API:public/menu] Error type:", typeof error);
    console.error(
      "[API:public/menu] Error details:",
      JSON.stringify(error, null, 2)
    );
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
