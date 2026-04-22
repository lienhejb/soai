'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppHeader({ hasNotification = true }: { hasNotification?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--gold-soft)] bg-[var(--bg-paper)]/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="SoAI">
          <LotusMark />
          <span className="font-serif text-lg tracking-widest text-[var(--ink)]">
            SoAI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Thông báo"
            className="relative flex h-10 w-10 items-center justify-center rounded-full active:bg-[var(--gold)]/10"
          >
            <BellIcon />
            {hasNotification && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-[var(--bg-paper)]" />
            )}
          </button>

          <Link
            href="/profile"
            className="h-10 w-10 overflow-hidden rounded-full border border-[var(--gold-soft)] bg-[var(--bg-paper-2)]"
            aria-label="Cá nhân"
          >
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[var(--gold-deep)]">
              NV
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Trang chủ', icon: HomeIcon },
    { href: '/calendar', label: 'Lịch', icon: CalendarIcon },
    { href: '/so', label: 'Sớ', icon: ScrollIcon },
    { href: '/profile', label: 'Cá nhân', icon: UserIcon },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--gold-soft)] bg-[var(--bg-paper)]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] tracking-wide transition ${
                  active
                    ? 'text-[var(--gold-deep)]'
                    : 'text-[var(--muted)] active:text-[var(--ink)]'
                }`}
              >
                <Icon active={!!active} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ===== Icons =====

function LotusMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3c1.5 3 1.5 6 0 9-1.5-3-1.5-6 0-9z" fill="var(--gold)" opacity="0.9" />
      <path d="M4 10c3 0 5.5 2 7 5-3 0-5.5-2-7-5z" fill="var(--gold)" opacity="0.7" />
      <path d="M20 10c-3 0-5.5 2-7 5 3 0 5.5-2 7-5z" fill="var(--gold)" opacity="0.7" />
      <circle cx="12" cy="16" r="1.5" fill="var(--gold)" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10.5 21a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--gold)' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="16" rx="2" fill={active ? 'var(--gold)' : 'none'} />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function ScrollIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        fill={active ? 'var(--gold)' : 'none'}
      />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--gold)' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.5 3.5-8 8-8s8 3.5 8 8" />
    </svg>
  );
}
