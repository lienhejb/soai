'use client';

import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { VoiceSelector } from './VoiceSelector';
import { AncestorList } from './AncestorList';
import type { Voice, Ancestor } from './types';

interface Props {
  voices: Voice[];
}

export function SetupForm({ voices }: Props) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(voices[0]?.voice_id ?? '');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [ancestors, setAncestors] = useState<Ancestor[]>([]);

  const canSubmit = ownerName.trim() && address.trim() && selectedVoiceId;

  const router = useRouter();

  function handleSubmit() {
  // TODO: Server Action lưu Supabase
  console.log({ selectedVoiceId, ownerName, address, ancestors });
  router.push('/dashboard');
}

  return (
    <>
      {/* PHẦN 1 — Chọn giọng */}
      <section className="mb-12">
        <SectionTitle index="1" title="Chọn Giọng Đọc" subtitle="Trợ Lý AI" />
        <VoiceSelector
          voices={voices}
          selectedId={selectedVoiceId}
          onSelect={setSelectedVoiceId}
        />
      </section>

      {/* PHẦN 2 — Thông tin khấn vái */}
      <section className="mb-12">
        <SectionTitle index="2" title="Thông Tin Khấn Vái" />

        <div className="space-y-4">
          <Field
            label="Tên Gia Chủ"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={ownerName}
            onChange={setOwnerName}
          />
          <Field
            label="Địa chỉ hành lễ"
            placeholder="Ví dụ: Số 12, Ngõ 3, Hà Nội"
            value={address}
            onChange={setAddress}
          />
        </div>

        <div className="mt-8">
          <h3 className="mb-3 font-serif text-lg text-[var(--ink)]">
            Gia Tiên <span className="text-sm font-normal text-[var(--muted)]">(Người đã khuất)</span>
          </h3>
          <AncestorList ancestors={ancestors} onChange={setAncestors} />
        </div>
      </section>

      {/* FOOTER — CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--gold-soft)] bg-[var(--bg-paper)]/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-sm bg-[var(--gold)] px-6 py-4 font-serif text-base font-medium tracking-widest text-[var(--ink)] shadow-[0_2px_0_var(--gold-deep)] transition active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[var(--gold-soft)] disabled:text-[var(--muted)] disabled:shadow-none"
          >
            HOÀN TẤT SETUP
          </button>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ index, title, subtitle }: { index: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-serif text-2xl text-[var(--gold-deep)]">{index}.</span>
      <h2 className="font-serif text-xl text-[var(--ink)] md:text-2xl">
        {title}
        {subtitle && <span className="ml-2 text-sm font-normal text-[var(--muted)]">({subtitle})</span>}
      </h2>
    </div>
  );
}

function Field({
  label, placeholder, value, onChange,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[var(--ink)]">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-[var(--gold-soft)] bg-[var(--bg-paper-2)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)]/70 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
      />
    </label>
  );
}
