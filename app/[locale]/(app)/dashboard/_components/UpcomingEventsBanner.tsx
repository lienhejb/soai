'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { ComputedEvent } from '@/lib/lunar';

interface Props {
  events: ComputedEvent[];
}

export function UpcomingEventsBanner({ events }: Props) {
  const [open, setOpen] = useState(false);
  const count = events.length;

  return (
    <div className="mx-5 mt-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-amber-300 hover:bg-amber-50/30"
      >
        <CalendarIcon />
        <span className="flex-1 text-left font-serif text-base font-medium text-stone-800">
          Lịch sự kiện sắp tới
        </span>
        {count > 0 && (
          <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-white">
            {count}
          </span>
        )}
        <ChevronIcon open={open} />
      </button>

      {/* Accordion content */}
      {open && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-stone-400">
              Không có sự kiện trong 30 ngày tới
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {events.map((ev, i) => (
                <li key={i}>
                  <Link
                    href={ev.target_slug ? `/so/${ev.target_slug}` : '/so'}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-amber-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-sm font-medium text-stone-800">
                        {ev.title}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500">
                        {ev.date_display} ·{' '}
                        <span className="text-amber-700">
                          {ev.days_left === 0 ? 'Hôm nay' : `Còn ${ev.days_left} ngày`}
                        </span>
                      </div>
                    </div>
                    <span className="text-stone-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
      </svg>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}