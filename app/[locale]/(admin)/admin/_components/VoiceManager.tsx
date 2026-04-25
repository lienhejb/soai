'use client';

import { useState } from 'react';
import { updateSystemVoice, type SystemVoice } from '@/lib/admin/voice-actions';

interface Props {
  initialVoices: SystemVoice[];
}

export function VoiceManager({ initialVoices }: Props) {
  const [voices, setVoices] = useState(initialVoices);

  function handleUpdate(id: string, patch: Partial<SystemVoice>) {
    setVoices((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-serif text-xl font-bold text-stone-800">Giọng đọc hệ thống</h2>
        <div className="mt-2 h-[1px] w-16 bg-gradient-to-r from-amber-600 via-amber-500 to-transparent" />
      </div>

      <div className="space-y-3">
        {voices.map((v) => (
          <VoiceRow key={v.id} voice={v} onUpdated={handleUpdate} />
        ))}
      </div>
    </section>
  );
}

function VoiceRow({
  voice,
  onUpdated,
}: {
  voice: SystemVoice;
  onUpdated: (id: string, patch: Partial<SystemVoice>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(voice.display_name);
  const [description, setDescription] = useState(voice.description ?? '');
  const [providerVoiceId, setProviderVoiceId] = useState(voice.provider_voice_id ?? '');
  const [previewUrl, setPreviewUrl] = useState(voice.preview_url ?? '');
  const [isActive, setIsActive] = useState(voice.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaving(true);
    const res = await updateSystemVoice(voice.id, {
      display_name: displayName.trim(),
      description: description.trim(),
      provider_voice_id: providerVoiceId.trim(),
      preview_url: previewUrl.trim(),
      is_active: isActive,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Lỗi');
      return;
    }
    onUpdated(voice.id, {
      display_name: displayName.trim(),
      description: description.trim() || null,
      provider_voice_id: providerVoiceId.trim() || null,
      preview_url: previewUrl.trim() || null,
      is_active: isActive,
    });
    setEditing(false);
  }

  function handleCancel() {
    setDisplayName(voice.display_name);
    setDescription(voice.description ?? '');
    setProviderVoiceId(voice.provider_voice_id ?? '');
    setPreviewUrl(voice.preview_url ?? '');
    setIsActive(voice.is_active);
    setError(null);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                voice.is_active ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            />
            <h3 className="font-serif text-lg font-bold text-stone-800">
              {voice.display_name}
            </h3>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-500">
              {voice.gender === 'female' ? 'Nữ' : 'Nam'}
            </span>
          </div>
          {voice.description && (
            <p className="mt-0.5 text-sm italic text-stone-500">{voice.description}</p>
          )}
          <p className="mt-1 font-mono text-xs text-stone-400">
            key: {voice.voice_key}
          </p>
          <p className="mt-0.5 font-mono text-xs text-amber-700">
            voice_id: {voice.provider_voice_id || '(chưa có)'}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-amber-500 hover:text-amber-600"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone-500">
                Display Name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone-500">
                Description
              </span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Trầm ấm, Chậm rãi"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone-500">
              ElevenLabs Voice ID
            </span>
            <input
              type="text"
              value={providerVoiceId}
              onChange={(e) => setProviderVoiceId(e.target.value)}
              placeholder="KVzG2JMdZJKi6y7cwERP"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone-500">
              Preview URL
            </span>
            <input
              type="text"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="/audio/preview/thay-thich-thien.mp3"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-stone-700">Hiển thị cho user chọn</span>
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:border-stone-800"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}