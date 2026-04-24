'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BACKGROUND_SOUNDS,
  VOCAL_DEFAULT_VOLUME,
  AUDIO_PREFS_STORAGE_KEY,
  type BackgroundSound,
} from '@/lib/hanh-le/background-sounds';

export interface AudioVolumes {
  vocal: number;
  [backgroundKey: string]: number;
}

interface Props {
  vocalAudioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

/**
 * Quản lý N background audio layers, sync play/pause với vocal
 * Volume state lưu localStorage
 */
export function useBackgroundSounds({ vocalAudioRef, isPlaying }: Props) {
  // Load prefs từ localStorage (lazy init)
  const [volumes, setVolumes] = useState<AudioVolumes>(() => {
    if (typeof window === 'undefined') return buildDefaults();
    try {
      const raw = localStorage.getItem(AUDIO_PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge với defaults (bổ sung keys mới nếu sau này thêm sound)
        return { ...buildDefaults(), ...parsed };
      }
    } catch {}
    return buildDefaults();
  });

  // Refs cho các background audio elements
  const bgRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Khởi tạo background audio elements
  useEffect(() => {
    BACKGROUND_SOUNDS.forEach((sound) => {
      if (!bgRefs.current.has(sound.key)) {
        const audio = new Audio(sound.url);
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = (volumes[sound.key] ?? sound.default_volume) / 100;
        bgRefs.current.set(sound.key, audio);
      }
    });

    // Cleanup khi unmount
    const refs = bgRefs.current;
    return () => {
      refs.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      refs.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply vocal volume
  useEffect(() => {
    if (vocalAudioRef.current) {
      vocalAudioRef.current.volume = volumes.vocal / 100;
    }
  }, [volumes.vocal, vocalAudioRef]);

  // Apply background volumes
  useEffect(() => {
    bgRefs.current.forEach((audio, key) => {
      audio.volume = (volumes[key] ?? 0) / 100;
    });
  }, [volumes]);

  // Sync play/pause với vocal
  useEffect(() => {
    bgRefs.current.forEach((audio) => {
      if (isPlaying) {
        audio.play().catch(() => {}); // ignore autoplay block
      } else {
        audio.pause();
      }
    });
  }, [isPlaying]);

  // Persist volumes
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(volumes));
    } catch {}
  }, [volumes]);

  const setVolume = useCallback((key: string, value: number) => {
    setVolumes((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    volumes,
    setVolume,
    backgroundSounds: BACKGROUND_SOUNDS,
  };
}

function buildDefaults(): AudioVolumes {
  const defaults: AudioVolumes = { vocal: VOCAL_DEFAULT_VOLUME };
  BACKGROUND_SOUNDS.forEach((s) => {
    defaults[s.key] = s.default_volume;
  });
  return defaults;
}