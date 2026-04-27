'use client';

import { useState } from 'react';
import { AncestorModal } from '@/components/ancestor/AncestorModal';
import type { Ancestor } from '@/components/ancestor/types';

interface Props {
  ancestors: Ancestor[];
  onChange: (list: Ancestor[]) => void;
}

export function AncestorList({ ancestors, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleAdd(a: Omit<Ancestor, 'id'>) {
    onChange([...ancestors, { ...a, id: crypto.randomUUID() }]);
    setModalOpen(false);
  }

  function handleRemove(id: string) {
    onChange(ancestors.filter((a) => a.id !== id));
  }

  return (
    <>
      {ancestors.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[var(--gold-soft)] bg-[var(--bg-paper-2)]/50 px-4 py-8 text-center">
          <div className="mb-2 font-serif text-sm italic text-[var(--muted)]">
            Chưa có hương linh nào được ghi nhận
          </div>
          <div className="text-xs text-[var(--muted)]/80">
            Thêm để AI gọi đúng danh hiệu trong buổi lễ
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {ancestors.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-4 py-3"
            >
              <div>
                <div className="font-serif text-[var(--ink)]">
                  {a.full_name}
                  <span className="ml-2 text-xs text-[var(--gold-deep)]">— {a.role}</span>
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">
                  Giỗ: {formatDeathDate(a)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(a.id)}
                aria-label="Xóa"
                className="text-[var(--muted)] transition hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-4 w-full rounded-sm border border-[var(--gold)] bg-transparent px-4 py-3 text-sm font-medium text-[var(--gold-deep)] transition hover:bg-[var(--gold)]/10"
      >
        + Thêm Hương Linh
      </button>

      {modalOpen && (
        <AncestorModal onClose={() => setModalOpen(false)} onSave={handleAdd} />
      )}
    </>
  );
}

function formatDeathDate(a: Ancestor): string {
  const [y, m, d] = a.death_date.split('-');
  const base = `${d}/${m}/${y}`;
  if (!a.is_lunar) return `${base} (Dương)`;
  return `${base} (Âm${a.is_leap_month ? ' - nhuận' : ''})`;
}
