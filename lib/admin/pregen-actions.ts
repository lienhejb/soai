'use server';

import { createClient } from '@/lib/supabase/server';
import { ttsWithTimestamps } from '@/lib/elevenlabs/tts-with-timestamps';

const STATIC_BUCKET = 'audio-static';

export interface PregenResult {
  ok: boolean;
  error?: string;
  stats?: {
    segment_count: number;
    generated: number;
    skipped: number;
    errors: string[];
  };
}

/**
 * Pre-gen TOÀN BỘ static segments của 1 template với 1 voice
 * - Force: xóa audio cũ nếu có, gen lại
 */
export async function pregenStaticAudioForTemplate(
  templateSlug: string,
  voiceKey: string,        // 'system:thay-thien'
  voiceProviderId: string  // ElevenLabs voice_id
): Promise<PregenResult> {
  const supabase = await createClient();

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Không có quyền admin' };
  }

  // Fetch template + static segments
  const { data: template } = await supabase
    .from('templates')
    .select('id, slug')
    .eq('slug', templateSlug)
    .eq('locale', 'vi')
    .single();

  if (!template) return { ok: false, error: 'Template không tồn tại' };

  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, order_index, text')
    .eq('template_id', template.id)
    .eq('segment_type', 'static')
    .order('order_index');

  if (!segments || segments.length === 0) {
    return { ok: false, error: 'Template không có static segments' };
  }

  const stats = {
    segment_count: segments.length,
    generated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Process từng segment
  for (const seg of segments) {
    try {
      // 1. Delete record cũ trong DB
      await supabase
        .from('static_audio')
        .delete()
        .eq('segment_id', seg.id)
        .eq('voice_key', voiceKey);

      // 2. Delete file cũ trong Storage (nếu có)
      const path = `${seg.id}/${voiceKey}.mp3`;
      await supabase.storage.from(STATIC_BUCKET).remove([path]);

      // 3. Gen audio mới với timestamps
      const { audioBuffer, lines, durationMs } = await ttsWithTimestamps(
        seg.text,
        voiceProviderId
      );

      // 4. Upload Storage
      const { error: uploadErr } = await supabase.storage
        .from(STATIC_BUCKET)
        .upload(path, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadErr) {
        stats.errors.push(`Segment ${seg.order_index}: upload lỗi - ${uploadErr.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(STATIC_BUCKET)
        .getPublicUrl(path);

      // 5. Insert DB
      const { error: insertErr } = await supabase.from('static_audio').insert({
        segment_id: seg.id,
        voice_key: voiceKey,
        audio_url: urlData.publicUrl,
        duration_ms: durationMs,
        lines_with_timing: lines,
      });

      if (insertErr) {
        stats.errors.push(`Segment ${seg.order_index}: DB insert - ${insertErr.message}`);
        continue;
      }

      stats.generated++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      stats.errors.push(`Segment ${seg.order_index}: ${msg}`);
    }
  }

  return { ok: true, stats };
}

/**
 * Helper: Query xem template đã có static_audio với voice nào chưa
 * (để hiển thị status trong admin UI)
 */
export async function getStaticAudioStatus(
  templateId: string
): Promise<Array<{ voice_key: string; segment_count: number }>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('static_audio')
    .select('voice_key, segment_id, template_segments!inner(template_id)')
    .eq('template_segments.template_id', templateId);

  if (!data) return [];

  // Gom nhóm theo voice_key
  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.voice_key, (counts.get(row.voice_key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([voice_key, segment_count]) => ({
    voice_key,
    segment_count,
  }));
}