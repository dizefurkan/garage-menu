'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Eye, Clock, TrendingUp } from 'lucide-react';

import { KPICard } from './KPICard';
import { DateRangePicker } from './DateRangePicker';
import { ChartsContainer } from './ChartsContainer';
import { HeatmapTabs } from './HeatmapTabs';

import type {
  AnalyticsSummary,
  ProductHeatmapData,
  CategoryHeatmapData,
  DeviceAnalytics,
  GeographicAnalytics,
  ReferrerAnalytics,
  TimeSeriesPoint,
} from '@/types/analytics';

interface AnalyticsDashboardProps {
  initialSummary: AnalyticsSummary;
  initialProductHeatmap: ProductHeatmapData[];
  initialCategoryHeatmap: CategoryHeatmapData[];
  initialDevices: DeviceAnalytics[];
  initialGeographic: GeographicAnalytics[];
  initialReferrers: ReferrerAnalytics[];
  initialTimeSeries: TimeSeriesPoint[];
  initialCategories?: any[];
}

/**
 * Main Analytics Dashboard Component
 */
export default function AnalyticsDashboard({
  initialSummary,
  initialProductHeatmap,
  initialCategoryHeatmap,
  initialDevices,
  initialGeographic,
  initialReferrers,
  initialTimeSeries,
  initialCategories = [],
}: AnalyticsDashboardProps) {
  const t = useTranslations('admin');
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);

  const handleDateRangeChange = async (range: 'day' | 'week' | 'month' | 'year') => {
    setDateRange(range);
    setIsLoading(true);

    // TODO: Fetch updated data based on date range
    // For now, just simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Calculate some derived metrics
  const avgSessionDuration = Math.round(initialSummary.avgDuration);
  const bounceRate = Math.round(initialSummary.bounceRate);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t('totalViews')}
          icon={<Eye className="w-4 h-4" />}
          value={initialSummary.totalViews.toLocaleString()}
          description={t('pageViewsTrend')}
        />

        <KPICard
          title={t('uniqueSessions')}
          icon={<Users className="w-4 h-4" />}
          value={initialSummary.uniqueSessions.toLocaleString()}
          description={t('sessionMetric')}
        />

        <KPICard
          title={t('avgTimeOnPage')}
          icon={<Clock className="w-4 h-4" />}
          value={avgSessionDuration}
          unit="sec"
          description={t('timeMetric')}
        />

        <KPICard
          title={t('bounceRate')}
          icon={<TrendingUp className="w-4 h-4" />}
          value={bounceRate}
          unit="%"
          description={t('bounceMetric')}
        />
      </div>

      {/* Charts Section */}
      <ChartsContainer
        timeSeries={initialTimeSeries}
        devices={initialDevices}
        referrers={initialReferrers}
        geographic={initialGeographic}
        isLoading={isLoading}
      />

      {/* Heatmap Tabs */}
      <HeatmapTabs
        productHeatmap={initialProductHeatmap}
        categoryHeatmap={initialCategoryHeatmap}
        categories={initialCategories}
        isLoading={isLoading}
      />
    </div>
  );
}
