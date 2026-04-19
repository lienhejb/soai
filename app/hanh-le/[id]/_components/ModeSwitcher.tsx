'use client';

export type ViewMode = 'karaoke' | 'avatar';

interface Props {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  autoAlternate: boolean;
  onToggleAuto: (v: boolean) => void;
}

export function ModeSwitcher({ mode, onChange, autoAlternate, onToggleAuto }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 pb-3 pt-1">
      {/* Segmented control */}
      <div className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-black/30 p-0.5 backdrop-blur">
        <SegButton
          active={mode === 'karaoke'}
          onClick={() => onChange('karaoke')}
          label="Lời sớ"
          icon={<TextIcon />}
        />
        <SegButton
          active={mode === 'avatar'}
          onClick={() => onChange('avatar')}
          label="Thầy"
          icon={<UserIcon />}
        />
      </div>

      {/* Auto toggle */}
      <button
        type="button"
        onClick={() => onToggleAuto(!autoAlternate)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] tracking-wide transition ${
          autoAlternate
            ? 'border-[var(--soft-gold)]/40 bg-[var(--soft-gold)]/10 text-[var(--soft-gold)]'
            : 'border-white/10 bg-black/30 text-white/40'
        }`}
        aria-label="Tự động chuyển đổi"
      >
        <AutoIcon active={autoAlternate} />
        <span>Auto</span>
      </button>
    </div>
  );
}

function SegButton({
  active, onClick, label, icon,
}: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition ${
        active
          ? 'bg-[var(--soft-gold)]/15 text-[var(--soft-gold)]'
          : 'text-white/50 active:text-white/80'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TextIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.5 3.5-8 8-8s8 3.5 8 8" />
    </svg>
  );
}

function AutoIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v5h5" />
      {active && <circle cx="12" cy="12" r="2.5" fill="currentColor" />}
    </svg>
  );
}
