import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  description?: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
}

/**
 * KPI Card Component
 * Displays key performance indicators
 */
export function KPICard({
  title,
  description,
  value,
  unit,
  icon,
}: KPICardProps) {
  return (
    <Card className="border-foreground/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium tracking-tight text-foreground/70">
          {title}
        </CardTitle>
        {icon && <div className="text-foreground/50">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">
          {value}
          {unit && <span className="text-sm font-normal text-foreground/50 ml-1">{unit}</span>}
        </div>

        {description && (
          <p className="text-xs text-foreground/50 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
