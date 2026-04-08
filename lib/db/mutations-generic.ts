"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTenant } from "@/lib/cache/revalidation";

/**
 * Resource type for cache invalidation
 */
type ResourceType = "products" | "categories" | "settings" | "unknown";

/**
 * ⚠️ CRITICAL SAFETY WARNING:
 *
 * Cache invalidation ONLY works when mutations go through these provided helpers:
 * - createGenericRecord()
 * - updateGenericRecord()
 * - deleteGenericRecord()
 * - withRevalidation()
 *
 * Direct database calls like:
 *   ❌ supabase.from('products').insert(...).select()
 *   ❌ supabase.from('products').update(...).eq(...)
 *   ❌ supabase.from('products').delete().eq(...)
 *
 * Will NOT trigger cache invalidation and may serve stale data.
 *
 * ALWAYS use the provided helpers!
 */

/**
 * Options for generic mutation operations
 */
interface GenericMutationOptions {
  table: string;
  slug: string; // Tenant slug (must be passed directly)
  resourceType?: ResourceType; // For granular cache invalidation
}

interface CreateRecordOptions extends GenericMutationOptions {
  data: Record<string, any>;
}

interface UpdateRecordOptions extends GenericMutationOptions {
  id: string | number | bigint;
  data: Record<string, any>;
  tenantId: number | bigint;
}

interface DeleteRecordOptions extends GenericMutationOptions {
  id: string | number | bigint;
  tenantId: number | bigint;
}

/**
 * Central revalidation wrapper for consistent, deduplicated cache invalidation
 *
 * ⚠️ DEDUPLICATION:
 * This wrapper automatically deduplicates cache invalidation to prevent
 * redundant revalidateTags calls. Uses smart logic:
 * - 'all' type → only invalidates root tenant tag
 * - Specific types → invalidates only those resource tags (no duplicates)
 * - Pass multiple types but duplicates are automatically removed
 *
 * ⚠️ Important: Only use this for operations that should invalidate cache.
 *
 * Usage:
 * ```typescript
 * // Invalidate all data for a tenant
 * const result = await withRevalidation({
 *   slug: 'my-restaurant',
 *   types: ['all'],
 *   operation: async () => {
 *     return await supabase.from('products').delete().eq('id', id);
 *   }
 * });
 *
 * // Invalidate specific resource types (granular)
 * const result = await withRevalidation({
 *   slug: 'my-restaurant',
 *   types: ['products', 'categories'],
 *   operation: async () => {
 *     return await supabase.from('products').insert({...}).select().single();
 *   }
 * });
 *
 * // Duplicates are automatically deduplicated
 * await withRevalidation({
 *   slug: 'my-restaurant',
 *   types: ['products', 'products', 'categories'],  // products appears twice
 *   operation: async () => { ... }
 * });
 * // Only calls revalidateTag twice: once for products, once for categories
 * ```
 */
export async function withRevalidation<T = any>(options: {
  slug: string;
  types: (ResourceType | "all")[];
  operation: () => Promise<T>;
}): Promise<{ success: boolean; data?: T; error?: string }> {
  const { slug, types, operation } = options;

  if (!slug || typeof slug !== "string") {
    return { success: false, error: "[Cache] Invalid tenant slug" };
  }

  if (!Array.isArray(types) || types.length === 0) {
    return {
      success: false,
      error: "[Cache] At least one resource type is required",
    };
  }

  try {
    // Execute the operation
    const data = await operation();

    // Invalidate appropriate cache tags (with automatic deduplication)
    await revalidateTenant(slug, types);

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[Mutations] Error during operation for tenant ${slug}:`,
      error
    );
    return { success: false, error: message };
  }
}

/**
 * Generic CREATE operation with semi-automatic cache invalidation
 *
 * ⚠️ IMPORTANT:
 * Cache invalidation ONLY works if you use this function.
 * Direct database insertions will NOT invalidate cache.
 *
 * @param supabase - Supabase client instance
 * @param options - {table, slug, data, resourceType}
 *
 * @example
 * const result = await createGenericRecord(supabaseAdmin, {
 *   table: 'products',
 *   slug: 'my-restaurant',
 *   resourceType: 'products',
 *   data: {
 *     tenant_id: 123,
 *     name: 'New Product',
 *     price: 29.99,
 *   }
 * });
 */
export async function createGenericRecord<T = any>(
  supabase: SupabaseClient,
  options: CreateRecordOptions
): Promise<{ success: boolean; data: T | null; error?: string }> {
  const { table, slug, resourceType = "unknown", data } = options;

  if (!slug) {
    return {
      success: false,
      data: null,
      error: "[Mutations] Tenant slug is required",
    };
  }

  try {
    // Perform the insert
    const { data: record, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error(
        `[Mutations] Failed to create row in ${table}:`,
        error.message
      );
      return { success: false, data: null, error: error.message };
    }

    // Invalidate tenant's cache (with automatic deduplication)
    const types: (ResourceType | "all")[] =
      resourceType && resourceType !== "unknown" ? [resourceType] : ["unknown"];
    await revalidateTenant(slug, types);
    console.log(
      `[Mutations] Created ${table} for tenant: ${slug} (types: ${types.join(", ")})`
    );

    return { success: true, data: record };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[Mutations] Unexpected error during create in ${table}:`,
      error
    );
    return { success: false, data: null, error: message };
  }
}

