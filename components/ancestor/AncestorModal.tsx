'use client';

import { useState, useEffect } from 'react';
import { ANCESTOR_ROLES, type Ancestor, type AncestorRole } from './types';

interface Props {
  onClose: () => void;
  onSave: (data: Omit<Ancestor, 'id'>) => void;
}

export function AncestorModal({ onClose, onSave }: Props) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AncestorRole>('Cha');
  const [deathDate, setDeathDate] = useState('');
  const [isLunar, setIsLunar] = useState(true);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  const canSave = fullName.trim() && deathDate;

  function handleSave() {
    if (!canSave) return;
    onSave({
      full_name: fullName.trim(),
      role,
      death_date: deathDate,
      is_lunar: isLunar,
      is_leap_month: isLunar ? isLeapMonth : false,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-lg border border-[var(--gold-soft)] bg-[var(--bg-paper)] p-6 shadow-2xl md:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-xl text-[var(--ink)]">Thêm Hương Linh</h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--ink)]">Tên đầy đủ</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn B"
              className="w-full rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-4 py-2.5 text-[var(--ink)] placeholder:text-[var(--muted)]/70 focus:border-[var(--gold)] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--ink)]">Vai vế</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AncestorRole)}
              className="w-full rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-4 py-2.5 text-[var(--ink)] focus:border-[var(--gold)] focus:outline-none"
            >
              {ANCESTOR_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--ink)]">Ngày giỗ</span>
            <input
  type="date"
  value={deathDate}
  onChange={(e) => setDeathDate(e.target.value)}
  min="1940-01-01"
  max="2026-12-31"
              className="w-full rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-4 py-2.5 text-[var(--ink)] focus:border-[var(--gold)] focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm text-[var(--ink)]">Loại lịch</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsLunar(true)}
                className={`flex-1 rounded-sm border py-2 text-sm transition ${
                  isLunar
                    ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-deep)]'
                    : 'border-[var(--gold-soft)] text-[var(--muted)]'
                }`}
              >
                Âm lịch
              </button>
              <button
                type="button"
                onClick={() => setIsLunar(false)}
                className={`flex-1 rounded-sm border py-2 text-sm transition ${
                  !isLunar
                    ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold-deep)]'
                    : 'border-[var(--gold-soft)] text-[var(--muted)]'
                }`}
              >
                Dương lịch
              </button>
            </div>

            {isLunar && (
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={isLeapMonth}
                  onChange={(e) => setIsLeapMonth(e.target.checked)}
                  className="h-4 w-4 accent-[var(--gold)]"
                />
                Tháng nhuận âm lịch
              </label>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-sm border border-[var(--gold-soft)] py-3 text-sm text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-sm bg-[var(--gold)] py-3 text-sm font-medium tracking-wider text-[var(--ink)] transition hover:bg-[var(--gold-deep)] hover:text-white disabled:cursor-not-allowed disabled:bg-[var(--gold-soft)] disabled:text-[var(--muted)]"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
