import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidateTenant } from "@/lib/cache/revalidation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from("categories")
      .select(
        `
        id,
        image_url,
        display_order,
        category_translations(name, language_code)
      `
      )
      .eq("tenant_id", tenant.id)
      .order("display_order")
      .order("id");

    if (error) {
      console.error("Categories fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Prefer English, but fall back to whatever translation exists so
    // tenants without an English name (e.g. Turkish-only menus) still get
    // a real category name instead of "N/A".
    const transformed = (data || []).map((cat: any) => ({
      id: cat.id,
      name:
        cat.category_translations?.find((t: any) => t.language_code === "en")
          ?.name ||
        cat.category_translations?.[0]?.name ||
        "N/A",
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    const { translations, image_url } = await req.json();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Create category
    const { data: category, error: categoryError } = await (
      supabaseAdmin as any
    )
      .from("categories")
      .insert({
        tenant_id: tenant.id,
        image_url: image_url || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (categoryError) {
      console.error("Category creation error:", categoryError);
      return NextResponse.json(
        { error: categoryError.message },
        { status: 500 }
      );
    }

    // Create translations for each language
    const translationInserts = Object.entries(translations).map(
      ([lang, trans]: [string, any]) => ({
        category_id: category.id,
        language_code: lang,
        name: trans.name,
      })
    );

    const { error: translationError } = await (supabaseAdmin as any)
      .from("category_translations")
      .insert(translationInserts);

    if (translationError) {
      console.error("Translation creation error:", translationError);
      return NextResponse.json(
        { error: translationError.message },
        { status: 500 }
      );
    }

    // Revalidate menu pages for this tenant
    console.log(`[Category Create] Revalidating tenant menu: ${tenant.slug}`);
    await revalidateTenant(tenant.slug, ["categories"]);

    return NextResponse.json({ success: true, category_id: category.id });
  } catch (error) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
