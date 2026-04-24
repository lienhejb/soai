const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const BITRATE_KBPS = 128; // khớp với output_format=mp3_44100_128

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
 * Gọi ElevenLabs TTS model eleven_v3 (giọng chuẩn nhất cho tiếng Việt).
 * Endpoint /with-timestamps silent-fallback multilingual_v2 nên không dùng được.
 * Thay vào đó: gen audio v3 thuần + synthesize timestamps theo tỉ lệ ký tự.
 */
export async function ttsWithTimestamps(
  text: string,
  voiceId: string
): Promise<TtsWithTimestampsResult> {
  const r = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
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
    throw new Error(`ElevenLabs v3 failed: ${err.slice(0, 200)}`);
  }

  const audioBuffer = Buffer.from(await r.arrayBuffer());
  const durationMs = estimateDurationMs(audioBuffer.length, BITRATE_KBPS);

  if (durationMs === 0) {
    throw new Error('Không ước lượng được duration của MP3');
  }

  const lines = synthesizeLinesByCharCount(text, durationMs);

  return { audioBuffer, lines, durationMs };
}

/**
 * Ước lượng duration từ file size + bitrate CBR.
 * Công thức: duration_sec = file_size_bits / bitrate_bps
 *         = (size_bytes * 8) / (kbps * 1000)
 * Sai số vài chục ms do ID3 tag ở đầu file — chấp nhận được.
 */
function estimateDurationMs(fileSizeBytes: number, bitrateKbps: number): number {
  if (fileSizeBytes <= 0 || bitrateKbps <= 0) return 0;
  const durationSec = (fileSizeBytes * 8) / (bitrateKbps * 1000);
  return Math.round(durationSec * 1000);
}

/**
 * Tách text thành lines theo dấu câu, phân bổ timestamps theo tỉ lệ ký tự.
 */
function synthesizeLinesByCharCount(
  text: string,
  totalDurationMs: number
): LineWithTiming[] {
  const rawLines = splitByPunctuation(text);
  if (rawLines.length === 0) return [];

  const totalChars = rawLines.reduce((sum, l) => sum + l.length, 0);
  if (totalChars === 0) return [];

  const lines: LineWithTiming[] = [];
  let cursorMs = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const lineText = rawLines[i];
    const share = (lineText.length / totalChars) * totalDurationMs;
    const startMs = Math.round(cursorMs);
    const endMs = Math.round(cursorMs + share);

    lines.push({
      line_id: `l${i + 1}`,
      text: lineText,
      start_ms: startMs,
      end_ms: endMs,
    });

    cursorMs += share;
  }

  // Ép line cuối = totalDurationMs (fix sai số làm tròn)
  if (lines.length > 0) {
    lines[lines.length - 1].end_ms = totalDurationMs;
  }

  return lines;
}

/**
 * Tách text theo dấu câu (. ! ?). Giữ dấu trong text của line.
 */
function splitByPunctuation(text: string): string[] {
  const parts = text.split(/([.!?])/);
  const lines: string[] = [];
  let buffer = '';

  for (const part of parts) {
    buffer += part;
    if (/[.!?]/.test(part)) {
      const trimmed = buffer.trim();
      if (trimmed.length > 0) lines.push(trimmed);
      buffer = '';
    }
  }

  const tail = buffer.trim();
  if (tail.length > 0) lines.push(tail);

  return lines;
}