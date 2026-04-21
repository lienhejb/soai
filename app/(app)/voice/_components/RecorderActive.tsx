'use client';

import { useEffect, useState } from 'react';
import type { RecordingScript } from './types';

interface Props {
  script: RecordingScript;
  onStop: () => void;
}

export function RecorderActive({ script, onStop }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const canStop = elapsed >= script.min_duration_sec;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-center font-serif text-2xl text-[var(--ink)] md:text-3xl">
        Vui lòng đọc rõ ràng
      </h2>
      <p className="mt-2 text-center text-base text-[var(--muted)]">
        Giữ điện thoại cách miệng ~20cm
      </p>

      {/* Script to, dễ đọc */}
      <div className="mt-8 w-full rounded-sm border border-[var(--gold)] bg-[var(--bg-paper-2)] p-6">
        <p className="font-serif text-xl leading-loose text-[var(--ink)] md:text-2xl">
          {script.content}
        </p>
      </div>

      {/* Timer */}
      <div className="mt-8 font-serif text-5xl tabular-nums text-[var(--gold-deep)]">
        {mm}:{ss}
      </div>

      {/* Nút Dừng với sóng */}
      <div className="relative mt-8">
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--gold)] opacity-20" />
        <button
          onClick={onStop}
          disabled={!canStop}
          aria-label="Dừng thu âm"
          className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--gold)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="h-10 w-10 rounded-sm bg-[var(--bg-paper)]" />
        </button>
      </div>
      <div className="mt-4 font-serif text-base tracking-widest text-[var(--ink)]">
        {canStop ? 'CHẠM ĐỂ DỪNG' : `CẦN THÊM ${script.min_duration_sec - elapsed}s`}
      </div>
    </div>
  );
}