'use client';

import { useEffect, useRef, useState } from 'react';
import type { Voice } from '@/components/ancestor/types';

interface Props {
  voices: Voice[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function VoiceSelector({ voices, selectedId, onSelect }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio khi unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function handlePreview(e: React.MouseEvent, voice: Voice) {
    e.stopPropagation(); // Tránh click bubble lên card

    // Đang phát voice này → pause
    if (playingId === voice.voice_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Đang phát voice khác → stop cái cũ
    audioRef.current?.pause();

    // Play voice mới
    const audio = new Audio(voice.preview_url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      console.warn('Preview audio failed:', voice.preview_url);
      setPlayingId(null);
    };
    audio.play().then(() => setPlayingId(voice.voice_id)).catch(() => setPlayingId(null));
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
          onPreview={(e) => handlePreview(e, v)}
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
  onPreview: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex min-w-[160px] flex-shrink-0 flex-col rounded-2xl border bg-white p-4 text-left transition md:min-w-0 ${
        selected
          ? 'border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500'
          : 'border-stone-200 shadow-sm hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      {/* Checkmark khi chọn */}
      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-xs font-bold text-white shadow">
          ✓
        </div>
      )}

      {/* Avatar */}
      <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-gradient-to-b from-amber-50/50 to-stone-50">
        <VoiceAvatar gender={voice.gender} active={playing} />
      </div>

      <div className="mb-3 text-center">
        <div className="font-serif text-sm font-semibold text-stone-800">
          {voice.display_name}
        </div>
        <div className="mt-0.5 text-[11px] italic text-stone-500">
          {voice.description}
        </div>
      </div>

      <div className="mt-auto">
        <div
          role="button"
          tabIndex={0}
          onClick={onPreview}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPreview(e as unknown as React.MouseEvent);
            }
          }}
          className="w-full cursor-pointer rounded-lg border border-amber-500 py-1.5 text-center text-[11px] font-medium tracking-wider text-amber-700 transition hover:bg-amber-50"
        >
          {playing ? '❚❚ Đang phát' : '▶ Nghe thử'}
        </div>
      </div>
    </button>
  );
}

function VoiceAvatar({ gender, active }: { gender: 'male' | 'female'; active: boolean }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle
        cx="28" cy="28" r="26"
        stroke="#fbbf24"
        strokeWidth="0.5"
        strokeDasharray="1 3"
        opacity="0.4"
        className={active ? 'origin-center animate-spin [animation-duration:12s]' : ''}
      />
      <circle cx="28" cy="22" r="7" fill="#d97706" opacity="0.85" />
      <path
        d={gender === 'male'
          ? 'M14 44c0-7 6-12 14-12s14 5 14 12v4H14v-4z'
          : 'M13 44c0-7 7-12 15-12s15 5 15 12v4H13v-4z'}
        fill="#b45309"
        opacity="0.75"
      />
      {active && (
        <circle cx="28" cy="28" r="14" stroke="#d97706" strokeWidth="0.6" opacity="0.5">
          <animate attributeName="r" from="14" to="26" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}