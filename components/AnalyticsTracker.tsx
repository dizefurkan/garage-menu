'use client';

import { useEffect, useRef } from 'react';
import { initializeAnalytics } from '@/lib/analytics/client-tracker';

interface AnalyticsTrackerProps {
  tenantSlug: string;
}

/**
 * Client-side component that initializes analytics tracking
 * Must be rendered on the page where you want to track events
 */
export function AnalyticsTracker({ tenantSlug }: AnalyticsTrackerProps) {
  const initRef = useRef(false);

  useEffect(() => {
    // Log immediately to verify component mounted
    console.log('[AnalyticsTracker] Component mounted on client');

    if (!tenantSlug) {
      console.warn('[AnalyticsTracker] No tenantSlug provided');
      return;
    }

    // Only initialize once
    if (initRef.current) {
      console.log('[AnalyticsTracker] Already initialized, skipping');
      return;
    }

    initRef.current = true;

    console.log('[AnalyticsTracker] Initializing analytics for tenant:', tenantSlug);

    try {
      const tracker = initializeAnalytics({
        tenantSlug,
        apiEndpoint: '/api/analytics/track',
      });
      console.log('[AnalyticsTracker] Successfully initialized tracker:', tracker);
    } catch (error) {
      console.error('[AnalyticsTracker] Failed to initialize analytics:', error);
    }
  }, [tenantSlug]);

  return null;
}
