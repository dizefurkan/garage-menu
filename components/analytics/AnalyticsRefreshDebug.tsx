'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  pageViewCount: number;
  productInteractionCount: number;
  categoryInteractionCount: number;
}

interface RefreshStatus {
  loading: boolean;
  success: boolean | null;
  message: string;
  rawData: AnalyticsData | null;
}

/**
 * Debug component to check analytics data and refresh materialized views
 * Shows raw data counts and provides manual refresh button
 */
export function AnalyticsRefreshDebug() {
  const [status, setStatus] = useState<RefreshStatus>({
    loading: false,
    success: null,
    message: '',
    rawData: null,
  });

  const handleCheckData = async () => {
    setStatus({ loading: true, success: null, message: '', rawData: null });

    try {
      const response = await fetch('/api/admin/analytics/refresh', {
        method: 'GET',
      });

      const result = await response.json();

      if (result.status === 'ok' && result.rawData) {
        setStatus({
          loading: false,
          success: true,
          message: 'Raw analytics data checked',
          rawData: result.rawData,
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: result.error || 'Failed to check data',
          rawData: null,
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: `Error: ${String(error)}`,
        rawData: null,
      });
    }
  };

  const handleRefresh = async () => {
    setStatus({ loading: true, success: null, message: '', rawData: null });

    try {
      const response = await fetch('/api/admin/analytics/refresh', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          loading: false,
          success: true,
          message: result.message,
          rawData: result.rawData,
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: result.message || result.error || 'Refresh failed',
          rawData: result.rawData || null,
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: `Error: ${String(error)}`,
        rawData: null,
      });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Analytics Debug
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Check raw analytics data and refresh materialized views
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCheckData}
          disabled={status.loading}
          variant="outline"
          size="sm"
        >
          {status.loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          Check Data
        </Button>
        <Button
          onClick={handleRefresh}
          disabled={status.loading}
          variant="outline"
          size="sm"
        >
          {status.loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          Refresh Views
        </Button>
      </div>

      {status.message && (
        <div
          className={`rounded-md p-3 text-sm ${
            status.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {status.success ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <div>{status.message}</div>
          </div>
        </div>
      )}

      {status.rawData && (
        <div className="rounded-md bg-white p-3 border border-slate-200 space-y-2 text-sm">
          <div className="font-semibold text-slate-900">Raw Analytics Data:</div>
          <div className="space-y-1 text-slate-700">
            <div>
              <span className="font-medium">Page Views:</span>{' '}
              {status.rawData.pageViewCount}
            </div>
            <div>
              <span className="font-medium">Product Interactions:</span>{' '}
              {status.rawData.productInteractionCount}
            </div>
            <div>
              <span className="font-medium">Category Interactions:</span>{' '}
              {status.rawData.categoryInteractionCount}
            </div>
          </div>
          {status.rawData.pageViewCount === 0 &&
            status.rawData.productInteractionCount === 0 &&
            status.rawData.categoryInteractionCount === 0 && (
              <div className="mt-2 p-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
                No tracking data found. Make sure:
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• The AnalyticsTracker component is loaded on the menu page</li>
                  <li>• Visitors are accessing the menu</li>
                  <li>• Browser console shows tracking events being sent</li>
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
