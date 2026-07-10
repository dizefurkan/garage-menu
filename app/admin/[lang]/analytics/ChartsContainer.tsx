'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import type {
  TimeSeriesPoint,
  DeviceAnalytics,
  ReferrerAnalytics,
  GeographicAnalytics,
} from '@/types/analytics';

interface ChartsContainerProps {
  timeSeries: TimeSeriesPoint[];
  devices: DeviceAnalytics[];
  referrers: ReferrerAnalytics[];
  geographic: GeographicAnalytics[];
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

/**
 * Charts Container Component
 * Displays time series, device, referrer, and geographic charts
 */
export function ChartsContainer({
  timeSeries,
  devices,
  referrers,
  geographic,
  isLoading,
}: ChartsContainerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Time Series Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Page Views Over Time</CardTitle>
          <CardDescription>Daily visitor counts for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? value.toLocaleString() : String(value)
                  }
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              {isLoading ? 'Loading chart data...' : 'No data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Traffic by device type</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={devices.map((d) => ({
                    name: d.deviceType,
                    value: d.viewCount,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {devices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : String(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              {isLoading ? 'Loading...' : 'No data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>Traffic sources</CardDescription>
        </CardHeader>
        <CardContent>
          {referrers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={referrers.slice(0, 8).map((r) => ({
                  name: r.referrerSource === 'direct' ? 'Direct' : r.referrerSource.replace(/https?:\/\/(www\.)?/, ''),
                  views: r.viewCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : String(value))} />
                <Bar dataKey="views" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              {isLoading ? 'Loading...' : 'No data available'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Breakdown */}
      {geographic.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Traffic by country</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={geographic.slice(0, 8).map((g) => ({
                  name: g.ipCountryName || g.ipCountry,
                  views: g.viewCount,
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : String(value))} />
                <Bar dataKey="views" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
