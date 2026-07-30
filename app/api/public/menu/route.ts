import { createClient } from "@supabase/supabase-js";
import {
  sortCategories,
  sortProducts,
  type CategorySort,
  type ProductSort,
} from "@/lib/menu-sorting";

/** How far back order history counts toward "popularity". */
const POPULARITY_WINDOW_DAYS = 90;

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
      .select("id, image_url, display_order, category_translations(name, language_code)")
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
        "id, category_id, is_available, is_out_of_stock, display_order, created_at, price, currency, calories, image_url, model_glb_url, model_usdz_url, product_translations(name, description, language_code), product_allergens(allergens(code, emoji, display_order, allergen_translations(name, language_code)))"
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

    // Popularity is only computed when a sort actually asks for it — most
    // venues use manual order and should not pay for this query.
    const categorySortMode = (tenant.category_sort ?? "manual") as CategorySort;
    const productSortMode = (tenant.product_sort ?? "manual") as ProductSort;
    const needsPopularity =
      categorySortMode === "popularity" || productSortMode === "popularity";

    const productPopularity = new Map<string, number>();
    const categoryPopularity = new Map<string, number>();

    if (needsPopularity) {
      const since = new Date();
      since.setDate(since.getDate() - POPULARITY_WINDOW_DAYS);

      // order_items carries tenant_id directly now, so this needs no join.
      const { data: soldItems, error: soldError } = await supabaseAdmin
        .from("order_items")
        .select("product_id, quantity")
        .eq("tenant_id", tenant.id)
        .gte("created_at", since.toISOString());

      if (soldError) {
        // Popularity is a nicety — a failure here must not blank the menu.
        console.error("[API:public/menu] Popularity query failed:", soldError);
      } else {
        const categoryOf = new Map<string, string>();
        (products || []).forEach((prod: any) => {
          categoryOf.set(String(prod.id), String(prod.category_id));
        });

        (soldItems || []).forEach((item: any) => {
          const key = String(item.product_id);
          const qty = item.quantity ?? 0;
          productPopularity.set(key, (productPopularity.get(key) ?? 0) + qty);

          const catKey = categoryOf.get(key);
          if (catKey) {
            categoryPopularity.set(
              catKey,
              (categoryPopularity.get(catKey) ?? 0) + qty
            );
          }
        });
      }
    }

    // Process categories
    const processedCategories = (categories || [])
      .map((cat: any) => {
        const translation = cat.category_translations?.find(
          (t: any) => t.language_code === lang
        );
        // Sold-out items are still rendered, but counting them would promise
        // more than the kitchen can serve.
        const productCount = (products || []).filter(
          (prod: any) =>
            prod.category_id === cat.id &&
            prod.is_available === true &&
            prod.is_out_of_stock !== true
        ).length;

        const totalCount = (products || []).filter(
          (prod: any) =>
            prod.category_id === cat.id && prod.is_available === true
        ).length;

        return {
          id: cat.id,
          name: translation?.name || "Unnamed Category",
          image: cat.image_url || null,
          display_order: cat.display_order ?? 0,
          productCount,
          totalCount,
        };
      })
      .filter(
        (cat: any) =>
          // Keep a category whose items are all sold out — hiding it would
          // make the menu look like the dish never existed.
          cat.productCount > 0 || cat.totalCount > 0
      );

    const orderedCategories = sortCategories(
      processedCategories,
      categorySortMode,
      lang,
      categoryPopularity
    );

    // Process products
    const processedProducts = (products || [])
      .filter((prod: any) => prod.is_available === true)
      .map((prod: any) => {
        const translation = prod.product_translations?.find(
          (t: any) => t.language_code === lang
        );
        const allergens = (prod.product_allergens || [])
          .map((pa: any) => pa.allergens)
          .filter(Boolean)
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((allergen: any) => ({
            code: allergen.code,
            emoji: allergen.emoji,
            name:
              allergen.allergen_translations?.find(
                (t: any) => t.language_code === lang
              )?.name ||
              allergen.allergen_translations?.find(
                (t: any) => t.language_code === "en"
              )?.name ||
              allergen.code,
          }));
        return {
          id: prod.id,
          category_id: prod.category_id,
          name: translation?.name || "Unnamed Product",
          description: translation?.description || "",
          image: prod.image_url || null,
          price: prod.price || 0,
          // Kept nullish rather than defaulted: NULL means the venue
          // never declared a value, and 0 kcal would be a false claim.
          calories: prod.calories ?? null,
          currency: prod.currency || "TRY",
          allergens,
          model_glb: prod.model_glb_url || null,
          model_usdz: prod.model_usdz_url || null,
          // Still listed, but the menu renders it as sold out and the order
          // endpoint refuses it.
          out_of_stock: prod.is_out_of_stock === true,
          display_order: prod.display_order ?? 0,
          created_at: prod.created_at,
        };
      });

    // The menu renders products grouped under their category, so ordering is
    // meaningful per category, not across the whole list.
    const orderedProducts = orderedCategories.flatMap((cat: any) =>
      sortProducts(
        processedProducts.filter((p: any) => p.category_id === cat.id),
        productSortMode,
        lang,
        productPopularity
      )
    );

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
        // This payload is an explicit allowlist, not a spread — anything the
        // public menu needs has to be named here or it silently arrives as
        // undefined. Defaults are applied so an older row without these
        // columns still behaves like the previous release.
        qr_ordering_enabled: tenant.qr_ordering_enabled ?? true,
        menu_layout: tenant.menu_layout ?? "products",
        category_sort: tenant.category_sort ?? "manual",
        product_sort: tenant.product_sort ?? "manual",
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
      categories: orderedCategories,
      products: orderedProducts,
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
