import { Link } from '@/i18n/navigation';
import type { UserSo } from './types';
import { EVENT_TYPE_LABEL } from './types';

interface Props {
  sos: UserSo[];
}

export function SoLibrary({ sos }: Props) {
  return (
    <section className="mt-8 px-5 pb-28">
      {/* Heading với gạch chân */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-bold text-stone-800">
            Thư Viện Văn Khấn
          </h2>
          <Link href="/so" className="text-xs font-medium text-amber-700 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="mt-2 h-[1px] w-16 bg-gradient-to-r from-amber-600 via-amber-500 to-transparent" />
      </div>

      {sos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <p className="font-serif text-sm italic text-stone-500">
            Chưa có sớ nào trong tủ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
      className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:ring-1 hover:ring-amber-500/30"
    >
      {/* Default badge */}
      {so.is_default && (
        <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
          Mặc định
        </div>
      )}

      {/* Icon tâm linh */}
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700">
        <IncenseIcon />
      </div>

      {/* Label event type */}
      <div className="text-[10px] font-medium uppercase tracking-wider text-amber-700">
        {EVENT_TYPE_LABEL[so.event_type]}
      </div>

      {/* Tên sớ */}
      <div className="mt-1 font-serif text-base font-semibold leading-snug text-stone-800 line-clamp-2">
        {so.nickname}
      </div>

      {/* Subtle arrow khi hover */}
      <div className="mt-3 flex items-center text-xs font-medium text-stone-400 transition group-hover:text-amber-600">
        Xem sớ
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5 transition group-hover:translate-x-0.5">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </div>
    </Link>
  );
}

function IncenseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {/* Nén nhang + khói */}
      <path d="M12 21V9" />
      <path d="M10 9h4" fill="currentColor" opacity="0.3" />
      <path d="M12 6c-1.5-1.5-1.5-3 0-4.5M12 6c1.5-1.5 1.5-3 0-4.5" opacity="0.5" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" />
    </svg>
  );
}