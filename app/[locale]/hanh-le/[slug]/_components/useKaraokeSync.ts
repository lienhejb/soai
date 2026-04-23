'use client';

import { useMemo } from 'react';
import type { SoPlaybackData, KaraokeLine } from './types';

export interface FlatLine extends KaraokeLine {
  global_start_ms: number;      // tính từ đầu bài sớ
  global_end_ms: number;
  segment_id: string;
  segment_type: 'STATIC' | 'DYNAMIC';
}

export function useFlatLines(data: SoPlaybackData): FlatLine[] {
  return useMemo(() => {
    const flat: FlatLine[] = [];
    let accumulatedMs = 0;
    for (const seg of data.segments) {
      for (const line of seg.lines) {
        flat.push({
          ...line,
          global_start_ms: accumulatedMs + line.start_ms,
          global_end_ms: accumulatedMs + line.end_ms,
          segment_id: seg.segment_id,
          segment_type: seg.type,
        });
      }
      accumulatedMs += seg.duration_ms;
    }
    return flat;
  }, [data]);
}

export function findActiveLineIndex(lines: FlatLine[], currentMs: number): number {
  // Binary search cho nhanh
  let lo = 0, hi = lines.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const l = lines[mid];
    if (currentMs < l.global_start_ms) hi = mid - 1;
    else if (currentMs >= l.global_end_ms) lo = mid + 1;
    else return mid;
  }
  // Nếu chưa tới line nào → trả về -1, hoặc gần nhất
  return Math.max(0, hi);
}
