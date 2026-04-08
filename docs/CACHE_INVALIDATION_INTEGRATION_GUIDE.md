# Integration Guide: Cache Invalidation System

## Quick Start

### 1. Create the Core Files

These files have been created for you:

```
lib/
├── cache/
│   └── revalidation.ts              ← Cache invalidation utilities
└── db/
    ├── mutations-generic.ts         ← Generic create/update/delete
    └── cached-queries.ts            ← Data fetching with tags
```

### 2. Update Existing API Routes

⚠️ **Requirement:** Slug must be available in your request context

- From session/tenant context: `tenant.slug`
- From URL params: `params.slug`
- From request body: `body.slug` (if provided)

If slug is not available, you cannot use the cache invalidation system.

**Before (without cache invalidation):**

```typescript
// app/api/admin/products/route.ts
export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert([{ tenant_id: tenant.id, ...body }])
    .select()
    .single();

  if (error) throw error;
  return NextResponse.json(data);
}
```

**After (with semi-automatic cache invalidation):**

```typescript
import { createGenericRecord } from "@/lib/db/mutations-generic";

export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  const body = await request.json();

  const result = await createGenericRecord(supabaseAdmin, {
    table: "products",
    slug: tenant.slug, // ← REQUIRED: Pass slug from session
    resourceType: "products", // OPTIONAL: For granular invalidation
    data: { tenant_id: tenant.id, ...body },
  });

  if (!result.success) return error(result.error);
  return success(result.data);
}
```

### 3. Update Public Site Data Fetching

**Before (no cache tags):**

```typescript
// app/menu/[slug]/page.tsx
export default async function MenuPage({ params }) {
  const response = await fetch(`/api/menu?slug=${params.slug}`);
  const menu = await response.json();
  // Cache behavior undefined - might be served stale
}
```

**After (with tenant cache tags):**

```typescript
import { getPublicMenu } from "@/lib/db/cached-queries";

export default async function MenuPage({ params }) {
  const menu = await getPublicMenu(params.slug);
  // Automatically tagged with 'tenant-{slug}'
  // Cache revalidated when tenant data updates
}
```

---

## Step-by-Step Integration

### Step 1: Update Admin API Routes

Choose one or more API routes and apply the pattern:

**File: `app/api/admin/products/route.ts`**

Replace all direct Supabase calls with generic functions:

```typescript
import {
  createGenericRecord,
  updateGenericRecord,
  deleteGenericRecord,
} from "@/lib/db/mutations-generic";

export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  if (!tenant) return unauthorized();

  const result = await createGenericRecord(supabaseAdmin, {
    table: "products",
    slug: tenant.slug, // REQUIRED: Pass slug
    resourceType: "products", // OPTIONAL: For granular invalidation
    data: { tenant_id: tenant.id, ...body },
  });

  return handleResult(result);
}

export async function PUT(request: NextRequest) {
  const tenant = await getCurrentTenant();
  const { id, ...data } = await request.json();

  const result = await updateGenericRecord(supabaseAdmin, {
    table: "products",
    id,
    slug: tenant.slug, // REQUIRED: Pass slug
    tenantId: tenant.id, // REQUIRED: For security scoping
    resourceType: "products", // OPTIONAL: For granular invalidation
    data,
  });

  return handleResult(result);
}

export async function DELETE(request: NextRequest) {
  const tenant = await getCurrentTenant();
  const { id } = await request.json();

  const result = await deleteGenericRecord(supabaseAdmin, {
    table: "products",
    id,
    slug: tenant.slug, // REQUIRED: Pass slug
    tenantId: tenant.id, // REQUIRED: For security scoping
    resourceType: "products", // OPTIONAL: For granular invalidation
  });

  return handleResult(result);
}

function handleResult(result: any, status = 200) {
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.data || { success: true }, { status });
}
```

### Step 2: Update Public Data Fetching

**File: `app/menu/[slug]/page.tsx`**

Replace direct API calls with cached query helpers:

```typescript
import {
  getPublicMenu,
  getPublicCategories,
  getPublicProducts,
  getPublicMenuConfig,
} from "@/lib/db/cached-queries";

export default async function MenuPage({ params }) {
  const { slug, lang = "en" } = params;

  // All these are automatically tagged with tenant-{slug}
  const [menu, categories, products, config] = await Promise.all([
    getPublicMenu(slug, lang),
    getPublicCategories(slug, lang),
    getPublicProducts(slug, lang),
    getPublicMenuConfig(slug),
  ]);

  // Render...
}
```

### Step 3: Apply to Other Tables

Once you've updated one table (e.g., products), apply the same pattern:

**Categories:**

```typescript
const result = await createGenericRecord(supabaseAdmin, {
  table: "categories", // Change table name
  slug: tenant.slug,
  resourceType: "categories", // Granular tag
  data: { tenant_id: tenant.id, ...body },
});
```

**Settings/Tenant:**

```typescript
const result = await updateGenericRecord(supabaseAdmin, {
  table: "tenants", // Works with any table
  id: tenant.id,
  slug: tenant.slug,
  tenantId: tenant.id, // Required for security scoping
  resourceType: "settings", // Granular tag
  data: { theme_color: "#000" },
});
```

