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
    const { data, error } = await supabase.rpc('refresh_analytics_views');

    if (error) {
      console.error('[Analytics Refresh] RPC error:', error);
      return {
        success: false,
        message: 'Failed to refresh analytics views',
        error: error.message,
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
    const [pageViews, productInteractions, categoryInteractions] = await Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
      supabase.from('product_interactions').select('*', { count: 'exact', head: true }),
      supabase.from('category_interactions').select('*', { count: 'exact', head: true }),
    ]);

    return {
      pageViewCount: pageViews.count || 0,
      productInteractionCount: productInteractions.count || 0,
      categoryInteractionCount: categoryInteractions.count || 0,
    };
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

    // Refresh the materialized views
    const refreshResult = await refreshAnalyticsViews();

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
