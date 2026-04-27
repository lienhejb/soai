'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MissingVar {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  helper_text?: string;
}

interface Props {
  rawText: string;
  serverRendered: string;
  isGuest: boolean;
  resolvedVars: Record<string, string>;
  missingVars: MissingVar[];
}

export function SoContent({ rawText, serverRendered, isGuest, resolvedVars, missingVars }: Props) {
  const [vars, setVars] = useState<Record<string, string>>(resolvedVars);
  const [text, setText] = useState(serverRendered);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(missingVars.map((v) => [v.key, '']))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isGuest && missingVars.length > 0) {
      setShowModal(true);
    }
  }, []);

  function rerender(newVars: Record<string, string>) {
    const merged = { ...vars, ...newVars };
    setVars(merged);
    const result = rawText
      .replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/gi, (_, k) => merged[k] ?? '')
      .replace(/\n{3,}/g, '\n\n');
    setText(result);
  }

  async function handleSubmit() {
    setSaving(true);
    // Save profile fields nếu có (chỉ address, display_name)
    const profileUpdates: Record<string, string> = {};
    if (form['address']) profileUpdates['address'] = form['address'];
    if (form['owner_name']) profileUpdates['display_name'] = form['owner_name'];

    if (Object.keys(profileUpdates).length > 0 && !isGuest) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
      }
    }

    rerender(form);
    setSaving(false);
    setShowModal(false);
  }

  return (
    <>
      <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-stone-800">
        {text}
      </p>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl md:rounded-2xl">
            <h3 className="mb-1 font-serif text-xl text-stone-800">Thông tin còn thiếu</h3>
            <p className="mb-5 text-sm text-stone-500">Vui lòng bổ sung để hiển thị đúng nội dung sớ</p>

            <div className="space-y-4">
              {missingVars.map((v) => (
                <div key={v.key}>
                  <label className="mb-1.5 block text-sm font-medium text-stone-600">
                    {v.label}
                  </label>
                  <input
                    type={v.type === 'date' ? 'date' : 'text'}
                    value={form[v.key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [v.key]: e.target.value }))}
                    placeholder={v.placeholder ?? ''}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
                  />
                  {v.helper_text && (
                    <p className="mt-1 text-xs text-stone-400">{v.helper_text}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}