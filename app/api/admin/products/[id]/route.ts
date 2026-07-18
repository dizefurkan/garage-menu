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
      .select("*, product_translations(*), product_allergens(allergen_id)")
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
      allergen_ids,
      contains_no_allergens,
      model_glb_url,
      model_usdz_url,
    } = await req.json();

    // Allergen fields are optional: callers that don't send them (e.g. the
    // availability toggle in the products table) must not wipe existing data.
    const allergenIds: number[] | undefined = Array.isArray(allergen_ids)
      ? allergen_ids
      : undefined;

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
    const updateData: Record<string, unknown> = {
      price,
      currency,
      is_available,
      category_id,
      image_url: image_url || null,
      updated_by: user.id,
    };
    if (contains_no_allergens !== undefined) {
      // Flag is only meaningful when no allergens are selected
      updateData.contains_no_allergens =
        Boolean(contains_no_allergens) &&
        (allergenIds === undefined || allergenIds.length === 0);
    }
    // Model fields: undefined = don't touch, "" or null = clear
    if (model_glb_url !== undefined) {
      updateData.model_glb_url = model_glb_url || null;
    }
    if (model_usdz_url !== undefined) {
      updateData.model_usdz_url = model_usdz_url || null;
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from("products")
      .update(updateData)
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

    // Replace allergen links (delete-then-insert; skipped when not sent)
    if (allergenIds !== undefined) {
      const { error: deleteAllergenError } = await (supabaseAdmin as any)
        .from("product_allergens")
        .delete()
        .eq("product_id", productId);

      if (deleteAllergenError) {
        console.error("Product allergen delete error:", deleteAllergenError);
        return NextResponse.json(
          { error: deleteAllergenError.message },
          { status: 500 }
        );
      }

      if (allergenIds.length > 0) {
        const { error: allergenError } = await (supabaseAdmin as any)
          .from("product_allergens")
          .insert(
            allergenIds.map((allergenId) => ({
              product_id: productId,
              allergen_id: allergenId,
            }))
          );

        if (allergenError) {
          console.error("Product allergen insert error:", allergenError);
          return NextResponse.json(
            { error: allergenError.message },
            { status: 500 }
          );
        }
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
