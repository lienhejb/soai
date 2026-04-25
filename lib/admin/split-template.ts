import { createHash } from 'crypto';

/**
 * Hash SHA256 của text. Dùng làm text_hash cho cache invalidation.
 */
export function hashText(text: string): string {
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
 * Check 1 đoạn text có chứa biến {{...}} không.
 * Dùng cho validate UI: block static không nên có biến.
 */
export function containsVariable(text: string): boolean {
  return /\{\{\s*\w+\s*\}\}/.test(text);
}

/**
 * So sánh 2 array segments để tìm segment nào "stale" (text đã đổi).
 * Match theo order_index.
 * Trả về list order_index của segment đã đổi text.
 */
export function findStaleSegmentIndices(
  oldSegments: Array<{ order_index: number; text_hash: string }>,
  newSegments: Array<{ order_index: number; text_hash: string }>
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