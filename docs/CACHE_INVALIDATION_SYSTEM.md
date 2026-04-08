# Tenant-Specific Cache Invalidation System

## Overview

This system implements **tenant-isolated cache invalidation** using Next.js App Router's `revalidateTag` functionality. When ANY data for a tenant is updated (products, categories, settings, etc.), only that tenant's cached public site is revalidated.

### Key Features

✅ **Semi-Automatic Cache Invalidation** - Works automatically with designated helper functions  
✅ **Tenant Isolation** - Each tenant's cache is independent  
✅ **Granular Invalidation** - Separate tags for products, categories, settings  
✅ **Production-Ready** - Works on Vercel and all Next.js deployments  
✅ **Generic Mutations** - One pattern works for ANY table  
✅ **Zero Downtime** - Revalidation happens asynchronously  
✅ **TypeScript** - Full type safety

⚠️ **Important Notes:**

- This system controls **server-side (Next.js) cache only**
- Browser caching is handled separately with HTTP Cache-Control headers
- Cache revalidation affects the NEXT request, not instant UI updates

---

## Architecture

### Cache Tag Strategy

```
tenant:{slug}                          # Invalidates ALL data for this tenant
tenant:{slug}:products                 # Granular: products only
tenant:{slug}:categories               # Granular: categories only
tenant:{slug}:settings                 # Granular: settings only
```

**Tag Format Rules:**

- Separator: `:` (colon, not hyphen)
- Slug: lowercase, URL-safe identifier
- Resource types: `'products' | 'categories' | 'settings' | 'unknown'`

### How It Works

1. **Data Mutation** (Admin updates a product)

   ```
   Product Updated → Extract tenant_id → Get tenant slug → Call revalidateTenant(slug)
   ```

2. **Cache Invalidation**

   ```
   revalidateTenant(slug) → revalidateTag('tenant-{slug}')
   ```

3. **Data Fetching** (Public page loads)

   ```
   fetch(..., { next: { tags: ['tenant-{slug}'] } })
   ```

4. **Cache Miss/Hit**
   - First load after invalidation: Miss → Fetch fresh data → Cache
   - Subsequent loads: Hit → Serve cached data

---

## Core Files

### 1. `lib/cache/revalidation.ts`

Main cache invalidation utilities. Functions automatically generate correct tags.

```typescript
// Invalidate all data for a tenant (includes specific resource types)
await revalidateTenant("my-restaurant");
// Invalidates: tenant:my-restaurant, tenant:my-restaurant:products, etc.

// Get base tenant cache tag
const tag = getTenantCacheTag("my-restaurant");
// Returns: 'tenant:my-restaurant'

// Get all tags for data fetching (use in fetch options)
const tags = getTenantCacheTags("my-restaurant", "products");
// Returns: ['tenant:my-restaurant', 'tenant:my-restaurant:products']
```

**When to use:**

- **DO**: Use `getTenantCacheTags()` for fetch calls (automatically called by helpers)
- **DO**: Use `revalidateTenant()` for manual invalidation (automatically called by mutation helpers)
- **DON'T**: Call these directly in most cases - use mutation helpers instead

---

### 2. `lib/db/mutations-generic.ts`

⚠️ **Semi-Automatic** Generic mutation functions that revalidate cache when used.

#### `createGenericRecord()`

```typescript
const result = await createGenericRecord(supabaseAdmin, {
  table: "products",
  slug: "my-restaurant", // REQUIRED: Pass slug from request context
  resourceType: "products", // OPTIONAL: For granular invalidation
  data: {
    tenant_id: 123,
    name: "New Product",
    price: 29.99,
    category_id: 5,
  },
});

if (result.success) {
  console.log("Product created, cache invalidated");
  console.log(
    "Tags invalidated: tenant:my-restaurant, tenant:my-restaurant:products"
  );
}
```

**What it does:**

1. Inserts record into table
2. Calls `revalidateTenant(slug, resourceType)`
3. Invalidates appropriate cache tags
4. Returns { success: true, data: record }

**⚠️ Important:**

