'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { KaraokeView } from './KaraokeView';
import { AudioControls } from './AudioControls';
import { ModeSwitcher, type ViewMode } from './ModeSwitcher';
import { AvatarMode } from './AvatarMode';
import PriestAvatar from './PriestAvatar';
import type { FlatLine } from './useKaraokeSync';

export interface RenderedSoData {
  title: string;
  audioUrl: string;
  durationMs: number;
  voiceKey: string;
  lines: Array<{
    line_id: string;
    text: string;
    start_ms: number;
    end_ms: number;
    segment_id?: string;
  }>;
}

const AUTO_INTERVAL_MS = 25000;

// Mock priest — sau này map voiceKey → voice profile
const MOCK_PRIEST = {
  name: 'Thầy Thích Thiện',
  role: 'Giọng Nam trầm — Miền Bắc',
  imageUrl: null as string | null,
};

export function HanhLeClient({ data }: { data: RenderedSoData }) {
  const router = useRouter();
  const [confirmClose, setConfirmClose] = useState(false);
  const [mode, setMode] = useState<ViewMode>('karaoke');
  const [autoAlternate, setAutoAlternate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);

  // Convert lines → FlatLine[]
  const flatLines: FlatLine[] = data.lines.map((l, i) => ({
    line_id: l.line_id || `l${i}`,
    text: l.text,
    start_ms: l.start_ms,
    end_ms: l.end_ms,
    segment_id: l.segment_id ?? '',
    segment_type: 'STATIC' as const,
  }));

  const activeIndex = findActiveIndex(flatLines, currentMs);
  const currentLine = flatLines[activeIndex] ?? null;

  // Track audio time mượt hơn bằng rAF
  useEffect(() => {
    function tick() {
      if (audioRef.current) {
        setCurrentMs(audioRef.current.currentTime * 1000);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  // Auto alternate mode
  const lastSwitchRef = useRef(0);
  useEffect(() => {
    if (!autoAlternate || !isPlaying) return;
    const id = setInterval(() => {
      const now = performance.now();
      if (now - lastSwitchRef.current >= AUTO_INTERVAL_MS) {
        setMode((m) => (m === 'karaoke' ? 'avatar' : 'karaoke'));
        lastSwitchRef.current = now;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [autoAlternate, isPlaying]);

  function handleModeChange(m: ViewMode) {
    setMode(m);
    lastSwitchRef.current = performance.now();
  }

  function toggle() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  function seek(ms: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = ms / 1000;
    setCurrentMs(ms);
  }

  function handleClose() {
    if (isPlaying) setConfirmClose(true);
    else router.back();
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0a0808] text-[var(--soft-gold)]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at top, rgba(232,184,75,0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(232,184,75,0.04) 0%, transparent 60%)',
      }}
    >
      <audio
        ref={audioRef}
        src={data.audioUrl}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header */}
      <header className="relative flex items-center justify-between px-4 py-3">
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
            {data.title}
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleModeChange(mode === 'karaoke' ? 'avatar' : 'karaoke')}
          className="flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
        >
          <PriestAvatar
            name={MOCK_PRIEST.name}
            imageUrl={MOCK_PRIEST.imageUrl}
            isPlaying={isPlaying}
            size="sm"
            showInfo={false}
          />
        </button>
      </header>

      <div className="min-h-0 flex-1">
        {mode === 'karaoke' ? (
          <KaraokeView lines={flatLines} activeIndex={activeIndex} />
        ) : (
          <AvatarMode
            name={MOCK_PRIEST.name}
            role={MOCK_PRIEST.role}
            imageUrl={MOCK_PRIEST.imageUrl}
            isPlaying={isPlaying}
            currentLine={currentLine}
            currentMs={currentMs}
            totalMs={data.durationMs}
          />
        )}
      </div>

      <ModeSwitcher
        mode={mode}
        onChange={handleModeChange}
        autoAlternate={autoAlternate}
        onToggleAuto={setAutoAlternate}
      />

      <AudioControls
        isPlaying={isPlaying}
        currentMs={currentMs}
        totalMs={data.durationMs}
        onToggle={toggle}
        onSeek={seek}
      />

      {confirmClose && (
        <ConfirmCloseModal
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => router.back()}
        />
      )}
    </div>
  );
}

function findActiveIndex(lines: FlatLine[], currentMs: number): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentMs >= lines[i].start_ms) return i;
  }
  return 0;
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