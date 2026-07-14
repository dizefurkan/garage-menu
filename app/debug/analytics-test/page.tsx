'use client';

import { useEffect, useState } from 'react';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

export default function AnalyticsTestPage() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;

    const captureLog = (level: string, ...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(' ');

      setLogs((prev) => [...prev, `[${level}] ${message}`]);
      if (level === 'LOG') originalLog(...args);
      if (level === 'ERROR') originalError(...args);
    };

    console.log = (...args) => captureLog('LOG', ...args);
    console.error = (...args) => captureLog('ERROR', ...args);

    // Test message
    console.log('[AnalyticsTest] Page mounted - testing analytics');

    // Simulate product interaction
    setTimeout(() => {
      console.log('[AnalyticsTest] Simulating product scroll');
      // Create a fake product element
      const fakeProduct = document.createElement('div');
      fakeProduct.setAttribute('data-product-id', '123');
      fakeProduct.setAttribute('data-category-id', '1');
      console.log('[AnalyticsTest] Created test element:', fakeProduct);
    }, 2000);

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Analytics Test Page</h1>

      {/* Add tracker */}
      <AnalyticsTracker tenantSlug="garage-chocolate-croissant" />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>This page initializes AnalyticsTracker</li>
          <li>Check console (F12) for [AnalyticsTracker] and [PageTracker] logs</li>
          <li>Scroll down to see products with tracking attributes</li>
          <li>Click products to trigger tracking events</li>
          <li>Check Network tab for /api/analytics/track requests</li>
        </ol>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-6 font-mono text-xs overflow-auto max-h-64">
        <div className="font-bold mb-2">Console Logs:</div>
        {logs.length === 0 ? (
          <div className="text-gray-500">Waiting for logs...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="py-0.5">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <div
            key={id}
            data-product-id={id}
            data-category-id="1"
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer"
            onClick={() => {
              console.log('[AnalyticsTest] Clicked product:', id);
            }}
          >
            <div className="font-bold mb-2">Test Product {id}</div>
            <div className="text-sm text-gray-600">
              Click to trigger tracking event
            </div>
            <div className="text-xs text-gray-400 mt-2">
              data-product-id={id}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold mb-2">What to check:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            Browser console (F12) should show [AnalyticsTracker] initialization
            logs
          </li>
          <li>When you click products, you should see [PageTracker] logs</li>
          <li>Network tab should show POST requests to /api/analytics/track</li>
          <li>Server logs should show [Analytics] messages</li>
        </ul>
      </div>
    </div>
  );
}
