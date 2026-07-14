'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangePickerProps {
  value: 'day' | 'week' | 'month' | 'year';
  onChange: (range: 'day' | 'week' | 'month' | 'year') => void;
}

/**
 * Date Range Picker Component
 * Allows selecting analytics time period
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const t = useTranslations('admin');

  const options: Array<{ value: 'day' | 'week' | 'month' | 'year'; label: string }> = [
    { value: 'day', label: t('last24Hours') },
    { value: 'week', label: t('last7Days') },
    { value: 'month', label: t('last30Days') },
    { value: 'year', label: t('lastYear') },
  ];

  const selectedLabel = options.find(opt => opt.value === value)?.label || t('period');

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground/60">{t('period')}:</span>
      <Select value={value} onValueChange={(v: any) => onChange(v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={selectedLabel}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
