'use client';

import Link from 'next/link';
import type { UpcomingEvent } from './types';

interface Props {
  event: UpcomingEvent;
}

export function HeroEventCard({ event }: Props) {
  const subtitle = event.days_left === 0
    ? 'Hôm nay'
    : event.days_left === 1
      ? 'Còn 1 ngày nữa'
      : `Còn ${event.days_left} ngày nữa`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[var(--brown-deep)] p-6 text-center shadow-lg">
      {/* Họa tiết mây vân mờ */}
      <CloudPattern />

      <div className="relative">
        <MoonIcon />

        <div className="mt-3 font-serif text-xs uppercase tracking-[0.25em] text-[var(--gold-soft)]/70">
          Sắp đến
        </div>
        <h2 className="mt-1 font-serif text-2xl font-medium uppercase tracking-wide text-[var(--gold)]">
          {event.title}
        </h2>
        <p className="mt-2 text-sm text-[var(--bg-paper-2)]/80">
          {subtitle} · {event.date_display}
        </p>

        <Link
          href={`/event/${event.event_id}/prepare`}
          className="mt-5 inline-flex w-full flex-col items-center rounded-xl bg-[var(--gold)] px-6 py-3.5 font-serif text-base font-semibold tracking-wider text-[var(--ink)] shadow-[0_3px_0_var(--gold-deep)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--gold-deep)]"
        >
          <span>BẮT ĐẦU CHUẨN BỊ LỄ</span>
          <span className="mt-0.5 text-[10px] font-normal italic tracking-normal text-[var(--ink)]/70">
            AI soạn sớ và tư vấn mâm cúng
          </span>
        </Link>
      </div>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="mx-auto"
      aria-hidden
    >
      <circle cx="20" cy="20" r="14" fill="var(--gold)" opacity="0.95" />
      <circle cx="16" cy="18" r="2" fill="var(--brown-deep)" opacity="0.2" />
      <circle cx="24" cy="22" r="1.5" fill="var(--brown-deep)" opacity="0.2" />
      <circle cx="20" cy="25" r="1" fill="var(--brown-deep)" opacity="0.2" />
      <circle cx="20" cy="20" r="18" stroke="var(--gold)" strokeWidth="0.3" opacity="0.3" fill="none" />
    </svg>
  );
}

function CloudPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <pattern id="clouds" x="0" y="0" width="120" height="80" patternUnits="userSpaceOnUse">
          <path
            d="M10 40 Q 20 25, 35 35 T 60 40 Q 70 30, 85 40 T 110 45"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1"
          />
          <path
            d="M5 65 Q 18 55, 30 62 T 55 65 Q 68 58, 80 65 T 115 70"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="0.7"
            opacity="0.6"
          />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#clouds)" />
    </svg>
  );
}
