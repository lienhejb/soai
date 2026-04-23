'use server';

import { createClient } from '@/lib/supabase/server';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Clone voice từ audio blob, lưu voice_id vào DB
 * Trả về voice_profile_id mới tạo
 */
export async function cloneVoice(
  audioBase64: string,
  displayName: string
): Promise<{ ok: boolean; voiceProfileId?: string; providerVoiceId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };

  // Decode base64 → Buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');

  // Build multipart form gửi ElevenLabs
  const form = new FormData();
  form.append('name', `soai_${user.id.slice(0, 8)}_${Date.now()}`);
  form.append('description', `Giọng ${displayName} - SoAI user ${user.id}`);
  form.append('files', new Blob([audioBuffer], { type: 'audio/wav' }), 'sample.wav');

  const r = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: form,
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('[clone] ElevenLabs error:', err);
    return { ok: false, error: `Clone thất bại: ${err.slice(0, 200)}` };
  }

  const { voice_id } = await r.json();

  // Lưu vào DB
  const { data: inserted, error: dbErr } = await supabase
    .from('voice_profiles')
    .insert({
      user_id: user.id,
      person_id: null, // NULL = giọng của user
      display_name: displayName,
      audio_sample_url: '', // tạm rỗng — không lưu sample lên Storage ở phase test
      provider: 'elevenlabs',
      provider_voice_id: voice_id,
      status: 'ready',
      locale: 'vi',
    })
    .select('id')
    .single();

  if (dbErr || !inserted) {
    console.error('[clone] DB error:', dbErr);
    return { ok: false, error: 'Lỗi lưu DB' };
  }

  return { ok: true, voiceProfileId: inserted.id, providerVoiceId: voice_id };
}

/**
 * TTS bằng voice đã clone, trả về audio base64
 */
export async function ttsWithClonedVoice(
  providerVoiceId: string,
  text: string
): Promise<{ ok: boolean; audioBase64?: string; error?: string }> {
  const r = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${providerVoiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_v3',
        language_code: 'vi',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!r.ok) {
    const err = await r.text();
    return { ok: false, error: err.slice(0, 200) };
  }

  const buf = Buffer.from(await r.arrayBuffer());
  return { ok: true, audioBase64: buf.toString('base64') };
}