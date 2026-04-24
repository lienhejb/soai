'use server';

import { createClient } from '@/lib/supabase/server';
import { ttsWithTimestamps, type LineWithTiming } from '@/lib/elevenlabs/tts-with-timestamps';
import { createHash } from 'crypto';

const STATIC_BUCKET = 'audio-static';
const RENDERED_BUCKET = 'audio-rendered';

export interface SegmentToPlay {
  segment_id: string;
  order_index: number;
  audio_url: string;
  duration_ms: number;
  lines: LineWithTiming[];
}

export interface PrepareSoResult {
  ok: boolean;
  error?: string;
  /** Đã có file merged sẵn trong DB */
  cached?: {
    merged_audio_url: string;
    lines_with_timing: Array<LineWithTiming & { segment_id: string }>;
    duration_ms: number;
  };
  /** Chưa có merged — client phải merge từ segments này */
  segments?: SegmentToPlay[];
  /** Metadata để client upload merged file xong gọi finalize */
  finalize?: {
    template_id: string;
    voice_key: string;
    variables_hash: string;
    global_lines: Array<LineWithTiming & { segment_id: string }>;
  };
}

/**
 * Chuẩn bị dữ liệu để render 1 bản sớ
 * - Check cache user_rendered_audio → HIT: trả merged URL
 * - MISS: lấy/gen từng segment → trả array cho client merge
 */
export async function prepareRenderedSo(
  templateSlug: string,
  voiceKey: string,        // 'system:thay-thien'
  voiceProviderId: string  // ElevenLabs voice_id
): Promise<PrepareSoResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  // 1. Fetch template
  const { data: template } = await supabase
    .from('templates')
    .select('id, slug')
    .eq('slug', templateSlug)
    .eq('locale', 'vi')
    .single();
  if (!template) return { ok: false, error: 'Template không tồn tại' };

  // 2. Fetch profile → vars
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, address')
    .eq('id', user.id)
    .single();

  const vars = {
    owner_name: profile?.display_name || 'Tín chủ',
    address: profile?.address || 'Địa chỉ không rõ',
  };
  const variablesHash = hashVariables(vars);

  // 3. Check cache merged
  const { data: cached } = await supabase
    .from('user_rendered_audio')
    .select('merged_audio_url, lines_with_timing, duration_ms')
    .eq('user_id', user.id)
    .eq('template_id', template.id)
    .eq('voice_key', voiceKey)
    .eq('variables_hash', variablesHash)
    .maybeSingle();

  if (cached?.merged_audio_url) {
    // Update last_accessed_at (không chờ)
    supabase
      .from('user_rendered_audio')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('template_id', template.id)
      .eq('voice_key', voiceKey)
      .eq('variables_hash', variablesHash)
      .then(() => {});

    return {
      ok: true,
      cached: {
        merged_audio_url: cached.merged_audio_url,
        lines_with_timing: cached.lines_with_timing as Array<LineWithTiming & { segment_id: string }>,
        duration_ms: cached.duration_ms ?? 0,
      },
    };
  }

  // 4. Fetch segments
  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, order_index, segment_type, text')
    .eq('template_id', template.id)
    .order('order_index');

  if (!segments || segments.length === 0) {
    return { ok: false, error: 'Template chưa có segments' };
  }

  // 5. Process từng segment
  const segmentsToPlay: SegmentToPlay[] = [];
  const globalLines: Array<LineWithTiming & { segment_id: string }> = [];
  let cumulativeOffsetMs = 0;

  for (const seg of segments) {
    let audioUrl: string;
    let lines: LineWithTiming[];
    let durationMs: number;

    if (seg.segment_type === 'static') {
      const staticData = await getOrGenerateStaticAudio(
        supabase,
        seg.id,
        seg.text,
        voiceKey,
        voiceProviderId
      );
      if (!staticData.ok) return { ok: false, error: staticData.error };
      audioUrl = staticData.audio_url!;
      lines = staticData.lines!;
      durationMs = staticData.duration_ms!;
    } else {
      // Dynamic — render text với vars + gen mới
      const renderedText = renderTemplate(seg.text, vars);
      try {
        const gen = await ttsWithTimestamps(renderedText, voiceProviderId);
        const path = `${user.id}/dyn_${seg.id}_${voiceKey}_${variablesHash.slice(0, 8)}.mp3`;
        const { error: upErr } = await supabase.storage
          .from(RENDERED_BUCKET)
          .upload(path, gen.audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });
        if (upErr) return { ok: false, error: `Upload dynamic: ${upErr.message}` };

        const { data: urlData } = supabase.storage.from(RENDERED_BUCKET).getPublicUrl(path);
        audioUrl = urlData.publicUrl;
        lines = gen.lines;
        durationMs = gen.durationMs;
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Gen dynamic lỗi' };
      }
    }

    segmentsToPlay.push({
      segment_id: seg.id,
      order_index: seg.order_index,
      audio_url: audioUrl,
      duration_ms: durationMs,
      lines,
    });

    // Offset global lines
    for (const line of lines) {
      globalLines.push({
        ...line,
        start_ms: line.start_ms + cumulativeOffsetMs,
        end_ms: line.end_ms + cumulativeOffsetMs,
        segment_id: seg.id,
      });
    }
    cumulativeOffsetMs += durationMs;
  }

  return {
    ok: true,
    segments: segmentsToPlay,
    finalize: {
      template_id: template.id,
      voice_key: voiceKey,
      variables_hash: variablesHash,
      global_lines: globalLines,
    },
  };
}

// ============ HELPERS ============

async function getOrGenerateStaticAudio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  segmentId: string,
  text: string,
  voiceKey: string,
  voiceProviderId: string
): Promise<{ ok: boolean; error?: string; audio_url?: string; lines?: LineWithTiming[]; duration_ms?: number }> {
  const { data: cached } = await supabase
    .from('static_audio')
    .select('audio_url, duration_ms, lines_with_timing')
    .eq('segment_id', segmentId)
    .eq('voice_key', voiceKey)
    .maybeSingle();

  if (cached) {
    return {
      ok: true,
      audio_url: cached.audio_url,
      duration_ms: cached.duration_ms ?? 0,
      lines: cached.lines_with_timing as LineWithTiming[],
    };
  }

  // Gen on-demand
  try {
    const gen = await ttsWithTimestamps(text, voiceProviderId);
    const path = `${segmentId}/${voiceKey}.mp3`;
    const { error: upErr } = await supabase.storage
      .from(STATIC_BUCKET)
      .upload(path, gen.audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });
    if (upErr) return { ok: false, error: `Upload static: ${upErr.message}` };

    const { data: urlData } = supabase.storage.from(STATIC_BUCKET).getPublicUrl(path);

    await supabase.from('static_audio').insert({
      segment_id: segmentId,
      voice_key: voiceKey,
      audio_url: urlData.publicUrl,
      duration_ms: gen.durationMs,
      lines_with_timing: gen.lines,
    });

    return {
      ok: true,
      audio_url: urlData.publicUrl,
      duration_ms: gen.durationMs,
      lines: gen.lines,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Gen static lỗi' };
  }
}

function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

function hashVariables(vars: Record<string, string>): string {
  const sorted = Object.keys(vars).sort().map((k) => `${k}=${vars[k]}`).join('|');
  return createHash('sha256').update(sorted).digest('hex');
}