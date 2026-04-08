/**
 * Example API Route: Generic Product Management with Deduplication
 *
 * This demonstrates:
 * - Using generic mutation functions (create/update/delete)
 * - Automatic cache deduplication (no redundant revalidateTags)
 * - Proper error handling and responses
 * - Using types array for granular cache invalidation
 *
 * Adapt this pattern for ANY table/resource
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

/**
 * POST /api/admin/products
 * Create a new product for the tenant
 *
 * ✅ Cache invalidation is deduplicated automatically:
 * - Calls revalidateTag('tenant:slug:products') ONCE
 * - No redundant calls to root tag
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get tenant
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin not initialized");
    }

    // Verify edit permissions
    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || body.price === undefined || !body.category_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, price, category_id" },
        { status: 400 }
      );
    }

    // Use generic create - automatically deduplicates cache invalidation
    // resourceType: 'products' → only invalidates product cache, not categories/settings
    const result = await createGenericRecord(supabaseAdmin, {
      table: "products",
      slug: tenant.slug, // REQUIRED: Pass slug from session
      resourceType: "products", // OPTIONAL: Enables granular, deduplicated tags
      data: {
        tenant_id: tenant.id,
        category_id: body.category_id,
        price: body.price,
        currency: body.currency || "USD",
        is_available: body.is_available !== false,
        is_draft: body.is_draft !== false,
        display_order: body.display_order || 0,
        created_by: tenant.id,
        updated_by: tenant.id,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]
 * Update an existing product for the tenant
 */
export async function PUT(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin not initialized");
    }

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    // Extract only updatable fields
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.category_id !== undefined)
      updateData.category_id = body.category_id;
    if (body.is_available !== undefined)
      updateData.is_available = body.is_available;
    if (body.is_draft !== undefined) updateData.is_draft = body.is_draft;
    if (body.display_order !== undefined)
      updateData.display_order = body.display_order;
    if (body.currency !== undefined) updateData.currency = body.currency;

    updateData.updated_by = tenant.id;
    updateData.updated_at = new Date().toISOString();

    // Use generic update - semi-automatically revalidates cache
    const result = await updateGenericRecord(supabaseAdmin, {
      table: "products",
      id: body.id,
      slug: tenant.slug, // REQUIRED: Pass slug from session
      tenantId: tenant.id, // REQUIRED: For security scoping
      resourceType: "products", // OPTIONAL: For granular invalidation
      data: updateData,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[PUT /api/admin/products]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete a product for the tenant
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin not initialized");
    }

    const canEdit = await verifyCanEdit(tenant.id as any);
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    // Use generic delete - semi-automatically revalidates cache
    const result = await deleteGenericRecord(supabaseAdmin, {
      table: "products",
      id: body.id,
      slug: tenant.slug, // REQUIRED: Pass slug from session
      tenantId: tenant.id, // REQUIRED: For security scoping
      resourceType: "products", // OPTIONAL: For granular invalidation
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/products]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
