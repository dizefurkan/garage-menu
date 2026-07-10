'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGridHeatmap } from '@/components/analytics/ProductGridHeatmap';
import { ProductListHeatmap } from '@/components/analytics/ProductListHeatmap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { ProductHeatmapData, CategoryHeatmapData } from '@/types/analytics';

interface HeatmapTabsProps {
  productHeatmap: ProductHeatmapData[];
  categoryHeatmap: CategoryHeatmapData[];
  isLoading?: boolean;
}

/**
 * Heatmap Tabs Component
 * Shows three different visualization styles for product heatmap
 */
export function HeatmapTabs({ productHeatmap, categoryHeatmap, isLoading }: HeatmapTabsProps) {
  return (
    <div className="space-y-6">
      {/* Product Heatmap */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <ProductGridHeatmap data={productHeatmap} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ProductListHeatmap data={productHeatmap} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryHeatmap data={categoryHeatmap} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Category Heatmap Component
 */
function CategoryHeatmap({
  data,
  isLoading,
}: {
  data: CategoryHeatmapData[];
  isLoading?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Categories ranked by interaction frequency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            {isLoading ? 'Loading category data...' : 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxInteractions = Math.max(...data.map((c) => c.totalInteractions), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Performance</CardTitle>
        <CardDescription>Categories ranked by interaction frequency and expansion rate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((category, index) => {
            const intensity = category.totalInteractions / maxInteractions;
            const intensityPercent = Math.round(intensity * 100);

            return (
              <div key={category.categoryId} className="border rounded-lg p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      #{index + 1} {category.categoryName}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {category.totalInteractions} total interactions
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{intensityPercent}%</div>
                    <p className="text-xs text-slate-500">intensity</p>
                  </div>
                </div>

                {/* Intensity Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-red-600 transition-all duration-300"
                      style={{ width: `${intensity * 100}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-600 text-xs mb-1">Expansions</p>
                    <p className="font-semibold text-slate-900">{category.expansions}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-600 text-xs mb-1">Collapses</p>
                    <p className="font-semibold text-slate-900">{category.collapses}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-600 text-xs mb-1">Rate</p>
                    <p className="font-semibold text-slate-900">{category.expansionRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-600 text-xs mb-1">Viewers</p>
                    <p className="font-semibold text-slate-900">{category.uniqueViewers}</p>
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