---

## Verification Checklist

After integration, verify everything works:

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Make a mutation (create/update/delete product)
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":29.99}'

# 3. Check server logs for cache revalidation message:
# [Mutations] Created record in products, invalidated cache for tenant: my-restaurant

# 4. Visit public page to verify data updated
# http://localhost:3000/restaurant-slug
```

### Vercel Staging

1. Deploy to Vercel staging
2. Make an admin update
3. Check public site - should show update immediately
4. Check Network tab: Should see cache invalidation

### Production Checklist

- ✅ All user-triggered mutations use generic functions
- ✅ All public pages use cached query helpers
- ✅ NO manual `revalidateTag()` calls scattered in code
- ✅ Error handling returns useful messages
- ✅ Tenant isolation verified (can't cross-tenant update)
- ✅ Performance monitoring: Check cache hit rates

---

## File Migration Paths

### For Each Admin API Route

| Route Example              | Table            | Migration                        |
| -------------------------- | ---------------- | -------------------------------- |
| `app/api/admin/products`   | `products`       | Use generic create/update/delete |
| `app/api/admin/categories` | `categories`     | Use generic create/update/delete |
| `app/api/admin/settings`   | `tenants`        | Use generic update               |
| `app/api/admin/gallery`    | `gallery_images` | Use generic create/update/delete |
| `app/api/admin/team`       | `tenant_users`   | Use generic create/update/delete |

### For Each Public Page

| Page Example                      | Queries                            | Migration                   |
| --------------------------------- | ---------------------------------- | --------------------------- |
| `app/menu/[slug]/page.tsx`        | menu, categories, products         | Use getPublic\* helpers     |
| `app/menu/[slug]/[lang]/page.tsx` | menu, categories, products, config | Use getPublic\* helpers     |
| Custom endpoints                  | All public data                    | Use getCachedData with tags |

---

## Common Mistakes to Avoid

### ❌ Wrong: Manual revalidateTag() in API routes

```typescript
// DON'T DO THIS
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  // ... mutation ...
  revalidateTag(`products-${tenantId}`); // ← Easy to forget or get wrong
}
```

### ✅ Right: Use generic functions

```typescript
// DO THIS
import { createGenericRecord } from '@/lib/db/mutations-generic';

export async function POST(request: NextRequest) {
  const result = await createGenericRecord(supabaseAdmin, {
    table: 'products',
    data: // ...
  });
  // Cache revalidation is automatic ✅
}
```

---

### ❌ Wrong: No tags on public data fetches

```typescript
// DON'T DO THIS
async function getMenuData(slug: string) {
  const response = await fetch(`/api/menu?slug=${slug}`);
  // No tags - cache behavior undefined
  return response.json();
}
```

### ✅ Right: Always include tags

```typescript
// DO THIS
export async function getPublicMenu(slug: string, lang = "en") {
  const tag = getTenantCacheTag(slug);
  return getCachedData(`/api/menu?slug=${slug}&lang=${lang}`, {
    tags: [tag], // ← Ensures cache is invalidated
  });
}
```

---

### ❌ Wrong: Forgetting tenant isolation

```typescript
// DON'T DO THIS
const result = await updateGenericRecord(supabaseAdmin, {
  table: "products",
  id: body.id,
  data: body.data,
  // ← Missing tenantId - security issue!
});
```

### ✅ Right: Always include tenantId

```typescript
// DO THIS
const tenant = await getCurrentTenant();
const result = await updateGenericRecord(supabaseAdmin, {
  table: "products",
  id: body.id,
  tenantId: tenant.id, // ← Ensures tenant isolation
  data: body.data,
});
```

---

## Rollout Strategy

### Phase 1: Core Routes (Week 1)

- Integrate products API
- Integrate categories API
- Test caching behavior

### Phase 2: Secondary Routes (Week 2)

- Integrate gallery/images
- Integrate settings
- Integrate contact info

### Phase 3: Public Pages (Week 3)

- Update menu display pages
- Update category pages
- Update search/listing pages

### Phase 4: Cleanup & Monitoring (Week 4)

- Remove old manual revalidation code
- Monitor cache hit rates
- Document final implementation

---

## Support & Debugging

### Check Cache Is Working

```typescript
// In your public page component
export default async function Page() {
  console.log("[Page] Loading with cache");
  const data = await getPublicMenu(slug);
  // First load: fresh from DB
  // Second load: served from cache
  // After mutation: cache revalidated, fresh load again
}
```

### View Cache Revalidation Logs

Production logs (Vercel):

```
[Cache] Revalidating tenant: my-restaurant
[Mutations] Created record in products, invalidated cache for tenant: my-restaurant
```

### Monitor Cache Performance

Vercel dashboard → Cache analytics → View hit rates per route

---

## Next Steps

1. ✅ Create the core files (done)
2. Pick ONE admin API route to update
3. Test locally
4. Deploy to Vercel staging
5. Verify cache invalidation works
6. Roll out to other routes
7. Update all public pages
8. Monitor analytics

Ready to integrate? Start with `app/api/admin/products/route.ts` 🚀
