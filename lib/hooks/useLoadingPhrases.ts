'use client';

import { useEffect, useState } from 'react';

/**
 * Xoay vòng text khi loading. Reset về phrase[0] mỗi khi active chuyển true.
 */
export function useLoadingPhrases(
  phrases: string[],
  active: boolean,
  intervalMs = 1700
) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, phrases.length, intervalMs]);

  return phrases[index] ?? phrases[0] ?? '';
}