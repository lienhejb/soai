'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { TemplatePickerSheet, type TemplateOption } from './TemplatePickerSheet';
import type { ComputedEvent as UpcomingEvent } from '@/lib/lunar';

interface Props {
  event: UpcomingEvent;
  suggestedTemplateSlug?: string;
  suggestedTemplateTitle?: string;
  availableTemplates?: TemplateOption[];
}

export function HeroEventCard({
  event,
  suggestedTemplateSlug,
  suggestedTemplateTitle,
  availableTemplates = [],
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(suggestedTemplateSlug);
  const [currentTitle, setCurrentTitle] = useState(suggestedTemplateTitle);

  // Parse ngày âm từ date_display "01/05 · 15/03 ÂL"
  const lunarPart = event.date_display.split('·')[1]?.trim() ?? ''; // "15/03 ÂL"
  const lunarDay = lunarPart.split('/')[0] ?? '';
  const lunarMonth = lunarPart.split('/')[1]?.replace('ÂL', '').trim() ?? '';

  return (
    <div className="mx-5 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-6 shadow-lg shadow-amber-900/5">
      <div className="flex items-center gap-5">
        {/* Cột trái: Ngày âm to */}
        <div className="flex-shrink-0 text-center">
          <div className="font-serif text-5xl font-bold leading-none text-amber-700">
            {lunarDay}
          </div>
          <div className="mt-1.5 text-[10px] uppercase tracking-wider text-stone-500">
            Tháng {lunarMonth} ÂL
          </div>
        </div>

        {/* Divider dọc */}
        <div className="h-16 w-px bg-amber-200/60" />

        {/* Cột giữa: Tên sự kiện + nút đổi (nếu nhiều template) */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-lg font-bold text-stone-800">
            {currentTitle ?? event.title}
          </h2>
          {availableTemplates.length > 1 && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800"
            >
              <SwapIcon /> Đổi văn khấn
            </button>
          )}
        </div>
      </div>

      {/* Nút Dâng Sớ */}
      <Link
        href={currentSlug ? `/so/${currentSlug}` : '/so'}
        className="mt-5 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-3.5 font-serif text-base font-bold tracking-widest text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40"
      >
        {currentSlug ? 'DÂNG SỚ' : 'CHỌN VĂN KHẤN'}
      </Link>

      <TemplatePickerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        options={availableTemplates.map((t) => ({
          ...t,
          is_current: t.slug === currentSlug,
        }))}
        onSelect={(opt) => {
          setCurrentSlug(opt.slug);
          setCurrentTitle(opt.title);
        }}
      />
    </div>
  );
}

function SwapIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  );
}