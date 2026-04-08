"use server";

import { revalidateTag } from "next/cache";

/**
 * Resource types that support granular cache invalidation
 *
 * ⚠️ IMPORTANT:
 * These types determine which cache tags are invalidated.
 * If you add a new resource type, add it here.
 */
type ResourceType = "products" | "categories" | "settings" | "unknown";

/**
 * Maps resource types to their cache tag suffix
 */
const RESOURCE_TYPE_MAP: Record<ResourceType, string> = {
  products: "products",
  categories: "categories",
  settings: "", // Settings use root tenant tag only
  unknown: "", // Unknown types use root tenant tag only
};

/**
 * Revalidates cache for a tenant with smart deduplication
 *
 * ⚠️ DEDUPLICATION LOGIC:
 * - If "all" is in types → ONLY invalidates root tag (most efficient)
 * - If specific types only → invalidates ONLY those type tags (granular)
 * - Prevents duplicate calls to revalidateTag for the same resource
 * - Uses a Set to track which tags have been invalidated
 *
 * ⚠️ CRITICAL:
 * This function ONLY works when mutations go through provided helpers.
 * Direct database calls will NOT trigger cache invalidation.
 *
 * @param slug - The tenant slug (unique identifier)
 * @param types - Array of resource types to invalidate (products, categories, settings, all, unknown)
 *               "all" = invalidate everything for this tenant (most efficient)
 *               Specific types = invalidate only those resources (granular)
 *
 * @example
 * // Invalidate all data for a tenant (most efficient)
 * await revalidateTenant('my-restaurant', ['all']);
 *
 * // Invalidate only products and categories (granular)
 * await revalidateTenant('my-restaurant', ['products', 'categories']);
 *
 * // Duplicates are automatically deduplicated
 * await revalidateTenant('my-restaurant', ['products', 'products', 'categories']);
 * // Calls revalidateTag twice: once for products, once for categories
 */
export async function revalidateTenant(
  slug: string,
  types: (ResourceType | "all")[] = ["unknown"]
): Promise<void> {
  if (!slug || typeof slug !== "string") {
    throw new Error("[Cache] Invalid tenant slug provided");
  }

  if (!Array.isArray(types) || types.length === 0) {
    types = ["unknown"];
  }

  try {
    // Check if "all" is included - if so, only invalidate root tag
    if (types.includes("all")) {
      const rootTag = getTenantCacheTag(slug);
      console.log(`[Cache] Bulk invalidate (all types) for tenant: ${slug}`);
      console.log(`[Cache] Revalidating: ${rootTag}`);
      (revalidateTag as any)(rootTag);
      return; // Early return - no need to invalidate specific types
    }

    // Deduplicate types using Set
    const uniqueTypes = new Set<ResourceType>();
    for (const type of types) {
      if (isValidResourceType(type)) {
        uniqueTypes.add(type);
      }
    }

    // Convert unique types to tags and deduplicate
    const tagsToInvalidate = new Set<string>();
    for (const type of uniqueTypes) {
      const tag = getTenantResourceTag(slug, type);
      // Only add non-empty tags (settings/unknown don't have specific tags)
      if (tag) {
        tagsToInvalidate.add(tag);
      }
    }

    // If no specific tags but we have types, invalidate root tag
    // This handles settings/unknown types that don't have granular tags
    if (tagsToInvalidate.size === 0) {
      const rootTag = getTenantCacheTag(slug);
      tagsToInvalidate.add(rootTag);
    }

    // Revalidate each unique tag exactly once
    console.log(
      `[Cache] Granular invalidate (${uniqueTypes.size} types) for tenant: ${slug}`
    );
    for (const tag of tagsToInvalidate) {
      console.log(`[Cache] Revalidating: ${tag}`);
      (revalidateTag as any)(tag);
    }
  } catch (error) {
    console.error(`[Cache] Failed to revalidate tenant ${slug}:`, error);
    // Don't throw - cache invalidation shouldn't break mutations
  }
}

/**
 * Validates if a resource type is recognized
 *
 * @param type - Resource type to validate
 * @returns True if type is recognized
 */
function isValidResourceType(type: any): type is ResourceType {
  return Object.keys(RESOURCE_TYPE_MAP).includes(type);
}

/**
 * BACKWARDS COMPATIBILITY: Invalidate all data for a tenant
 *
 * Convenience function - equivalent to:
 * ```typescript
 * await revalidateTenant(slug, ['all']);
 * ```
 *
 * Use this when you want to invalidate all cached data for a tenant
 * (e.g., when bulk-updating settings or doing admin cleanup)
 *
 * @param slug - The tenant slug
 *
 * @example
 * // Invalidate everything for a tenant (most efficient)
 * await revalidateTenantAll('my-restaurant');
 */
export async function revalidateTenantAll(slug: string): Promise<void> {
  await revalidateTenant(slug, ["all"]);
}

/**
 * BACKWARDS COMPATIBILITY: Invalidate specific resource types
 *
 * Convenience function for single type - equivalent to:
 * ```typescript
 * await revalidateTenant(slug, [resourceType]);
 * ```
 *
 * Use this for basic, single-resource invalidations
 *
 * @param slug - The tenant slug
 * @param resourceType - The resource type to invalidate
 *
 * @example
 * // Invalidate only products for a tenant
 * await revalidateTenantResource('my-restaurant', 'products');
 */
export async function revalidateTenantResource(
  slug: string,
  resourceType: ResourceType
): Promise<void> {
  await revalidateTenant(slug, [resourceType]);
}

/**
 * Generates the root cache tag for a tenant
 * Format: tenant:{slug}
 *
 * Used as fallback invalidation for any resource type
 *
 * @param slug - The tenant slug
 * @returns Cache tag string
 */
export function getTenantCacheTag(slug: string): string {
  return `tenant:${slug}`;
}

/**
 * Generates a granular cache tag for a tenant resource
 * Format: tenant:{slug}:{resource}
 *
 * Returns empty string for settings/unknown types (use root tag only)
 *
 * @param slug - The tenant slug
 * @param resourceType - Resource type (products, categories, settings, unknown)
 * @returns Cache tag string (may be empty for certain types)
 */
export function getTenantResourceTag(
  slug: string,
  resourceType: ResourceType = "unknown"
): string {
  const resourceSuffix = RESOURCE_TYPE_MAP[resourceType];

  if (!resourceSuffix) {
    // Return empty string for settings/unknown - use root tag only
    return "";
  }

  return `tenant:${slug}:${resourceSuffix}`;
}

/**
 * ADVANCED: Get all cache tags for a resource (used in fetch operations)
 *
 * Returns both global and resource-specific tags for comprehensive caching
 *
 * @param slug - The tenant slug
 * @param resourceType - Resource type
 * @returns Array of cache tags to use in fetch operations
 */
export function getTenantCacheTags(
  slug: string,
  resourceType: ResourceType = "unknown"
): string[] {
  const tags: string[] = [];

  // Always include root tag
  tags.push(getTenantCacheTag(slug));

  // Include resource-specific tag if applicable
  const resourceTag = getTenantResourceTag(slug, resourceType);
  if (resourceTag) {
    tags.push(resourceTag);
  }

  return tags;
}
