import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidateTenant } from "@/lib/cache/revalidation";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const categoryId = parseInt(id, 10);

    // Verify category belongs to tenant
    const { data: category, error: fetchError } = await (supabaseAdmin as any)
      .from("categories")
      .select("id, tenant_id")
      .eq("id", categoryId)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: "Unauthorized - category belongs to different tenant" },
        { status: 403 }
      );
    }

    // Block deletion if products still reference this category
    const { count: productCount, error: countError } = await (supabaseAdmin as any)
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (countError) {
      console.error("Category product count error:", countError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if (productCount && productCount > 0) {
      return NextResponse.json(
        { error: "CATEGORY_HAS_PRODUCTS", count: productCount },
        { status: 409 }
      );
    }

    // Delete category (cascades to translations)
    const { error: deleteError } = await (supabaseAdmin as any)
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (deleteError) {
      console.error("Category deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Revalidate menu pages for this tenant
    console.log(`[Category Delete] Revalidating tenant menu: ${tenant.slug}`);
    await revalidateTenant(tenant.slug, ["categories"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const categoryId = parseInt(id, 10);

    // Fetch category with translations
    const { data: category, error } = await (supabaseAdmin as any)
      .from("categories")
      .select("*, category_translations(*)")
      .eq("id", categoryId)
      .eq("tenant_id", tenant.id)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const categoryId = parseInt(id, 10);
    const { translations } = await req.json();

    // Verify category belongs to tenant
    const { data: category, error: fetchError } = await (supabaseAdmin as any)
      .from("categories")
      .select("id, tenant_id")
      .eq("id", categoryId)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: "Unauthorized - category belongs to different tenant" },
        { status: 403 }
      );
    }

    // Update category
    const { error: updateError } = await (supabaseAdmin as any)
      .from("categories")
      .update({
        updated_by: user.id,
      })
      .eq("id", categoryId);

    if (updateError) {
      console.error("Category update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update translations
    for (const [lang, trans] of Object.entries(translations)) {
      const transData = trans as any;
      const { error: transError } = await (supabaseAdmin as any)
        .from("category_translations")
        .upsert(
          {
            category_id: categoryId,
            language_code: lang,
            name: transData.name,
            description: transData.description || null,
          },
          { onConflict: "category_id,language_code" }
        );

      if (transError) {
        console.error("Translation update error:", transError);
        return NextResponse.json(
          { error: transError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, category_id: categoryId });
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
