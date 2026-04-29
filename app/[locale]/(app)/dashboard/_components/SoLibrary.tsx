'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { UserSo } from './types';

interface Props {
  sos: UserSo[];
}

const PREVIEW_LIMIT = 5;

export function SoLibrary({ sos }: Props) {
  const visibleSos = sos.slice(0, PREVIEW_LIMIT);
  const hasMore = sos.length > PREVIEW_LIMIT;

  return (
    <section className="mt-8 pb-28">
      {/* Heading */}
      <div className="mb-4 flex items-baseline justify-between px-5">
        <h2 className="font-serif text-xl font-bold text-stone-800">
          Sớ Của Tôi
        </h2>
        {hasMore && (
          <Link href="/so" className="text-xs font-medium text-amber-700 hover:underline">
            Xem tất cả →
          </Link>
        )}
      </div>

      {sos.length === 0 ? (
        <div className="mx-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <p className="font-serif text-sm italic text-stone-500">
            Chưa có sớ nào
          </p>
        </div>
      ) : (
        // Grid 2 cột — card cùng kích thước
        <div className="grid grid-cols-2 gap-3 px-5">
          {visibleSos.map((so) => (
            <SoCard key={so.user_so_id} so={so} />
          ))}
        </div>
      )}
    </section>
  );
}

function SoCard({ so }: { so: UserSo }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPending = false;

  return (
    <div className="relative">
      <Link
        href={isPending ? '#' : `/so/${so.user_so_id}`}
        onClick={(e) => isPending && e.preventDefault()}
        className={`group flex h-full min-h-[148px] flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all ${
          isPending
            ? 'cursor-not-allowed'
            : 'hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
        }`}
      >
        {/* Icon */}
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700">
          <IncenseIcon />
        </div>

        {/* Tên sớ — cố định 2 dòng để mọi card cao bằng nhau */}
        <div className="font-serif text-sm font-semibold leading-snug text-stone-800 line-clamp-2 min-h-[2.5rem]">
          {so.nickname}
        </div>

        {/* Spacer đẩy trạng thái xuống đáy */}
        <div className="mt-auto pt-2 text-[10px] italic text-stone-400">
          {so.has_rendered ? 'Đã thỉnh' : 'Chưa thỉnh'}
        </div>
      </Link>

      {/* Nút ... menu */}
      {!isPending && (
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Tùy chọn"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <DotsIcon />
        </button>
      )}

      {/* Menu dropdown */}
      {menuOpen && !isPending && (
        <div
          className="absolute right-2 top-10 z-10 w-32 rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button className="w-full px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50">
            Đổi tên
          </button>
          <button className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50">
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}

function IncenseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 21V9" />
      <path d="M10 9h4" fill="currentColor" opacity="0.3" />
      <path d="M12 6c-1.5-1.5-1.5-3 0-4.5M12 6c1.5-1.5 1.5-3 0-4.5" opacity="0.5" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}