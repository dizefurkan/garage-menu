'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Eye, Clock, TrendingUp } from 'lucide-react';

import { KPICard } from './KPICard';
import { DateRangePicker } from './DateRangePicker';
import { ChartsContainer } from './ChartsContainer';
import { HeatmapTabs } from './HeatmapTabs';
import { AnalyticsRefreshDebug } from '@/components/analytics/AnalyticsRefreshDebug';

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
}: AnalyticsDashboardProps) {
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
          title="Total Views"
          icon={<Eye className="w-4 h-4" />}
          value={initialSummary.totalViews.toLocaleString()}
          description="Page visits in selected period"
        />

        <KPICard
          title="Unique Sessions"
          icon={<Users className="w-4 h-4" />}
          value={initialSummary.uniqueSessions.toLocaleString()}
          description="Individual visitors"
        />

        <KPICard
          title="Avg Time on Page"
          icon={<Clock className="w-4 h-4" />}
          value={avgSessionDuration}
          unit="sec"
          description="Average session duration"
        />

        <KPICard
          title="Bounce Rate"
          icon={<TrendingUp className="w-4 h-4" />}
          value={bounceRate}
          unit="%"
          description="Visitors who left without interaction"
          trend={bounceRate > 50 ? 'down' : 'up'}
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
        isLoading={isLoading}
      />

      {/* Debug Section */}
      <AnalyticsRefreshDebug />
    </div>
  );
}
