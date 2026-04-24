import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Fetch N audio URLs, decode bằng Web Audio API, nối thành 1 AudioBuffer,
 * encode sang MP3 (128kbps) → Blob mp3 duy nhất
 */
export async function mergeAudioUrlsToMp3(
  urls: string[],
  voiceKey?: string,
  segmentTypes?: ('static' | 'dynamic')[]
): Promise<Blob> {
  if (urls.length === 0) throw new Error('No audio URLs');

  const ctx = new AudioContext({ sampleRate: 44100 });

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

    // 1.5. Áp Dynamic Range Compressor cho giọng có dynamic range lớn (Thầy Thiện)
    const processedBuffers = voiceKey === 'thay-thich-thien'
      ? await Promise.all(buffers.map(applyCompressor))
      : buffers;

    // 2. Tính toán silence extra quanh dynamic segments (chỉ Thầy Thiện)
    const EXTRA_PAUSE_MS = 500;
    const sampleRate = processedBuffers[0].sampleRate;
    const numChannels = Math.min(...processedBuffers.map((b) => b.numberOfChannels));

    // Array AudioBuffer cần merge, có chèn silence ở vị trí cần
    const buffersToMerge: AudioBuffer[] = [];
    const shouldInsertPause =
      voiceKey === 'thay-thich-thien' && segmentTypes && segmentTypes.length === processedBuffers.length;

    for (let i = 0; i < processedBuffers.length; i++) {
      // Chèn silence TRƯỚC segment dynamic (nếu không phải segment đầu tiên)
      if (shouldInsertPause && segmentTypes![i] === 'dynamic' && i > 0) {
        buffersToMerge.push(createSilenceBuffer(EXTRA_PAUSE_MS, sampleRate, numChannels, ctx));
      }

      buffersToMerge.push(processedBuffers[i]);

      // Chèn silence SAU segment dynamic (nếu không phải segment cuối)
      if (shouldInsertPause && segmentTypes![i] === 'dynamic' && i < processedBuffers.length - 1) {
        buffersToMerge.push(createSilenceBuffer(EXTRA_PAUSE_MS, sampleRate, numChannels, ctx));
      }
    }

    // 3. Merge tuần tự
    const totalLength = buffersToMerge.reduce((sum, b) => sum + b.length, 0);
    const merged = ctx.createBuffer(numChannels, totalLength, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const out = merged.getChannelData(ch);
      let offset = 0;
      for (const buf of buffersToMerge) {
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

/**
 * Áp dụng Dynamic Range Compressor lên AudioBuffer qua OfflineAudioContext.
 * Dùng cho giọng có dynamic range lớn (vd Thầy Thiện): nén peak, bù gain.
 * Trả về AudioBuffer mới đã compressed.
 */
async function applyCompressor(buffer: AudioBuffer): Promise<AudioBuffer> {
  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = buffer;

  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.value = -18;  // dB — bắt đầu nén
  compressor.knee.value = 6;          // dB — nén mượt
  compressor.ratio.value = 3;         // 3:1 — vừa phải, không robot
  compressor.attack.value = 0.003;    // 3ms — bắt transient nhanh
  compressor.release.value = 0.25;    // 250ms — release tự nhiên

  // Makeup gain bù lại volume sau nén
  const makeup = offline.createGain();
  makeup.gain.value = 1.4; // +2.9 dB — cân bằng với audio gốc

  source.connect(compressor).connect(makeup).connect(offline.destination);
  source.start(0);

  return await offline.startRendering();
}

/**
 * Tạo AudioBuffer chứa silence đúng duration, cùng sampleRate + channels với buffer reference.
 */
function createSilenceBuffer(
  durationMs: number,
  sampleRate: number,
  numChannels: number,
  audioContext: AudioContext
): AudioBuffer {
  const length = Math.floor((durationMs / 1000) * sampleRate);
  const silenceBuffer = audioContext.createBuffer(numChannels, length, sampleRate);
  // Float32Array mặc định fill 0 = silence
  return silenceBuffer;
}