'use client';

import { useState } from 'react';
import { AuthModal } from '@/app/[locale]/_components/AuthModal';

export function LoginButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-amber-500 px-4 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
      >
        Đăng nhập
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}