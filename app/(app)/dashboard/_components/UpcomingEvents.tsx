import Link from 'next/link';
import type { UpcomingEvent } from './types';
import { EVENT_TYPE_LABEL } from './types';

interface Props {
  events: UpcomingEvent[];
}

export function UpcomingEvents({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <section className="mt-8 px-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-lg font-medium text-[var(--ink)]">
          Sự kiện sắp tới
        </h2>
        <Link href="/calendar" className="text-xs text-[var(--gold-deep)] underline-offset-4 hover:underline">
          Xem lịch
        </Link>
      </div>

      <ul className="space-y-2">
        {events.map((e) => (
          <EventRow key={e.event_id} event={e} />
        ))}
      </ul>
    </section>
  );
}

function EventRow({ event }: { event: UpcomingEvent }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-3.5 py-3">
      {/* Badge type */}
      <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--gold)]/10">
        <EventIcon type={event.event_type} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-serif text-[15px] font-medium text-[var(--ink)]">
          {event.title}
        </div>
        <div className="mt-0.5 text-xs text-[var(--muted)]">
          {event.date_display} · Còn {event.days_left} ngày
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/event/${event.event_id}/so`}
        className="flex-shrink-0 rounded-lg border border-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[var(--gold-deep)] active:bg-[var(--gold)]/10"
      >
        Xem sớ
      </Link>
    </li>
  );
}

function EventIcon({ type }: { type: UpcomingEvent['event_type'] }) {
  // Ký tự tối giản thay icon library
  const map: Record<UpcomingEvent['event_type'], string> = {
    RAM: '◯',
    MONG: '●',
    GIO: '卍',
    TAT_NIEN: '春',
    CUNG_GIA_TIEN: '祖',
    LE_TET: '福',
    KHAI_TRUONG: '開',
    NHAP_TRACH: '家',
    KHAC: '・',
  };
  return (
    <span
      className="font-serif text-base text-[var(--gold-deep)]"
      aria-label={EVENT_TYPE_LABEL[type]}
    >
      {map[type]}
    </span>
  );
}
