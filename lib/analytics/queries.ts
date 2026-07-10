/**
 * Analytics Server Actions & Queries
 * ===================================
 * Server-side functions for:
 * - Fetching analytics data
 * - Computing metrics
 * - RLS-protected queries
 */

"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentTenant } from "@/lib/auth/server";

// Create Supabase client with service role (for admin queries)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get analytics summary for a date range
 */
export async function getAnalyticsSummary(
  dateRange: "day" | "week" | "month" | "year" = "month"
) {
  const tenant = await getCurrentTenant();
  console.log("tenant", tenant);
  if (!tenant) throw new Error("Unauthorized");

  const daysMap = { day: 1, week: 7, month: 30, year: 365 };
  const days = daysMap[dateRange];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("analytics_daily_summary")
    .select("*")
    .eq("tenant_id", tenant.id)
    .gte("view_date", startDate.toISOString().split("T")[0])
    .order("view_date", { ascending: true });

  if (error) throw error;

  // Aggregate across all days
  const aggregated = {
    totalViews: data.reduce((sum, d) => sum + d.total_views, 0),
    uniqueSessions: data.reduce((sum, d) => sum + d.unique_sessions, 0),
    avgDuration: Math.round(
      data.reduce((sum, d) => sum + d.avg_duration_seconds, 0) /
        (data.length || 1)
    ),
    bounceRate: Math.round(
      data.reduce((sum, d) => sum + d.bounce_rate_percent, 0) /
        (data.length || 1)
    ),
    avgPageLoad: Math.round(
      data.reduce((sum, d) => sum + (d.avg_page_load_ms || 0), 0) /
        (data.length || 1)
    ),
    dailyData: data,
  };

  return aggregated;
}

/**
 * Get product heatmap data
 */
export async function getProductHeatmap(days: number = 30, language: string = "en") {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("analytics_product_heatmap")
    .select(
      `
      product_id,
      total_interactions,
      click_count,
      view_count,
      scroll_count,
      image_click_count,
      avg_time_on_product_seconds,
      unique_viewers,
      click_through_rate_percent,
      products(id, price, product_translations(name, language_code))
    `
    )
    .eq("tenant_id", tenant.id)
    .order("total_interactions", { ascending: false });

  if (error) throw error;

  return (
    data?.map((item: any) => {
      const translations = item.products?.product_translations || [];
      const translation =
        translations.find((t: any) => t.language_code === language) ||
        translations[0] ||
        null;

      return {
        productId: item.product_id,
        productName: translation?.name || "Unknown product",
        totalInteractions: item.total_interactions,
        clicks: item.click_count,
        views: item.view_count,
        scrolls: item.scroll_count,
        imageClicks: item.image_click_count,
        avgTimeSeconds: item.avg_time_on_product_seconds,
        uniqueViewers: item.unique_viewers,
        clickThroughRate: item.click_through_rate_percent,
        price: item.products?.price,
      };
    }) || []
  );
}

/**
 * Get category heatmap data
 */
export async function getCategoryHeatmap(days: number = 30, language: string = "en") {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("analytics_category_heatmap")
    .select(
      `
      category_id,
      total_interactions,
      expand_count,
      collapse_count,
      view_count,
      unique_viewers,
      expansion_rate_percent,
      categories(id, category_translations(name, language_code))
    `
    )
    .eq("tenant_id", tenant.id)
    .order("total_interactions", { ascending: false });

  if (error) throw error;

  return (
    data?.map((item: any) => {
      const translations = item.categories?.category_translations || [];
      const translation =
        translations.find((t: any) => t.language_code === language) ||
        translations[0] ||
        null;

      return {
        categoryId: item.category_id,
        categoryName: translation?.name || "Unknown category",
        totalInteractions: item.total_interactions,
        expansions: item.expand_count,
        collapses: item.collapse_count,
        views: item.view_count,
        uniqueViewers: item.unique_viewers,
        expansionRate: item.expansion_rate_percent,
      };
    }) || []
  );
}

/**
 * Get device breakdown
 */
export async function getDeviceBreakdown() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("analytics_device_breakdown")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("view_count", { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Get geographic breakdown
 */
export async function getGeographicBreakdown() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("analytics_geographic_breakdown")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("view_count", { ascending: false })
    .limit(20);

  if (error) throw error;

  return data || [];
}

/**
 * Get referrer breakdown
 */
export async function getReferrerBreakdown() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("analytics_referrer_breakdown")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("view_count", { ascending: false })
    .limit(10);

  if (error) throw error;

  return data || [];
}

