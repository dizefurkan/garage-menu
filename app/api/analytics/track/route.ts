/**
 * Analytics Tracking API Route
 * =============================
 * Receives tracking events from client-side tracker
 * Validates and inserts into analytics tables
 *
 * POST /api/analytics/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for inserting analytics data
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

interface TrackingEvent {
  eventType: string;
  tenantSlug: string;
  sessionId: string;
  [key: string]: any;
}

/**
 * Validate tracking event has required fields
 */
function validateEvent(event: TrackingEvent): boolean {
  if (!event.eventType || !event.tenantSlug || !event.sessionId) {
    return false;
  }

  const validTypes = ['page_view', 'product_interaction', 'category_interaction', 'page_exit'];
  return validTypes.includes(event.eventType);
}

/**
 * Get tenant ID from slug
 */
async function getTenantId(slug: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error(`[Analytics] Tenant not found: ${slug}`);
    return null;
  }

  return data.id;
}

/**
 * Handle page view event
 */
async function handlePageView(
  tenantId: number,
  sessionId: string,
  event: TrackingEvent
): Promise<void> {
  console.log('[Analytics] handlePageView - Inserting page_view:', {
    tenant_id: tenantId,
    session_id: sessionId?.slice(0, 8),
    device_type: event.deviceType,
    browser_name: event.browserName,
  });

  const { error, data } = await supabase.from('page_views').insert({
    tenant_id: tenantId,
    session_id: sessionId,
    referrer: event.referrer || null,
    utm_source: event.utm_source || null,
    utm_medium: event.utm_medium || null,
    utm_campaign: event.utm_campaign || null,
    device_type: event.deviceType || null,
    os_type: event.osType || null,
    browser_name: event.browserName || null,
    browser_version: event.browserVersion || null,
    ip_country: event.ipCountry || null,
    ip_country_name: event.ipCountryName || null,
    language: event.language || null,
    timezone: event.timezone || null,
    duration_seconds: event.durationSeconds || 0,
    exit_page: event.exitPage || null,
    page_load_time_ms: event.pageLoadTimeMs || null,
  });

  if (error) {
    console.error('[Analytics] Failed to insert page_view:', error);
  } else {
    console.log('[Analytics] Successfully inserted page_view for tenant:', tenantId);
  }
}

/**
 * Handle product interaction event
 */
async function handleProductInteraction(
  tenantId: number,
  sessionId: string,
  event: TrackingEvent
): Promise<void> {
  // Validate required fields
  if (!event.productId) {
    console.warn('[Analytics] Product interaction missing productId');
    return;
  }

  console.log('[Analytics] handleProductInteraction - Inserting:', {
    tenant_id: tenantId,
    product_id: event.productId,
    category_id: event.categoryId,
    interaction_type: event.interactionType,
  });

  const { error } = await supabase.from('product_interactions').insert({
    tenant_id: tenantId,
    session_id: sessionId,
    product_id: event.productId,
    category_id: event.categoryId || null,
    interaction_type: event.interactionType || 'view',
    time_on_product_seconds: event.timeOnProductSeconds || 0,
  });

  if (error) {
    console.error('[Analytics] Failed to insert product_interaction:', error);
  } else {
    console.log('[Analytics] Successfully inserted product_interaction');
  }
}

/**
 * Handle category interaction event
 */
async function handleCategoryInteraction(
  tenantId: number,
  sessionId: string,
  event: TrackingEvent
): Promise<void> {
  // Validate required fields
  if (!event.categoryId) {
    console.warn('[Analytics] Category interaction missing categoryId');
    return;
  }

  console.log('[Analytics] handleCategoryInteraction - Inserting:', {
    tenant_id: tenantId,
    category_id: event.categoryId,
    interaction_type: event.interactionType,
  });

  const { error } = await supabase.from('category_interactions').insert({
    tenant_id: tenantId,
    session_id: sessionId,
    category_id: event.categoryId,
    interaction_type: event.interactionType || 'view',
  });

  if (error) {
    console.error('[Analytics] Failed to insert category_interaction:', error);
  } else {
    console.log('[Analytics] Successfully inserted category_interaction');
  }
}

/**
 * Main POST handler
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    console.log('[Analytics] Received tracking event:', {
      eventType: body.eventType,
      tenantSlug: body.tenantSlug,
      sessionId: body.sessionId?.slice(0, 8),
    });

    // Validate event
    if (!validateEvent(body)) {
      console.warn('[Analytics] Invalid event structure:', body);
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    // Get tenant ID
    const tenantId = await getTenantId(body.tenantSlug);
    if (!tenantId) {
      console.error('[Analytics] Tenant not found:', body.tenantSlug);
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    console.log('[Analytics] Processing event for tenant:', tenantId);

    // Route to appropriate handler
    switch (body.eventType) {
      case 'page_view':
        console.log('[Analytics] Tracking page_view');
        await handlePageView(tenantId, body.sessionId, body);
        break;

      case 'product_interaction':
        console.log('[Analytics] Tracking product_interaction for product:', body.productId);
        await handleProductInteraction(tenantId, body.sessionId, body);
        break;

      case 'category_interaction':
        console.log('[Analytics] Tracking category_interaction for category:', body.categoryId);
        await handleCategoryInteraction(tenantId, body.sessionId, body);
        break;

      case 'page_exit':
        // For page_exit, we already have the duration in the page_view record
        // Just use this for logging or metrics
        console.log('[Analytics] Page exit event (duration:', body.durationSeconds, 'seconds)');
        break;

      default:
        console.warn('[Analytics] Unknown event type:', body.eventType);
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Return success
    console.log('[Analytics] Event successfully tracked');
    return NextResponse.json(
      { success: true, message: 'Event tracked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analytics] Tracking error:', error);
    // Don't expose error details to client
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

/**
 * Handle other methods (not allowed)
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
