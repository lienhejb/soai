'use client';

import { useEffect, useState } from 'react';
import { pregenForVoices } from '@/lib/admin/pregen-actions';
import type { TemplateListItem, VoiceAudioStatus } from '@/lib/admin/template-actions';

interface VoiceMeta {
  voice_key: string;
  voice_label: string;
  provider_voice_id: string;
}

interface Props {
  open: boolean;
  template: TemplateListItem | null;
  voicesMeta: VoiceMeta[];
  onClose: () => void;
  onDone: () => void;
}

export function GenAudioModal({ open, template, voicesMeta, onClose, onDone }: Props) {
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [forceRegen, setForceRegen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Reset + default tick voice thiếu khi modal mở
  useEffect(() => {
    if (!open || !template) return;
    const incompleteVoices = template.audio_status
      .filter((s) => !s.is_complete)
      .map((s) => s.voice_key);
    setSelectedVoices(new Set(incompleteVoices));
    setForceRegen(false);
    setResult(null);
  }, [open, template]);

  if (!open || !template) return null;

  function toggleVoice(voiceKey: string) {
    const next = new Set(selectedVoices);
    if (next.has(voiceKey)) next.delete(voiceKey);
    else next.add(voiceKey);
    setSelectedVoices(next);
  }

  async function handleGen() {
    if (running || selectedVoices.size === 0) return;
    setRunning(true);
    setResult(null);

    const targets = voicesMeta
      .filter((v) => selectedVoices.has(v.voice_key))
      .map((v) => ({
        voice_key: v.voice_key,
        voice_provider_id: v.provider_voice_id,
      }));

    try {
      const res = await pregenForVoices(template!.slug, targets, forceRegen);

      if (!res.ok) {
        setResult(`Lỗi: ${res.error}`);
        setRunning(false);
        return;
      }

      // Compose summary
      const lines: string[] = [];
      for (const r of res.results ?? []) {
        const label = voicesMeta.find((v) => v.voice_key === r.voice_key)?.voice_label ?? r.voice_key;
        if (r.error) {
          lines.push(`✗ ${label}: ${r.error}`);
        } else if (r.stats) {
          const { generated, skipped, errors } = r.stats;
          const errSuffix = errors.length > 0 ? `, ${errors.length} lỗi` : '';
          lines.push(`✓ ${label}: gen ${generated}, bỏ qua ${skipped}${errSuffix}`);
        }
      }
      setResult(lines.join('\n'));
      onDone();
    } catch (e) {
      setResult(`Lỗi: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setRunning(false);
    }
  }

  function getStatusFor(voiceKey: string): VoiceAudioStatus | undefined {
    return template?.audio_status.find((s) => s.voice_key === voiceKey);
  }

  function statusLabel(s: VoiceAudioStatus | undefined): string {
    if (!s) return '?';
    if (s.total_static === 0) return 'không có segments';
    if (s.is_complete) return `đã đủ ${s.ready_count}/${s.total_static}`;
    if (s.ready_count === 0) return `thiếu toàn bộ ${s.total_static}/${s.total_static}`;
    return `thiếu ${s.total_static - s.ready_count}/${s.total_static}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4">
          <h3 className="font-serif text-xl font-bold text-stone-900">Gen Audio</h3>
          <p className="mt-1 text-sm text-stone-600">
            Template: <span className="font-medium text-stone-900">{template.title}</span>
          </p>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">
              Chọn voice cần gen:
            </p>
            <div className="space-y-1.5">
              {voicesMeta.map((v) => {
                const status = getStatusFor(v.voice_key);
                const checked = selectedVoices.has(v.voice_key);
                const isComplete = status?.is_complete ?? false;
                return (
                  <label
                    key={v.voice_key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      checked
                        ? 'border-stone-900 bg-stone-50'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleVoice(v.voice_key)}
                      disabled={running}
                      className="h-4 w-4 rounded border-stone-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-stone-900">{v.voice_label}</div>
                      <div className={`text-xs ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {statusLabel(status)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={forceRegen}
                onChange={(e) => setForceRegen(e.target.checked)}
                disabled={running}
                className="mt-0.5 h-4 w-4 rounded border-amber-300"
              />
              <div>
                <div className="text-sm font-medium text-amber-900">
                  Force regen (xóa audio cũ + gen lại)
                </div>
                <div className="text-xs text-amber-700">
                  Mặc định OFF: chỉ gen segment thiếu/stale, giữ nguyên audio đã có. Bật khi muốn gen lại
                  toàn bộ.
                </div>
              </div>
            </label>
          </div>

          {result && (
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Kết quả:</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-stone-800">{result}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={running}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            {result ? 'Đóng' : 'Hủy'}
          </button>
          {!result && (
            <button
              onClick={handleGen}
              disabled={running || selectedVoices.size === 0}
              className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {running ? 'Đang gen...' : `Bắt đầu gen ${selectedVoices.size} voice`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}