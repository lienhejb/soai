'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ttsWithTimestamps, type LineWithTiming } from '@/lib/elevenlabs/tts-with-timestamps';
import { createHash } from 'crypto';
import { getDateStringsForSo } from '@/lib/lunar';
import { GUEST_USER_ID, GUEST_PROFILE } from '@/lib/guest';

const STATIC_BUCKET = 'audio-static';
const RENDERED_BUCKET = 'audio-rendered';
const EXTRA_PAUSE_MS = 500; // Silence extra quanh dynamic segment (chỉ Thầy Thiện)

export interface SegmentToPlay {
  segment_id: string;
  order_index: number;
  segment_type: 'static' | 'dynamic';
  audio_url: string;
  duration_ms: number;
  lines: LineWithTiming[];
}

export interface PrepareSoResult {
  ok: boolean;
  error?: string;
  cached?: {
    merged_audio_url: string;
    lines_with_timing: Array<LineWithTiming & { segment_id: string }>;
    duration_ms: number;
  };
  segments?: SegmentToPlay[];
  finalize?: {
    template_id: string;
    voice_key: string;
    variables_hash: string;
    segments_fingerprint: string;
    global_lines: Array<LineWithTiming & { segment_id: string }>;
    total_duration_ms: number;
  };
}

export async function prepareRenderedSo(
  templateSlug: string,
  voiceKey: string,
  voiceProviderId: string
): Promise<PrepareSoResult> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guest mode: user chưa login → dùng system guest user (cố định)
  // Mọi guest share chung 1 user_id → cache cross-guest, tiết kiệm credit
  const userId = user?.id ?? GUEST_USER_ID;
  const isGuest = !user;

  const { data: template } = await supabase
    .from('templates')
    .select('id, slug')
    .eq('slug', templateSlug)
    .eq('locale', 'vi')
    .single();
  if (!template) return { ok: false, error: 'Template không tồn tại' };

  // Guest: lấy thẳng từ GUEST_PROFILE (không cần query DB)
  // User: query profile thật
  let displayName: string;
  let address: string;
  if (isGuest) {
    displayName = GUEST_PROFILE.display_name;
    address = GUEST_PROFILE.address;
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, address')
      .eq('id', userId)
      .single();
    displayName = profile?.display_name || '';
    address = profile?.address || 'Địa chỉ không rõ';
  }

  const familySurname = displayName.trim().split(/\s+/)[0] || 'Tín chủ';

  const vars = {
    owner_name: displayName || 'Tín chủ',
    family_surname: familySurname,
    address,
    ...getDateStringsForSo(),
  };
  
  const variablesHash = hashVariables(vars);

  // Fetch segments TRƯỚC để tính fingerprint
  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, order_index, segment_type, text')
    .eq('template_id', template.id)
    .order('order_index');

  if (!segments || segments.length === 0) {
    return { ok: false, error: 'Template chưa có segments' };
  }

  // Tính segments_fingerprint: hash(voice_key + variables_hash + mỗi segment text_hash theo thứ tự)
  const segmentHashes = segments.map((s) => hashText(s.text));
  const segmentsFingerprint = hashText(
    [voiceKey, variablesHash, ...segmentHashes].join('|')
  );

  // Check cache merged với fingerprint mới
  const { data: cached } = await supabase
    .from('user_rendered_audio')
    .select('merged_audio_url, lines_with_timing, duration_ms')
    .eq('user_id', user.id)
    .eq('template_id', template.id)
    .eq('voice_key', voiceKey)
    .eq('variables_hash', variablesHash)
    .eq('segments_fingerprint', segmentsFingerprint)
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
      .eq('segments_fingerprint', segmentsFingerprint)
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

  // Cache MISS — process từng segment
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
        admin,
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
      const renderedText = renderTemplate(seg.text, vars);
      const renderedTextHash = hashText(renderedText);

      // Check dynamic_audio cache trước khi gen
      const { data: cachedDyn } = await supabase
        .from('dynamic_audio')
        .select('audio_url, duration_ms, lines_with_timing')
        .eq('user_id', user.id)
        .eq('segment_id', seg.id)
        .eq('voice_key', voiceKey)
        .eq('variables_hash', variablesHash)
        .eq('text_hash', renderedTextHash)
        .maybeSingle();

      if (cachedDyn) {
        // Cache HIT — reuse, không tốn credit
        audioUrl = cachedDyn.audio_url;
        lines = cachedDyn.lines_with_timing as LineWithTiming[];
        durationMs = cachedDyn.duration_ms;

        // Update last_accessed_at (không await)
        supabase
          .from('dynamic_audio')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('segment_id', seg.id)
          .eq('voice_key', voiceKey)
          .eq('variables_hash', variablesHash)
          .eq('text_hash', renderedTextHash)
          .then(() => {});
      } else {
        // Cache MISS — gen mới
        try {
          const gen = await ttsWithTimestamps(renderedText, voiceProviderId);
          const path = `${user.id}/dyn_${seg.id}_${voiceKey}_${variablesHash.slice(0, 8)}.mp3`;

          const { error: upErr } = await admin.storage
            .from(RENDERED_BUCKET)
            .upload(path, gen.audioBuffer, {
              contentType: 'audio/mpeg',
              upsert: true,
            });
          if (upErr) return { ok: false, error: `Upload dynamic: ${upErr.message}` };

          const { data: urlData } = admin.storage.from(RENDERED_BUCKET).getPublicUrl(path);
          audioUrl = urlData.publicUrl;
          lines = gen.lines;
          durationMs = gen.durationMs;

          // Insert vào dynamic_audio cache (xóa record cũ cùng key trước nếu có)
          await supabase
            .from('dynamic_audio')
            .delete()
            .eq('user_id', user.id)
            .eq('segment_id', seg.id)
            .eq('voice_key', voiceKey)
            .eq('variables_hash', variablesHash);

          await supabase.from('dynamic_audio').insert({
            user_id: user.id,
            segment_id: seg.id,
            voice_key: voiceKey,
            variables_hash: variablesHash,
            text_hash: renderedTextHash,
            audio_url: audioUrl,
            duration_ms: durationMs,
            lines_with_timing: lines,
          });
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Gen dynamic lỗi' };
        }
      }
    }

    segmentsToPlay.push({
      segment_id: seg.id,
      order_index: seg.order_index,
      segment_type: seg.segment_type as 'static' | 'dynamic',
      audio_url: audioUrl,
      duration_ms: durationMs,
      lines,
    });

    const segIndex = segments.indexOf(seg);
    const isFirstSeg = segIndex === 0;
    const isLastSeg = segIndex === segments.length - 1;
    const isDynamicForThien =
      voiceKey === 'thay-thich-thien' && seg.segment_type === 'dynamic';

    // Silence TRƯỚC segment dynamic (không phải segment đầu)
    if (isDynamicForThien && !isFirstSeg) {
      cumulativeOffsetMs += EXTRA_PAUSE_MS;
    }

    for (const line of lines) {
      globalLines.push({
        ...line,
        start_ms: line.start_ms + cumulativeOffsetMs,
        end_ms: line.end_ms + cumulativeOffsetMs,
        segment_id: seg.id,
      });
    }
    cumulativeOffsetMs += durationMs;

    // Silence SAU segment dynamic (không phải segment cuối)
    if (isDynamicForThien && !isLastSeg) {
      cumulativeOffsetMs += EXTRA_PAUSE_MS;
    }
  }

  return {
    ok: true,
    segments: segmentsToPlay,
    finalize: {
      template_id: template.id,
      voice_key: voiceKey,
      variables_hash: variablesHash,
      segments_fingerprint: segmentsFingerprint,
      global_lines: globalLines,
      total_duration_ms: cumulativeOffsetMs,
    },
  };
}

