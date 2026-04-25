'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  templateTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({ open, templateTitle, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-serif text-xl font-bold text-stone-900">Xác nhận xóa</h3>
        <p className="mt-3 text-stone-600">
          Bạn chắc muốn xóa template <span className="font-semibold text-stone-900">{templateTitle}</span>?
          Template sẽ bị ẩn (soft delete), audio đã gen vẫn giữ trên Storage.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Đang xóa...' : 'Xóa template'}
          </button>
        </div>
      </div>
    </div>
  );
}