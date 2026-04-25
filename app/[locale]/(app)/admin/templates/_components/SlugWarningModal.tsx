'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  oldSlug: string;
  newSlug: string;
  templateUuid: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function SlugWarningModal({
  open,
  oldSlug,
  newSlug,
  templateUuid,
  onClose,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const uuidUrl = `/vi/so/u/${templateUuid}`;

  async function handleCopyUuid() {
    await navigator.clipboard.writeText(uuidUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-serif text-xl font-bold text-stone-900">⚠️ Đổi đường dẫn (slug)</h3>

        <div className="mt-4 space-y-3 text-sm text-stone-600">
          <p>
            Đường dẫn cũ:{' '}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-800">{oldSlug}</code>
          </p>
          <p>
            Đường dẫn mới:{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">{newSlug}</code>
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-semibold">Lưu ý:</p>
            <p className="mt-1">
              Mọi link đã chia sẻ với slug cũ <code>{oldSlug}</code> sẽ <strong>404</strong>.
              Tuy nhiên link UUID dưới đây vĩnh viễn không đổi:
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-white p-2">
              <code className="flex-1 truncate text-stone-700">{uuidUrl}</code>
              <button
                onClick={handleCopyUuid}
                className="rounded bg-stone-900 px-2 py-1 text-xs font-medium text-white hover:bg-stone-700"
              >
                {copied ? '✓ Đã copy' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-amber-700">
              Bạn có thể chia sẻ link UUID này nếu muốn đảm bảo không bao giờ chết.
            </p>
          </div>
        </div>

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
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Đồng ý đổi slug'}
          </button>
        </div>
      </div>
    </div>
  );
}