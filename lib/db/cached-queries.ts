"use server";

import {
  getTenantCacheTag,
  getTenantResourceTag,
  getTenantCacheTags,
} from "@/lib/cache/revalidation";

/**
 * Options for cached data fetching
 */
interface CachedFetchOptions {
  /** Cache tags for Next.js cache invalidation */
  tags?: string[];
  /** Time-based revalidation (seconds) - optional, use tags primarily */
  revalidate?: number;
}

/**
 * ⚠️ IMPORTANT - Browser Cache Warning
 *
 * This system only controls Next.js server-side cache.
 * Browser caching must be handled separately using HTTP headers.
 *
 * Always set appropriate Cache-Control headers in API routes:
 * ```
 * headers: {
 *   'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
 * }
 * ```
 */

/**
 * Generic cached fetch helper
 * Wraps the native fetch API with Next.js cache configuration
 *
 * ⚠️ Note: revalidateTag only invalidates the server-side cache.
 * Fresh data will be fetched on the NEXT request, not instantly.
 */
export async function getCachedData<T = any>(
  url: string,
  options?: CachedFetchOptions
): Promise<T> {
  const { tags = [], revalidate } = options || {};

  const nextOptions: any = { tags };

  if (revalidate !== undefined) {
    nextOptions.revalidate = revalidate;
  }

  try {
    const response = await fetch(url, {
      next: nextOptions,
    });

    if (!response.ok) {
      throw new Error(
        `[Cached Query] ${url} responded with ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`[Cached Query] Failed to fetch ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch public menu with tenant cache tags
 *
 * Tags: tenant:{slug}
 *
 * ⚠️ Cache invalidated when: ANY tenant data updates
 * Duration: Until revalidateTenant() is called
 */
export async function getPublicMenu(slug: string, language: string = "en") {
  const tags = getTenantCacheTags(slug, "unknown");

  return getCachedData(`/api/public/menu?slug=${slug}&lang=${language}`, {
    tags,
  });
}

/**
 * Fetch public categories with granular tenant cache tags
 *
 * Tags: tenant:{slug}, tenant:{slug}:categories
 *
 * ⚠️ Cache invalidated when: Categories or ANY tenant data updates
 * Duration: Until revalidateTenant() is called with 'categories' type
 */
export async function getPublicCategories(
  slug: string,
  language: string = "en"
) {
  const tags = getTenantCacheTags(slug, "categories");

  return getCachedData(`/api/public/categories?slug=${slug}&lang=${language}`, {
    tags,
  });
}

/**
 * Fetch public products with granular tenant cache tags
 *
 * Tags: tenant:{slug}, tenant:{slug}:products
 *
 * ⚠️ Cache invalidated when: Products update
 * Duration: Until revalidateTenant() is called with 'products' type
 */
export async function getPublicProducts(slug: string, language: string = "en") {
  const tags = getTenantCacheTags(slug, "products");

  return getCachedData(`/api/public/products?slug=${slug}&lang=${language}`, {
    tags,
  });
}

/**
 * Fetch single product with granular tenant cache tags
 *
 * Tags: tenant:{slug}, tenant:{slug}:products
 *
 * ⚠️ Cache invalidated when: Product updates
 */
export async function getPublicProduct(
  slug: string,
  productId: number,
  language: string = "en"
) {
  const tags = getTenantCacheTags(slug, "products");

  return getCachedData(
    `/api/public/products/${productId}?slug=${slug}&lang=${language}`,
    {
      tags,
    }
  );
}

/**
 * Fetch menu configuration (colors, theme, settings)
 *
 * Tags: tenant:{slug}
 *
 * ⚠️ Cache invalidated when: ANY tenant data updates (including settings)
 */
export async function getPublicMenuConfig(slug: string) {
  const tags = getTenantCacheTags(slug, "settings");

  return getCachedData(`/api/public/config?slug=${slug}`, {
    tags,
  });
}

/**
 * Fetch tenant contact information
 *
 * Tags: tenant:{slug}
 *
 * ⚠️ Cache invalidated when: ANY tenant data updates
 */
export async function getPublicContactInfo(slug: string) {
  const tags = getTenantCacheTags(slug, "unknown");

  return getCachedData(`/api/public/contact?slug=${slug}`, {
    tags,
  });
}

/**
 * Advanced: Fetch with custom tags for specialized scenarios
 *
 * Use this when you need more control over cache invalidation.
 *
 * ⚠️ Ensure custom tags follow the pattern: tenant:{slug}[:resource]
 */
export async function getCachedDataWithCustomTags<T = any>(
  url: string,
  tags: string[],
  revalidate?: number
): Promise<T> {
  return getCachedData<T>(url, { tags, revalidate });
}
