# Multi-Tenant SaaS Menu System - Implementation Guide

## Quick Start

### 1. Prerequisites

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS + shadcn/ui installed
- Supabase project created

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js nanoid zod react-hook-form swr
npm install next-intl  # or use your preferred i18n library
```

### 3. Setup Steps

#### Step 1: Create Supabase Tables

Copy and run the SQL from `SUPABASE_SCHEMA.sql` in your Supabase SQL editor.

#### Step 2: Enable RLS

Run the SQL from `RLS_POLICIES.sql` to enable Row Level Security.

#### Step 3: Create Storage Bucket

```
Supabase Console → Storage → New Bucket
- Name: product-images
- Make it public
```

#### Step 4: Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]  # Server-side only!
```

#### Step 5: Folder Structure

```bash
# Copy the folder structure from FOLDER_STRUCTURE.md
mkdir -p app/admin/{products,categories,settings,invites}
mkdir -p components/{admin,public,auth}
mkdir -p lib/{db,auth,seo,themes}
mkdir -p types
```

---

## Architecture Overview

### Multi-Tenancy Model

- **URL-based**: `/[slug]/[lang]/page.tsx`
- **Database-level isolation**: Every table has `tenant_id`
- **RLS enforcement**: Users can only see their tenant's data
- **Per-tenant settings**: Theme, languages, branding

### Authentication Flow

1. User visits public menu: `/garage/en`
2. Admin clicks "Login" → redirects to login page
3. User logs in with email (Supabase Auth)
4. System checks `tenant_users` table for permissions
5. After auth OK → redirects to `/admin/dashboard`

### Invite System

1. Tenant owner goes to `/admin/invites`
2. Enters email + role (editor/viewer)
3. System generates unique token
4. Email sent to invitee with link: `/accept-invite?token=ABC123`
5. Invitee signs up + accepts → added to `tenant_users`

### Publishing System

- All content starts as `is_draft = TRUE`
- Editors make changes in draft mode
- Press "Publish" to set `is_draft = FALSE`
- Public API only returns published content

### Translation Model

- Separate `*_translations` tables
- Each product/category can have multiple languages
- Query joins on `language_code`
- Admin interface has language tabs

### SEO Strategy

- **SSR on public pages**: `/[slug]/[lang]/page.tsx` is dynamic server component
- **Metadata generation**: tenant name + product/category titles
- **Canonical URLs**: Prevents duplicate content issues
- **hreflang tags**: Links to alternate language versions
- **OpenGraph**: For social sharing

---

## File Organization

### Core Infrastructure

- `lib/auth/supabase.ts` - Client initialization (public + admin)
- `lib/auth/server.ts` - Server utilities (get current user, tenant)
- `lib/db/schema.ts` - TypeScript type definitions
- `lib/db/queries.ts` - Database queries (server actions)

### Public Routes

- `app/(public)/[slug]/[lang]/page.tsx` - Menu display (SSR)
- `app/(public)/[slug]/[lang]/layout.tsx` - Per-tenant layout

### Admin Routes

- `app/admin/layout.tsx` - Admin layout (auth guard)
- `app/admin/products/page.tsx` - Products list (shadcn/ui Table)
- `app/admin/products/[id]/edit/page.tsx` - Product editor (shadcn/ui Form)
- `app/admin/categories/page.tsx` - Categories list
- `app/admin/settings/page.tsx` - Theme selector
- `app/admin/invites/page.tsx` - Invite manager

---

## Key Decisions

### Why Separate Translation Tables?

- ✅ Supports unlimited languages
- ✅ No messy JSONB columns
- ✅ Easy filtering and sorting
- ✅ Works well with RLS

### Why Multi-Tenant at URL Level?

- ✅ SEO benefits (one subdomain per tenant)
- ✅ Easier to understand URLs
- ✅ Can serve from CDN edge
- ❌ Cannot easily switch tenants (by design!)

### Why Server Actions for Mutations?

- ✅ Type-safe data mutations
- ✅ Automatic CSRF protection
- ✅ Server-side validation
- ✅ Direct database access (with RLS)

### Why shadcn/ui for Admin?

- ✅ Unstyled, composable components
- ✅ TypeScript-first
- ✅ Integrates perfectly with Tailwind
- ✅ No heavy UI library overhead
- ✅ Consistent with modern Next.js ecosystem

---

## Database Query Patterns

### Fetch Products with Translations (for public)

```typescript
// Gets product + all translations (en, tr, etc.)
const products = await supabase
  .from("products")
  .select(
    `
    id, price, image_url, category_id,
    product_translations(language_code, name, description)
  `
  )
  .eq("tenant_id", tenantId)
  .eq("is_draft", false)
  .order("display_order");
```

### Fetch Single Translation

```typescript
// Gets product + only the TR translation
const product = await supabase
  .from("products")
  .select(
    `
    id, price, image_url,
    product_translations(name, description)!inner
  `
  )
  .eq("tenant_id", tenantId)
  .eq("product_translations.language_code", "tr")
  .single();
```

### Insert Product with Translations

```typescript
// Use server action to handle both inserts
"use server";
export async function createProduct(
  tenantId: bigint,
  data: {
    name_tr: string;
    desc_tr: string;
    name_en: string;
    desc_en: string;
    price: number;
  }
) {
  // 1. Insert product
  const { data: product, error: prodError } = await supabase
    .from("products")
    .insert({ tenant_id: tenantId, price: data.price, is_draft: true })
    .select()
    .single();

  // 2. Insert translations
  await supabase.from("product_translations").insert([
    {
      product_id: product.id,
      language_code: "tr",
      name: data.name_tr,
      description: data.desc_tr,
    },
    {
      product_id: product.id,
      language_code: "en",
      name: data.name_en,
      description: data.desc_en,
    },
  ]);
}
```

---

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema imported
- [ ] RLS policies enabled
- [ ] Storage bucket created
- [ ] OAuth provider configured (GitHub/Google)
- [ ] Environment variables set in Vercel
- [ ] First tenant created manually
- [ ] First user invited
- [ ] Test public menu: `/garage/en`
- [ ] Test admin: `/admin/dashboard`
- [ ] Test publish workflow
- [ ] Test invite system
- [ ] Test image upload

---

## Common Issues & Solutions

### 1. "User does not have permission to access table"

**Cause**: RLS policies not enabled  
**Fix**: Run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` for all tables in RLS_POLICIES.sql

### 2. "Auth.uid() returns NULL"

**Cause**: User not signed in or token expired  
**Fix**: Check middleware, ensure auth guard is working

### 3. "No row returned" when fetching product

**Cause**: Product doesn't exist for this tenant (RLS filtering it out)  
**Fix**: Check `tenant_id` matches current user's tenant

### 4. Images not uploading

**Cause**: Storage bucket permissions  
**Fix**: Ensure RLS policies allow storage write for authenticated users

### 5. Translations not showing

**Cause**: Joins not including language_code in WHERE clause  
**Fix**: Always filter by `language_code` when querying translations

---

## Next: Detailed Implementation Files

Continue to:

1. `lib/db/schema.ts` - Type definitions
2. `lib/auth/supabase.ts` - Client setup
3. `lib/db/queries.ts` - Server actions
4. `app/(public)/[slug]/[lang]/page.tsx` - Public page
5. `app/admin/dashboard/page.tsx` - Admin dashboard
6. `app/(auth)/accept-invite/page.tsx` - Invite flow
