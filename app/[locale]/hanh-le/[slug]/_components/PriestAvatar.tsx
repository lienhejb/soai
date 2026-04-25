'use client';

import Image from 'next/image';

export type PriestAvatarSize = 'sm' | 'md' | 'lg';

interface Props {
  name: string;
  role?: string;                    // "Giọng Nam trầm - Miền Bắc"
  imageUrl?: string | null;
  isPlaying: boolean;
  size?: PriestAvatarSize;
  showInfo?: boolean;               // true → hiện tên + role + status bên dưới
}

const SIZE_MAP: Record<PriestAvatarSize, { avatar: number; halo: string; ring: string }> = {
  sm: { avatar: 40,  halo: 'scale-110', ring: 'ring-2' },
  md: { avatar: 96,  halo: 'scale-125', ring: 'ring-[3px]' },
  lg: { avatar: 176, halo: 'scale-125', ring: 'ring-4' },
};

export default function PriestAvatar({
  name,
  role,
  imageUrl,
  isPlaying,
  size = 'md',
  showInfo = true,
}: Props) {
  const { avatar, halo, ring } = SIZE_MAP[size];

  return (
    <div className="flex flex-col items-center">
      {/* Khối Avatar + Hào quang */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: avatar, height: avatar }}
      >
        {/* Hào quang pulse — chỉ hiện khi playing */}
        <div
          className={`absolute inset-0 rounded-full bg-[var(--soft-gold)]/20 transition-all duration-700 ${
            isPlaying ? `${halo} opacity-100 animate-pulse` : 'scale-100 opacity-0'
          }`}
        />
        {/* Hào quang lớp ngoài — chỉ size md/lg */}
        {size !== 'sm' && isPlaying && (
          <div
            className="absolute inset-0 rounded-full bg-[var(--soft-gold)]/10 blur-xl"
            style={{ transform: 'scale(1.6)' }}
          />
        )}

        {/* Avatar */}
        <div
          className={`relative overflow-hidden rounded-full border-2 transition-all duration-700 ${
            isPlaying
              ? `scale-105 border-[var(--soft-gold)] ${ring} ring-[var(--soft-gold)]/30 shadow-[0_0_40px_rgba(232,184,75,0.4)]`
              : 'scale-100 border-white/15 shadow-md'
          }`}
          style={{ width: avatar, height: avatar }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={avatar}
              height={avatar}
              className="h-full w-full object-cover"
              priority={size === 'lg'}
            />
          ) : (
            <LotusPlaceholder active={isPlaying} size={avatar} />
          )}
        </div>
      </div>

      {showInfo && (
        <>
          {/* Tên + Role */}
          <div className="mt-5 text-center">
            <h3
              className={`font-serif font-semibold tracking-wide transition-colors duration-500 ${
                size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-sm'
              } ${isPlaying ? 'text-[var(--soft-gold)]' : 'text-white/80'}`}
            >
              {name}
            </h3>
            {role && size !== 'sm' && (
              <p className="mt-1 text-xs tracking-wide text-white/40">
                {role}
              </p>
            )}
          </div>

          {/* Status indicator — chiều cao cố định tránh jitter */}
          {size !== 'sm' && (
            <div className="mt-3 flex h-5 items-center justify-center gap-2">
              {isPlaying ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[var(--soft-gold)] opacity-75" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--soft-gold)]" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--soft-gold)]/90">
                    Đang hành lễ
                  </span>
                </>
              ) : (
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                  Đang tĩnh tâm
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ===== Placeholder: Bông sen + hào quang SVG =====
function LotusPlaceholder({ active, size }: { active: boolean; size: number }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center transition-colors duration-700 ${
        active
          ? 'bg-gradient-to-b from-[#2a1e14] to-[#1a120a]'
          : 'bg-gradient-to-b from-[#1a1512] to-[#0f0c09]'
      }`}
    >
      <svg
  width={size * 0.55}
  height={size * 0.55}
  viewBox="0 0 100 100"
  fill="none"
  aria-hidden
>
  <defs>
    {/* Glow filter — pulse nhẹ */}
    <filter id="lotus-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    {/* Radial gradient cho aura tỏa ra từ tâm */}
    <radialGradient id="lotus-aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="var(--soft-gold)" stopOpacity="0.5" />
      <stop offset="60%" stopColor="var(--soft-gold)" stopOpacity="0.1" />
      <stop offset="100%" stopColor="var(--soft-gold)" stopOpacity="0" />
    </radialGradient>
  </defs>

  {/* Aura tỏa từ tâm — chỉ hiện khi đọc */}
  {active && (
    <circle
      cx="50"
      cy="50"
      r="40"
      fill="url(#lotus-aura)"
      className="animate-lotus-pulse origin-center"
    />
  )}

  {/* Hào quang vòng ngoài (giữ nguyên) */}
  <circle
    cx="50"
    cy="50"
    r="44"
    stroke="var(--soft-gold)"
    strokeWidth="0.4"
    strokeDasharray="1 3"
    opacity={active ? '0.6' : '0.25'}
    className={active ? 'origin-center animate-spin [animation-duration:20s]' : ''}
  />

  {/* Cánh sen + nhị — apply glow filter khi active */}
  <g transform="translate(50, 50)" filter={active ? 'url(#lotus-glow)' : undefined}>
    {/* 5 cánh */}
    {[0, 72, 144, 216, 288].map((angle) => (
      <path
        key={angle}
        d="M 0 -5 Q -10 -20, 0 -32 Q 10 -20, 0 -5 Z"
        fill="var(--soft-gold)"
        opacity={active ? '0.9' : '0.55'}
        transform={`rotate(${angle})`}
        className={active ? 'animate-lotus-pulse' : ''}
      />
    ))}
    {/* Nhị sen */}
    <circle
      r="5"
      fill="var(--soft-gold)"
      opacity={active ? '1' : '0.8'}
      className={active ? 'animate-lotus-pulse' : ''}
    />
    <circle r="2.5" fill="#0a0808" opacity="0.4" />
  </g>
</svg>
    </div>
  );
}
