'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { AuthModal } from '@/app/[locale]/_components/AuthModal';

export default function SoPublicLayout({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[var(--bg-paper)]">
      <header className="sticky top-0 z-30 border-b border-[var(--gold-soft)] bg-[var(--bg-paper)]/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2" aria-label="GiongDoc">
            <LotusMark />
            <span className="font-serif text-lg tracking-widest text-[var(--ink)]">
              GiongDoc
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="rounded-full border border-[var(--gold-soft)] px-4 py-1.5 text-sm font-medium text-[var(--gold-deep)] transition active:bg-[var(--gold)]/10"
          >
            Đăng nhập
          </button>
        </div>
      </header>

      <main className="pb-12">{children}</main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

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