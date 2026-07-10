import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  description?: string;
  value: string | number;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning';
}

/**
 * KPI Card Component
 * Displays key performance indicators with optional trend
 */
export function KPICard({
  title,
  description,
  value,
  unit,
  change,
  trend = 'neutral',
  icon,
  variant = 'default',
}: KPICardProps) {
  const variantClasses = {
    default: 'border-slate-200 bg-white',
    secondary: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">
            {value}
            {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
          </div>
        </div>

        {description && (
          <p className="text-xs text-slate-600 mt-2">{description}</p>
        )}

        {change !== undefined && (
          <p className={`text-xs font-semibold mt-2 ${trendClasses[trend]}`}>
            {trend === 'up' && '↑'} {trend === 'down' && '↓'} {Math.abs(change)}%{' '}
            {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'unchanged'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
