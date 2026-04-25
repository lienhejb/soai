'use client';

import { useEffect, useState } from 'react';
import { loadDraft } from '@/lib/draft';
import { getDateStringsForSo } from '@/lib/lunar';

interface Props {
  rawText: string;       // template gốc, chưa render var
  serverRendered: string; // text đã render server-side (placeholder hoặc user thật)
  isGuest: boolean;
}

export function SoContent({ rawText, serverRendered, isGuest }: Props) {
  const [text, setText] = useState(serverRendered);

  useEffect(() => {
    if (!isGuest) return; // user đã login → giữ server render
    const draft = loadDraft();
    if (!draft) return;   // không có draft → giữ placeholder

    const ownerName = draft.owner_name?.trim();
    const address = draft.address?.trim();
    if (!ownerName && !address) return; // draft rỗng → giữ placeholder

    const familySurname = (ownerName || '').split(/\s+/)[0] || 'Tín chủ';
    const overridden = renderTemplate(rawText, {
      owner_name: ownerName || 'Tín chủ',
      family_surname: familySurname,
      address: address || 'Địa chỉ không rõ',
      ...getDateStringsForSo(),
    });
    setText(overridden);
  }, [isGuest, rawText]);

  return (
    <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-stone-800">
      {text}
    </p>
  );
}

function renderTemplate(content: string, vars: Record<string, string>): string {
  return content
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `[${k}]`)
    .replace(/\n{3,}/g, '\n\n'); // collapse 3+ newlines → 2
}