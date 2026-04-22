import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — multilingual

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const voiceId = request.nextUrl.searchParams.get('voice_id') || DEFAULT_VOICE_ID;

  if (!slug) return new Response('Missing slug', { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Fetch template + profile
  const [tmplRes, profileRes] = await Promise.all([
    supabase.from('templates').select('content').eq('slug', slug).eq('locale', 'vi').single(),
    supabase.from('profiles').select('display_name, address').eq('id', user.id).single(),
  ]);

  if (!tmplRes.data) return new Response('Template not found', { status: 404 });

  const text = renderTemplate(tmplRes.data.content, {
    owner_name: profileRes.data?.display_name || 'Tín chủ',
    address: profileRes.data?.address || 'Địa chỉ không xác định',
  });

  // Gọi ElevenLabs streaming
  const r = await fetch(`${ELEVENLABS_API}/${voiceId}/stream?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!r.ok || !r.body) {
    const err = await r.text();
    console.error('[tts] ElevenLabs error:', err);
    return new Response('TTS failed', { status: 500 });
  }

  return new Response(r.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}

function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}