'use client';

import { ProductHeatmapData } from '@/types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductListHeatmapProps {
  data: ProductHeatmapData[];
  isLoading?: boolean;
}

/**
 * Get gradient color based on intensity
 */
function getGradientColor(intensity: number): string {
  // Green to Red gradient
  if (intensity < 0.33) return 'from-green-400 to-green-600';
  if (intensity < 0.66) return 'from-yellow-400 to-orange-600';
  return 'from-orange-400 to-red-600';
}

/**
 * Product List Heatmap
 * Shows products in list format with intensity bars and detailed metrics
 */
export function ProductListHeatmap({ data, isLoading }: ProductListHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Heatmap (List View)</CardTitle>
          <CardDescription>Products ranked by interaction intensity with detailed metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            {isLoading ? 'Loading heatmap data...' : 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxInteractions = Math.max(...data.map((p) => p.totalInteractions), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Heatmap (List View)</CardTitle>
        <CardDescription>Products ranked by interaction intensity with detailed metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((product, index) => {
            const intensity = product.totalInteractions / maxInteractions;
            const gradientClass = getGradientColor(intensity);

            return (
              <div key={product.productId} className="border-b last:border-b-0 pb-6 last:pb-0">
                {/* Rank & Product Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{product.productName}</h4>
                    {product.price && (
                      <p className="text-sm text-slate-500">${product.price.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {product.totalInteractions}
                    </div>
                    <p className="text-xs text-slate-500">interactions</p>
                  </div>
                </div>

                {/* Intensity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-600">Interaction Intensity</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {Math.round(intensity * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradientClass} transition-all duration-300`}
                      style={{ width: `${intensity * 100}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-medium mb-1">Clicks</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{product.clicks}</span>
                      <span className="text-xs text-slate-500">
                        ({product.clickThroughRate.toFixed(1)}% CTR)
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-medium mb-1">Views</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{product.views}</span>
                      <span className="text-xs text-slate-500">scrolls</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-medium mb-1">Avg Time</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">
                        {product.avgTimeSeconds.toFixed(1)}s
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 font-medium mb-1">Unique Viewers</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">
                        {product.uniqueViewers}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="border rounded p-2">
                    <p className="text-slate-600 mb-1">Scrolls</p>
                    <p className="font-semibold text-slate-900">{product.scrolls}</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-slate-600 mb-1">Image Clicks</p>
                    <p className="font-semibold text-slate-900">{product.imageClicks}</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-slate-600 mb-1">Interaction Rate</p>
                    <p className="font-semibold text-slate-900">
                      {((product.clicks / product.views) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
