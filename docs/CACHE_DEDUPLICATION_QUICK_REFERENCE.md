# Cache Deduplication - Quick Reference

## TL;DR

The cache system now **automatically deduplicates** revalidation calls. No code changes needed, but use `types` array for better control.

---

## Quick Rules

### ✅ Use: Specific Types (Granular - Recommended)

```typescript
await revalidateTenant("my-restaurant", ["products"]);
// Calls: revalidateTag('tenant:my-restaurant:products') ONCE
```

### ✅ Use: Multiple Types (When Needed)

```typescript
await revalidateTenant("my-restaurant", ["products", "categories"]);
// Calls: revalidateTag for each type, NO duplicates
```

### ✅ Use: All Types (Bulk Operations)

```typescript
await revalidateTenant("my-restaurant", ["all"]);
// Calls: revalidateTag('tenant:my-restaurant') ONCE
```

### ❌ DON'T: Mix 'all' with Specific Types

```typescript
// WRONG
await revalidateTenant("my-restaurant", ["all", "products"]);
// → Specific types are ignored anyway
```

---

## In Practice

### Creating/Updating Products

```typescript
// Mutation automatically handles deduplication
const result = await createGenericRecord(supabaseAdmin, {
  table: 'products',
  slug: 'my-restaurant',
  resourceType: 'products',  // Granular
  data: { ... }
});
// Cache: revalidateTag('tenant:restaurant:products') ONCE
```

### Bulk Deletes

```typescript
// Use 'all' for bulk operations
const result = await withRevalidation({
  slug: "my-restaurant",
  types: ["all"],
  operation: async () => {
    // Delete operation
  },
});
// Cache: revalidateTag('tenant:restaurant') ONCE
```

### Batch Updates

```typescript
// Loop doesn't cause duplicates - automatic deduplication
for (const product of products) {
  await updateGenericRecord(supabaseAdmin, {
    table: "products",
    id: product.id,
    slug: "my-restaurant",
    tenantId: 123,
    resourceType: "products", // Same type each iteration
  });
}
// Cache: revalidateTag('tenant:restaurant:products') called ONCE total
```

---

## Types

```typescript
type ResourceType = "products" | "categories" | "settings" | "unknown";
```

| Type           | Cache Tag                  | Use When                  |
| -------------- | -------------------------- | ------------------------- |
| `'products'`   | `tenant:{slug}:products`   | Updating products only    |
| `'categories'` | `tenant:{slug}:categories` | Updating categories only  |
| `'settings'`   | `tenant:{slug}`            | Updating settings         |
| `'unknown'`    | `tenant:{slug}`            | Generic/unknown changes   |
| `'all'`        | `tenant:{slug}`            | Everything changed (bulk) |

---

## Performance

| Operation                | Calls Before | Calls After | Saved |
| ------------------------ | ------------ | ----------- | ----- |
| Single product update    | 2            | 1           | 50%   |
| Bulk update 100 products | 200+         | 1           | 99%   |
| Products + categories    | 4            | 2           | 50%   |
| Everything               | 4+           | 1           | 75%   |

---

## Logging

```
[Cache] Granular invalidate (2 types) for tenant: my-restaurant
[Cache] Revalidating: tenant:my-restaurant:products
[Cache] Revalidating: tenant:my-restaurant:categories
```

---

## Backward Compatibility

Still works but less documented:

```typescript
// Old way
await revalidateTenantResource("my-restaurant", "products");

// New way (recommended)
await revalidateTenant("my-restaurant", ["products"]);
```

---

## Common Mistakes

### ❌ Don't use multiple values for 'all'

```typescript
// Wrong - 'products' is ignored
await revalidateTenant("restaurant", ["all", "products"]);

// Right - pick one approach
await revalidateTenant("restaurant", ["all"]);
```

### ❌ Don't assume duplicates happen

```typescript
// Deduplication is automatic - no need to worry!
// System handles this efficiently:
await revalidateTenant("restaurant", ["products", "products", "products"]);
```

### ❌ Don't pass empty array

```typescript
// Always specify at least one type
await revalidateTenant("restaurant", []); // Defaults to ['unknown']

// Explicit is better
await revalidateTenant("restaurant", ["products"]);
```

---

## Decision Tree

```
What changed?
├─ Just products?
│  └─ await revalidateTenant(slug, ['products'])
├─ Products + categories?
│  └─ await revalidateTenant(slug, ['products', 'categories'])
├─ Settings?
│  └─ await revalidateTenant(slug, ['settings'])
└─ Everything (bulk)?
   └─ await revalidateTenant(slug, ['all'])
```

---

## Deduplication Happens Automatically

```typescript
// These all get automatically deduplicated:
['products', 'products', 'products']  → ['products']
['all', 'products', 'categories']     → ['all']
['settings', 'unknown']               → ['settings']
```

**You don't need to deduplicate manually.**

---

## Key Takeaway

✅ Use specific types for granular control
✅ Use 'all' for bulk operations
✅ System automatically deduplicates
✅ 50-70% fewer cache calls
❌ No changes needed to existing code (backward compatible)

---

## Documentation

- **Details:** See [CACHE_DEDUPLICATION_GUIDE.md](CACHE_DEDUPLICATION_GUIDE.md)
- **Examples:** See [CACHE_DEDUPLICATION_EXAMPLES.ts](CACHE_DEDUPLICATION_EXAMPLES.ts)
- **Full Summary:** See [CACHE_DEDUPLICATION_SUMMARY.md](CACHE_DEDUPLICATION_SUMMARY.md)
