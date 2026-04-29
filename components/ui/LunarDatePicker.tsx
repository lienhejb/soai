'use client';

import { useEffect, useState } from 'react';
import { isBirthDateKey, formatDateForKhanText } from '@/lib/lunar';

interface Props {
  variableKey: string;          // dùng để detect default tick
  value: string;                // "YYYY-MM-DD" | ""
  showLunar: boolean | null;    // null = chưa set → dùng default theo key. true/false = user đã chọn.
  onChange: (value: string, showLunar: boolean) => void;
  required?: boolean;
  min?: string;                 // default "1900-01-01"
  max?: string;                 // default today
}

export function LunarDatePicker({
  variableKey,
  value,
  showLunar,
  onChange,
  required,
  min = '1900-01-01',
  max,
}: Props) {
  // Tính default tick theo heuristic key
  const defaultShowLunar = !isBirthDateKey(variableKey);
  const effectiveShowLunar = showLunar !== null ? showLunar : defaultShowLunar;
  
  // Default max = hôm nay
  const today = new Date().toISOString().split('T')[0];
  const effectiveMax = max ?? today;

  // Preview text
  const [preview, setPreview] = useState('');
  useEffect(() => {
    setPreview(value ? formatDateForKhanText(value, effectiveShowLunar) : '');
  }, [value, effectiveShowLunar]);

  function handleDateChange(newDate: string) {
    onChange(newDate, effectiveShowLunar);
  }

  function handleToggleLunar(newShowLunar: boolean) {
    onChange(value, newShowLunar);
  }

  return (
    <div className="space-y-2">
      <input
        type="date"
        value={value}
        onChange={(e) => handleDateChange(e.target.value)}
        min={min}
        max={effectiveMax}
        required={required}
        className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
      />

      <label className="flex cursor-pointer items-start gap-2 text-xs text-stone-600">
        <input
          type="checkbox"
          checked={effectiveShowLunar}
          onChange={(e) => handleToggleLunar(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-amber-500"
        />
        <span>
          Đọc kèm ngày âm lịch trong văn khấn
        </span>
      </label>

      {preview && (
        <div className="rounded-lg bg-amber-50/50 px-3 py-2 text-xs italic text-stone-600">
          {preview}
        </div>
      )}
    </div>
  );
}