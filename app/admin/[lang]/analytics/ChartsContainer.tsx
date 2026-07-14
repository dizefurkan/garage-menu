"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type {
  TimeSeriesPoint,
  DeviceAnalytics,
  ReferrerAnalytics,
  GeographicAnalytics,
} from "@/types/analytics";

interface ChartsContainerProps {
  timeSeries: TimeSeriesPoint[];
  devices: DeviceAnalytics[];
  referrers: ReferrerAnalytics[];
  geographic: GeographicAnalytics[];
  isLoading?: boolean;
}

/**
 * Charts Container Component
 * Displays time series chart and simple data tables for breakdowns
 */
export function ChartsContainer({
  timeSeries,
  devices,
  referrers,
  geographic,
  isLoading,
}: ChartsContainerProps) {
  const t = useTranslations('admin');

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0 || isNaN(value) || isNaN(total)) return '0.0';
    const percentage = ((value / total) * 100);
    return isNaN(percentage) ? '0.0' : percentage.toFixed(1);
  };

  const deviceTotal = Math.max(devices.reduce((sum, d) => sum + (d.viewCount || 0), 0), 0);
  const referrerTotal = Math.max(referrers.reduce((sum, r) => sum + (r.viewCount || 0), 0), 0);
  const geoTotal = Math.max(geographic.reduce((sum, g) => sum + (g.viewCount || 0), 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Time Series Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('pageViewsOverTime')}</CardTitle>
          <CardDescription>
            {t('dailyVisitorCounts')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--foreground)" }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis tick={{ fontSize: 12, fill: "var(--foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    color: "var(--popover-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value) =>
                    typeof value === "number"
                      ? value.toLocaleString()
                      : String(value)
                  }
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
                <Legend wrapperStyle={{ color: "var(--foreground)" }} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--chart-1, hsl(217, 91%, 60%))"
                  strokeWidth={2}
                  dot={false}
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="var(--chart-2, hsl(142, 72%, 29%))"
                  strokeWidth={2}
                  dot={false}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {isLoading ? "Loading chart data..." : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('deviceBreakdown')}</CardTitle>
          <CardDescription>{t('trafficByDevice')}</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <div className="space-y-2 divide-y divide-border">
              {devices.map((device, index) => {
                const percentage = calculatePercentage(
                  device.viewCount,
                  deviceTotal
                );
                return (
                  <div
                    key={index}
                    className="py-3 flex items-center justify-between first:pt-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {device.deviceType}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {device.viewCount?.toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('topReferrers')}</CardTitle>
          <CardDescription>{t('trafficSources')}</CardDescription>
        </CardHeader>
        <CardContent>
          {referrers.length > 0 ? (
            <div className="space-y-2 divide-y divide-border">
              {referrers.slice(0, 8).map((referrer, index) => {
                const percentage = calculatePercentage(
                  referrer.viewCount,
                  referrerTotal
                );
                const label =
                  !referrer.referrerSource ||
                  referrer.referrerSource === "direct"
                    ? "Direct"
                    : referrer.referrerSource.replace(
                        /https?:\/\/(www\.)?/,
                        ""
                      );
                return (
                  <div
                    key={index}
                    className="py-3 flex items-center justify-between first:pt-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {label}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {referrer.viewCount?.toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Breakdown Table */}
      {geographic.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('topCountries')}</CardTitle>
            <CardDescription>{t('trafficByCountry')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 divide-y divide-border">
              {geographic.slice(0, 8).map((country) => {
                const percentage = calculatePercentage(
                  country.viewCount,
                  geoTotal
                );
                return (
                  <div
                    key={country.ipCountry}
                    className="py-3 flex items-center justify-between first:pt-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {country.ipCountryName || country.ipCountry}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {country.viewCount.toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {percentage}%
                      </p>
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
