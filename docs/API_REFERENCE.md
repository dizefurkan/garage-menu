# API Reference - Multi-Tenant Menu SaaS

## Overview

This document describes all available server actions and database queries. All mutations are server actions (use `"use server"` directive).

---

## Authentication Utilities

### `getCurrentUser()`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `User | null`

Get the currently authenticated user.

```typescript
const user = await getCurrentUser();
if (!user) {
  // Not authenticated
}
```

---

### `getCurrentTenant()`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `Tenant | null`

Get the current user's tenant context.

```typescript
const tenant = await getCurrentTenant();
const tenantId = tenant.id;
```

---

### `getCurrentTenantId()`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `bigint | null`

Get just the tenant ID (faster than full tenant object).

```typescript
const tenantId = await getCurrentTenantId();
```

---

### `getUserRole(userId: string)`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `"owner" | "editor" | "viewer" | null`

Get user's role in their tenant.

```typescript
const role = await getUserRole(userId);
if (role === "owner") {
  // Show admin features
}
```

---

### `verifyTenantAccess(tenantId: bigint)`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `boolean`

Verify that current user has access to a specific tenant. Use in API routes.

```typescript
if (!(await verifyTenantAccess(tenantId))) {
  return new Response("Unauthorized", { status: 403 });
}
```

---

### `verifyCanEdit(tenantId: bigint)`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `boolean`

Check if user can edit content (owner or editor role).

```typescript
if (!(await verifyCanEdit(tenantId))) {
  throw new Error("You don't have permission to edit");
}
```

---

### `verifyIsOwner(tenantId: bigint)`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `boolean`

Check if user is the tenant owner (for sensitive operations).

```typescript
if (!(await verifyIsOwner(tenantId))) {
  throw new Error("Only owners can change theme");
}
```

---

### `getTenantBySlug(slug: string)`

**File**: `lib/auth/server.ts`  
**Type**: Async Function  
**Returns**: `Tenant | null`

Get a tenant by its URL slug (used on public pages, no auth required).

```typescript
const tenant = await getTenantBySlug("garage-cafe");
```

---

## Product Operations

### `getPublishedProducts(tenantId: bigint, language?: string)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `ProductWithTranslations[]`

Get all published products for a tenant, with translations joined.

```typescript
const products = await getPublishedProducts(tenantId, "tr");
// Returns: [{ id, price, product_translations: [...] }, ...]
```

---

### `getProduct(productId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `ProductWithTranslations | null`

Get a single product with all translations (auth required).

```typescript
const product = await getProduct(productId);
// Checks: user has access to this product's tenant
```

---

### `createProduct(input: CreateProductInput)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Parameters**: `CreateProductInput`  
**Returns**: `Product`

Create a new product with translations.

```typescript
"use client";
const newProduct = await createProduct({
  category_id: 1,
  price: 99.99,
  is_draft: true,
  image_url: "https://...",
  translations: {
    tr: { name: "Kahvaltı 1", description: "Açıklama" },
    en: { name: "Breakfast 1", description: "Description" },
  },
});
```

**Validates**:

- User is editor or owner
- Belongs to current tenant
- All translations have required fields

**Errors**:

- `"Unauthorized"` - User lacks permission
- `"Failed to create product"` - Database error

---

### `updateProduct(input: UpdateProductInput)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Parameters**: `UpdateProductInput`  
**Returns**: `void`

Update product fields and/or translations.

```typescript
await updateProduct({
  id: 123n,
  price: 109.99,
  translations: {
    tr: { name: "Updated Name", description: "Updated desc" },
  },
});
```

