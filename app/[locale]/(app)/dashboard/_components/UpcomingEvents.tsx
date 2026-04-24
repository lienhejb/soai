import { Link } from '@/i18n/navigation';
import type { ComputedEvent as UpcomingEvent } from '@/lib/lunar';
import { EVENT_TYPE_LABEL } from './types';

interface Props {
  events: UpcomingEvent[];
}

export function UpcomingEvents({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <section className="mt-8 px-5">
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-bold text-stone-800">
            Sắp diễn ra trong 30 ngày
          </h2>
          <Link href="/calendar" className="text-xs font-medium text-amber-700 hover:underline">
            Xem lịch →
          </Link>
        </div>
        <div className="mt-2 h-[1px] w-16 bg-gradient-to-r from-amber-600 via-amber-500 to-transparent" />
      </div>

      <ul className="space-y-2.5">
        {events.map((e) => (
          <EventRow key={e.event_id} event={e} />
        ))}
      </ul>
    </section>
  );
}

function EventRow({ event }: { event: UpcomingEvent }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700">
        <EventIcon type={event.event_type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-serif text-base font-semibold text-stone-800">
          {event.title}
        </div>
        <div className="mt-0.5 text-xs text-stone-500">
          {event.date_display}
          <span className="mx-1.5 text-stone-300">·</span>
          <span className="font-medium text-amber-700">
            {event.days_left === 0 ? 'Hôm nay' : `Còn ${event.days_left} ngày`}
          </span>
        </div>
      </div>

      <Link
        href={`/so/${event.event_id}`}
        className="flex-shrink-0 rounded-lg border border-amber-500 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
      >
        Xem sớ
      </Link>
    </li>
  );
}

function EventIcon({ type }: { type: UpcomingEvent['event_type'] }) {
  const map: Record<UpcomingEvent['event_type'], string> = {
    RAM: '◯',
    MONG: '●',
    GIO: '卍',
    KHAC: '・',
  };
  return (
    <span
      className="font-serif text-lg font-semibold"
      aria-label={EVENT_TYPE_LABEL[type]}
    >
      {map[type]}
    </span>
  );
}