'use client';

import type { Ancestor, VoiceOwner } from './types';

interface Props {
  ancestors: Ancestor[];
  onSelect: (owner: VoiceOwner) => void;
}

export function OwnerPicker({ ancestors, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-[var(--ink)] md:text-3xl">
          Giọng này của ai?
        </h2>
        <p className="mt-2 text-base text-[var(--muted)]">
          AI sẽ ghi nhớ âm sắc để đọc sớ sau này.
        </p>
      </div>

      {/* Lựa chọn: Của chính Tín chủ */}
      <button
        type="button"
        onClick={() => onSelect({ kind: 'user' })}
        className="w-full rounded-sm border-2 border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-5 py-6 text-left transition active:border-[var(--gold)] active:bg-[var(--gold)]/5"
      >
        <div className="font-serif text-xl text-[var(--ink)]">Giọng của tôi</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          Dùng chính giọng Tín chủ đọc sớ
        </div>
      </button>

      {/* Danh sách Gia tiên */}
      {ancestors.length > 0 && (
        <div>
          <div className="mb-3 mt-8 text-sm uppercase tracking-wider text-[var(--muted)]">
            Hoặc giọng của người thân
          </div>
          <div className="space-y-3">
            {ancestors.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  onSelect({
                    kind: 'ancestor',
                    ancestor_id: a.id,
                    display_name: `Giọng ${a.role} ${a.full_name}`,
                  })
                }
                className="w-full rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper)] px-5 py-5 text-left transition active:border-[var(--gold)] active:bg-[var(--gold)]/5"
              >
                <div className="font-serif text-lg text-[var(--ink)]">
                  {a.role} {a.full_name}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">
                  Lưu giữ giọng người đã khuất
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}