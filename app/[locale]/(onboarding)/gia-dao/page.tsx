import { SetupForm } from './_components/SetupForm';
import type { Voice } from './_components/types';

// Mock data - sẽ thay bằng Supabase query
const MOCK_VOICES: Voice[] = [
  {
    voice_id: 'a1b2c3d4-0001',
    voice_slug: 'thay-thich-thien',
    display_name: 'Thầy Thích Thiện',
    description: 'Trầm ấm, Chậm rãi',
    gender: 'male',
    preview_url: '/audio/preview/thay-thich-thien.mp3',
  },
  {
    voice_id: 'a1b2c3d4-0002',
    voice_slug: 'thay-bao-phuc',
    display_name: 'Thầy Bảo Phúc',
    description: 'Uy nghiêm, Vang vọng',
    gender: 'male',
    preview_url: '/audio/preview/thay-bao-phuc.mp3',
  },
  {
    voice_id: 'a1b2c3d4-0003',
    voice_slug: 'co-dieu-tam',
    display_name: 'Cô Diệu Tâm',
    description: 'Từ bi, Nhẹ nhàng',
    gender: 'female',
    preview_url: '/audio/preview/co-dieu-tam.mp3',
  },
];

export default function GiaDaoSetupPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-paper)]">
      <Header />
      <main className="mx-auto max-w-2xl px-5 pb-32 pt-8 md:pt-12">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[var(--ink)] md:text-4xl">
            Thiết Lập Gia Đạo
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)] md:text-base">
            Chỉ cần làm 1 lần, AI sẽ nhớ cho mọi buổi lễ sau này.
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-[var(--gold)]" />
        </div>
        <SetupForm voices={MOCK_VOICES} />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="relative border-b border-[var(--gold-soft)] bg-[var(--bg-paper)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <div className="w-9" aria-hidden />
        <div className="flex items-center gap-2">
          <LotusMark />
          <span className="font-serif text-lg tracking-widest text-[var(--ink)]">
            SoAI
          </span>
        </div>
        <div className="h-9 w-9 overflow-hidden rounded-full border border-[var(--gold-soft)] bg-[var(--bg-paper-2)]">
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
            NV
          </div>
        </div>
      </div>
    </header>
  );
}

function LotusMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c1.5 3 1.5 6 0 9-1.5-3-1.5-6 0-9z"
        fill="var(--gold)"
        opacity="0.9"
      />
      <path
        d="M4 10c3 0 5.5 2 7 5-3 0-5.5-2-7-5z"
        fill="var(--gold)"
        opacity="0.7"
      />
      <path
        d="M20 10c-3 0-5.5 2-7 5 3 0 5.5-2 7-5z"
        fill="var(--gold)"
        opacity="0.7"
      />
      <circle cx="12" cy="16" r="1.5" fill="var(--gold)" />
    </svg>
  );
}