/**
 * Generic UPDATE operation with semi-automatic cache invalidation
 *
 * ⚠️ IMPORTANT:
 * Cache invalidation ONLY works if you use this function.
 * Direct database updates will NOT invalidate cache.
 *
 * @param supabase - Supabase client instance
 * @param options - {table, slug, id, tenantId, data, resourceType}
 *
 * @example
 * const result = await updateGenericRecord(supabaseAdmin, {
 *   table: 'products',
 *   slug: 'my-restaurant',
 *   id: 42,
 *   tenantId: 123,
 *   resourceType: 'products',
 *   data: {
 *     name: 'Updated Product',
 *     price: 39.99,
 *   }
 * });
 */
export async function updateGenericRecord<T = any>(
  supabase: SupabaseClient,
  options: UpdateRecordOptions
): Promise<{ success: boolean; data: T | null; error?: string }> {
  const { table, id, slug, resourceType = "unknown", data, tenantId } = options;

  if (!slug) {
    return {
      success: false,
      data: null,
      error: "[Mutations] Tenant slug is required",
    };
  }

  if (
    !tenantId ||
    (typeof tenantId === "number" && tenantId <= 0) ||
    (typeof tenantId === "bigint" && tenantId <= BigInt(0))
  ) {
    return {
      success: false,
      data: null,
      error: "[Mutations] Valid tenantId is required",
    };
  }

  if (!id) {
    return {
      success: false,
      data: null,
      error: "[Mutations] Record ID is required",
    };
  }

  try {
    // Perform the update (scoped to tenant for safety)
    const { data: record, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) {
      console.error(`[Mutations] Failed to update ${table}:`, error.message);
      return { success: false, data: null, error: error.message };
    }

    // Invalidate tenant's cache (with automatic deduplication)
    const types: (ResourceType | "all")[] =
      resourceType && resourceType !== "unknown" ? [resourceType] : ["unknown"];
    await revalidateTenant(slug, types);
    console.log(
      `[Mutations] Updated ${table} for tenant: ${slug} (ID: ${id}, types: ${types.join(", ")})`
    );

    return { success: true, data: record };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[Mutations] Unexpected error during update in ${table}:`,
      error
    );
    return { success: false, data: null, error: message };
  }
}

/**
 * Generic DELETE operation with semi-automatic cache invalidation
 *
 * ⚠️ IMPORTANT:
 * Cache invalidation ONLY works if you use this function.
 * Direct database deletes will NOT invalidate cache.
 *
 * @param supabase - Supabase client instance
 * @param options - {table, slug, id, tenantId, resourceType}
 *
 * @example
 * const result = await deleteGenericRecord(supabaseAdmin, {
 *   table: 'products',
 *   slug: 'my-restaurant',
 *   id: 42,
 *   tenantId: 123,
 *   resourceType: 'products',
 * });
 */
export async function deleteGenericRecord(
  supabase: SupabaseClient,
  options: DeleteRecordOptions
): Promise<{ success: boolean; error?: string }> {
  const { table, id, slug, resourceType = "unknown", tenantId } = options;

  if (!slug) {
    return { success: false, error: "[Mutations] Tenant slug is required" };
  }

  if (
    !tenantId ||
    (typeof tenantId === "number" && tenantId <= 0) ||
    (typeof tenantId === "bigint" && tenantId <= BigInt(0))
  ) {
    return { success: false, error: "[Mutations] Valid tenantId is required" };
  }

  if (!id) {
    return { success: false, error: "[Mutations] Record ID is required" };
  }

  try {
    // Perform the delete (scoped to tenant for safety)
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error(
        `[Mutations] Failed to delete from ${table}:`,
        error.message
      );
      return { success: false, error: error.message };
    }

    // Invalidate tenant's cache (with automatic deduplication)
    const types: (ResourceType | "all")[] =
      resourceType && resourceType !== "unknown" ? [resourceType] : ["unknown"];
    await revalidateTenant(slug, types);
    console.log(
      `[Mutations] Deleted from ${table} for tenant: ${slug} (ID: ${id}, types: ${types.join(", ")})`
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[Mutations] Unexpected error during delete in ${table}:`,
      error
    );
    return { success: false, error: message };
  }
}
