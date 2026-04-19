'use client';

import PriestAvatar from './PriestAvatar';
import type { FlatLine } from './useKaraokeSync';

interface Props {
  name: string;
  role?: string;
  imageUrl?: string | null;
  isPlaying: boolean;
  currentLine: FlatLine | null;
  currentMs: number;
  totalMs: number;
}

export function AvatarMode({
  name, role, imageUrl, isPlaying, currentLine, currentMs, totalMs,
}: Props) {
  const progress = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8">
      {/* Avatar lớn */}
      <PriestAvatar
        name={name}
        role={role}
        imageUrl={imageUrl}
        isPlaying={isPlaying}
        size="lg"
      />

      {/* Dòng sớ đang đọc (mini) */}
      <div className="mt-10 flex min-h-[60px] w-full max-w-xs items-center justify-center">
        {currentLine && (
          <p
            key={currentLine.line_id}
            className="text-center font-serif text-base italic leading-relaxed text-[var(--soft-gold)]/70 animate-in fade-in duration-500"
          >
            "{currentLine.text}"
          </p>
        )}
      </div>

      {/* Progress bar mini */}
      <div className="mt-6 w-full max-w-xs">
        <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-full bg-[var(--soft-gold)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] tabular-nums text-white/30">
          <span>{fmtTime(currentMs)}</span>
          <span>{fmtTime(totalMs)}</span>
        </div>
      </div>
    </div>
  );
}

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
