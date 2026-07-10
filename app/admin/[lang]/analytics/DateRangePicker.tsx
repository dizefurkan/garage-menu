'use client';

import { Button } from '@/components/ui/button';
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
  const options: Array<{ value: 'day' | 'week' | 'month' | 'year'; label: string }> = [
    { value: 'day', label: 'Last 24 Hours' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last Year' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-600">Period:</span>
      <Select value={value} onValueChange={(v: any) => onChange(v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
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
