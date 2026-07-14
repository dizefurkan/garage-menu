'use client';

import { ProductHeatmapData } from '@/types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductGridHeatmapProps {
  data: ProductHeatmapData[];
  isLoading?: boolean;
}

/**
 * Get heatmap color based on intensity (0-1)
 */
function getHeatmapColor(intensity: number): string {
  if (intensity < 0.25) return 'bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800';
  if (intensity < 0.5) return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800';
  if (intensity < 0.75) return 'bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800';
  return 'bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800';
}

/**
 * Product Grid Heatmap
 * Shows products as color-coded tiles based on interaction intensity
 */
export function ProductGridHeatmap({ data, isLoading }: ProductGridHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Heatmap (Grid View)</CardTitle>
          <CardDescription>Products visualized by interaction intensity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
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
        <CardTitle>Product Heatmap (Grid View)</CardTitle>
        <CardDescription>Color intensity shows interaction frequency</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-6 flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 dark:bg-green-950 dark:border-green-800 rounded"></div>
            <span className="text-foreground/70">Low (0-25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800 rounded"></div>
            <span className="text-foreground/70">Medium (25-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 dark:bg-orange-950 dark:border-orange-800 rounded"></div>
            <span className="text-foreground/70">High (50-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 dark:bg-red-950 dark:border-red-800 rounded"></div>
            <span className="text-foreground/70">Very High (75%+)</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((product) => {
            const intensity = product.totalInteractions / maxInteractions;
            const colorClass = getHeatmapColor(intensity);

            return (
              <div
                key={product.productId}
                className={`p-4 rounded-lg border-2 transition-shadow hover:shadow-md cursor-pointer ${colorClass}`}
              >
                {/* Product Name */}
                <h4 className="font-semibold text-foreground truncate mb-2">
                  {product.productName}
                </h4>

                {/* Main Metric */}
                <div className="mb-3">
                  <div className="text-2xl font-bold text-foreground">
                    {product.totalInteractions}
                  </div>
                  <p className="text-xs text-foreground/60">interactions</p>
                </div>

                {/* Sub-metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-foreground/60">Clicks</p>
                    <p className="font-semibold text-foreground">{product.clicks}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">CTR</p>
                    <p className="font-semibold text-foreground">{product.clickThroughRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Viewers</p>
                    <p className="font-semibold text-foreground">{product.uniqueViewers}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Avg Time</p>
                    <p className="font-semibold text-foreground">{product.avgTimeSeconds.toFixed(1)}s</p>
                  </div>
                </div>

                {/* Price (if available) */}
                {product.price && (
                  <div className="mt-3 pt-3 border-t border-foreground/10">
                    <p className="text-xs text-foreground/60">Price</p>
                    <p className="font-semibold text-foreground">${product.price.toFixed(2)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
