import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const lang = searchParams.get("lang") || "en";

  if (!slug) {
    return Response.json({ error: "Slug required" }, { status: 400 });
  }

  if (!["en", "tr"].includes(lang)) {
    return Response.json({ error: "Invalid language" }, { status: 400 });
  }

  try {
    // Get tenant using admin client to bypass RLS
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tenantError || !tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
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
        console.error("[API] Error parsing contact_info:", e);
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

    return Response.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        theme_config: tenant.theme_config || {},
        description: tenant.description || undefined,
        logo_url: tenant.logo_url || undefined,
        contactInfo: {
          address: contactInfo.address || undefined,
          phone: contactInfo.phone || undefined,
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
    console.error("[API] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
