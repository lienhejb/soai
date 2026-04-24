'use client';

import { Link } from '@/i18n/navigation';
import type { ComputedEvent as UpcomingEvent } from '@/lib/lunar';

interface Props {
  event: UpcomingEvent;
  suggestedTemplateSlug?: string;   // slug văn khấn AI gợi ý
  suggestedTemplateTitle?: string;
}

export function HeroEventCard({
  event,
  suggestedTemplateSlug,
  suggestedTemplateTitle,
}: Props) {
  const subtitle = event.days_left === 0
    ? 'Hôm nay'
    : event.days_left === 1
      ? 'Còn 1 ngày nữa'
      : `Còn ${event.days_left} ngày nữa`;

  return (
    <div className="mx-5 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-6 shadow-lg shadow-amber-900/5">
      {/* Box Ngày tháng */}
      <div className="flex items-start gap-4">
        <MoonIcon />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-700">
            Sự kiện sắp tới
          </div>
          <h2 className="mt-1 font-serif text-xl font-bold leading-tight text-stone-800">
            {event.title}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {event.date_display} · <span className="font-medium text-amber-700">{subtitle}</span>
          </p>
        </div>
      </div>

      {/* AI Gợi ý */}
      {suggestedTemplateSlug && suggestedTemplateTitle && (
        <div className="mt-5 rounded-xl border border-amber-100 bg-white/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-amber-700">
            <SparkleIcon />
            <span>Gợi ý văn khấn</span>
          </div>
          <div className="mt-1.5 font-serif text-base font-semibold text-stone-800">
            {suggestedTemplateTitle}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 space-y-2.5">
        {suggestedTemplateSlug ? (
          <Link
            href={`/so/${suggestedTemplateSlug}`}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-3.5 font-serif text-base font-bold tracking-widest text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40"
          >
            TIẾN HÀNH DÂNG SỚ
          </Link>
        ) : (
          <Link
            href="/so"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-3.5 font-serif text-base font-bold tracking-widest text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40"
          >
            CHỌN VĂN KHẤN
          </Link>
        )}

        <Link
          href="/so"
          className="flex w-full items-center justify-center text-sm text-stone-500 hover:text-amber-700"
        >
          Chọn văn khấn khác →
        </Link>
      </div>
    </div>
  );
}

function MoonIcon() {
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}