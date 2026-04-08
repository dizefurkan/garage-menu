# Vercel Deployment Checklist - Production 404 Fix

## Problem Solved ✅

- **Issue**: `/menu/garage-chocolate-croissant/en` returned 404 on Vercel (worked on localhost)
- **Root Cause**: Missing `generateStaticParams()` in dynamic route
- **Solution**: Added static params generation that pre-generates all tenant menu routes at build time

## What Changed

### File: `/app/menu/[slug]/[lang]/page.tsx`

**Before**: Missing `generateStaticParams()` function
**After**: Added `generateStaticParams()` that:

- Queries Supabase for all tenants and their languages
- Returns `{slug, lang}` pairs for route pre-generation
- Gracefully handles errors without blocking build

**Code Added**:

```typescript
import { createClient } from "@supabase/supabase-js";

export async function generateStaticParams() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("slug, languages");

    if (error || !tenants) {
      console.error("[generateStaticParams] Error:", error);
      return [];
    }

    const params = tenants.flatMap((tenant: any) => {
      const languages = tenant.languages || ["en"];
      return languages.map((lang: string) => ({
        slug: tenant.slug,
        lang: lang,
      }));
    });

    return params;
  } catch (error) {
    console.error("[generateStaticParams] Error:", error);
    return [];
  }
}
```

## Build Status

✅ **Build Output Shows**:

```
● /menu/[slug]/[lang]                          1h      1y
  └ /menu/garage-chocolate-croissant/en        1h      1y

●  (SSG)      prerendered as static HTML (uses generateStaticParams)
```

This means:

- ✅ Routes are pre-generated at build time
- ✅ Route `/menu/garage-chocolate-croissant/en` will be available immediately
- ✅ No 404 on first request

## Vercel Deployment Steps

### Step 1: Verify Environment Variables

Go to: **Vercel Project Settings → Environment Variables → Production**

Ensure these are set:

```
NEXT_PUBLIC_SUPABASE_URL = https://dvvjsnvvsbdwobighenf.supabase.co
SUPABASE_SERVICE_ROLE_KEY = (your service role key)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (your anon key) ← optional
```

⚠️ **CRITICAL**: `SUPABASE_SERVICE_ROLE_KEY` must be set! Without it, `generateStaticParams()` will fail during build.

### Step 2: Deploy

Choose one:

**Option A: Redeploy from Dashboard**

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Find latest deployment and click "⋮" (three dots)
4. Select "Redeploy"
5. Wait for build to complete (~2-5 minutes)

**Option B: Git Push**

```bash
git add .
git commit -m "fix: add generateStaticParams for menu routes"
git push origin main
```

**Option C: Vercel CLI**

```bash
vercel deploy --prod
```

### Step 3: Verify Deployment

1. Wait for build to complete
2. Check deployment logs for:
   ```
   ✓ Route /menu/[slug]/[lang] with generateStaticParams
   ```
3. Test URL: `https://garage-menu.vercel.app/menu/garage-chocolate-croissant/en`
   - Should NOT return 404
   - Should load menu page successfully

### Step 4: Monitor

Watch for errors in:

- Vercel Analytics
- Vercel Logs (Deployments tab)
- Error tracking (if configured)

## Troubleshooting

### Build Fails with "SUPABASE_SERVICE_ROLE_KEY is not set"

**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

### Build Completes but Route Still Returns 404

1. Clear Vercel cache:
   - Dashboard → Project Settings → Git
   - Click "Clear Cache"
   - Trigger redeploy

2. Check if `generateStaticParams()` ran:
   - View build logs in Deployments tab
   - Look for: `● /menu/[slug]/[lang]` (should have ● icon)

3. Check base URL configuration:
   - `getBaseUrl()` should return correct Vercel URL
   - Vercel automatically sets `process.env.VERCEL_URL`

### Route Works but Returns Wrong Data

1. Check Supabase connection from Vercel:
   - Vercel Functions → Logs
   - Filter by `/api/public/menu`
   - Check error messages

2. Verify API endpoint:
   - Test manually: `https://garage-menu.vercel.app/api/public/menu?slug=garage-chocolate-croissant&lang=en`
   - Should return JSON, not 404

## Rollback Plan

If issues occur:

```bash
git revert HEAD
git push origin main
# Vercel will auto-deploy previous version
```

## Additional Notes

- `generateMetadata()` was already present (good for SEO)
- `generateStaticParams()` complements it for dynamic route generation
- Routes are cached for 1 hour (ISR config in `getMenuData()`)
- Both routes pre-generate: English AND Turkish versions

## Files Modified

- [app/menu/[slug]/[lang]/page.tsx](../../app/menu/[slug]/[lang]/page.tsx)

## Related Docs

- [Supabase Schema](./SUPABASE_SCHEMA.sql)
- [Complete Setup Guide](./SETUP_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
