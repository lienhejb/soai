import Link from 'next/link';
import type { UserSo } from './types';
import { EVENT_TYPE_LABEL } from './types';

interface Props {
  sos: UserSo[];
}

export function SoLibrary({ sos }: Props) {
  return (
    <section className="mt-8 px-4 pb-28">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-lg font-medium text-[var(--ink)]">
          Tủ Sớ Điện Tử
        </h2>
        <Link href="/so" className="text-xs text-[var(--gold-deep)] underline-offset-4 hover:underline">
          Xem tất cả
        </Link>
      </div>

      {sos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--gold-soft)] bg-[var(--bg-paper-2)]/50 p-6 text-center">
          <p className="font-serif text-sm italic text-[var(--muted)]">
            Chưa có sớ nào trong tủ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sos.map((so) => <SoCard key={so.user_so_id} so={so} />)}
        </div>
      )}
    </section>
  );
}

function SoCard({ so }: { so: UserSo }) {
  return (
    <Link
      href={`/so/${so.user_so_id}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-b from-[var(--paper-scroll)] to-[var(--paper-scroll-2)] p-3 shadow-sm active:scale-[0.98] active:shadow-none"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, var(--paper-scroll), var(--paper-scroll-2)),
          repeating-linear-gradient(
            0deg,
            transparent 0,
            transparent 4px,
            rgba(154,122,31,0.03) 4px,
            rgba(154,122,31,0.03) 5px
          )
        `,
      }}
    >
      {/* Dải trang trí trên */}
      <div className="absolute left-0 right-0 top-0 h-1.5 bg-[var(--gold-deep)]" />
      <div className="absolute left-0 right-0 top-1.5 h-px bg-[var(--gold)]" />

      {/* Default badge */}
      {so.is_default && (
        <div className="absolute right-1.5 top-2.5 rounded-full bg-[var(--gold)] px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-[var(--ink)]">
          MẶC ĐỊNH
        </div>
      )}

      <div className="mt-4 flex h-full flex-col">
        {/* Con dấu giả */}
        <div className="mx-auto my-2 flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--brown-deep)]/40 bg-[var(--brown-deep)]/5">
          <span className="font-serif text-base text-[var(--brown-deep)]">
            {EVENT_TYPE_LABEL[so.event_type][0]}
          </span>
        </div>

        {/* Tên sớ */}
        <div className="mt-auto">
          <div className="text-[10px] uppercase tracking-wider text-[var(--gold-deep)]/70">
            {EVENT_TYPE_LABEL[so.event_type]}
          </div>
          <div className="mt-0.5 line-clamp-2 font-serif text-sm font-medium leading-tight text-[var(--ink)]">
            {so.nickname}
          </div>
        </div>
      </div>

      {/* Dải trang trí dưới */}
      <div className="absolute bottom-1.5 left-0 right-0 h-px bg-[var(--gold)]" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[var(--gold-deep)]" />
    </Link>
  );
}
