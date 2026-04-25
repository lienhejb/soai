import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { prepareRenderedSo } from '@/lib/voice-clone/prepare-so';
import { HanhLeClient, type RenderedSoData } from './_components/HanhLeClient';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ voice?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function HanhLePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { voice } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/vi/auth/login');

  const { data: template } = await supabase
    .from('templates')
    .select('id, title')
    .eq('slug', slug)
    .eq('locale', 'vi')
    .single();

  if (!template) redirect('/vi/so');

  // Resolve voice: ưu tiên ?voice= từ query, fallback theo gender
  let voiceMeta: {
    voice_key: string;
    provider_voice_id: string | null;
    display_name: string;
    description: string | null;
    gender: 'male' | 'female';
  } | null = null;

  if (voice) {
    const { data: vRow } = await supabase
      .from('system_voices')
      .select('voice_key, provider_voice_id, display_name, description, gender')
      .eq('voice_key', voice)
      .eq('is_active', true)
      .maybeSingle();
    if (vRow?.provider_voice_id) {
      voiceMeta = vRow as typeof voiceMeta;
    }
  }

  if (!voiceMeta) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', user.id)
      .single();

    const { data: voices } = await supabase
      .from('system_voices')
      .select('voice_key, provider_voice_id, display_name, description, gender')
      .eq('is_active', true)
      .order('sort_order');

    const fallback = voices?.find((v) =>
      v.gender === (profile?.gender === 'female' ? 'female' : 'male')
    ) ?? voices?.[0];

    if (!fallback?.provider_voice_id) redirect(`/vi/so/${slug}`);
    voiceMeta = fallback as typeof voiceMeta;
  }

  // Gọi prepareRenderedSo
  const res = await prepareRenderedSo(slug, voiceMeta!.voice_key, voiceMeta!.provider_voice_id!);

  if (!res.ok) {
    console.error('[hanh-le] prepare error:', res.error);
    redirect(`/vi/so/${slug}?error=prepare`);
  }

  // Build segments[] cho client
  let segments: RenderedSoData['segments'];
  let totalDurationMs: number;
  let allLines: RenderedSoData['lines'];

  if (res.cached) {
    segments = [{
      audio_url: res.cached.merged_audio_url,
      duration_ms: res.cached.duration_ms,
    }];
    totalDurationMs = res.cached.duration_ms;
    allLines = (res.cached.lines_with_timing ?? []).map((l) => ({
      line_id: l.line_id,
      text: l.text,
      start_ms: l.start_ms,
      end_ms: l.end_ms,
      segment_id: (l as { segment_id?: string }).segment_id,
    }));
  } else if (res.segments && res.finalize) {
    segments = res.segments
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => ({
        audio_url: s.audio_url,
        duration_ms: s.duration_ms,
      }));
    totalDurationMs = res.finalize.total_duration_ms;
    allLines = res.finalize.global_lines.map((l) => ({
      line_id: l.line_id,
      text: l.text,
      start_ms: l.start_ms,
      end_ms: l.end_ms,
      segment_id: l.segment_id,
    }));
  } else {
    redirect(`/vi/so/${slug}`);
  }

  // Build role hiển thị từ description + gender
  const genderLabel = voiceMeta!.gender === 'female' ? 'Nữ' : 'Nam';
  const role = voiceMeta!.description
    ? `Giọng ${genderLabel} — ${voiceMeta!.description}`
    : `Giọng ${genderLabel}`;

  const data: RenderedSoData = {
    title: template.title,
    segments,
    durationMs: totalDurationMs,
    voiceKey: voiceMeta!.voice_key,
    priest: {
      name: voiceMeta!.display_name,
      role,
      imageUrl: null, // DB chưa có avatar_url; sau này thêm xong wire vào đây
    },
    lines: allLines,
  };

  return <HanhLeClient data={data} />;
}