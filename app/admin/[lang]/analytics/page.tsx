import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { BarChart3 } from 'lucide-react';

import {
  getAnalyticsSummary,
  getProductHeatmap,
  getCategoryHeatmap,
  getDeviceBreakdown,
  getGeographicBreakdown,
  getReferrerBreakdown,
  getTimeSeriesData,
} from '@/lib/analytics/queries';
import { getPublishedCategories } from '@/lib/db/queries';
import { getSessionWithTenant } from '@/lib/auth/session';
import AnalyticsDashboard from './AnalyticsDashboard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'admin' });

  return {
    title: `${t('analytics')} - Dashboard`,
    description: t('analyticsDescription'),
  };
}

interface AnalyticsPageProps {
  params: Promise<{ lang: string }>;
}

/**
 * Analytics Dashboard Page
 * Route: /admin/[lang]/analytics
 * Supports i18n with dynamic language parameter
 */
export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { lang } = await params;

  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) {
    redirect('/auth/login');
  }

  // Resolved before the try so the error branch below can reuse it.
  const t = await getTranslations({ locale: lang, namespace: 'admin' });

  try {
    // Default empty values for analytics data
    const defaultSummary = {
      totalViews: 0,
      uniqueSessions: 0,
      avgDuration: 0,
      bounceRate: 0,
      avgPageLoad: 0,
      dailyData: [],
    };

    // Fetch all analytics data in parallel with error handling
    const [summary, productHeatmap, categoryHeatmap, devices, geographic, referrers, timeSeries, categories] =
      await Promise.all([
        getAnalyticsSummary('month').catch((err) => {
          console.error('Failed to fetch analytics summary:', err);
          return defaultSummary;
        }),
        getProductHeatmap(30, lang).catch(() => []),
        getCategoryHeatmap(30, lang).catch(() => []),
        getDeviceBreakdown().catch(() => []),
        getGeographicBreakdown().catch(() => []),
        getReferrerBreakdown().catch(() => []),
        getTimeSeriesData(30).catch(() => []),
        getPublishedCategories(BigInt(tenant.id)).catch(() => []),
      ]);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {t('analytics')}
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                {t('analyticsDescription')}
              </p>
            </div>
          </div>
        </div>

        <AnalyticsDashboard
          initialSummary={summary}
          initialProductHeatmap={productHeatmap}
          initialCategoryHeatmap={categoryHeatmap}
          initialDevices={devices}
          initialGeographic={geographic}
          initialReferrers={referrers}
          initialTimeSeries={timeSeries}
          initialCategories={categories}
        />
      </div>
    );
  } catch (error) {
    console.error('Analytics page error:', error);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('analytics')}
          </h1>
          <p className="text-sm text-foreground/60">
            {t('analyticsDescription')}
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            {t('errorLoadingAnalytics')}
          </h2>
          <p className="text-red-700">{t('analyticsErrorDescription')}</p>
        </div>
      </div>
    );
  }
}
