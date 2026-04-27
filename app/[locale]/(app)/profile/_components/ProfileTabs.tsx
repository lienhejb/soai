'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AncestorList } from '@/app/[locale]/(onboarding)/gia-dao/_components/AncestorList';
import type { Ancestor } from '@/components/ancestor/types';

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

  const [ancestors, setAncestors] = useState<Ancestor[]>(
    people.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      role: p.relationship as Ancestor['role'],
      death_date: p.death_date ?? '',
      is_lunar: p.is_lunar_death ?? true,
      is_leap_month: false,
    }))
  );

  async function handleAddAncestor(data: Omit<Ancestor, 'id'>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted } = await supabase.from('people').insert({
      user_id: user!.id,
      full_name: data.full_name,
      relationship: data.role,
      death_date: data.death_date,
      is_lunar_death: data.is_lunar,
      is_leap_month_death: data.is_leap_month,
      status: 'deceased',
    }).select('id').single();
    if (inserted) {
      setAncestors((prev) => [...prev, { ...data, id: inserted.id }]);
    }
  }

  async function handleRemoveAncestor(id: string) {
    const supabase = createClient();
    await supabase.from('people').delete().eq('id', id);
    setAncestors((prev) => prev.filter((a) => a.id !== id));
  }

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
              <span className="text-sm text-stone-500">{ancestors.length} người</span>
            </div>
            <AncestorList
              ancestors={ancestors}
              onChange={(list) => {
                const added = list.find((a) => !ancestors.find((x) => x.id === a.id));
                const removed = ancestors.find((a) => !list.find((x) => x.id === a.id));
                if (added) handleAddAncestor(added);
                if (removed) handleRemoveAncestor(removed.id);
              }}
            />
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