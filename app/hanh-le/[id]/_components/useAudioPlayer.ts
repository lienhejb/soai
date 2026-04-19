'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Mock audio player — giả lập playback mà không cần file thật
// Khi có audio thật sẽ thay bằng Web Audio API decode + schedule

interface UseMockAudioPlayerProps {
  totalDurationMs: number;
  onEnd?: () => void;
}

export function useMockAudioPlayer({ totalDurationMs, onEnd }: UseMockAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    setCurrentMs((prev) => {
      const next = prev + delta;
      if (next >= totalDurationMs) {
        setIsPlaying(false);
        onEnd?.();
        return totalDurationMs;
      }
      return next;
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [totalDurationMs, onEnd]);

  const play = useCallback(() => {
    if (currentMs >= totalDurationMs) setCurrentMs(0);
    setIsPlaying(true);
  }, [currentMs, totalDurationMs]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const seek = useCallback((ms: number) => {
    setCurrentMs(Math.max(0, Math.min(totalDurationMs, ms)));
  }, [totalDurationMs]);

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, tick]);

  return { isPlaying, currentMs, play, pause, seek, toggle: () => isPlaying ? pause() : play() };
}
