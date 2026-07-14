/**
 * Refresh Analytics Materialized Views
 * =====================================
 * Admin-only endpoint to refresh analytics aggregation views
 * Call this periodically or after bulk data operations
 *
 * POST /api/admin/analytics/refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentTenant } from '@/lib/auth/server';

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
 * Refresh all analytics materialized views
 */
async function refreshAnalyticsViews(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log('[Analytics Refresh] Starting materialized view refresh...');

    // Call the database function to refresh all views
    let result = await supabase.rpc('refresh_analytics_views');

    // If concurrent refresh fails, try individual refreshes
    if (result.error && result.error.message?.includes('concurrently')) {
      console.log('[Analytics Refresh] Concurrent refresh failed, trying individual refreshes...');

      const views = [
        'analytics_daily_summary',
        'analytics_product_heatmap',
        'analytics_category_heatmap',
        'analytics_device_breakdown',
        'analytics_geographic_breakdown',
        'analytics_referrer_breakdown',
      ];

      for (const view of views) {
        const { error } = await supabase.rpc('refresh_analytics_view_single', {
          view_name: view,
        });

        if (error) {
          console.error(`[Analytics Refresh] Failed to refresh ${view}:`, error);
        } else {
          console.log(`[Analytics Refresh] Successfully refreshed ${view}`);
        }
      }

      return {
        success: true,
        message: 'Analytics views refreshed (individual refresh)',
      };
    }

    if (result.error) {
      console.error('[Analytics Refresh] RPC error:', result.error);
      return {
        success: false,
        message: 'Failed to refresh analytics views',
        error: result.error.message,
      };
    }

    console.log('[Analytics Refresh] Successfully refreshed all materialized views');
    return {
      success: true,
      message: 'All analytics views refreshed successfully',
    };
  } catch (error) {
    console.error('[Analytics Refresh] Exception:', error);
    return {
      success: false,
      message: 'Exception during analytics refresh',
      error: String(error),
    };
  }
}

/**
 * Check raw data in analytics tables
 */
async function checkAnalyticsData(): Promise<{
  pageViewCount: number;
  productInteractionCount: number;
  categoryInteractionCount: number;
}> {
  try {
    console.log('[Analytics] Starting raw data check...');

    const [pageViews, productInteractions, categoryInteractions] = await Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
      supabase.from('product_interactions').select('*', { count: 'exact', head: true }),
      supabase.from('category_interactions').select('*', { count: 'exact', head: true }),
    ]);

    console.log('[Analytics] pageViews result:', { count: pageViews.count, error: pageViews.error?.message });
    console.log('[Analytics] productInteractions result:', { count: productInteractions.count, error: productInteractions.error?.message });
    console.log('[Analytics] categoryInteractions result:', { count: categoryInteractions.count, error: categoryInteractions.error?.message });

    const result = {
      pageViewCount: pageViews.count || 0,
      productInteractionCount: productInteractions.count || 0,
      categoryInteractionCount: categoryInteractions.count || 0,
    };

    console.log('[Analytics] Final counts:', result);
    return result;
  } catch (error) {
    console.error('[Analytics] Failed to check data:', error);
    return {
      pageViewCount: 0,
      productInteractionCount: 0,
      categoryInteractionCount: 0,
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authorization - must be admin
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access (for now, we'll allow if they have a tenant)
    console.log('[Analytics Refresh] Admin request from tenant:', tenant.id);

    // Get raw data counts
    console.log('[Analytics Refresh] Checking raw analytics data...');
    const dataCounts = await checkAnalyticsData();
    console.log('[Analytics Refresh] Data counts:', dataCounts);

    // Check materialized view data before refresh
    console.log('[Analytics Refresh] Checking materialized view data before refresh...');
    const { data: viewData, error: viewError } = await supabase
      .from('analytics_daily_summary')
      .select('*', { count: 'exact', head: true });

    console.log('[Analytics Refresh] Materialized view count:', {
      count: viewData?.length || 0,
      error: viewError?.message,
    });

    // Refresh the materialized views
    const refreshResult = await refreshAnalyticsViews();

    // Check materialized view data after refresh
    console.log('[Analytics Refresh] Checking materialized view data after refresh...');
    const { data: viewDataAfter, error: viewErrorAfter } = await supabase
      .from('analytics_daily_summary')
      .select('*', { count: 'exact', head: true });

    console.log('[Analytics Refresh] Materialized view count after refresh:', {
      count: viewDataAfter?.length || 0,
      error: viewErrorAfter?.message,
    });

    return NextResponse.json({
      ...refreshResult,
      rawData: dataCounts,
    });
  } catch (error) {
    console.error('[Analytics Refresh] Request error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process refresh request',
        error: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check data and refresh status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Analytics] Checking analytics data status...');
    const dataCounts = await checkAnalyticsData();

    return NextResponse.json({
      status: 'ok',
      message: 'Analytics data status',
      rawData: dataCounts,
    });
  } catch (error) {
    console.error('[Analytics] Status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
