'use client';

import { useState } from 'react';
import { pregenStaticAudioForTemplate } from '@/lib/admin/pregen-actions';

interface Props {
  templateSlug: string;
  title: string;
  purpose: string;
  isActive: boolean;
  staticCount: number;
  dynamicCount: number;
  audioStatus: Array<{ voice_key: string; segment_count: number }>;
}

export function AdminTemplateCard({
  templateSlug,
  title,
  purpose,
  isActive,
  staticCount,
  dynamicCount,
  audioStatus,
}: Props) {
  const [voiceKey, setVoiceKey] = useState('system:thay-thien');
  const [voiceProviderId, setVoiceProviderId] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    errors?: string[];
  } | null>(null);

  async function handleGen() {
    if (!voiceProviderId.trim()) {
      setResult({ ok: false, message: 'Chưa nhập Voice ID' });
      return;
    }

    setResult(null);
    setRunning(true);

    const res = await pregenStaticAudioForTemplate(
      templateSlug,
      voiceKey.trim(),
      voiceProviderId.trim()
    );

    setRunning(false);

    if (!res.ok) {
      setResult({ ok: false, message: res.error ?? 'Lỗi không xác định' });
      return;
    }

    const s = res.stats!;
    setResult({
      ok: true,
      message: `Gen xong: ${s.generated}/${s.segment_count} segments thành công`,
      errors: s.errors.length > 0 ? s.errors : undefined,
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-700">
            <span>{purpose}</span>
            {!isActive && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">inactive</span>
            )}
          </div>
          <h3 className="mt-1 font-serif text-lg font-bold text-stone-800">
            {title}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-stone-400">
            {templateSlug}
          </p>
        </div>

        <div className="flex-shrink-0 text-right text-xs">
          <div className="text-stone-500">
            Static: <span className="font-semibold text-stone-800">{staticCount}</span>
          </div>
          <div className="text-stone-500">
            Dynamic: <span className="font-semibold text-stone-800">{dynamicCount}</span>
          </div>
        </div>
      </div>

      {/* Audio status */}
      {audioStatus.length > 0 && (
        <div className="mt-4 rounded-lg bg-stone-50 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">
            Audio đã gen
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {audioStatus.map((s) => (
              <span
                key={s.voice_key}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  s.segment_count === staticCount
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {s.voice_key}: {s.segment_count}/{staticCount}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-stone-500">
              Voice Key
            </span>
            <input
              type="text"
              value={voiceKey}
              onChange={(e) => setVoiceKey(e.target.value)}
              placeholder="system:thay-thien"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs shadow-inner focus:border-amber-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-stone-500">
              ElevenLabs Voice ID
            </span>
            <input
              type="text"
              value={voiceProviderId}
              onChange={(e) => setVoiceProviderId(e.target.value)}
              placeholder="pNInz6obpgDQGcFmaJgB"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs shadow-inner focus:border-amber-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleGen}
          disabled={running || staticCount === 0}
          className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-2.5 text-sm font-bold tracking-widest text-white shadow transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running
            ? 'ĐANG GEN...'
            : staticCount === 0
              ? 'KHÔNG CÓ STATIC SEGMENT'
              : `GEN ${staticCount} STATIC AUDIO`}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`mt-3 rounded-lg p-3 text-sm ${
            result.ok
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {result.errors.map((err, i) => (
                <li key={i} className="font-mono">• {err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}