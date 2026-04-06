import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
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
        product_translations(name, language_code),
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

    const { price, currency, is_available, category_id, translations } =
      await req.json();

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

    return NextResponse.json({ success: true, product_id: product.id });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
