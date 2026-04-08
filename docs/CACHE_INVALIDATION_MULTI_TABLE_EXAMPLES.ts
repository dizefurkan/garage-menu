/**
 * Multi-Table Example: Using Generic Mutations for Different Resources
 *
 * This demonstrates how ONE PATTERN works for:
 * - Products
 * - Categories
 * - Tenants settings
 * - Contact info
 * - Gallery images
 * - Any other table
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentTenant, verifyCanEdit } from "@/lib/auth/server";
import {
  createGenericRecord,
  updateGenericRecord,
  deleteGenericRecord,
} from "@/lib/db/mutations-generic";

export const runtime = "nodejs";

// ============================================================================
// CATEGORIES EXAMPLE
// ============================================================================

export async function POST_Category(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { name, description, display_order } = await request.json();

    // SAME PATTERN - just different table name
    const result = await createGenericRecord(supabaseAdmin, {
      table: "categories", // ← Different table
      slug: tenant.slug, // REQUIRED: Pass slug
      resourceType: "categories", // OPTIONAL: Granular tag
      data: {
        tenant_id: tenant.id,
        name,
        description,
        display_order: display_order || 0,
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// GALLERY/IMAGES EXAMPLE
// ============================================================================

export async function POST_GalleryImage(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { url, title, description, display_order } = await request.json();

    // SAME PATTERN - gallery table
    const result = await createGenericRecord(supabaseAdmin, {
      table: "gallery_images", // ← Different table
      slug: tenant.slug, // REQUIRED: Pass slug
      data: {
        tenant_id: tenant.id,
        url,
        title,
        description,
        display_order: display_order || 0,
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// TENANT SETTINGS EXAMPLE
// ============================================================================

export async function PUT_TenantSettings(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { theme_color, description, logo_url } = await request.json();

    // SAME PATTERN - but we need special handling since tenants table has different ID
    const result = await updateGenericRecord(supabaseAdmin, {
      table: "tenants", // ← Different table
      id: tenant.id,
      slug: tenant.slug, // REQUIRED: Pass slug
      tenantId: tenant.id, // REQUIRED: For security scoping
      resourceType: "settings", // OPTIONAL: Granular tag
      data: {
        theme_color,
        description,
        logo_url,
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// CONTACT INFO EXAMPLE
// ============================================================================

export async function POST_ContactInfo(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { address, phone, email, whatsapp, instagram, facebook } =
      await request.json();

    // SAME PATTERN - contact_info table
    const result = await createGenericRecord(supabaseAdmin, {
      table: "contact_info", // ← Different table
      slug: tenant.slug, // REQUIRED: Pass slug
      data: {
        tenant_id: tenant.id,
        address,
        phone,
        email,
        whatsapp,
        instagram,
        facebook,
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PRODUCT TRANSLATIONS EXAMPLE (with custom tenantIdField)
// ============================================================================

export async function POST_ProductTranslation(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { product_id, language_code, name, description, slug } =
      await request.json();

    // Get product first to verify it belongs to this tenant
    const { data: product } = (await supabaseAdmin
      .from("products")
      .select("id, tenant_id")
      .eq("id", product_id)
      .single()) as any;

    if (!product || product.tenant_id !== tenant.id) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 403 }
      );
    }

    // Note: product_translations table has product_id, not tenant_id directly
    // But we can still use createGenericRecord if we manually set tenant_id in data
    // OR we can manually handle this specific case

    const result = await createGenericRecord(supabaseAdmin, {
      table: "product_translations",
      slug: tenant.slug, // REQUIRED: Pass slug
      resourceType: "products", // Products are affected by translations
      data: {
        tenant_id: tenant.id, // Include for consistency
        product_id,
        language_code,
        name,
        description,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// BULK DELETE EXAMPLE
// ============================================================================

export async function DELETE_MultipleProducts(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid IDs array" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin not initialized");
    }

    // Delete each product - cache is revalidated after the FIRST delete
    // but you might want to batch this differently
    const results = await Promise.all(
      ids.map((id) =>
        deleteGenericRecord(supabaseAdmin!, {
          table: "products",
          id,
          slug: tenant.slug, // REQUIRED: Pass slug
          tenantId: tenant.id,
          resourceType: "products", // OPTIONAL: Granular tag
        })
      )
    );

    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      return NextResponse.json(
        {
          error: `${failed.length} items failed to delete`,
          succeeded: ids.length - failed.length,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// BATCH CREATE WITH TRANSLATIONS EXAMPLE
// ============================================================================

export async function POST_BatchProducts(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) throw new Error("Supabase not initialized");

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { products } = await request.json(); // Array of product objects with translations

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Invalid products array" },
        { status: 400 }
      );
    }

    const results = [];

    for (const productData of products) {
      const { translations, ...productFields } = productData;

      // Step 1: Create product
      const productResult = await createGenericRecord(supabaseAdmin, {
        table: "products",
        slug: tenant.slug, // REQUIRED: Pass slug
        resourceType: "products", // OPTIONAL: Granular tag
        data: {
          tenant_id: tenant.id,
          ...productFields,
        },
      });

      if (!productResult.success) {
        results.push({ success: false, error: productResult.error });
        continue;
      }

      const productId = productResult.data.id;

      // Step 2: Create translations for this product
      if (translations && Array.isArray(translations)) {
        for (const translation of translations) {
          await createGenericRecord(supabaseAdmin, {
            table: "product_translations",
            slug: tenant.slug, // REQUIRED: Pass slug
            resourceType: "products", // OPTIONAL: Products are affected by translations
            data: {
              tenant_id: tenant.id,
              product_id: productId,
              ...translation,
            },
          });
        }
      }

      results.push({ success: true, data: productResult.data });
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successCount === products.length,
      created: successCount,
      failed: products.length - successCount,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// KEY TAKEAWAY
// ============================================================================

/**
 * The same mutation pattern works for ANY table:
 *
 * 1. Create/Update/Delete any record with createGenericRecord/updateGenericRecord/deleteGenericRecord
 * 2. Include tenant_id in the data
 * 3. Automatic cache invalidation happens
 * 4. Works across entire application
 *
 * This eliminates:
 * ❌ Manual cache.revalidateTag() calls
 * ❌ Per-table custom mutations
 * ❌ Risk of forgetting to invalidate cache
 *
 * Result:
 * ✅ Consistent error handling across app
 * ✅ Guaranteed cache invalidation
 * ✅ Easy to add new tables/features
 * ✅ Type-safe with TypeScript
 */
