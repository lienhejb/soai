import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HanhLeClient, type RenderedSoData } from './_components/HanhLeClient';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function HanhLePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/vi/auth/login');

  // Fetch template theo slug
  const { data: template } = await supabase
    .from('templates')
    .select('id, title')
    .eq('slug', slug)
    .eq('locale', 'vi')
    .single();

  if (!template) redirect('/vi/so');

  // Lấy rendered audio MỚI NHẤT của user + template (bất kể voice/variables_hash)
  const { data: rendered } = await supabase
    .from('user_rendered_audio')
    .select('merged_audio_url, lines_with_timing, duration_ms, voice_key')
    .eq('user_id', user.id)
    .eq('template_id', template.id)
    .order('last_accessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Chưa render → về trang sớ
  if (!rendered?.merged_audio_url) {
    redirect(`/vi/so/${slug}`);
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