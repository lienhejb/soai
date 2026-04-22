'use client';

import type { RecordingScript, VoiceOwner } from './types';

interface Props {
  owner: VoiceOwner;
  script: RecordingScript;
  onStart: () => void;
  onBack: () => void;
}

export function RecorderIdle({ owner, script, onStart, onBack }: Props) {
  const ownerLabel =
    owner.kind === 'user' ? 'Giọng của bạn' : owner.display_name;

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onBack}
        className="self-start text-sm text-[var(--muted)] active:text-[var(--ink)]"
      >
        ← Đổi người
      </button>

      <h2 className="mt-4 text-center font-serif text-2xl text-[var(--ink)] md:text-3xl">
        Lưu Giữ Giọng Đọc
      </h2>
      <p className="mt-2 text-center text-base text-[var(--muted)]">
        {ownerLabel}
      </p>

      {/* Đoạn văn mẫu */}
      <div className="mt-8 w-full rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] p-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">
          Sẽ đọc đoạn văn sau
        </div>
        <p className="font-serif text-lg leading-relaxed text-[var(--ink)] md:text-xl">
          {script.content}
        </p>
      </div>

      {/* Nút Micro lớn */}
      <button
        onClick={onStart}
        aria-label="Bắt đầu thu âm"
        className="mt-10 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--gold)]/5 transition active:scale-95 active:bg-[var(--gold)]/15"
      >
        <MicIcon />
      </button>
      <div className="mt-4 font-serif text-base tracking-widest text-[var(--ink)]">
        CHẠM ĐỂ BẮT ĐẦU
      </div>
      <div className="mt-1 text-xs text-[var(--muted)]">
        Đọc tối thiểu {script.min_duration_sec} giây
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--gold-deep)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="12" rx="3" fill="var(--gold)" opacity="0.2" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}