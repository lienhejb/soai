'use client';

import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { prepareRenderedSo } from '@/lib/voice-clone/prepare-so';
import { finalizeRenderedSo } from '@/lib/voice-clone/upload-rendered';
import { mergeAudioUrlsToMp3 } from '@/lib/audio/mergeAudioUrls';
// (đã có prepareRenderedSo + finalizeRenderedSo + mergeAudioUrlsToMp3 — không cần thêm gì)

interface Voice {
  id: string;
  voice_key: string;   // ← THÊM
  label: string;
  gender: 'male' | 'female';
  type: 'system' | 'clone';
}

interface Props {
  templateSlug: string;
  templateTitle: string;
  voices: Voice[];
  defaultVoiceId: string;
}

type RenderStatus = 'idle' | 'preparing' | 'merging' | 'uploading' | 'done' | 'error';

export function SoPlayer({ templateSlug, templateTitle, voices, defaultVoiceId }: Props) {
  const router = useRouter();

  const [voiceId, setVoiceId] = useState(defaultVoiceId);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [renderError, setRenderError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentVoice = voices.find((v) => v.id === voiceId)!;

  async function handlePlay() {
  if (playing) {
    audioRef.current?.pause();
    setPlaying(false);
    return;
  }

  // Nếu đã có URL → play luôn
  if (audioUrl) {
    setTimeout(() => {
      audioRef.current?.play();
      setPlaying(true);
    }, 50);
    return;
  }

  // Chưa có → prepare/merge giống flow hành lễ nhưng không upload + không redirect
  setLoading(true);
  try {
    const url = await prepareAndMergeForListen();
    if (!url) return; // error đã set bên trong
    setAudioUrl(url);
    setTimeout(() => {
      audioRef.current?.play();
      setPlaying(true);
    }, 50);
  } finally {
    setLoading(false);
  }
}

async function prepareAndMergeForListen(): Promise<string | null> {
  const voiceKey = voices.find((v) => v.id === voiceId)?.voice_key;
  if (!voiceKey) {
    showToast('Voice không hợp lệ');
    return null;
  }

  const res = await prepareRenderedSo(templateSlug, voiceKey, voiceId);
  if (!res.ok) {
    showToast(res.error ?? 'Không tải được sớ');
    return null;
  }

  // Cache hit — đã có merged URL
  if (res.cached) {
    return res.cached.merged_audio_url;
  }

  if (!res.segments || !res.finalize) {
    showToast('Dữ liệu trả về không hợp lệ');
    return null;
  }

  // Cache miss — merge client-side, KHÔNG upload (NGHE không cần persist merged)
  const sortedSegments = res.segments.sort((a, b) => a.order_index - b.order_index);
  const urls = sortedSegments.map((s) => s.audio_url);
  const segmentTypes = sortedSegments.map((s) => s.segment_type);
  const mergedBlob = await mergeAudioUrlsToMp3(urls, voiceKey, segmentTypes);

  return URL.createObjectURL(mergedBlob);
}

  function handleVoiceChange(newId: string) {
  if (newId === voiceId) {
    setVoicePickerOpen(false);
    return;
  }
  setVoiceId(newId);
  setVoicePickerOpen(false);
  audioRef.current?.pause();
  
  // Revoke blob URL cũ nếu là blob (NGHE cache miss tạo blob)
  if (audioUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(audioUrl);
  }
  setAudioUrl(null);
  
  setPlaying(false);
  showToast(`Đã đổi sang ${voices.find((v) => v.id === newId)?.label}`);
}

  function handleDownload() {
    if (!audioUrl) {
      showToast('Vui lòng bấm "Nghe" trước');
      return;
    }
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${templateTitle.replace(/\s+/g, '-')}.mp3`;
    a.click();
  }

  async function handleShare() {
    if (!audioUrl) {
      showToast('Vui lòng bấm "Nghe" trước');
      return;
    }
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: templateTitle, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Đã sao chép liên kết');
    }
  }

  async function handleHanhLe() {
  setRenderStatus('preparing');
  setRenderError(null);

  try {
    const voiceKey = voices.find((v) => v.id === voiceId)?.voice_key;
    if (!voiceKey) {
      setRenderError('Voice không hợp lệ');
      setRenderStatus('error');
      return;
    }

    // Prepare để warm cache static_audio + dynamic_audio (segment-level)
    // Bỏ qua merge + upload — sang /hanh-le sẽ tự fetch segments
    const res = await prepareRenderedSo(templateSlug, voiceKey, voiceId);
    if (!res.ok) {
      setRenderError(res.error ?? 'Không chuẩn bị được sớ');
      setRenderStatus('error');
      return;
    }

    setRenderStatus('done');
    router.push(`/hanh-le/${templateSlug}?voice=${voiceKey}`);
  } catch (e) {
    console.error('[hanh-le]', e);
    setRenderError(e instanceof Error ? e.message : 'Lỗi không xác định');
    setRenderStatus('error');
  }
}

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const renderInProgress = renderStatus === 'preparing' || renderStatus === 'merging' || renderStatus === 'uploading';

  return (
    <div className="relative">
      {/* Voice picker */}
      <div className="relative mb-4">
        <button
          onClick={() => setVoicePickerOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              {currentVoice.gender === 'female' ? '👩' : '👨'}
            </div>
            <div className="text-left">
              <div className="text-xs text-stone-500">Giọng đọc</div>
              <div className="font-serif text-base font-medium text-stone-800">
                {currentVoice.label}
              </div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {voicePickerOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
            {voices.map((v) => (
              <button
                key={v.id}
                onClick={() => handleVoiceChange(v.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-amber-50 ${
                  v.id === voiceId ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100">
                  {v.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="flex-1 font-serif text-sm text-stone-800">
                  {v.label}
                </div>
                {v.id === voiceId && <span className="text-amber-600">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePlay}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-4 font-bold tracking-widest text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 disabled:opacity-60"
        >
          {loading ? <><Spinner /><span className="text-sm">TẢI</span></> :
            playing ? <><span>❚❚</span><span className="text-sm">DỪNG</span></> :
            <><span>▶</span><span className="text-sm">NGHE</span></>}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1 rounded-xl border border-stone-300 py-4 font-medium text-stone-700 transition hover:border-amber-500 hover:text-amber-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
          <span className="text-sm">Tải</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1 rounded-xl border border-stone-300 py-4 font-medium text-stone-700 transition hover:border-amber-500 hover:text-amber-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          <span className="text-sm">Chia sẻ</span>
        </button>
      </div>

      {/* Nút Vào chế độ Hành Lễ */}
      <button
        onClick={handleHanhLe}
        disabled={renderInProgress}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-gradient-to-b from-amber-50 to-white py-4 font-serif font-bold tracking-widest text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {renderStatus === 'preparing' && <><Spinner /><span>ĐANG CHUẨN BỊ...</span></>}
        {renderStatus === 'merging' && <><Spinner /><span>ĐANG GHÉP ÂM THANH...</span></>}
        {renderStatus === 'uploading' && <><Spinner /><span>ĐANG LƯU...</span></>}
        {!renderInProgress && (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l9 9-9 9M3 12h18" />
            </svg>
            <span>VÀO CHẾ ĐỘ HÀNH LỄ</span>
          </>
        )}
      </button>

      {renderStatus === 'error' && renderError && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {renderError}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}