- Must pass `slug` from request context (session, URL params, etc.)
- Return value includes error details for logging and UI display
- **Direct Supabase calls do NOT invalidate cache** - use these helpers

#### `updateGenericRecord()`

```typescript
const result = await updateGenericRecord(supabaseAdmin, {
  table: "products",
  id: 42,
  slug: "my-restaurant", // REQUIRED: Pass slug
  resourceType: "products", // OPTIONAL: For granular invalidation
  data: {
    name: "Updated Name",
    price: 39.99,
  },
});
```

**What it does:**

1. Updates record (scoped to tenant for security)
2. Calls `revalidateTenant(slug, resourceType)`
3. Returns { success: true, data: record }

**Security:** Update is scoped to specific record ID - cannot accidentally update other tenants

#### `deleteGenericRecord()`

```typescript
const result = await deleteGenericRecord(supabaseAdmin, {
  table: "products",
  id: 42,
  slug: "my-restaurant", // REQUIRED: Pass slug
  resourceType: "products", // OPTIONAL: For granular invalidation
});
```

**What it does:**

1. Deletes record (scoped to tenant for security)
2. Calls `revalidateTenant(slug, resourceType)`
3. Returns { success: true }

**Security:** Delete is scoped to specific record ID - cannot accidentally delete across tenants

---

### 3. `lib/db/cached-queries.ts`

Data fetching helpers with proper cache tagging. Use these on public pages.

```typescript
// Fetch public menu
const menu = await getPublicMenu("my-restaurant", "en");
// Tagged with: ['tenant:my-restaurant']

// Fetch categories (granular tags)
const categories = await getPublicCategories("my-restaurant", "en");
// Tagged with: ['tenant:my-restaurant', 'tenant:my-restaurant:categories']

// Fetch products (granular tags)
const products = await getPublicProducts("my-restaurant", "en");
// Tagged with: ['tenant:my-restaurant', 'tenant:my-restaurant:products']

// Single product
const product = await getPublicProduct("my-restaurant", 42, "en");
// Tagged with: ['tenant:my-restaurant', 'tenant:my-restaurant:products']

// Custom tags if needed
const data = await getCachedDataWithCustomTags("/api/custom-endpoint", [
  "tenant:my-restaurant",
  "custom-tag",
]);
```

**⚠️ Important:**

- Slug parameter is required (extracted from URL params or request context)
- Language parameter is optional (defaults to 'en')
- All queries use granular tags for precise cache invalidation

---

## Usage Patterns

### Pattern 1: Create Operation

In your API route:

```typescript
// app/api/admin/products/route.ts
export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return unauthorized();

  const body = await request.json();

  const result = await createGenericRecord(supabaseAdmin, {
    table: "products",
    data: {
      tenant_id: tenant.id,
      name: body.name,
      price: body.price,
      // ... other fields
    },
  });

  if (!result.success) return error(result.error);
  return success(result.data);
}
```

### Pattern 2: Update Operation

```typescript
export async function PUT(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return unauthorized();

  const { id, ...updateData } = await request.json();

  const result = await updateGenericRecord(supabaseAdmin, {
    table: "products",
    id,
    tenantId: tenant.id,
    data: updateData,
  });

  if (!result.success) return error(result.error);
  return success(result.data);
}
```

### Pattern 3: Delete Operation

```typescript
export async function DELETE(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return unauthorized();

  const { id } = await request.json();

  const result = await deleteGenericRecord(supabaseAdmin, {
    table: "products",
    id,
    tenantId: tenant.id,
  });

  if (!result.success) return error(result.error);
  return success();
}
```

### Pattern 4: Public Page Data Fetching

```typescript
// app/menu/[slug]/page.tsx or similar
export default async function MenuPage({ params }: MenuPageProps) {
  const { slug, lang = 'en' } = params;

  // All data is automatically tagged with tenant-{slug}
  const [menu, categories, products] = await Promise.all([
    getPublicMenu(slug, lang),
    getPublicCategories(slug, lang),
    getPublicProducts(slug, lang),
  ]);

  return (
    <div>
      {/* Render */}
    </div>
  );
}
```

---

