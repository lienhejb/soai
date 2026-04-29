'use client';

import { useState, useEffect } from 'react';
import { saveUserVariables } from '@/lib/profile/user-variables';
import { updateMyProfilePartial } from '@/lib/profile/actions';

interface MissingVar {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  helper_text?: string;
}

interface Props {
  rawText: string;
  serverRendered: string;
  isGuest: boolean;
  resolvedVars: Record<string, string>;
  missingVars: MissingVar[];
  /** Map key → label, dùng để render placeholder VN khi biến thiếu. */
  varLabels: Record<string, string>;
}

export function SoContent({ 
  rawText, 
  serverRendered, 
  isGuest, 
  resolvedVars, 
  missingVars,
  varLabels,
}: Props) {
  const [vars, setVars] = useState<Record<string, string>>(resolvedVars);
  const [text, setText] = useState(serverRendered);
  const [showModal, setShowModal] = useState(false);
  const [pendingMissing, setPendingMissing] = useState<MissingVar[]>(missingVars);
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(missingVars.map((v) => [v.key, '']))
  );
  const [saving, setSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Tự mở popup lần đầu nếu user (không guest) và có biến thiếu
  useEffect(() => {
    if (!isGuest && missingVars.length > 0) {
      setShowModal(true);
    }
  }, []);

  // Re-render text với placeholder VN cho biến thiếu
  function renderText(currentVars: Record<string, string>) {
    return rawText
      .replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/gi, (match, k: string) => {
        const key = k.toLowerCase();
        const val = currentVars[key];
        if (val && val.trim() !== '') return val;
        // Biến thiếu → hiện [Label] (sẽ wrap span ở dưới qua dangerouslySetInnerHTML)
        const label = varLabels[key] || key;
        return `__MISSING_START__${label}__MISSING_END__`;
      })
      .replace(/\n{3,}/g, '\n\n');
  }

  // Convert text với marker → JSX với highlight span
  function renderWithHighlight(rawString: string) {
    const parts = rawString.split(/(__MISSING_START__.*?__MISSING_END__)/);
    return parts.map((part, i) => {
      const m = part.match(/^__MISSING_START__(.*?)__MISSING_END__$/);
      if (m) {
        return (
          <span 
            key={i}
            className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 font-medium"
          >
            [{m[1]}]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  function rerender(newVars: Record<string, string>) {
    const merged = { ...vars, ...newVars };
    setVars(merged);
    setText(renderText(merged));
    // Cập nhật pendingMissing — biến nào đã có giá trị thì loại khỏi list
    const stillMissing = pendingMissing.filter(
      (v) => !merged[v.key] || merged[v.key].trim() === ''
    );
    setPendingMissing(stillMissing);
  }

  // Init render với placeholder marker (chỉ chạy khi mount)
  useEffect(() => {
    setText(renderText(resolvedVars));
  }, []);

  async function handleSubmit() {
  setSaving(true);
  
  if (!isGuest) {
    // Pass nguyên form xuống — server action tự phân loại profile vs user_variables
    await saveUserVariables(form);
  }

  rerender(form);
  setSaving(false);
  setShowModal(false);
}

  function handleCloseRequest() {
    // Chỉ chặn close nếu còn biến required: true chưa nhập
    const stillRequired = pendingMissing.some(
  (v) => v.required && !form[v.key]?.trim()
);
    if (stillRequired) {
      setShowCloseConfirm(true);
    } else {
      setShowModal(false);
    }
  }

  function confirmClose() {
    setShowCloseConfirm(false);
    setShowModal(false);
  }

  return (
    <>
      {/* Header với nút mở lại popup */}
      {pendingMissing.length > 0 && !isGuest && (
        <div className="mb-3 flex items-center justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
          >
            <span>📝 Còn thiếu {pendingMissing.length} thông tin</span>
          </button>
        </div>
      )}

      <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-stone-800">
        {renderWithHighlight(text)}
      </p>

      {/* Modal nhập biến */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
        >
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl md:rounded-2xl">
            {/* Nút X */}
            <button
              onClick={handleCloseRequest}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="Đóng"
            >
              ✕
            </button>

            <h3 className="mb-1 font-serif text-xl text-stone-800">Thông tin còn thiếu</h3>
            <p className="mb-5 text-sm text-stone-500">Vui lòng bổ sung để hiển thị đúng nội dung sớ</p>

            <div className="space-y-4">
              {pendingMissing.map((v) => (
                <div key={v.key}>
                  <label className="mb-1.5 block text-sm font-medium text-stone-600">
                    {v.label}
                    {v.required && <span className="ml-1 text-rose-500">*</span>}
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

      {/* Confirm dialog khi user thoát popup mà chưa nhập đủ */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="mb-2 font-serif text-lg font-bold text-stone-800">
              Sớ sẽ thiếu thông tin
            </h4>
            <p className="mb-5 text-sm text-stone-600">
              Nội dung sớ sẽ hiển thị ô trống cho các thông tin chưa khai. Bạn có thể bấm vào nút ở góc trên để khai lại sau. Vẫn thoát?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                Tiếp tục khai
              </button>
              <button
                onClick={confirmClose}
                className="flex-1 rounded-xl bg-stone-800 py-2.5 text-sm font-medium text-white transition hover:bg-stone-900"
              >
                Vẫn thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}