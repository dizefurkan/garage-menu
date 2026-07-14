import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  getAnalyticsSummary,
  getProductHeatmap,
  getCategoryHeatmap,
  getDeviceBreakdown,
  getGeographicBreakdown,
  getReferrerBreakdown,
  getTimeSeriesData,
} from '@/lib/analytics/queries';
import { getSessionWithTenant } from '@/lib/auth/session';
import AnalyticsDashboard from './AnalyticsDashboard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const messages = await loadLocaleMessages(lang);
  const t = createTranslator(messages);

  return {
    title: `${t('analytics')} - Dashboard`,
    description: t('analyticsDescription'),
  };
}

interface AnalyticsPageProps {
  params: Promise<{ lang: string }>;
}

async function loadLocaleMessages(lang: string) {
  try {
    const messages = (await import(`@/messages/${lang}.json`)).default;
    return messages.admin ?? {};
  } catch {
    const fallback = (await import('@/messages/en.json')).default;
    return fallback.admin ?? {};
  }
}

function createTranslator(messages: Record<string, string>) {
  return (key: string) => messages[key] || key;
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

  try {
    // Get translations
    const messages = await loadLocaleMessages(lang);
    const t = createTranslator(messages);

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
    const [summary, productHeatmap, categoryHeatmap, devices, geographic, referrers, timeSeries] =
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
      ]);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-slate-900" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {t('analytics')}
                </h1>
                <p className="text-sm text-foreground/60 mt-1">
                  {t('analyticsDescription')}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('export')}
            </Button>
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
        />
      </div>
    );
  } catch (error) {
    // Get translations for error message
    const messages = await loadLocaleMessages(lang);
    const t = createTranslator(messages);

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
