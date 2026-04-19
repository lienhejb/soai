'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MOCK_SO_DATA } from './_components/mockData';
import { useFlatLines, findActiveLineIndex } from './_components/useKaraokeSync';
import { useMockAudioPlayer } from './_components/useAudioPlayer';
import { KaraokeView } from './_components/KaraokeView';
import { AudioControls } from './_components/AudioControls';

export default function HanhLePage() {
  const router = useRouter();
  const data = MOCK_SO_DATA;
  const flatLines = useFlatLines(data);
  const [confirmClose, setConfirmClose] = useState(false);

  const { isPlaying, currentMs, seek, toggle } = useMockAudioPlayer({
    totalDurationMs: data.total_duration_ms,
  });

  const activeIndex = findActiveLineIndex(flatLines, currentMs);

  function handleClose() {
    if (isPlaying) {
      setConfirmClose(true);
    } else {
      router.back();
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0a0808] text-[var(--soft-gold)]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(232,184,75,0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(232,184,75,0.04) 0%, transparent 60%)',
      }}
    >
      {/* Header */}
      <header className="relative flex items-center justify-between px-4 py-3.5">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 active:bg-white/5 active:text-white/70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--soft-gold)]/40">
            Hành Lễ
          </div>
          <div className="font-serif text-sm tracking-wide text-[var(--soft-gold)]/70">
            {data.title.replace('Hành Lễ Live: ', '')}
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center">
          {isPlaying && <LivePulse />}
        </div>
      </header>

      {/* Karaoke */}
      <div className="min-h-0 flex-1">
        <KaraokeView lines={flatLines} activeIndex={activeIndex} />
      </div>

      {/* Controls */}
      <AudioControls
        isPlaying={isPlaying}
        currentMs={currentMs}
        totalMs={data.total_duration_ms}
        onToggle={toggle}
        onSeek={seek}
      />

      {/* Confirm close modal */}
      {confirmClose && (
        <ConfirmCloseModal
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => router.back()}
        />
      )}
    </div>
  );
}

function LivePulse() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative h-2 w-2 rounded-full bg-red-500" />
      </span>
      <span className="text-[9px] uppercase tracking-wider text-white/50">Live</span>
    </div>
  );
}

function ConfirmCloseModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-[var(--soft-gold)]/20 bg-[#1a1512] p-6 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg text-[var(--soft-gold)]">Dừng buổi lễ?</h3>
        <p className="mt-2 text-sm text-white/60">
          Bạn đang trong buổi hành lễ. Việc dừng giữa chừng có thể ảnh hưởng đến tâm thành.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-[var(--soft-gold)] py-3 font-serif font-medium text-[#0a0808]"
          >
            Tiếp tục hành lễ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg py-3 text-sm text-white/50 active:text-white/80"
          >
            Dừng buổi lễ
          </button>
        </div>
      </div>
    </div>
  );
}
