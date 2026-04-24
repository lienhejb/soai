'use client';

interface Props {
  honorific: string;
  fullName: string;
  todayLunar: string;
  onEdit: () => void;
  isAdmin?: boolean;
}

export function DashboardGreeting({ honorific, fullName, todayLunar, onEdit, isAdmin }: Props) {
  return (
    <div className="px-5 pb-5 pt-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-stone-800">
            Kính chào,
          </h1>
          <h2 className="mt-1 truncate font-serif text-2xl font-semibold text-stone-800">
            {honorific} {fullName}
          </h2>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isAdmin && (
            
            <a  href="/vi/admin"
              aria-label="Admin Dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 shadow-sm transition hover:border-stone-800 hover:text-stone-800"
            >
              <ShieldIcon />
            </a>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Chỉnh sửa thông tin"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/40 bg-white text-amber-600 shadow-sm transition hover:border-amber-500 hover:bg-amber-50"
          >
            <PenIcon />
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm italic text-stone-500">
        Tâm xuất Phật biết, vạn sự bình an.
      </p>

      <p className="mt-2 text-xs text-stone-400">
        Hôm nay là ngày <span className="font-medium text-amber-700">{todayLunar}</span> Âm lịch
      </p>
    </div>
  );
}

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}