import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidateTenant } from "@/lib/cache/revalidation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const categoryId = searchParams.get("categoryId");

    const offset = (page - 1) * pageSize;

    let query = (supabaseAdmin as any)
      .from("products")
      .select(
        `
        id,
        price,
        currency,
        image_url,
        is_available,
        is_draft,
        created_at,
        category_id,
        contains_no_allergens,
        product_translations(name, language_code),
        product_allergens(allergen_id),
        categories(id, category_translations(name, language_code))
      `,
        { count: "exact" }
      )
      .eq("tenant_id", tenant.id);

    if (categoryId && categoryId !== "null") {
      query = query.eq("category_id", parseInt(categoryId));
    }

    const { data, error, count } = await query
      .range(offset, offset + pageSize - 1)
      .order("id", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Transform data to extract names from translations
    const transformedProducts = (data || []).map((product: any) => {
      const nameTranslation =
        product.product_translations?.find(
          (t: any) => t.language_code === "en"
        ) || product.product_translations?.[0];

      const categoryNameTranslation =
        product.categories?.category_translations?.find(
          (t: any) => t.language_code === "en"
        ) || product.categories?.category_translations?.[0];

      return {
        id: product.id,
        name: nameTranslation?.name || "N/A",
        price: product.price,
        currency: product.currency,
        image_url: product.image_url,
        is_available: product.is_available,
        is_draft: product.is_draft,
        created_at: product.created_at,
        category_id: product.category_id,
        contains_no_allergens: product.contains_no_allergens || false,
        allergen_count: product.product_allergens?.length ?? 0,
        categories: {
          id: product.categories?.id || null,
          name: categoryNameTranslation?.name || null,
        },
      };
    });

    return NextResponse.json({
      products: transformedProducts,
      totalCount,
      pageCount: totalPages,
      currentPage: page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      price,
      currency,
      is_available,
      category_id,
      translations,
      allergen_ids = [],
      contains_no_allergens = false,
      image_url,
      model_glb_url,
      model_usdz_url,
    } = await req.json();

    const allergenIds: number[] = Array.isArray(allergen_ids)
      ? allergen_ids
      : [];

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Create product
    const { data: product, error: productError } = await (supabaseAdmin as any)
      .from("products")
      .insert({
        tenant_id: tenant.id,
        category_id,
        price,
        currency,
        is_available,
        contains_no_allergens: contains_no_allergens && allergenIds.length === 0,
        image_url: image_url || null,
        model_glb_url: model_glb_url || null,
        model_usdz_url: model_usdz_url || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (productError) {
      console.error("Product creation error:", productError);
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    // Create translations for each language
    const translationInserts = Object.entries(translations).map(
      ([lang, trans]: [string, any]) => ({
        product_id: product.id,
        language_code: lang,
        name: trans.name,
        description: trans.description || null,
      })
    );

    const { error: translationError } = await (supabaseAdmin as any)
      .from("product_translations")
      .insert(translationInserts);

    if (translationError) {
      console.error("Translation creation error:", translationError);
      return NextResponse.json(
        { error: translationError.message },
        { status: 500 }
      );
    }

    // Link selected allergens
    if (allergenIds.length > 0) {
      const { error: allergenError } = await (supabaseAdmin as any)
        .from("product_allergens")
        .insert(
          allergenIds.map((allergenId) => ({
            product_id: product.id,
            allergen_id: allergenId,
          }))
        );

      if (allergenError) {
        console.error("Product allergen creation error:", allergenError);
        return NextResponse.json(
          { error: allergenError.message },
          { status: 500 }
        );
      }
    }

    // Revalidate menu pages for this tenant
    console.log(`[Product Create] Revalidating tenant menu: ${tenant.slug}`);
    await revalidateTenant(tenant.slug, ["products"]);

    return NextResponse.json({ success: true, product_id: product.id });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
