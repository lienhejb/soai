'use client';

import { useEffect, useState } from 'react';
import { updateProfile } from '@/lib/profile/actions';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: {
    display_name: string;
    gender: 'male' | 'female' | null;
    birth_year: number | null;
    address: string;
  };
  onSaved: () => void;
}

export function EditProfileModal({ open, onClose, initial, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [gender, setGender] = useState<'male' | 'female' | null>(initial.gender);
  const [birthYear, setBirthYear] = useState(initial.birth_year?.toString() || '');
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock scroll khi mở
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Reset về initial khi mở lại
  useEffect(() => {
    if (open) {
      setDisplayName(initial.display_name);
      setGender(initial.gender);
      setBirthYear(initial.birth_year?.toString() || '');
      setAddress(initial.address);
      setError(null);
    }
  }, [open, initial]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    // Validation strict
if (!displayName.trim()) {
  setError('Vui lòng nhập họ tên');
  setSaving(false);
  return;
}
if (!address.trim()) {
  setError('Vui lòng nhập địa chỉ');
  setSaving(false);
  return;
}

    const yearNum = birthYear ? parseInt(birthYear, 10) : null;
    if (yearNum && (yearNum < 1920 || yearNum > new Date().getFullYear())) {
      setError('Năm sinh không hợp lệ');
      setSaving(false);
      return;
    }

    const res = await updateProfile({
      display_name: displayName.trim(),
      gender,
      birth_year: yearNum,
      address: address.trim(),
    });

    setSaving(false);

    if (!res.ok) {
      setError(res.error || 'Có lỗi xảy ra');
      return;
    }

    onSaved();
    onClose();
  }

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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-serif text-2xl font-bold text-stone-800">
            Cập nhật Thông tin
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Họ tên */}
<label className="block">
  <span className="mb-1.5 block font-serif text-sm font-medium text-stone-800">
    Họ tên Gia Chủ <span className="text-rose-500">*</span>
  </span>
  <input
  type="text"
  value={displayName}
  onChange={(e) => setDisplayName(e.target.value)}
  placeholder="Ví dụ: Nguyễn Văn A"
  required
  autoComplete="name"
  className="w-full rounded-xl border ..."
/>
  {displayName.trim() && (
    <p className="mt-1.5 text-xs text-stone-500">
      Họ trong văn khấn: <span className="font-medium text-amber-700">{displayName.trim().split(/\s+/)[0]}</span>
      <span className="ml-1 text-stone-400">(tự động lấy chữ đầu)</span>
    </p>
  )}
</label>

          {/* Giới tính */}
          <div>
            <span className="mb-1.5 block font-serif text-sm font-medium text-stone-800">
              Giới tính
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`rounded-lg py-2.5 text-sm font-medium transition ${
                  gender === 'male'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Nam
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`rounded-lg py-2.5 text-sm font-medium transition ${
                  gender === 'female'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Nữ
              </button>
            </div>
          </div>

          {/* Năm sinh */}
          <label className="block">
            <span className="mb-1.5 block font-serif text-sm font-medium text-stone-800">
              Năm sinh
            </span>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="Ví dụ: 1980"
              min={1920}
              max={new Date().getFullYear()}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-800 placeholder:text-stone-400 shadow-inner transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </label>

          {/* Địa chỉ */}
          <label className="block">
            <span className="mb-1.5 block font-serif text-sm font-medium text-stone-800">
  Địa chỉ cư trú <span className="text-rose-500">*</span>
</span>
            <input
  type="text"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
  placeholder="Ví dụ: Số 12, Ngõ 3, Hà Nội"
  required
  autoComplete="street-address"
  className="w-full rounded-xl border ..."
/>
          </label>

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3.5 font-serif text-base font-bold tracking-widest text-white shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}
          </button>
        </form>
      </div>
    </div>
  );
}