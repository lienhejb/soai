'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const HOUSE_DIRECTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Nam', 'Đông Bắc', 'Tây Nam', 'Tây Bắc'];

type Profile = {
  display_name: string | null;
  gender: string | null;
  address: string | null;
  dong_tho_address: string | null;
  house_direction: string | null;
  business_name: string | null;
};

type Person = {
  id: string;
  full_name: string;
  relationship: string;
  death_date: string | null;
  is_lunar_death: boolean;
};

export function ProfileTabs({
  profile,
  email,
  people,
}: {
  profile: Profile | null;
  email: string | null;
  people: Person[];
}) {
  const [tab, setTab] = useState<'tin-chu' | 'chi-tiet'>('tin-chu');
  const [detail, setDetail] = useState({
    dong_tho_address: profile?.dong_tho_address ?? '',
    house_direction: profile?.house_direction ?? '',
    business_name: profile?.business_name ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({
      dong_tho_address: detail.dong_tho_address || null,
      house_direction: detail.house_direction || null,
      business_name: detail.business_name || null,
    }).eq('id', (await supabase.auth.getUser()).data.user!.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      {/* Tab switcher */}
      <div className="mb-4 flex gap-2">
        {(['tin-chu', 'chi-tiet'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {t === 'tin-chu' ? 'Tín chủ' : 'Chi tiết'}
          </button>
        ))}
      </div>

      {tab === 'tin-chu' && (
        <>
          <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg text-stone-800">Tín chủ</h2>
            <InfoRow label="Họ tên" value={profile?.display_name} />
            <InfoRow label="Giới tính" value={profile?.gender === 'male' ? 'Nam' : profile?.gender === 'female' ? 'Nữ' : null} />
            <InfoRow label="Địa chỉ" value={profile?.address} />
            <InfoRow label="Email" value={email} />
          </section>

          <section className="mb-8">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-lg text-stone-800">Gia Tiên</h2>
              <span className="text-sm text-stone-500">{people.length} người</span>
            </div>
            {people.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
                Chưa có Hương linh nào
              </div>
            ) : (
              <div className="space-y-2">
                {people.map((p) => (
                  <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="font-serif text-base text-stone-800">
                      {p.relationship} {p.full_name}
                    </div>
                    <div className="mt-1 text-xs text-stone-500">
                      {p.death_date && `${p.is_lunar_death ? 'Âm lịch' : 'Dương lịch'} ${formatDate(p.death_date)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'chi-tiet' && (
        <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg text-stone-800">Thông tin chi tiết</h2>

          <div className="space-y-4">
            <Field label="Địa chỉ động thổ">
              <input
                type="text"
                value={detail.dong_tho_address}
                onChange={(e) => setDetail((d) => ({ ...d, dong_tho_address: e.target.value }))}
                placeholder="Nhập địa chỉ công trình..."
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
              />
            </Field>

            <Field label="Hướng nhà (Nhập trạch)">
              <select
                value={detail.house_direction}
                onChange={(e) => setDetail((d) => ({ ...d, house_direction: e.target.value }))}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:border-amber-400 focus:outline-none"
              >
                <option value="">— Chọn hướng —</option>
                {HOUSE_DIRECTIONS.map((dir) => (
                  <option key={dir} value={dir}>{dir}</option>
                ))}
              </select>
            </Field>

            <Field label="Tên doanh nghiệp (Khai trương)">
              <input
                type="text"
                value={detail.business_name}
                onChange={(e) => setDetail((d) => ({ ...d, business_name: e.target.value }))}
                placeholder="Nhập tên doanh nghiệp..."
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
              />
            </Field>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu thông tin'}
          </button>
        </section>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-stone-500">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between border-b border-stone-100 py-2 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm text-stone-800">{value || '—'}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}