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

/**
 * Pre-gen CHỈ những static segment chưa có audio cho voice này.
 * KHÔNG xóa audio cũ. Tiết kiệm credit khi voice ở status "thiếu một phần".
 */
export async function pregenMissingSegments(
  templateSlug: string,
  voiceKey: string,
  voiceProviderId: string
): Promise<PregenResult> {
  const supabase = await createClient();

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

  const { data: template } = await supabase
    .from('templates')
    .select('id, slug')
    .eq('slug', templateSlug)
    .eq('locale', 'vi')
    .single();

  if (!template) return { ok: false, error: 'Template không tồn tại' };

  // Fetch tất cả static segments
  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, order_index, text, text_hash')
    .eq('template_id', template.id)
    .eq('segment_type', 'static')
    .order('order_index');

  if (!segments || segments.length === 0) {
    return { ok: false, error: 'Template không có static segments' };
  }

  // Fetch audio đã có cho voice này
  const segmentIds = segments.map((s) => s.id);
  const { data: existingAudios } = await supabase
    .from('static_audio')
    .select('segment_id, text_hash')
    .eq('voice_key', voiceKey)
    .in('segment_id', segmentIds);

  const existingMap = new Map(
    (existingAudios ?? []).map((a) => [a.segment_id, a.text_hash])
  );

  // Lọc ra segments thiếu (chưa có audio HOẶC text_hash khác = stale)
  const missingSegments = segments.filter((seg) => {
    const existingHash = existingMap.get(seg.id);
    return !existingHash || existingHash !== seg.text_hash;
  });

  const stats = {
    segment_count: segments.length,
    generated: 0,
    skipped: segments.length - missingSegments.length,
    errors: [] as string[],
  };

  if (missingSegments.length === 0) {
    return { ok: true, stats };
  }

  // Gen từng segment thiếu
  for (const seg of missingSegments) {
    try {
      // Xóa record cũ (nếu có hash khác)
      await supabase
        .from('static_audio')
        .delete()
        .eq('segment_id', seg.id)
        .eq('voice_key', voiceKey);

      // Storage path: ghi đè cùng path cũ (nếu có)
      const path = `${seg.id}/${voiceKey}.mp3`;

      const { audioBuffer, lines, durationMs } = await ttsWithTimestamps(
        seg.text,
        voiceProviderId
      );

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

      const { error: insertErr } = await supabase.from('static_audio').insert({
        segment_id: seg.id,
        voice_key: voiceKey,
        text_hash: seg.text_hash,
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
 * Wrapper: gen audio cho NHIỀU voice 1 lần.
 * - forceRegen=false: dùng pregenMissingSegments (chỉ gen thiếu)
 * - forceRegen=true: dùng pregenStaticAudioForTemplate (xóa hết, gen lại all)
 */
export interface VoiceTarget {
  voice_key: string;
  voice_provider_id: string;
}

export async function pregenForVoices(
  templateSlug: string,
  voiceTargets: VoiceTarget[],
  forceRegen: boolean
): Promise<{
  ok: boolean;
  error?: string;
  results?: Array<{ voice_key: string; stats?: PregenResult['stats']; error?: string }>;
}> {
  if (voiceTargets.length === 0) {
    return { ok: false, error: 'Chưa chọn voice nào' };
  }

  const results: Array<{ voice_key: string; stats?: PregenResult['stats']; error?: string }> = [];

  for (const target of voiceTargets) {
    const fn = forceRegen ? pregenStaticAudioForTemplate : pregenMissingSegments;
    const res = await fn(templateSlug, target.voice_key, target.voice_provider_id);

    results.push({
      voice_key: target.voice_key,
      stats: res.stats,
      error: res.ok ? undefined : res.error,
    });
  }

  return { ok: true, results };
}