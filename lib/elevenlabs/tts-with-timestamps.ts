const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

export interface TtsWithTimestampsResult {
  audioBuffer: Buffer;
  lines: LineWithTiming[];
  durationMs: number;
}

export interface LineWithTiming {
  line_id: string;
  text: string;
  start_ms: number;
  end_ms: number;
}

/**
 * Gọi ElevenLabs TTS với character-level timestamps
 * Trả về audio + lines đã tính timing từ alignment
 */
export async function ttsWithTimestamps(
  text: string,
  voiceId: string
): Promise<TtsWithTimestampsResult> {
  const r = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        language_code: 'vi',
        output_format: 'mp3_44100_128',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`ElevenLabs timestamps failed: ${err.slice(0, 200)}`);
  }

  const data = (await r.json()) as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };

  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const lines = buildLinesFromAlignment(text, data.alignment);
  const durationMs =
    lines.length > 0 ? lines[lines.length - 1].end_ms : 0;

  return { audioBuffer, lines, durationMs };
}

/**
 * Tách text thành lines theo dấu câu, gán timing từ character alignment
 */
function buildLinesFromAlignment(
  text: string,
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  }
): LineWithTiming[] {
  const lines: LineWithTiming[] = [];
  const sentenceEnders = /[.!?]/;
  let currentLineText = '';
  let currentLineStartIdx = 0;
  let lineCounter = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    currentLineText += ch;

    const isEnder = sentenceEnders.test(ch);
    const isLastChar = i === alignment.characters.length - 1;

    if (isEnder || isLastChar) {
      const trimmed = currentLineText.trim();
      if (trimmed.length > 0) {
        lineCounter++;
        lines.push({
          line_id: `l${lineCounter}`,
          text: trimmed,
          start_ms: Math.round(
            alignment.character_start_times_seconds[currentLineStartIdx] * 1000
          ),
          end_ms: Math.round(
            alignment.character_end_times_seconds[i] * 1000
          ),
        });
      }
      currentLineText = '';
      currentLineStartIdx = i + 1;
    }
  }

  return lines;
}