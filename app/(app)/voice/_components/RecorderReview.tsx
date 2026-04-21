'use client';

import { useEffect, useRef, useState } from 'react';
import type { VoiceOwner } from './types';

interface Props {
  owner: VoiceOwner;
  audioUrl: string;
  onRetry: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function RecorderReview({ owner, audioUrl, onRetry, onSave, isSaving }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const end = () => setIsPlaying(false);
    a.addEventListener('ended', end);
    return () => a.removeEventListener('ended', end);
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play();
      setIsPlaying(true);
    }
  }

  const label =
    owner.kind === 'user' ? 'Giọng của bạn' : owner.display_name;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-center font-serif text-2xl text-[var(--ink)] md:text-3xl">
        Nghe lại bản thu
      </h2>
      <p className="mt-2 text-center text-base text-[var(--muted)]">{label}</p>

      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Nút Play */}
      <button
        onClick={toggle}
        aria-label={isPlaying ? 'Tạm dừng' : 'Phát thử'}
        className="mt-10 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--gold)]/10 transition active:scale-95"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="mt-3 text-sm text-[var(--muted)]">
        {isPlaying ? 'Đang phát...' : 'Chạm để nghe thử'}
      </div>

      {/* 2 nút hành động */}
      <div className="mt-12 grid w-full grid-cols-2 gap-3">
        <button
          onClick={onRetry}
          disabled={isSaving}
          className="rounded-sm border border-[var(--gold-soft)] px-4 py-5 font-serif text-base tracking-wider text-[var(--muted)] transition active:border-[var(--ink)] active:text-[var(--ink)] disabled:opacity-50"
        >
          Thu lại
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="rounded-sm bg-[var(--gold)] px-4 py-5 font-serif text-base font-medium tracking-widest text-[var(--ink)] shadow-[0_2px_0_var(--gold-deep)] transition active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'ĐANG LƯU...' : 'LƯU GIỌNG'}
        </button>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--gold-deep)">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--gold-deep)">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}