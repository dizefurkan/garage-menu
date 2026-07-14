# Analytics Testing & Debugging Guide

## Overview
The analytics system tracks user interactions on the public menu and aggregates them into a dashboard visible to admins. This guide helps verify that data is being tracked correctly.

## How Analytics Works

### 1. Data Collection (Frontend)
- The **AnalyticsTracker** component (`components/AnalyticsTracker.tsx`) initializes on the public menu page
- It tracks:
  - **Page views** - When someone visits the menu
  - **Product interactions** - Clicks, image clicks, scrolls on products
  - **Category interactions** - Expand/collapse of category sections
  - **Product visibility** - When products scroll into view
- Tracking events are sent to `/api/analytics/track`

### 2. Raw Data Storage (Backend)
Events are stored in three raw tables:
- `page_views` - Page visit data
- `product_interactions` - User interactions with products
- `category_interactions` - User interactions with categories

### 3. Data Aggregation (Database)
Materialized views aggregate raw data:
- `analytics_daily_summary` - Daily metrics
- `analytics_product_heatmap` - Product popularity
- `analytics_category_heatmap` - Category popularity
- `analytics_device_breakdown` - Device/OS/browser stats
- `analytics_geographic_breakdown` - Country-based traffic
- `analytics_referrer_breakdown` - Traffic sources

These views are **refreshed** periodically via `refresh_analytics_views()` function.

## Testing Steps

### Step 1: Verify Tracker Is Initialized
1. Open your menu page (e.g., `http://localhost:3000/menu/garage-chocolate-croissant/en`)
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Look for logs starting with `[AnalyticsTracker]` - should see:
   ```
   [AnalyticsTracker] Initializing analytics for tenant: garage-chocolate-croissant
   ```

### Step 2: Verify Tracking Events Are Sent
1. On the menu page, perform actions:
   - Scroll through products
   - Click on products
   - Click on product images
2. Open the **Network** tab in DevTools
3. Look for requests to `/api/analytics/track`
4. Verify they have status `200 OK`
5. Click on a request and check the request body - should contain tracking data

### Step 3: Check Server Logs
1. If running locally: Check terminal where Next.js is running
2. Look for logs like:
   ```
   [Analytics] Received tracking event: { eventType: 'page_view', tenantSlug: 'garage-chocolate-croissant', ... }
   [Analytics] Successfully inserted page_view for tenant: 1
   ```

### Step 4: Verify Raw Data In Database
1. Go to analytics dashboard: `/admin/[lang]/analytics`
2. Scroll to the bottom - you'll see a **Debug** section
3. Click **"Check Data"** button
4. This will show counts in the three raw tables:
   - Page Views count
   - Product Interactions count
   - Category Interactions count

> **Note**: If all counts are 0, tracking events are not being stored. Check steps 1-3.

### Step 5: Refresh Materialized Views
1. In the Debug section, click **"Refresh Views"** button
2. This calls `refresh_analytics_views()` to aggregate the raw data
3. Should see green success message

### Step 6: Verify Dashboard Shows Data
1. After refreshing views, go back to top of analytics dashboard
2. Check **KPI cards** - should show non-zero values:
   - Total Views
   - Unique Sessions
   - Avg Time on Page
   - Bounce Rate
3. Charts and heatmaps should populate

## Troubleshooting

### Problem: No tracking events in Network tab
**Causes:**
- AnalyticsTracker component not rendering
- Page interactions not matching tracking selectors

**Solution:**
1. Check that `<AnalyticsTracker tenantSlug={slug} />` is in menu page
2. Verify product elements have `data-product-id` attribute
3. Check browser console for initialization logs

### Problem: Tracking events sent but data not in database
**Causes:**
- RLS policies blocking inserts
- Invalid tenant slug or missing tenant
- Database connection issues

**Solution:**
1. Check server logs for `[Analytics] Failed to insert` errors
2. Verify tenant exists in database
3. Check RLS policies on analytics tables

### Problem: Raw data exists but dashboard shows no data
**Causes:**
- Materialized views not refreshed
- Views are stale

**Solution:**
1. Click **"Refresh Views"** button in Debug section
2. Wait for success message
3. Refresh dashboard page

### Problem: Keep seeing "Check Data" to verify data is there
1. Use SQL client or Supabase UI to query directly:
   ```sql
   SELECT COUNT(*) FROM page_views;
   SELECT COUNT(*) FROM product_interactions;
   SELECT COUNT(*) FROM category_interactions;
   ```
2. Check if any data exists at all

## Data Flow Diagram

```
User visits menu
        ↓
AnalyticsTracker initializes
        ↓
User interactions (scroll, click)
        ↓
Events sent to /api/analytics/track
        ↓
Data inserted into raw tables
        ↓
refresh_analytics_views() called
        ↓
Materialized views updated
        ↓
Dashboard queries views
        ↓
Admin sees analytics
```

## Important Files

- **Frontend tracking**: `lib/analytics/client-tracker.ts`
- **Tracker component**: `components/AnalyticsTracker.tsx`
- **API tracking endpoint**: `app/api/analytics/track/route.ts`
- **Debug component**: `components/analytics/AnalyticsRefreshDebug.tsx`
- **Refresh API**: `app/api/admin/analytics/refresh/route.ts`
- **Queries**: `lib/analytics/queries.ts`
- **Dashboard**: `app/admin/[lang]/analytics/`
- **Menu page**: `app/menu/[slug]/[lang]/page.tsx`

## Common Issues & Solutions

### 1. Tracking not starting
```
✗ Check: Is AnalyticsTracker component mounted?
✓ Fix: Add <AnalyticsTracker tenantSlug={slug} /> to menu page
```

### 2. Events not captured
```
✗ Check: Do product elements have data-product-id?
✓ Fix: Add data-product-id={product.id} to ProductCard div
```

### 3. Events sent but not in database
```
✗ Check: Are insert permissions allowed for RLS?
✓ Fix: Check RLS policies allow anon inserts
```

### 4. Data in raw tables but dashboard empty
```
✗ Check: Have you clicked "Refresh Views"?
✓ Fix: Click the Refresh Views button in Debug section
```

## Performance Notes

- Materialized views use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid locking
- Views filter data to last 30-90 days to keep performance good
- Consider scheduling automatic refreshes during off-peak hours
- Raw data is automatically cleaned up after 90 days

## Next Steps

1. **Enable cron refresh** (optional):
   - Set up a scheduled task to call `refresh_analytics_views()` hourly
   - Could be done with `pg_cron` or external job scheduler

2. **Set up alerting** (optional):
   - Monitor if data stops flowing
   - Alert if refresh fails

3. **Optimize queries** (if needed):
   - Add indexes for common filter combinations
   - Adjust date range filters based on usage patterns
