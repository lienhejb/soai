'use client';

import { Link } from '@/i18n/navigation';
import { useRef, useState } from 'react';

interface Voice {
  id: string;
  label: string;
  gender: 'male' | 'female';
  type: 'system' | 'clone';
}

interface Props {
  templateSlug: string;
  templateTitle: string;
  voices: readonly Voice[];
  defaultVoiceId: string;
}

export function SoPlayer({ templateSlug, templateTitle, voices, defaultVoiceId }: Props) {
  const [voiceId, setVoiceId] = useState(defaultVoiceId);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentVoice = voices.find((v) => v.id === voiceId)!;

  async function handlePlay() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    // MOCK: fake delay "render audio"
    if (!audioUrl) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      // MOCK URL — sau này là merged file từ /api/render-so
      setAudioUrl(`/api/tts?slug=${templateSlug}&voice_id=${voiceId}&t=${Date.now()}`);
      setLoading(false);
    }

    setTimeout(() => {
      audioRef.current?.play();
      setPlaying(true);
    }, 50);
  }

  function handleVoiceChange(newId: string) {
    if (newId === voiceId) {
      setVoicePickerOpen(false);
      return;
    }
    setVoiceId(newId);
    setVoicePickerOpen(false);
    // Reset audio (sẽ render lại với giọng mới)
    audioRef.current?.pause();
    setAudioUrl(null);
    setPlaying(false);
    showToast(`Đã đổi sang ${voices.find((v) => v.id === newId)?.label}`);
  }

  function handleDownload() {
    if (!audioUrl) {
      showToast('Vui lòng bấm "Nghe" trước để chuẩn bị file');
      return;
    }
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${templateTitle.replace(/\s+/g, '-')}.mp3`;
    a.click();
  }

  async function handleShare() {
    if (!audioUrl) {
      showToast('Vui lòng bấm "Nghe" trước để chuẩn bị file');
      return;
    }
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: templateTitle,
          text: `Bản ${templateTitle} — SoAI`,
          url: shareUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Đã sao chép liên kết');
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

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
                {v.id === voiceId && (
                  <span className="text-amber-600">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audio hidden */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* 3 nút action */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handlePlay}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-4 font-bold tracking-widest text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Spinner />
              <span className="text-sm">TẢI</span>
            </>
          ) : playing ? (
            <>
              <span>❚❚</span>
              <span className="text-sm">DỪNG</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span className="text-sm">NGHE</span>
            </>
          )}
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

      {/* Nút Vào chế độ Hành Lễ */}<Link
  href={`/hanh-le/${templateSlug}`}
  className="mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-gradient-to-b from-amber-50 to-white py-4 font-serif font-bold tracking-widest text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l9 9-9 9M3 12h18" />
  </svg>
  <span>VÀO CHẾ ĐỘ HÀNH LỄ</span>
</Link>

      {/* Toast */}
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