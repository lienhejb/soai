'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { AuthModal } from '@/app/[locale]/_components/AuthModal';

interface Props {
  isLoggedIn: boolean;
  displayName: string | null;
}

export function SoLayoutHeaderActions({ isLoggedIn, displayName }: Props) {
  const [authOpen, setAuthOpen] = useState(false);

  if (isLoggedIn) {
    // Lấy 2 chữ initials cho avatar
    const initials = displayName
      ? displayName
          .trim()
          .split(/\s+/)
          .slice(-2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
      : 'U';

    return (
      <Link
        href="/dashboard"
        className="flex h-9 items-center gap-2 rounded-full border border-[var(--gold-soft)] pl-1 pr-3 transition active:bg-[var(--gold)]/10"
        aria-label="Về Dashboard"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gold)]/15 text-xs font-bold text-[var(--gold-deep)]">
          {initials}
        </span>
        <span className="text-xs font-medium text-[var(--ink)]">Dashboard</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className="rounded-full border border-[var(--gold-soft)] px-4 py-1.5 text-sm font-medium text-[var(--gold-deep)] transition active:bg-[var(--gold)]/10"
      >
        Đăng nhập
      </button>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}