## Advanced: Custom Tables

The system is generic and works with ANY table. Just follow the pattern:

### For a New Table (e.g., `coupons`)

**Create mutation:**

```typescript
const result = await createGenericRecord(supabaseAdmin, {
  table: "coupons",
  data: {
    tenant_id: 123,
    code: "SUMMER20",
    discount: 20,
  },
});
// Automatically invalidates tenant-{slug}
```

**Fetch cached (in public API):**

```typescript
const coupons = await getCachedData(`/api/public/coupons?slug=my-restaurant`, {
  tags: [getTenantCacheTag("my-restaurant")],
});
```

---

## Advanced: Granular Cache Invalidation

For specific scenarios where you want more control:

```typescript
import { getTenantResourceTag, revalidateTag } from "@/lib/cache/revalidation";

// Invalidate only products cache for a tenant
revalidateTag(getTenantResourceTag("my-restaurant", "products"));

// Invalidate specific product
revalidateTag(getTenantResourceTag("my-restaurant", "products", 42));
```

---

## Error Handling

All mutation functions return a Result type:

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Always check the result:**

```typescript
const result = await updateGenericRecord(...);

if (!result.success) {
  // Handle error
  return NextResponse.json({ error: result.error }, { status: 400 });
}

// Use result.data
return NextResponse.json(result.data);
```

---

## Production Checklist

- ✅ Use `revalidateTag` (not `revalidatePath`)
- ✅ All mutations use generic functions or call `revalidateTenant()` explicitly
- ✅ All public data fetching includes tenant cache tags
- ✅ NO `force-dynamic` or `revalidate = 0`
- ✅ Error handling with try-catch in mutations
- ✅ Tenant validation before mutations
- ✅ RLS policies enforce tenant isolation in database
- ✅ Test cache behavior in Vercel preview deployments

---

## Testing Cache Invalidation

### Local Testing

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test cache invalidation
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 29.99, "category_id": 1}'

# Visit public page to verify cache was cleared
# http://localhost:3000/restaurant-slug
```

### Vercel Testing

1. Deploy to preview environment
2. Update data via admin routes
3. Verify public site shows updates immediately
4. Check X-Vercel-Cache header:
   - `MISS` - Fresh data fetched
   - `HIT` - Cached data served

```bash
curl -I https://preview.myapp.com/restaurant-slug
# Look for: cache-control header
```

---

## Security Considerations

1. **Tenant Isolation**
   - All mutations scoped to `tenantId` in WHERE clause
   - Cache tags include `tenant-{slug}` to prevent cross-tenant leakage
   - RLS policies required in database

2. **Authorization**
   - Always call `verifyCanEdit()` or similar before mutations
   - Check `getCurrentTenant()` returns valid tenant

3. **Slug Validation**
   - Validate slug format before cache operations
   - Prevent injection attacks via slug parameter

---

## Troubleshooting

### Cache Not Updating

**Problem:** Updated data not showing on public site

**Solutions:**

1. Verify `revalidateTenant()` is being called
2. Check browser cache: Force refresh (Cmd+Shift+R)
3. Verify cache tag is being used in data fetch
4. Check Vercel logs for revalidation errors

### Stale Data

**Problem:** Old data showing even after updates

**Causes:**

- Data fetching not using cache tags
- Mutation not calling `revalidateTenant()`
- Browser caching (not Next.js caching)

**Solution:**

```typescript
// Ensure fetch has tags
const data = await fetch(url, {
  next: { tags: [getTenantCacheTag(slug)] },
});
```

### Performance Issues

**Problem:** Cache invalidation affecting performance

**Solution:** Use granular tags:

```typescript
// Instead of just tenant-{slug}
// Use:
getTenantResourceTag(slug, "products"); // Only invalidate products
getTenantResourceTag(slug, "categories"); // Separately
getTenantResourceTag(slug, "config"); // Separately
```

---

## References

- [Next.js cache invalidation](https://nextjs.org/docs/app/building-your-application/caching#revalidation)
- [revalidateTag API](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Vercel Cache Control](https://vercel.com/docs/edge-network/caching)
