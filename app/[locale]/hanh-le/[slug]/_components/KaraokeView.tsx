'use client';

import { useEffect, useRef } from 'react';
import type { FlatLine } from './useKaraokeSync';

interface Props {
  lines: FlatLine[];
  activeIndex: number;
}

export function KaraokeView({ lines, activeIndex }: Props) {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div
      className="relative h-full overflow-y-auto scroll-smooth"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 70%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 70%, transparent 100%)',
      }}
    >
      <div className="min-h-full px-6 py-[35vh]">
        {lines.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          const distance = Math.abs(i - activeIndex);

          return (
            <div
              key={line.line_id}
              ref={isActive ? activeLineRef : null}
              className="py-3 text-center font-serif leading-relaxed transition-all duration-500"
              style={{
                fontSize: isActive ? '26px' : '19px',
                fontWeight: isActive ? 500 : 400,
                color: isActive
                  ? '#E8B84B'
                  : isPast
                    ? 'rgba(232,184,75,0.2)'
                    : `rgba(232,184,75,${Math.max(0.25, 0.55 - distance * 0.08)})`,
                textShadow: isActive
                  ? '0 0 20px rgba(232,184,75,0.4), 0 0 40px rgba(232,184,75,0.2)'
                  : 'none',
                letterSpacing: isActive ? '0.02em' : '0',
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
