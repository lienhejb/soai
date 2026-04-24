'use client';

import { useState } from 'react';

import type { BackgroundSound } from '@/lib/hanh-le/background-sounds';
import type { AudioVolumes } from './useBackgroundSounds';

interface Props {
  isPlaying: boolean;
  currentMs: number;
  totalMs: number;
  onToggle: () => void;
  onSeek: (ms: number) => void;
  volumes: AudioVolumes;
  onVolumeChange: (key: string, value: number) => void;
  backgroundSounds: readonly BackgroundSound[];
}

export function AudioControls({
  isPlaying,
  currentMs,
  totalMs,
  onToggle,
  onSeek,
  volumes,
  onVolumeChange,
  backgroundSounds,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);

  const progress = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;

  return (
    <div className="border-t border-white/[0.06] bg-[#0a0808]/95 backdrop-blur-lg">
      {/* Progress bar */}
      <div className="px-5 pt-4">
        <input
          type="range"
          min={0}
          max={totalMs}
          value={currentMs}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--soft-gold)]"
          style={{
            background: `linear-gradient(to right, #E8B84B 0%, #E8B84B ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/40">
          <span>{fmtTime(currentMs)}</span>
          <span>{fmtTime(totalMs)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="relative flex items-center justify-center gap-8 px-5 py-5">
        <button
          type="button"
          aria-label="Lùi 10 giây"
          onClick={() => onSeek(Math.max(0, currentMs - 10000))}
          className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 active:bg-white/5 active:text-white"
        >
          <Rewind10Icon />
        </button>

        <button
          type="button"
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          onClick={onToggle}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E8B84B] to-[#9a7a1f] shadow-[0_0_30px_rgba(232,184,75,0.3)] active:scale-95"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          type="button"
          aria-label="Tiến 10 giây"
          onClick={() => onSeek(Math.min(totalMs, currentMs + 10000))}
          className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 active:bg-white/5 active:text-white"
        >
          <Forward10Icon />
        </button>

        {/* Settings toggle */}
        <button
          type="button"
          aria-label="Cài đặt pháp khí"
          onClick={() => setShowSettings(!showSettings)}
          className="absolute right-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/40 active:bg-white/5"
        >
          <MixerIcon />
        </button>
      </div>

      {/* Volume panel */}
      {showSettings && (
        <div className="border-t border-white/[0.06] px-5 py-4">
          <VolumeSlider
            label="Giọng đọc"
            icon={<VoiceIcon />}
            value={volumes.vocal}
            onChange={(v) => onVolumeChange('vocal', v)}
          />
          {backgroundSounds.map((sound) => (
            <VolumeSlider
              key={sound.key}
              label={sound.label}
              icon={iconFor(sound.icon)}
              value={volumes[sound.key] ?? sound.default_volume}
              onChange={(v) => onVolumeChange(sound.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VolumeSlider({
  label, icon, value, onChange,
}: { label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex h-7 w-7 items-center justify-center text-[var(--soft-gold)]/70">{icon}</div>
      <div className="w-20 text-xs text-white/60">{label}</div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10"
        style={{
          background: `linear-gradient(to right, #E8B84B 0%, #E8B84B ${value}%, rgba(255,255,255,0.1) ${value}%)`,
        }}
      />
      <div className="w-8 text-right text-[11px] tabular-nums text-white/50">{value}</div>
    </div>
  );
}

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function iconFor(name: 'mo' | 'chuong'): React.ReactNode {
  switch (name) {
    case 'mo': return <MoIcon />;
    case 'chuong': return <BellPhapKhiIcon />;
  }
}

// ===== Icons =====

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#0a0808">
      <path d="M7 5v14l12-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#0a0808">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function Rewind10Icon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" />
      <path d="M3 3v5h5" />
      <text x="12" y="15.5" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="600">10</text>
    </svg>
  );
}

function Forward10Icon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 12a8.5 8.5 0 1 1-2.8-6.3" />
      <path d="M21 3v5h-5" />
      <text x="12" y="15.5" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="600">10</text>
    </svg>
  );
}

function MixerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="6" y1="3" x2="6" y2="14" /><line x1="6" y1="18" x2="6" y2="21" /><circle cx="6" cy="16" r="2" />
      <line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="11" x2="12" y2="21" /><circle cx="12" cy="9" r="2" />
      <line x1="18" y1="3" x2="18" y2="11" /><line x1="18" y1="15" x2="18" y2="21" /><circle cx="18" cy="13" r="2" />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function MoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <ellipse cx="12" cy="14" rx="8" ry="6" />
      <path d="M12 8V4M12 4l-2 2M12 4l2 2" />
    </svg>
  );
}

function BellPhapKhiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10.5 21a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}
