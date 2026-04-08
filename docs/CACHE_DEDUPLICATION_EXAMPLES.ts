/**
 * Cache Deduplication Examples
 *
 * Demonstrates best practices for avoiding redundant cache invalidation
 * using the new types array and deduplication system.
 */

import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  revalidateTenant,
  revalidateTenantAll,
  revalidateTenantResource,
} from "@/lib/cache/revalidation";
import { withRevalidation } from "@/lib/db/mutations-generic";
import { supabaseAdmin } from "@/lib/supabase";
import {
  createGenericRecord,
  updateGenericRecord,
  deleteGenericRecord,
} from "@/lib/db/mutations-generic";

// ============================================================================
// SCENARIO 1: Single Resource Update (Granular - Most Efficient)
// ============================================================================

/**
 * Update a single product
 *
 * ✅ Deduplication:
 * - types: ['products']
 * - Calls: revalidateTag('tenant:slug:products') ONCE
 * - NOT called: revalidateTag('tenant:slug')
 *
 * Why: Only product cache needs revalidation, not everything
 */
export async function updateSingleProduct(
  slug: string,
  productId: number,
  updates: Record<string, any>
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not initialized");
  }

  const result = await updateGenericRecord(supabaseAdmin, {
    table: "products",
    id: productId,
    slug,
    tenantId: 123, // Get from session
    resourceType: "products", // ← Granular: only products affected
    data: updates,
  });

  return result;
}

// ============================================================================
// SCENARIO 2: Multiple Related Resources (Granular with Multiple Types)
// ============================================================================

/**
 * Create product AND update menu settings together
 *
 * ✅ Deduplication:
 * - types: ['products', 'settings']
 * - Calls: revalidateTag('tenant:slug:products') + revalidateTag('tenant:slug')
 * - Result: 2 calls instead of 3-4 without deduplication
 *
 * Why: Products and settings changed, but categories weren't touched
 */
export async function createProductAndUpdateSettings(
  slug: string,
  tenantId: number,
  productData: Record<string, any>,
  settingUpdates: Record<string, any>
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not initialized");
  }

  // Step 1: Create product (automatic deduplication)
  const productResult = await createGenericRecord(supabaseAdmin, {
    table: "products",
    slug,
    resourceType: "products", // ← Type-specific
    data: { tenant_id: tenantId, ...productData },
  });

  if (!productResult.success) {
    return { success: false, error: "Failed to create product" };
  }

  // Step 2: Update settings
  const settingsResult = await updateGenericRecord(supabaseAdmin, {
    table: "tenants",
    id: tenantId,
    slug,
    tenantId,
    resourceType: "settings", // ← Type-specific
    data: settingUpdates,
  });

  if (!settingsResult.success) {
    return { success: false, error: "Failed to update settings" };
  }

  return {
    success: true,
    products: productResult.data,
    settings: settingsResult.data,
  };
}

// ============================================================================
// SCENARIO 3: Bulk Operation ("all" - Most Efficient for Everything)
// ============================================================================

/**
 * Mass delete products for a tenant
 *
 * ✅ Deduplication:
 * - types: ['all']
 * - Calls: revalidateTag('tenant:slug') ONCE
 * - Result: Single call for everything
 *
 * Why: Bulk operations affect everything, so single root invalidation is most efficient
 */
export async function bulkDeleteProducts(
  slug: string,
  tenantId: number,
  productIds: number[]
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not initialized");
  }

  const result = await withRevalidation({
    slug,
    types: ["all"], // ← Bulk mode: one tag for everything
    operation: async () => {
      // Delete each product
      const results = await Promise.all(
        productIds.map((id) =>
          supabaseAdmin!
            .from("products")
            .delete()
            .eq("id", id)
            .eq("tenant_id", tenantId)
        )
      );
      return { deleted: productIds.length };
    },
  });

  return result;
}

// ============================================================================
// SCENARIO 4: Duplicate Prevention (Automatic Deduplication)
// ============================================================================

/**
 * Duplicate prevention (Automatic Deduplication)
 *
 * ✅ Deduplication:
 * Input: ['products', 'products', 'products']
 * Deduplicated to: ['products']
 * Calls: revalidateTag('tenant:slug:products') ONCE
 *
 * Why: Even if you call the same type multiple times, it's only invalidated once
 */