**Note**: Uses UPSERT for translations (creates if doesn't exist).

---

### `deleteProduct(productId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `void`

Delete product and cascade delete translations.

```typescript
await deleteProduct(productId);
```

**Note**: Automatically deletes all related `product_translations`.

---

### `publishProduct(productId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `void`

Publish a product (set `is_draft = false`).

```typescript
await publishProduct(productId);
// Now visible on public menu pages
```

---

## Category Operations

### `getPublishedCategories(tenantId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `CategoryWithTranslations[]`

Get all published categories with translations joined.

```typescript
const categories = await getPublishedCategories(tenantId);
```

---

### `getCategory(categoryId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `CategoryWithTranslations | null`

Get single category (auth required).

```typescript
const category = await getCategory(categoryId);
```

---

### `createCategory(input: CreateCategoryInput)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Parameters**: `CreateCategoryInput`  
**Returns**: `Category`

Create a new category.

```typescript
const newCategory = await createCategory({
  display_order: 2,
  is_draft: false,
  translations: {
    tr: { name: "Tatlılar", description: "Tatlı ürünler" },
    en: { name: "Desserts", description: "Sweet treats" },
  },
});
```

---

### `updateCategory(categoryId: bigint, input: CreateCategoryInput)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `void`

Update category details and translations.

```typescript
await updateCategory(categoryId, {
  display_order: 3,
  is_draft: false,
  translations: {
    tr: { name: "Updated Name" },
  },
});
```

---

### `deleteCategory(categoryId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `void`

Delete category (and cascade delete translations).

```typescript
await deleteCategory(categoryId);
```

---

## Invitation & Team Operations

### `sendInvite(input: InviteUserInput, tenantId: bigint)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Parameters**: `{ email, role }`  
**Returns**: `{ token, email }`

Send an invitation to a user.

```typescript
const { token, email } = await sendInvite(
  { email: "user@example.com", role: "editor" },
  tenantId
);
// email with link: /accept-invite?token=ABC123
```

**Validations**:

- Sender must be tenant owner
- Email is valid format
- Token expires in 7 days

---

### `acceptInvite(token: string)`

**File**: `lib/db/queries.ts`  
**Type**: Async Server Action  
**Returns**: `void`

Accept an invitation (adds user to tenant).

```typescript
await acceptInvite(inviteToken);
// User now has role 'editor' in the tenant
```

**Validations**:

- Token is valid
- Token hasn't expired
- User is authenticated
- User doesn't already belong to tenant

---

## SEO Functions

### `generateMenuMetadata(slug: string, lang: string)`

**File**: `lib/seo/metadata.ts`  
**Type**: Async Function  
**Returns**: `Metadata`

Generate SEO metadata for public menu page.

```typescript
export async function generateMetadata() {
  return generateMenuMetadata("garage-cafe", "en");
}
```

**Generates**:

- Title tags
- Meta descriptions
- OpenGraph data
- Twitter cards
- Canonical URLs
- hreflang links

---

### `generateHrefLangLinks(slug: string, languages: string[])`

**File**: `lib/seo/metadata.ts`  
**Type**: Function  
**Returns**: `{ rel, hrefLang, href }[]`

Generate hreflang tags for multi-language SEO.

```typescript
const links = generateHrefLangLinks("garage", ["en", "tr"]);
// Use in layout head tags
```

---

### `generateMenuStructuredData(slug: string, lang: string, tenant: Tenant)`

**File**: `lib/seo/metadata.ts`  
**Type**: Function  
**Returns**: `JSONSchema`

Generate JSON-LD structured data

for search engines.

```typescript
const schema = generateMenuStructuredData("garage", "en", tenant);
// Include in <script type="application/ld+json">
```

---

## Theme Functions

### `themeConfigToCss(config: ThemeConfig)`

**File**: `lib/themes/types.ts`  
**Type**: Function  
**Returns**: `string` (CSS variables)

Convert theme config to CSS variables.

```typescript
const css = themeConfigToCss({
  primary: "#8B0333",
  secondary: "#F2F0E9",
  font: "serif",
});
// Output: "--color-primary: #8B0333; --color-secondary: ..."
// Apply to document.documentElement.style.cssText
```

---

### `getTenantTheme(config: ThemeConfig | null)`

**File**: `lib/themes/types.ts`  
**Type**: Function  
**Returns**: `ThemeConfig`

Get tenant theme with fallback to default.

```typescript
const theme = getTenantTheme(tenant.theme_config);
```

---

## Type Definitions

### `Database` Type

Located in `types/database.ts` or generate from Supabase CLI.

```bash
npx supabase gen types typescript --schema public > types/database.ts
```

---

## Error Handling

All server actions throw errors on failure. Wrap in try-catch:

```typescript
try {
  await createProduct(data);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    setError(error.message);
  }
}
```

---

## Rate Limiting & Best Practices

- ✅ Always use `await` when calling server actions
- ✅ Check user permissions in sensitive operations
- ✅ Validate input with Zod schemas before passing to server actions
- ✅ Use `getCurrentTenantId()` for tenant context
- ⚠️ Don't expose `supabaseAdmin` to client code
- ⚠️ Keep sensitive API keys in `.env.local` only

---

## Examples

### Complete Product Create Flow

```typescript
"use client"
import { useTransition } from "react";
import { createProduct } from "@/lib/db/queries";
import { CreateProductSchema } from "@/lib/db/schema";

export function ProductForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: CreateProductInput) {
    startTransition(async () => {
      try {
        // Validate
        const parsed = CreateProductSchema.parse(formData);

        // Create
        const newProduct = await createProduct(parsed);

        console.log("Product created:", newProduct.id);
        // Redirect or refresh
      } catch (error) {
        console.error("Validation or submission error:", error);
      }
    });
  }

  return <form onSubmit={...} />;
}
```

---

## Pagination (Future)

Currently not implemented. When adding:

```typescript
export async function getPublishedProducts(
  tenantId: bigint,
  language?: string,
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize;
  // Add .range(offset, offset + pageSize - 1)
}
```
