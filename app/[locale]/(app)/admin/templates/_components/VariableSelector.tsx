'use client';

import { useState } from 'react';
import { PRESET_VARIABLES, isValidVariableKey, type RequiredVariable } from '@/lib/admin/preset-variables';

interface Props {
  selected: RequiredVariable[];
  onChange: (vars: RequiredVariable[]) => void;
}

export function VariableSelector({ selected, onChange }: Props) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const selectedKeys = new Set(selected.map((v) => v.key));
  const availablePresets = PRESET_VARIABLES.filter((p) => !selectedKeys.has(p.key));

  function addPreset(preset: RequiredVariable) {
    onChange([...selected, preset]);
  }

  function removeVar(key: string) {
    onChange(selected.filter((v) => v.key !== key));
  }

  function addCustom() {
    setCustomError(null);
    const key = customKey.trim().toLowerCase();
    const label = customLabel.trim();

    if (!key || !label) {
      setCustomError('Nhập đủ key và label');
      return;
    }
    if (!isValidVariableKey(key)) {
      setCustomError('Key chỉ chứa chữ thường, số, dấu gạch dưới');
      return;
    }
    if (selectedKeys.has(key)) {
      setCustomError('Key đã tồn tại');
      return;
    }

    onChange([
      ...selected,
      { key, label, type: 'text', required: true },
    ]);
    setCustomKey('');
    setCustomLabel('');
    setShowCustomForm(false);
  }

  function toggleRequired(key: string) {
    onChange(
      selected.map((v) =>
        v.key === key ? { ...v, required: !v.required } : v
      )
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected variables */}
      <div className="space-y-1.5">
        {selected.length === 0 ? (
          <p className="text-sm text-stone-400 italic">Chưa chọn biến nào</p>
        ) : (
          selected.map((v) => (
            <div
              key={v.key}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
                {`{{${v.key}}}`}
              </code>
              <span className="flex-1 text-stone-800">{v.label}</span>
              <span className="text-xs text-stone-500">{v.type}</span>
              {v.auto_from_profile && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  auto profile
                </span>
              )}
              {v.auto_compute && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  auto compute
                </span>
              )}
              {v.default_value && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  default
                </span>
              )}
              <button
                onClick={() => toggleRequired(v.key)}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                  v.required
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
                title="Click để toggle bắt buộc"
              >
                {v.required ? 'Bắt buộc' : 'Tùy chọn'}
              </button>
              <button
                onClick={() => removeVar(v.key)}
                className="text-stone-400 hover:text-red-600"
                title="Bỏ biến"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add from preset */}
      {availablePresets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Thêm từ preset
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availablePresets.map((p) => (
              <button
                key={p.key}
                onClick={() => addPreset(p)}
                className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 transition hover:border-amber-400 hover:bg-amber-50"
              >
                <span className="font-mono text-stone-500">{`{{${p.key}}}`}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom variable form */}
      <div>
        {showCustomForm ? (
          <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-medium text-stone-700">Thêm biến tùy chỉnh</p>
            <div className="flex gap-2">
              <input
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="key (vd: ten_dong_ho)"
                className="flex-1 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm font-mono"
              />
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Label tiếng Việt"
                className="flex-1 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            {customError && (
              <p className="text-xs text-red-600">{customError}</p>
            )}
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomError(null);
                }}
                className="rounded px-2 py-1 text-xs text-stone-600 hover:bg-stone-200"
              >
                Hủy
              </button>
              <button
                onClick={addCustom}
                className="rounded bg-stone-900 px-3 py-1 text-xs font-medium text-white hover:bg-stone-700"
              >
                Thêm
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            className="text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            + Thêm biến tùy chỉnh
          </button>
        )}
      </div>
    </div>
  );
}