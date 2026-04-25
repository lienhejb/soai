'use client';

import { useRef, useState } from 'react';

export function PlayButton({ slug }: { slug: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function handlePlay() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    const audio = audioRef.current;
    if (audio) {
      audio.src = `/api/tts?slug=${slug}&t=${Date.now()}`;
      try {
        await audio.play();
        setPlaying(true);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        onClick={handlePlay}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-4 font-bold tracking-widest text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 disabled:opacity-60"
      >
        {loading ? 'ĐANG TẢI...' : playing ? '⏸ TẠM DỪNG' : '▶ NGHE THỬ'}
      </button>
    </>
  );
}