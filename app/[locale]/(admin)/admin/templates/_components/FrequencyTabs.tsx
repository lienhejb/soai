'use client';

import type { Frequency } from '@/lib/admin/template-actions';

export type FrequencyTab = Frequency | 'all';

interface Props {
  active: FrequencyTab;
  onChange: (tab: FrequencyTab) => void;
  counts?: Partial<Record<FrequencyTab, number>>;
}

const TABS: Array<{ key: FrequencyTab; label: string; helper: string }> = [
  { key: 'all', label: 'Tất cả', helper: '' },
  { key: 'monthly', label: 'Định kỳ', helper: 'Rằm, Mùng 1' },
  { key: 'yearly', label: 'Thường niên', helper: 'Giỗ, Lễ Tết' },
  { key: 'rare', label: 'Hiếm', helper: 'Nhập trạch, Khai trương' },
  { key: 'other', label: 'Khác', helper: '' },
];

export function FrequencyTabs({ active, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              isActive
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
            }`}
            title={tab.helper}
          >
            <span>{tab.label}</span>
            {typeof count === 'number' && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}