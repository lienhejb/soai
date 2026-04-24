'use server';

import { createClient } from '@/lib/supabase/server';
import { ttsWithTimestamps, type LineWithTiming } from '@/lib/elevenlabs/tts-with-timestamps';
import { createHash } from 'crypto';

const STATIC_BUCKET = 'audio-static';

export interface RenderedSoResult {
  ok: boolean;
  error?: string;
  audioUrl?: string;
  durationMs?: number;
  lines?: Array<LineWithTiming & { segment_id: string }>;
}

/**
 * Render sớ hoàn chỉnh cho 1 user + 1 template + 1 voice
 * - Static segments: dùng lại từ DB nếu có, gen mới nếu chưa
 * - Dynamic segments: gen mới với profile user, cache theo variables_hash
 * - Client sẽ tự ghép audio từ danh sách URL trả về
 */
export async function renderSoForUser(
  templateSlug: string,
  voiceKey: string,
  voiceProviderId: string
): Promise<{ ok: boolean; error?: string; segments?: Array<{ segment_id: string; audio_url: string; lines: LineWithTiming[] }> }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  // 1. Fetch template + segments
  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('slug', templateSlug)
    .eq('locale', 'vi')
    .single();

  if (!template) return { ok: false, error: 'Template không tồn tại' };

  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, order_index, segment_type, text, required_variables')
    .eq('template_id', template.id)
    .order('order_index');

  if (!segments || segments.length === 0) {
    return { ok: false, error: 'Template chưa có nội dung' };
  }

  // 2. Fetch profile để render dynamic vars
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, address')
    .eq('id', user.id)
    .single();

  const vars = {
    owner_name: profile?.display_name || 'Tín chủ',
    address: profile?.address || 'không rõ',
  };

  // 3. Process từng segment
  const result: Array<{ segment_id: string; audio_url: string; lines: LineWithTiming[] }> = [];

  for (const seg of segments) {
    if (seg.segment_type === 'static') {
      const staticResult = await getOrGenerateStaticAudio(
        supabase,
        seg.id,
        seg.text,
        voiceKey,
        voiceProviderId
      );
      if (!staticResult.ok) return { ok: false, error: staticResult.error };
      result.push({
        segment_id: seg.id,
        audio_url: staticResult.audioUrl!,
        lines: staticResult.lines!,
      });
    } else {
      // Dynamic — render text với vars
      const renderedText = renderTemplate(seg.text, vars);
      const dynamicResult = await getOrGenerateDynamicAudio(
        supabase,
        user.id,
        seg.id,
        renderedText,
        vars,
        voiceKey,
        voiceProviderId
      );
      if (!dynamicResult.ok) return { ok: false, error: dynamicResult.error };
      result.push({
        segment_id: seg.id,
        audio_url: dynamicResult.audioUrl!,
        lines: dynamicResult.lines!,
      });
    }
  }

  return { ok: true, segments: result };
}

// ============ HELPERS ============

async function getOrGenerateStaticAudio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  segmentId: string,
  text: string,
  voiceKey: string,
  voiceProviderId: string
): Promise<{ ok: boolean; error?: string; audioUrl?: string; lines?: LineWithTiming[] }> {
  // Check cache
  const { data: cached } = await supabase
    .from('static_audio')
    .select('audio_url, lines_with_timing')
    .eq('segment_id', segmentId)
    .eq('voice_key', voiceKey)
    .maybeSingle();

  if (cached) {
    return {
      ok: true,
      audioUrl: cached.audio_url,
      lines: cached.lines_with_timing as LineWithTiming[],
    };
  }

  // Gen mới
  try {
    const { audioBuffer, lines, durationMs } = await ttsWithTimestamps(text, voiceProviderId);

    const path = `${segmentId}/${voiceKey}.mp3`;
    const { error: uploadErr } = await supabase.storage
      .from(STATIC_BUCKET)
      .upload(path, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadErr) return { ok: false, error: `Upload lỗi: ${uploadErr.message}` };

    const { data: urlData } = supabase.storage.from(STATIC_BUCKET).getPublicUrl(path);

    // Insert DB
    await supabase.from('static_audio').insert({
      segment_id: segmentId,
      voice_key: voiceKey,
      audio_url: urlData.publicUrl,
      duration_ms: durationMs,
      lines_with_timing: lines,
    });

    return { ok: true, audioUrl: urlData.publicUrl, lines };
  } catch (e) {
    console.error('[static_gen]', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Gen static lỗi' };
  }
}

async function getOrGenerateDynamicAudio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  segmentId: string,
  renderedText: string,
  vars: Record<string, string>,
  voiceKey: string,
  voiceProviderId: string
): Promise<{ ok: boolean; error?: string; audioUrl?: string; lines?: LineWithTiming[] }> {
  const variablesHash = hashVariables(vars);

  // Không cache dynamic per-segment (cache ở user_rendered_audio level sau)
  // Phase này gen mới mỗi lần dynamic thay đổi
  try {
    const { audioBuffer, lines, durationMs } = await ttsWithTimestamps(
      renderedText,
      voiceProviderId
    );

    // Upload dynamic vào audio-rendered (tạm path)
    const path = `${userId}/dynamic_${segmentId}_${voiceKey}_${variablesHash.slice(0, 8)}.mp3`;
    const { error: uploadErr } = await supabase.storage
      .from('audio-rendered')
      .upload(path, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadErr) return { ok: false, error: `Upload dynamic lỗi: ${uploadErr.message}` };

    const { data: urlData } = supabase.storage.from('audio-rendered').getPublicUrl(path);

    return { ok: true, audioUrl: urlData.publicUrl, lines };
  } catch (e) {
    console.error('[dynamic_gen]', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Gen dynamic lỗi' };
  }
}

function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

function hashVariables(vars: Record<string, string>): string {
  const sorted = Object.keys(vars).sort().map((k) => `${k}=${vars[k]}`).join('|');
  return createHash('sha256').update(sorted).digest('hex');
}