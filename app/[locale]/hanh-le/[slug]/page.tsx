import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createHash } from 'crypto';
import { HanhLeClient, type RenderedSoData } from './_components/HanhLeClient';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function HanhLePage({ params }: PageProps) {
  const { slug } = await params;
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

  // Fetch segments để tính fingerprint hiện tại
  const { data: segments } = await supabase
    .from('template_segments')
    .select('id, order_index, text')
    .eq('template_id', template.id)
    .order('order_index');

  if (!segments || segments.length === 0) {
    redirect(`/vi/so/${slug}`);
  }

  // Fetch profile để tính variables_hash
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, address')
    .eq('id', user.id)
    .single();

  const vars = {
    owner_name: profile?.display_name || 'Tín chủ',
    address: profile?.address || 'Địa chỉ không rõ',
  };
  const variablesHash = hashText(
    Object.keys(vars).sort().map((k) => `${k}=${vars[k as keyof typeof vars]}`).join('|')
  );

  // Lấy record mới nhất MỌI voice của user + template + variables
  const { data: rendered } = await supabase
    .from('user_rendered_audio')
    .select('merged_audio_url, lines_with_timing, duration_ms, voice_key, segments_fingerprint')
    .eq('user_id', user.id)
    .eq('template_id', template.id)
    .eq('variables_hash', variablesHash)
    .order('last_accessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rendered?.merged_audio_url) {
    redirect(`/vi/so/${slug}`);
  }

  // Validate fingerprint với voice_key record
  const segmentHashes = segments.map((s) => hashText(s.text));
  const expectedFingerprint = hashText(
    [rendered.voice_key, variablesHash, ...segmentHashes].join('|')
  );

  // Fingerprint mismatch → template đã đổi → redirect về trang sớ để render lại
  if (rendered.segments_fingerprint !== expectedFingerprint) {
    redirect(`/vi/so/${slug}?stale=1`);
  }

  const data: RenderedSoData = {
    title: template.title,
    audioUrl: rendered.merged_audio_url,
    durationMs: rendered.duration_ms ?? 0,
    voiceKey: rendered.voice_key,
    lines: (rendered.lines_with_timing ?? []) as Array<{
      line_id: string;
      text: string;
      start_ms: number;
      end_ms: number;
      segment_id?: string;
    }>,
  };

  return <HanhLeClient data={data} />;
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}