// ============ HELPERS ============

async function getOrGenerateStaticAudio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  admin: ReturnType<typeof createAdminClient>,
  segmentId: string,
  text: string,
  voiceKey: string,
  voiceProviderId: string
): Promise<{ ok: boolean; error?: string; audio_url?: string; lines?: LineWithTiming[]; duration_ms?: number }> {
  const textHash = hashText(text);

  // Check cache WITH text_hash
  const { data: cached } = await supabase
    .from('static_audio')
    .select('audio_url, duration_ms, lines_with_timing')
    .eq('segment_id', segmentId)
    .eq('voice_key', voiceKey)
    .eq('text_hash', textHash)
    .maybeSingle();

  if (cached) {
    return {
      ok: true,
      audio_url: cached.audio_url,
      duration_ms: cached.duration_ms ?? 0,
      lines: cached.lines_with_timing as LineWithTiming[],
    };
  }

  // Cache MISS — gen mới (và xóa record cũ nếu có hash khác)
  try {
    const gen = await ttsWithTimestamps(text, voiceProviderId);
    const path = `${segmentId}/${voiceKey}.mp3`;

    // Xóa record cũ (hash khác) — keep storage file cũ để không mất ngay, sẽ cleanup cron sau
    await supabase
      .from('static_audio')
      .delete()
      .eq('segment_id', segmentId)
      .eq('voice_key', voiceKey);

    const { error: upErr } = await admin.storage
  .from(STATIC_BUCKET)
  .upload(path, gen.audioBuffer, {
    contentType: 'audio/mpeg',
    upsert: true,
  });
if (upErr) return { ok: false, error: `Upload static: ${upErr.message}` };

const { data: urlData } = admin.storage.from(STATIC_BUCKET).getPublicUrl(path);

    await supabase.from('static_audio').insert({
      segment_id: segmentId,
      voice_key: voiceKey,
      text_hash: textHash,
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
  return hashText(sorted);
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}