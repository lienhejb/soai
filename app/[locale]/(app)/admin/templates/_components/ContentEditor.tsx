'use client';

import { useState } from 'react';
import type { RequiredVariable } from '@/lib/admin/preset-variables';

interface Props {
  value: string;
  onChange: (text: string) => void;
  variables: RequiredVariable[];
}

export function ContentEditor({ value, onChange, variables }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleCopy(key: string) {
    const placeholder = `{{${key}}}`;
    await navigator.clipboard.writeText(placeholder);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        spellCheck={false}
        placeholder="Nhập nội dung văn khấn ở đây. Sử dụng cú pháp {{ten_bien}} để chèn biến — bạn có thể click vào biến ở dưới để copy."
        className="w-full rounded-xl border border-stone-300 bg-white p-4 font-serif text-base leading-relaxed text-stone-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
      />

      {variables.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">
            Biến đã chọn — Click để copy
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v.key}
                onClick={() => handleCopy(v.key)}
                className="group flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs transition hover:border-amber-400 hover:bg-amber-50"
                title={`Copy {{${v.key}}}`}
              >
                <code className="font-mono text-stone-700 group-hover:text-amber-700">
                  {`{{${v.key}}}`}
                </code>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600">{v.label}</span>
                {copiedKey === v.key && (
                  <span className="text-emerald-600">✓ Đã copy</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}