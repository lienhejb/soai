'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';

export interface TemplateOption {
  id: string;
  slug: string;
  title: string;
  is_current?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  options: TemplateOption[];
  onSelect: (opt: TemplateOption) => void;
}

export function TemplatePickerSheet({ open, onClose, options, onSelect }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200 md:hidden" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-stone-800">
            Chọn văn khấn khác
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {options.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">
            Chưa có văn khấn phù hợp
          </p>
        ) : (
          <ul className="space-y-2">
            {options.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    opt.is_current
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/30'
                      : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-base font-semibold text-stone-800">
                      {opt.title}
                    </div>
                    {opt.is_current && (
                      <div className="mt-0.5 text-xs font-medium text-amber-700">
                        Đang dùng
                      </div>
                    )}
                  </div>
                  {opt.is_current ? (
                    <span className="flex-shrink-0 text-amber-600">✓</span>
                  ) : (
                    <span className="flex-shrink-0 text-stone-400">→</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/so"
          className="mt-4 block text-center text-sm text-stone-500 hover:text-amber-700"
          onClick={onClose}
        >
          Xem toàn bộ thư viện →
        </Link>
      </div>
    </div>
  );
}