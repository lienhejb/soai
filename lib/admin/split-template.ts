import { createHash } from 'crypto';

export interface SplitSegment {
  order_index: number;
  segment_type: 'static' | 'dynamic';
  text: string;
  text_hash: string;
}

/**
 * Tách content template thành array segments dựa trên vị trí biến {{...}}.
 * 
 * Quy tắc:
 * - Đoạn không chứa {{...}} → static
 * - Đoạn chứa {{...}} → dynamic (mở rộng tới ranh giới câu gần nhất 2 phía)
 * - Merge các đoạn cùng type liền kề
 * - Trim whitespace mỗi segment
 * 
 * Ví dụ input:
 *   "Nam mô A Di Đà Phật. Tín chủ con là {{owner_name}}, ngụ tại {{address}}. Cúi xin chứng giám."
 * 
 * Output:
 *   [
 *     { static: "Nam mô A Di Đà Phật." },
 *     { dynamic: "Tín chủ con là {{owner_name}}, ngụ tại {{address}}." },
 *     { static: "Cúi xin chứng giám." }
 *   ]
 */
export function splitTemplate(content: string): SplitSegment[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  // 1. Tách thành "câu" theo dấu . ! ? (giữ dấu)
  const sentences = splitIntoSentences(trimmed);
  if (sentences.length === 0) return [];

  // 2. Phân loại từng câu: có {{...}} = dynamic, không = static
  const classified = sentences.map((s) => ({
    text: s,
    type: containsVariable(s) ? ('dynamic' as const) : ('static' as const),
  }));

  // 3. Merge các câu cùng type liền kề
  const merged: Array<{ text: string; type: 'static' | 'dynamic' }> = [];
  for (const item of classified) {
    const last = merged[merged.length - 1];
    if (last && last.type === item.type) {
      last.text = `${last.text} ${item.text}`;
    } else {
      merged.push({ text: item.text, type: item.type });
    }
  }

  // 4. Tạo SplitSegment với order_index + text_hash
  return merged.map((m, i) => ({
    order_index: i + 1,
    segment_type: m.type,
    text: m.text.trim(),
    text_hash: hashText(m.text.trim()),
  }));
}

/**
 * Tách string thành array sentences theo dấu câu (. ! ?).
 * Giữ dấu câu trong sentence.
 */
function splitIntoSentences(text: string): string[] {
  const parts = text.split(/([.!?])/);
  const sentences: string[] = [];
  let buffer = '';

  for (const part of parts) {
    buffer += part;
    if (/[.!?]/.test(part)) {
      const trimmed = buffer.trim();
      if (trimmed.length > 0) sentences.push(trimmed);
      buffer = '';
    }
  }

  const tail = buffer.trim();
  if (tail.length > 0) sentences.push(tail);

  return sentences;
}

function containsVariable(text: string): boolean {
  return /\{\{\s*\w+\s*\}\}/.test(text);
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Extract list các variable keys xuất hiện trong content.
 * VD: "Hello {{owner_name}}, ngụ tại {{address}}" → ['owner_name', 'address']
 * Dedup, sorted alphabetical.
 */
export function extractVariableKeys(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  const keys = new Set<string>();
  for (const m of matches) {
    keys.add(m[1]);
  }
  return Array.from(keys).sort();
}

/**
 * So sánh 2 array segments để tìm segment nào "stale" (text đã đổi).
 * Match theo order_index. Trả về list order_index của segment đã đổi text.
 * 
 * Dùng khi admin update template:
 * - oldSegments: từ DB hiện tại
 * - newSegments: kết quả splitTemplate(newContent)
 */
export function findStaleSegmentIndices(
  oldSegments: Array<{ order_index: number; text_hash: string }>,
  newSegments: SplitSegment[]
): number[] {
  const oldMap = new Map(oldSegments.map((s) => [s.order_index, s.text_hash]));
  const stale: number[] = [];

  for (const newSeg of newSegments) {
    const oldHash = oldMap.get(newSeg.order_index);
    if (oldHash !== newSeg.text_hash) {
      stale.push(newSeg.order_index);
    }
  }

  // Cũng coi là stale những order_index có ở old mà không có ở new (segment bị xóa)
  for (const oldSeg of oldSegments) {
    if (!newSegments.find((n) => n.order_index === oldSeg.order_index)) {
      stale.push(oldSeg.order_index);
    }
  }

  return [...new Set(stale)].sort((a, b) => a - b);
}