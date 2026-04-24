'use server';

import { createClient } from '@/lib/supabase/server';
import type { LineWithTiming } from '@/lib/elevenlabs/tts-with-timestamps';

const RENDERED_BUCKET = 'audio-rendered';

export interface FinalizeInput {
  template_id: string;
  voice_key: string;
  variables_hash: string;
  segments_fingerprint: string;
  merged_mp3_base64: string;
  duration_ms: number;
  global_lines: Array<LineWithTiming & { segment_id: string }>;
}

export interface FinalizeResult {
  ok: boolean;
  error?: string;
  merged_audio_url?: string;
}

export async function finalizeRenderedSo(input: FinalizeInput): Promise<FinalizeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  const mp3Buffer = Buffer.from(input.merged_mp3_base64, 'base64');
  if (mp3Buffer.length === 0) return { ok: false, error: 'Merged file rỗng' };

  // Path kèm fingerprint để tránh collision giữa các version
  const path = `${user.id}/merged_${input.template_id}_${input.voice_key}_${input.variables_hash.slice(0, 8)}_${input.segments_fingerprint.slice(0, 8)}.mp3`;

  const { error: upErr } = await supabase.storage
    .from(RENDERED_BUCKET)
    .upload(path, mp3Buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (upErr) {
    console.error('[finalize] upload error:', upErr);
    return { ok: false, error: `Upload lỗi: ${upErr.message}` };
  }

  const { data: urlData } = supabase.storage.from(RENDERED_BUCKET).getPublicUrl(path);

  // Xóa record cũ (cùng user + template + voice + variables nhưng khác fingerprint)
  await supabase
    .from('user_rendered_audio')
    .delete()
    .eq('user_id', user.id)
    .eq('template_id', input.template_id)
    .eq('voice_key', input.voice_key)
    .eq('variables_hash', input.variables_hash);

  // Insert record mới
  const { error: dbErr } = await supabase
    .from('user_rendered_audio')
    .insert({
      user_id: user.id,
      template_id: input.template_id,
      voice_key: input.voice_key,
      variables_hash: input.variables_hash,
      segments_fingerprint: input.segments_fingerprint,
      merged_audio_url: urlData.publicUrl,
      duration_ms: input.duration_ms,
      lines_with_timing: input.global_lines,
      last_accessed_at: new Date().toISOString(),
    });

  if (dbErr) {
    console.error('[finalize] db error:', dbErr);
    return { ok: false, error: `DB lỗi: ${dbErr.message}` };
  }

  return {
    ok: true,
    merged_audio_url: urlData.publicUrl,
  };
}