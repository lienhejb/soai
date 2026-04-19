'use client';

import { useRef, useState } from 'react';
import type { Voice } from './types';

interface Props {
  voices: Voice[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function VoiceSelector({ voices, selectedId, onSelect }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function handlePreview(voice: Voice) {
    // Mock preview — thực tế sẽ load preview_url
    if (playingId === voice.voice_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    setPlayingId(voice.voice_id);
    // Simulate — sau sẽ dùng Audio element thật
    setTimeout(() => setPlayingId(null), 2000);
  }

  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
      {voices.map((v) => (
        <VoiceCard
          key={v.voice_id}
          voice={v}
          selected={selectedId === v.voice_id}
          playing={playingId === v.voice_id}
          onSelect={() => onSelect(v.voice_id)}
          onPreview={() => handlePreview(v)}
        />
      ))}
    </div>
  );
}

function VoiceCard({
  voice, selected, playing, onSelect, onPreview,
}: {
  voice: Voice;
  selected: boolean;
  playing: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className={`relative flex min-w-[160px] flex-shrink-0 flex-col rounded-sm border bg-[var(--bg-paper-2)] p-4 transition md:min-w-0 ${
        selected
          ? 'border-[var(--gold)] shadow-[0_0_0_1px_var(--gold),0_4px_20px_-8px_var(--gold-deep)]'
          : 'border-[var(--gold-soft)] hover:border-[var(--gold)]'
      }`}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] text-[var(--ink)]">
          ✓
        </div>
      )}

      {/* Avatar / sóng âm */}
      <div className="mb-3 flex h-20 items-center justify-center rounded-sm bg-gradient-to-b from-[var(--bg-paper)] to-[var(--bg-paper-2)]">
        <VoiceAvatar gender={voice.gender} active={playing} />
      </div>

      <div className="mb-3 text-center">
        <div className="font-serif text-sm font-medium text-[var(--ink)]">
          {voice.display_name}
        </div>
        <div className="mt-0.5 text-[11px] italic text-[var(--muted)]">
          {voice.description}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          className="w-full rounded-sm bg-[var(--gold)] py-1.5 text-[11px] font-medium tracking-wider text-[var(--ink)] transition hover:bg-[var(--gold-deep)] hover:text-white"
        >
          {playing ? '❚❚ Đang phát' : '▶ Nghe thử'}
        </button>
        <button
          type="button"
          onClick={onSelect}
          disabled={selected}
          className="w-full rounded-sm border border-[var(--gold)] py-1.5 text-[11px] font-medium tracking-wider text-[var(--gold-deep)] transition hover:bg-[var(--gold)]/10 disabled:opacity-40"
        >
          {selected ? 'Đã chọn' : 'Chọn'}
        </button>
      </div>
    </div>
  );
}

function VoiceAvatar({ gender, active }: { gender: 'male' | 'female'; active: boolean }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      {/* Hào quang */}
      <circle
        cx="28" cy="28" r="26"
        stroke="var(--gold-soft)"
        strokeWidth="0.5"
        strokeDasharray="1 3"
        className={active ? 'origin-center animate-spin [animation-duration:12s]' : ''}
      />
      {/* Đầu */}
      <circle cx="28" cy="22" r="7" fill="var(--gold)" opacity="0.85" />
      {/* Vai/áo */}
      <path
        d={gender === 'male'
          ? 'M14 44c0-7 6-12 14-12s14 5 14 12v4H14v-4z'
          : 'M13 44c0-7 7-12 15-12s15 5 15 12v4H13v-4z'}
        fill="var(--gold-deep)"
        opacity="0.7"
      />
      {/* Sóng âm khi playing */}
      {active && (
        <>
          <circle cx="28" cy="28" r="14" stroke="var(--gold)" strokeWidth="0.6" opacity="0.5">
            <animate attributeName="r" from="14" to="26" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}
