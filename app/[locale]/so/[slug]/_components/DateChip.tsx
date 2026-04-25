'use client';

import { useState } from 'react';
import { getNextLunarOccurrences, formatSolarShort, isSameDay } from '@/lib/lunar';
import { Solar } from 'lunar-javascript';

interface Props {
  suggestedLunarDays: number[] | null;
  value: Date;
  onChange: (date: Date) => void;
}

export function DateChip({ suggestedLunarDays, value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  // Build danh sách ngày gợi ý (highlight)
  const highlighted: Date[] = [];
  if (suggestedLunarDays && suggestedLunarDays.length > 0) {
    for (const day of suggestedLunarDays) {
      highlighted.push(...getNextLunarOccurrences(day, 3));
    }
    highlighted.sort((a, b) => a.getTime() - b.getTime());
  }

  const valueLabel = formatChipLabel(value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 transition hover:bg-amber-100"
      >
        <CalendarSmallIcon />
        <span className="font-medium">{valueLabel}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 backdrop-blur-sm md:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-800">Chọn ngày dâng sớ</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* Quick-pick gợi ý */}
            {highlighted.length > 0 && (
              <div className="mb-5">
                <div className="mb-2 text-xs uppercase tracking-wider text-amber-700">
                  Ngày phù hợp
                </div>
                <div className="flex flex-wrap gap-2">
                  {highlighted.map((d) => {
                    const isSelected = isSameDay(d, value);
                    return (
                      <button
                        key={d.getTime()}
                        type="button"
                        onClick={() => {
                          onChange(d);
                          setOpen(false);
                        }}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          isSelected
                            ? 'border-amber-500 bg-amber-100 text-amber-900'
                            : 'border-amber-200 bg-amber-50/50 text-stone-700 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        <div className="font-serif text-sm font-bold">
                          {formatChipLabel(d)}
                        </div>
                        <div className="mt-0.5 text-[10px] text-stone-500">
                          {formatSolarShort(d)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Free pick */}
            <div>
              <div className="mb-2 text-xs uppercase tracking-wider text-stone-500">
                Hoặc chọn ngày khác
              </div>
              <input
                type="date"
                value={toInputValue(value)}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  if (y && m && d) {
                    onChange(new Date(y, m - 1, d));
                    setOpen(false);
                  }
                }}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatChipLabel(d: Date): string {
  const lunar = Solar.fromDate(d).getLunar();
  const lDay = lunar.getDay();
  const lMonth = lunar.getMonth();
  const dayLabel = lDay === 15 ? 'Rằm' : lDay === 1 ? 'Mùng 1' : `${lDay}`;
  return `${dayLabel} tháng ${lMonth} ÂL`;
}

function toInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function CalendarSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </svg>
  );
}