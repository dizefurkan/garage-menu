# Quick Fix Summary: Menu Routes 404 on Vercel

## The Problem

```
localhost ✅ http://localhost:3000/menu/garage-chocolate-croissant/en
Vercel    ❌ https://garage-menu.vercel.app/menu/garage-chocolate-croissant/en → 404
```

## The Fix (One Simple Addition)

Added **`generateStaticParams()`** to `/app/menu/[slug]/[lang]/page.tsx`

This function tells Vercel:

- "Here are all the menu routes you need to pre-generate"
- "Fetch from Supabase, combine all tenant slugs with their languages"
- "Pre-render English + Turkish for each tenant"

## What Happens Now

### At Build Time (Vercel)

1. `generateStaticParams()` runs
2. Queries: "SELECT slug, languages FROM tenants"
3. Gets back: `[{slug: "garage-chocolate-croissant", languages: ["en", "tr"]}, ...]`
4. Pre-generates HTML for each combination:
   - `/menu/garage-chocolate-croissant/en` ✅
   - `/menu/garage-chocolate-croissant/tr` ✅
5. Deploys pre-generated HTML files

### At Request Time (First Visit)

1. User requests: `/menu/garage-chocolate-croissant/en`
2. Vercel serves pre-generated HTML immediately
3. **NO 404** because HTML exists ✅

## Before/After

### Before

```typescript
export async function generateMetadata({ params }: Props) { ... }

export default async function MenuPage({ params }: Props) { ... }
// ❌ No generateStaticParams = routes NOT pre-generated = 404 on Vercel
```

### After

```typescript
export async function generateStaticParams() {
  // Fetch all tenants with their languages
  // Return [{slug: "...", lang: "..."}, ...]
  // ✅ Routes ARE pre-generated = instant loading on Vercel
}

export async function generateMetadata({ params }: Props) { ... }

export default async function MenuPage({ params }: Props) { ... }
```

## Required for Success

### On Vercel Environment Variables (MUST HAVE)

```
✅ NEXT_PUBLIC_SUPABASE_URL     = https://dvvjsnvvsbdwobighenf.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY    = (secret key from Supabase)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = (optional)
```

Without `SUPABASE_SERVICE_ROLE_KEY`, `generateStaticParams()` can't query Supabase → build might fail or fallback to empty routes.

### Database Schema (Already Exists)

```sql
tenants table:
- id (primary key)
- slug (text) ← "garage-chocolate-croissant"
- languages (text[]) ← '{"en","tr"}'  -- Supported languages
```

## Deployment

```bash
# 1. Push changes
git add .
git commit -m "fix: add generateStaticParams for menu routes"
git push origin main

# 2. Vercel auto-deploys (or manually redeploy)
# 3. Wait for build (~2-5 min)
# 4. Check: /menu/garage-chocolate-croissant/en should work
```

## Verify It Works

### Check 1: Build Output

Look in Vercel Deployment Logs:

```
● /menu/[slug]/[lang]          1h      1y
  └ /menu/garage-chocolate-croissant/en

●  (SSG)  prerendered as static HTML (uses generateStaticParams)
```

The `●` icon means: ✅ **Successfully pre-generated with generateStaticParams**

### Check 2: Live Test

```
https://garage-menu.vercel.app/menu/garage-chocolate-croissant/en
↓
Should load menu page (not 404)
```

### Check 3: API Test

```
https://garage-menu.vercel.app/api/public/menu?slug=garage-chocolate-croissant&lang=en
↓
Should return JSON with tenant + menu data
```

## Why This Happens

### Dynamic Routes in Next.js

- Local dev: Routes work "on demand" (slow first load, but always works)
- Vercel: Routes must be known at deploy time (fast + reliable, but need `generateStaticParams`)

Without `generateStaticParams()`:

- ❌ Vercel builds without knowing which routes exist
- ❌ User requests route for first time
- ❌ Route not in pre-generated files
- ❌ Vercel can't generate on-demand (or slow fallback)
- ❌ Returns 404

With `generateStaticParams()`:

- ✅ Vercel knows which routes to pre-generate
- ✅ Builds all route combinations upfront
- ✅ User requests route
- ✅ Route HTML exists
- ✅ Instant response ✅

## Files Changed

- `app/menu/[slug]/[lang]/page.tsx` - Added `generateStaticParams()` function

## Time to Fix

- Build passes ✅
- Ready to deploy 🚀