/**
 * Get time series data (daily views)
 */
export async function getTimeSeriesData(days: number = 30) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("analytics_daily_summary")
    .select(
      "view_date, total_views, unique_sessions, avg_duration_seconds, bounce_rate_percent"
    )
    .eq("tenant_id", tenant.id)
    .gte("view_date", startDate.toISOString().split("T")[0])
    .order("view_date", { ascending: true });

  if (error) throw error;

  return (
    data?.map((item: any) => ({
      date: item.view_date,
      views: item.total_views,
      sessions: item.unique_sessions,
      avgDuration: item.avg_duration_seconds,
      bounceRate: item.bounce_rate_percent,
    })) || []
  );
}

/**
 * Get specific category analytics
 */
export async function getCategoryAnalytics(
  categoryId: number,
  days: number = 30,
  language: string = "en"
) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all product interactions for this category
  const { data, error } = await supabase
    .from("product_interactions")
    .select(
      `
      product_id,
      interaction_type,
      products(id, price, product_translations(name, language_code))
    `
    )
    .eq("tenant_id", tenant.id)
    .eq("category_id", categoryId)
    .gte("interacted_at", startDate.toISOString());

  if (error) throw error;

  // Group by product
  const productStats = new Map<
    number,
    {
      productId: number;
      productName: string;
      price: number;
      interactions: number;
      clicks: number;
    }
  >();

  data?.forEach((item: any) => {
    const key = item.product_id;
    if (!productStats.has(key)) {
      const translations = item.products?.product_translations || [];
      const translation =
        translations.find((t: any) => t.language_code === language) ||
        translations[0] ||
        null;

      productStats.set(key, {
        productId: key,
        productName: translation?.name || "Unknown product",
        price: item.products?.price,
        interactions: 0,
        clicks: 0,
      });
    }

    const stat = productStats.get(key)!;
    stat.interactions++;
    if (item.interaction_type === "click") stat.clicks++;
  });

  return Array.from(productStats.values()).sort(
    (a, b) => b.interactions - a.interactions
  );
}

/**
 * Get total page views count
 */
export async function getTotalPageViews(days: number = 30) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { count, error } = await supabase
    .from("page_views")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .gte("visited_at", startDate.toISOString());

  if (error) throw error;

  return count || 0;
}

/**
 * Export analytics data to CSV format
 */
export async function exportAnalyticsData(format: "csv" | "json" = "csv") {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const summary = await getAnalyticsSummary("month");
  const heatmap = await getProductHeatmap(30);
  const devices = await getDeviceBreakdown();
  const referrers = await getReferrerBreakdown();

  if (format === "json") {
    return JSON.stringify(
      {
        summary,
        productHeatmap: heatmap,
        deviceBreakdown: devices,
        referrerBreakdown: referrers,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  // CSV format
  let csv = "Analytics Export\n\n";

  // Summary
  csv += "Summary Metrics\n";
  csv += `Total Views,${summary.totalViews}\n`;
  csv += `Unique Sessions,${summary.uniqueSessions}\n`;
  csv += `Avg Duration (seconds),${summary.avgDuration}\n`;
  csv += `Bounce Rate (%),${summary.bounceRate}\n\n`;

  // Top Products
  csv += "Top Products\n";
  csv += "Product,Interactions,Clicks,Avg Time (s),CTR (%)\n";
  heatmap.slice(0, 20).forEach((product: any) => {
    csv += `"${product.productName}",${product.totalInteractions},${product.clicks},${product.avgTimeSeconds.toFixed(1)},${product.clickThroughRate.toFixed(1)}\n`;
  });

  csv += "\nDevice Breakdown\n";
  csv += "Device Type,OS,Browser,Views,Avg Duration\n";
  devices.forEach((device: any) => {
    csv += `${device.device_type},${device.os_type},${device.browser_name},${device.view_count},${device.avg_duration_seconds.toFixed(1)}\n`;
  });

  return csv;
}

/**
 * Get latest analytics update time
 */
export async function getLastAnalyticsUpdate() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("page_views")
    .select("visited_at")
    .eq("tenant_id", tenant.id)
    .order("visited_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return new Date(data.visited_at);
}