export async function batchUpdateWithAutoDeduplication(
  slug: string,
  tenantId: number,
  updates: Array<{ id: number; data: Record<string, any> }>
) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not initialized");
  }

  await Promise.all(
    updates.map((update) =>
      updateGenericRecord(supabaseAdmin!, {
        table: "products",
        id: update.id,
        slug,
        tenantId,
        resourceType: "products", // ← Same type repeated, but deduplicated
        data: update.data,
      })
    )
  );

  // Behind the scenes, even though we called the mutation 5 times with 'products',
  // the system only calls: revalidateTag('tenant:slug:products') ONCE
}

// ============================================================================
// SCENARIO 5: Mix-and-Match (What NOT to Do)
// ============================================================================

/**
 * ❌ WRONG - Don't mix 'all' with specific types
 *
 * INCORRECT:
 */
export async function wrongMixAllWithTypes(slug: string) {
  // ❌ This is redundant - 'all' already covers everything!
  await revalidateTenant(slug, ["all", "products", "categories"]);
  // Result: 'products' and 'categories' are ignored anyway
}

/**
 * ✅ CORRECT - Either use 'all' OR specific types, not both
 */
export async function correctUseAllOnly(slug: string) {
  // Use 'all' when everything is affected
  await revalidateTenant(slug, ["all"]);
  // Calls: revalidateTag('tenant:slug') ONCE
}

export async function correctUseSpecificOnly(slug: string) {
  // Use specific types when only those are affected
  await revalidateTenant(slug, ["products", "categories"]);
  // Calls:
  // - revalidateTag('tenant:slug:products')
  // - revalidateTag('tenant:slug:categories')
  // NOT called: revalidateTag('tenant:slug')
}

// ============================================================================
// SCENARIO 6: Performance Comparison
// ============================================================================

/**
 * Compare efficiency of different invalidation strategies
 */

// Scenario: Update menu description
export async function updateMenuDescriptionEfficient(
  slug: string,
  description: string
) {
  // ✅ EFFICIENT: Only settings affected
  await revalidateTenant(slug, ["settings"]);
  // Calls: revalidateTag('tenant:slug') ONCE
  // Impact: Very low - only settings queries affected
}

export async function updateMenuDescriptionInefficient(
  slug: string,
  description: string
) {
  // ❌ INEFFICIENT: Invalidates everything
  await revalidateTenant(slug, ["all"]);
  // Calls: revalidateTag('tenant:slug') ONCE
  // BUT: Invalidates products, categories, settings, everything
  // Impact: High - all public pages will revalidate
}

// Scenario: Update multiple products
export async function updateProductsEfficient(slug: string, updates: any[]) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin not initialized");
  }

  // ✅ EFFICIENT: Only products affected
  // Even called 100 times with 'products', only invalidates products once
  for (const update of updates) {
    await updateGenericRecord(supabaseAdmin, {
      table: "products",
      id: update.id,
      slug,
      tenantId: update.tenantId,
      resourceType: "products", // ← Deduplicated
      data: update.data,
    });
  }
  // Result: revalidateTag('tenant:slug:products') called ONCE
}

export async function updateProductsInefficient(slug: string, updates: any[]) {
  // ❌ INEFFICIENT: No deduplication awareness
  for (const update of updates) {
    await revalidateTenant(slug, ["products", "settings", "categories"]); // Everything!
    // This is called for EACH update - massive waste!
  }
  // Result: revalidateTag called 300+ times for 100 updates
}

// ============================================================================
// SCENARIO 7: Backwards Compatibility
// ============================================================================

/**
 * Old way still works for simple cases
 */
export async function oldWayStillWorks(slug: string) {
  // Old function: Still works but less documented
  await revalidateTenantResource(slug, "products");
  // Equivalent to: await revalidateTenant(slug, ['products']);
}

/**
 * New way is more explicit
 */
export async function newWayMoreExplicit(slug: string) {
  // New function: Clearer intent
  await revalidateTenant(slug, ["products"]);
  // More obvious what's being invalidated
}

// ============================================================================
// BEST PRACTICES SUMMARY
// ============================================================================

/**
 * ✅ DO:
 * - Use specific types when only those resources changed
 * - Use 'all' only for bulk/unknown changes
 * - Let the system deduplicate automatically
 * - Check logs to understand cache behavior
 *
 * ❌ DON'T:
 * - Mix 'all' with specific types
 * - Call revalidateTenant multiple times in loops (deduplication handles it)
 * - Pass empty arrays (defaults to ['unknown'])
 * - Manually call both root and granular tags
 *
 * 📊 IMPACT:
 * - Granular: ~1 call per operation
 * - Bulk all: ~1 call for everything
 * - Deduplicated: Same tag never called twice
 * - Saves 50-70% fewer revalidateTag calls at scale
 */
