import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Fetch N audio URLs, decode bằng Web Audio API, nối thành 1 AudioBuffer,
 * encode sang MP3 (128kbps) → Blob mp3 duy nhất
 */
export async function mergeAudioUrlsToMp3(urls: string[]): Promise<Blob> {
  if (urls.length === 0) throw new Error('No audio URLs');

  const ctx = new AudioContext();

  try {
    // 1. Fetch + decode song song
    const buffers = await Promise.all(
      urls.map(async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Fetch fail: ${url}`);
        const arr = await r.arrayBuffer();
        return ctx.decodeAudioData(arr);
      })
    );

    // 2. Merge AudioBuffers tuần tự
    const sampleRate = buffers[0].sampleRate;
    const numChannels = Math.min(...buffers.map((b) => b.numberOfChannels));
    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const merged = ctx.createBuffer(numChannels, totalLength, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const out = merged.getChannelData(ch);
      let offset = 0;
      for (const buf of buffers) {
        out.set(buf.getChannelData(ch), offset);
        offset += buf.length;
      }
    }

    // 3. Encode MP3
    return encodeMp3(merged);
  } finally {
    await ctx.close();
  }
}

/**
 * Encode AudioBuffer → MP3 Blob (128 kbps)
 */
function encodeMp3(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const kbps = 128;

  // Convert Float32 → Int16 samples
  const left = floatToInt16(buffer.getChannelData(0));
  const right = numChannels > 1 ? floatToInt16(buffer.getChannelData(1)) : left;

  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
  const chunks: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < left.length; i += blockSize) {
    const leftBlock = left.subarray(i, i + blockSize);
    const rightBlock = numChannels > 1 ? right.subarray(i, i + blockSize) : leftBlock;
    const encoded = encoder.encodeBuffer(leftBlock, numChannels > 1 ? rightBlock : undefined);
    if (encoded.length > 0) chunks.push(encoded);
  }

  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(tail);

  return new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
}

function floatToInt16(floatArr: Float32Array): Int16Array {
  const int16 = new Int16Array(floatArr.length);
  for (let i = 0; i < floatArr.length; i++) {
    const s = Math.max(-1, Math.min(1, floatArr[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}