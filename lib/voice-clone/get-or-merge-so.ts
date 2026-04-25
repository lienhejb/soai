'use server';

import { createClient } from '@/lib/supabase/server';
import { prepareRenderedSo } from './prepare-so';

/**
 * Wrapper cho NGHE: nếu cache hit → trả URL ngay.
 * Cache miss → trả về segments để client merge & finalize qua finalizeRenderedSo.
 * Khác handleHanhLe: KHÔNG redirect — chỉ cần trả audio URL để play.
 */
export async function getOrPrepareForListen(
  templateSlug: string,
  voiceKey: string,
  voiceProviderId: string
) {
  return await prepareRenderedSo(templateSlug, voiceKey, voiceProviderId);
}