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

    const productId = parseInt(id, 10);

    // Verify product belongs to tenant
    const { data: product, error: fetchError } = await (supabaseAdmin as any)
      .from("products")
      .select("id, tenant_id")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: "Unauthorized - product belongs to different tenant" },
        { status: 403 }
      );
    }

    // Delete product (cascades to translations)
    const { error: deleteError } = await (supabaseAdmin as any)
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("Product deletion error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Revalidate menu pages for this tenant
    console.log(`[Product Delete] Revalidating tenant menu: ${tenant.slug}`);
    await revalidateTenant(tenant.slug, ["products"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product deletion error:", error);
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

    const productId = parseInt(id, 10);

    // Fetch product with translations
    const { data: product, error } = await (supabaseAdmin as any)
      .from("products")
      .select("*, product_translations(*)")
      .eq("id", productId)
      .eq("tenant_id", tenant.id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product fetch error:", error);
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

    const productId = parseInt(id, 10);
    const {
      price,
      currency,
      is_available,
      category_id,
      image_url,
      translations,
    } = await req.json();

    // Verify product belongs to tenant
    const { data: product, error: fetchError } = await (supabaseAdmin as any)
      .from("products")
      .select("id, tenant_id")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: "Unauthorized - product belongs to different tenant" },
        { status: 403 }
      );
    }

    // Update product
    const { error: updateError } = await (supabaseAdmin as any)
      .from("products")
      .update({
        price,
        currency,
        is_available,
        category_id,
        image_url: image_url || null,
        updated_by: user.id,
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Product update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update translations
    for (const [lang, trans] of Object.entries(translations)) {
      const transData = trans as any;
      const { error: transError } = await (supabaseAdmin as any)
        .from("product_translations")
        .upsert(
          {
            product_id: productId,
            language_code: lang,
            name: transData.name,
            description: transData.description || null,
          },
          { onConflict: "product_id,language_code" }
        );

      if (transError) {
        console.error("Translation update error:", transError);
        return NextResponse.json(
          { error: transError.message },
          { status: 500 }
        );
      }
    }

    // Revalidate menu pages for this tenant
    console.log(`[Product Update] Revalidating tenant menu: ${tenant.slug}`);
    await revalidateTenant(tenant.slug, ["products"]);

    return NextResponse.json({ success: true, product_id: productId });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
