'use client';

import { useEffect, useRef, useState } from 'react';
import { cloneVoice, ttsWithClonedVoice } from '@/lib/voice-clone/actions';

interface Props {
  scriptContent: string;
  minDurationSec: number;
  testText: string;
}

type Step = 'idle' | 'recording' | 'review' | 'cloning' | 'generating' | 'done' | 'error';

export function VoiceRecorderSimple({ scriptContent, minDurationSec, testText }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer khi recording
  useEffect(() => {
    if (step === 'recording') {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  async function handleStartRecord() {
    setErrorMsg(null);
    setElapsed(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setStep('review');
      };

      mr.start();
      setStep('recording');
    } catch (e) {
      console.error(e);
      setErrorMsg('Không truy cập được microphone. Vui lòng cho phép quyền.');
      setStep('error');
    }
  }

  function handleStopRecord() {
    mediaRecorderRef.current?.stop();
  }

  function handleRetry() {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTtsUrl(null);
    setElapsed(0);
    setStep('idle');
  }

  async function handleCloneAndTest() {
    if (!recordedBlob) return;
    setErrorMsg(null);
    setStep('cloning');

    try {
      // Blob → base64
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Clone
      const cloneRes = await cloneVoice(base64, 'Giọng của tôi');
      if (!cloneRes.ok || !cloneRes.providerVoiceId) {
        setErrorMsg(cloneRes.error || 'Clone thất bại');
        setStep('error');
        return;
      }

      // TTS ngay với text khác
      setStep('generating');
      const ttsRes = await ttsWithClonedVoice(cloneRes.providerVoiceId, testText);
      if (!ttsRes.ok || !ttsRes.audioBase64) {
        setErrorMsg(ttsRes.error || 'Tạo âm thanh thất bại');
        setStep('error');
        return;
      }

      // Base64 → Blob URL để play
      const audioBytes = Uint8Array.from(atob(ttsRes.audioBase64), (c) => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
      setTtsUrl(URL.createObjectURL(audioBlob));
      setStep('done');
    } catch (e) {
      console.error(e);
      setErrorMsg('Có lỗi xảy ra');
      setStep('error');
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const canStop = elapsed >= minDurationSec;

  return (
    <div className="space-y-6">
      {/* Script to đọc */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/40 to-white p-6 shadow-sm">
        <div className="mb-2 text-xs uppercase tracking-widest text-stone-400">
          Đoạn văn cần đọc
        </div>
        <p className="font-serif text-xl leading-loose text-stone-800">
          {scriptContent}
        </p>
      </div>

      {/* STEP: IDLE */}
      {step === 'idle' && (
        <div className="flex flex-col items-center py-8">
          <button
            onClick={handleStartRecord}
            aria-label="Bắt đầu thu âm"
            className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-500/40 transition hover:scale-105 active:scale-95"
          >
            <MicIcon />
          </button>
          <p className="mt-4 font-serif text-base tracking-widest text-stone-700">
            CHẠM ĐỂ BẮT ĐẦU
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Đọc tối thiểu {minDurationSec} giây
          </p>
        </div>
      )}

      {/* STEP: RECORDING */}
      {step === 'recording' && (
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 font-serif text-5xl tabular-nums text-amber-600">
            {mm}:{ss}
          </div>
          <div className="relative">
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-30" />
            <button
              onClick={handleStopRecord}
              disabled={!canStop}
              className="relative flex h-28 w-28 items-center justify-center rounded-full bg-red-500 shadow-xl shadow-red-500/40 transition active:scale-95 disabled:opacity-60"
            >
              <div className="h-10 w-10 rounded bg-white" />
            </button>
          </div>
          <p className="mt-4 font-serif text-base tracking-widest text-stone-700">
            {canStop ? 'CHẠM ĐỂ DỪNG' : `CẦN THÊM ${minDurationSec - elapsed}s`}
          </p>
        </div>
      )}

      {/* STEP: REVIEW */}
      {step === 'review' && recordedUrl && (
        <div className="space-y-4">
          <div className="rounded-xl bg-stone-50 p-4">
            <div className="mb-2 text-sm font-medium text-stone-700">
              Nghe lại bản ghi
            </div>
            <audio controls src={recordedUrl} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRetry}
              className="rounded-xl border border-stone-300 py-4 font-serif tracking-widest text-stone-600 transition hover:border-stone-800 hover:text-stone-800"
            >
              THU LẠI
            </button>
            <button
              onClick={handleCloneAndTest}
              className="rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-4 font-serif font-bold tracking-widest text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40"
            >
              CLONE & NGHE THỬ
            </button>
          </div>
        </div>
      )}

      {/* STEP: CLONING / GENERATING */}
      {(step === 'cloning' || step === 'generating') && (
        <div className="flex flex-col items-center py-12">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          <p className="mt-4 font-serif text-lg text-stone-700">
            {step === 'cloning' ? 'AI đang học giọng của bạn...' : 'Đang đọc bản sớ bằng giọng bạn...'}
          </p>
          <p className="mt-2 text-xs text-stone-500">Có thể mất 10-30 giây</p>
        </div>
      )}

      {/* STEP: DONE */}
      {step === 'done' && ttsUrl && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 shadow-lg">
            <div className="mb-3 text-sm font-medium text-amber-700">
              ✓ AI đọc bản sớ Rằm bằng giọng bạn vừa clone:
            </div>
            <audio controls src={ttsUrl} className="w-full" autoPlay />
            <details className="mt-4 text-xs text-stone-500">
              <summary className="cursor-pointer">Xem nội dung đọc</summary>
              <p className="mt-2 whitespace-pre-line">{testText}</p>
            </details>
          </div>
          <button
            onClick={handleRetry}
            className="w-full rounded-xl border border-stone-300 py-3 text-sm text-stone-600 hover:border-stone-800 hover:text-stone-800"
          >
            Thử lại giọng khác
          </button>
        </div>
      )}

      {/* STEP: ERROR */}
      {step === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" fill="white" fillOpacity="0.2" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}