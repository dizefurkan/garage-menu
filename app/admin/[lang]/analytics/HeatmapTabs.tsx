'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ProductHeatmapData, CategoryHeatmapData } from '@/types/analytics';

interface HeatmapTabsProps {
  productHeatmap: ProductHeatmapData[];
  categoryHeatmap: CategoryHeatmapData[];
  categories?: any[];
  isLoading?: boolean;
}

/**
 * Analytics Data Table Component
 * Shows product analytics in a simple table format with category filtering
 */
export function HeatmapTabs({ productHeatmap, categoryHeatmap, categories = [], isLoading }: HeatmapTabsProps) {
  const t = useTranslations('admin');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const handleCategoryChange = (value: string | null) => {
    if (value) {
      setSelectedCategoryId(value);
      // Pagination will reset automatically since filteredProducts will change
    }
  };

  const uniqueCategories = useMemo(() => {
    const categoryMap = new Map<string, string>();
    categoryMap.set('all', t('allCategories'));

    // Use the categories prop if available, otherwise fall back to categoryHeatmap
    if (categories && categories.length > 0) {
      categories.forEach((cat: any) => {
        const categoryId = cat.id?.toString() || '';
        if (categoryId) {
          // Get translated name for the language
          const translations = cat.category_translations || [];
          const name = translations.length > 0 ? translations[0].name : 'Unknown';
          categoryMap.set(categoryId, name);
        }
      });
    }

    return Array.from(categoryMap.entries());
  }, [categories, t]);

  const selectedCategoryLabel = useMemo(() => {
    const found = uniqueCategories.find(([id]) => id === selectedCategoryId);
    return found ? found[1] : t('filterByCategory');
  }, [selectedCategoryId, uniqueCategories, t]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return productHeatmap;
    }
    const categoryIdNum = parseInt(selectedCategoryId, 10);
    return productHeatmap.filter(product => product.categoryId === categoryIdNum);
  }, [productHeatmap, selectedCategoryId]);

  const columns: ColumnDef<ProductHeatmapData>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('product')}
            <div className="ml-2 h-4 w-4">
              {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
              {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
              {column.getIsSorted() === false && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        ),
        enableSorting: true,
        size: 300,
        minSize: 250,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center gap-3 min-w-[250px]">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="w-8 h-8 rounded object-cover bg-muted flex-shrink-0"
                />
              )}
              <span className="truncate">{product.productName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'views',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('views')}
            <div className="ml-2 h-4 w-4">
              {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
              {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
              {column.getIsSorted() === false && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        ),
        enableSorting: true,
        size: 100,
        minSize: 80,
        cell: ({ row }) => <span className="min-w-[80px] block">{row.original.views.toLocaleString()}</span>,
      },
      {
        accessorKey: 'clicks',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('clicks')}
            <div className="ml-2 h-4 w-4">
              {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
              {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
              {column.getIsSorted() === false && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        ),
        enableSorting: true,
        size: 100,
        minSize: 80,
        cell: ({ row }) => <span className="min-w-[80px] block">{row.original.clicks.toLocaleString()}</span>,
      },
      {
        accessorKey: 'clickThroughRate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('ctr')}
            <div className="ml-2 h-4 w-4">
              {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
              {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
              {column.getIsSorted() === false && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        ),
        enableSorting: true,
        size: 100,
        minSize: 80,
        cell: ({ row }) => <span className="min-w-[80px] block">{row.original.clickThroughRate.toFixed(1)}%</span>,
      },
      {
        accessorKey: 'avgTimeSeconds',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('avgTime')}
            <div className="ml-2 h-4 w-4">
              {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
              {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
              {column.getIsSorted() === false && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        ),
        enableSorting: true,
        size: 120,
        minSize: 100,
        cell: ({ row }) => <span className="min-w-[100px] block">{row.original.avgTimeSeconds.toFixed(1)}s</span>,
      },
      {
        accessorKey: 'uniqueViewers',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('viewers')}
            <div className="ml-2 h-4 w-4">
              {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
              {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
              {column.getIsSorted() === false && <ArrowUpDown className="h-4 w-4 opacity-50" />}
            </div>
          </Button>
        ),
        enableSorting: true,
        size: 100,
        minSize: 80,
        cell: ({ row }) => <span className="min-w-[80px] block">{row.original.uniqueViewers.toLocaleString()}</span>,
      },
    ],
    [t]
  );

  // Show empty state only if the entire productHeatmap is empty (not due to filtering)
  if (!productHeatmap || productHeatmap.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('productAnalytics')}</CardTitle>
          <CardDescription>{t('detailedMetrics')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {isLoading ? t('loadingAnalytics') : t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('productAnalytics')}</CardTitle>
              <CardDescription>{t('detailedMetrics')}</CardDescription>
            </div>
            <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-fit bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <SelectValue placeholder={t('filterByCategory')}>
                  {selectedCategoryLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.length > 0 &&
                  uniqueCategories.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<ProductHeatmapData, unknown>
            columns={columns}
            data={filteredProducts}
            filterPlaceholder={t('searchProducts')}
            filterColumnId="productName"
            isLoading={isLoading}
            initialPageIndex={0}
          />
        </CardContent>
      </Card>

      {/* Categories Summary */}
      {categoryHeatmap && categoryHeatmap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('categorySummary')}</CardTitle>
            <CardDescription>{t('categoryInteractionMetrics')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryHeatmap.map((category) => {
                const maxInteractions = Math.max(
                  ...categoryHeatmap.map((c) => c.totalInteractions),
                  1
                );
                const intensity = category.totalInteractions / maxInteractions;

                return (
                  <div
                    key={category.categoryId}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <h4 className="font-semibold text-foreground mb-2">
                      {category.categoryName}
                    </h4>
                    <div className="mb-4">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-red-600 dark:from-green-600 dark:to-red-700 transition-all duration-300"
                          style={{ width: `${intensity * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-foreground/60">{t('views')}</p>
                        <p className="font-semibold text-foreground">
                          {category.views.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground/60">{t('interactions')}</p>
                        <p className="font-semibold text-foreground">
                          {category.totalInteractions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground/60">{t('expansions')}</p>
                        <p className="font-semibold text-foreground">
                          {category.expansions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground/60">{t('rate')}</p>
                        <p className="font-semibold text-foreground">
                          {category.expansionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
