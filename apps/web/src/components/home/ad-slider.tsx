'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';

/* Admin-managed promotional ad slider.
   Banners are created in Admin → Content → Banners & Sliders with
   position = "AD_SLIDER". Falls back to `fallback` when none exist so the
   slot is never empty. */

interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  order?: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

const ROTATE_MS = 4500;

export function AdSlider({ fallback, lang = 'en' }: { fallback?: React.ReactNode; lang?: 'en' | 'bn' }) {
  const { data } = useQuery<AdBanner[]>({
    queryKey: ['ad-slider-banners'],
    queryFn: () =>
      api.get('/design/banners').then(r => (r.data?.data ?? r.data ?? []) as AdBanner[]).catch(() => []),
    staleTime: 60_000,
  });

  const now = Date.now();
  const slides = (data ?? [])
    .filter(b => b.position === 'AD_SLIDER' && b.isActive)
    .filter(b => (!b.startsAt || new Date(b.startsAt).getTime() <= now) && (!b.endsAt || new Date(b.endsAt).getTime() >= now))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;
  const go = useCallback((next: (i: number) => number) => setIdx(i => (count ? (next(i) + count) % count : 0)), [count]);

  useEffect(() => { if (idx >= count) setIdx(0); }, [count, idx]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % count), ROTATE_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count, paused]);

  // No admin banners → render the provided fallback (e.g. flash-sale teaser)
  if (count === 0) return <>{fallback ?? null}</>;

  const active = slides[idx];

  return (
    <div
      className="group relative rounded-xl overflow-hidden min-h-[140px] sm:min-h-[180px] h-full bg-gray-900 shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides stack (cross-fade) */}
      {slides.map((s, i) => {
        const inner = (
          <>
            <Image
              src={s.imageUrl}
              alt={s.title}
              fill
              className={`object-cover transition-transform duration-[6000ms] ease-out ${i === idx ? 'scale-110' : 'scale-100'}`}
              sizes="(max-width: 768px) 100vw, 360px"
              priority={i === 0}
            />
            {/* Cinematic gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            {/* Top sheen */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            {/* Ad label + content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
              <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm ring-1 ring-white/20">
                {lang === 'bn' ? 'বিজ্ঞাপন' : 'Featured'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow line-clamp-2">
                {s.title}
              </h3>
              {s.linkUrl && (
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-gray-900 shadow-md transition-all group-hover:bg-yellow-400">
                  {lang === 'bn' ? 'দেখুন' : 'Shop Now'}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </>
        );

        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
          >
            {s.linkUrl ? (
              <Link href={s.linkUrl} className="block h-full w-full" aria-label={s.title}>
                {inner}
              </Link>
            ) : (
              <div className="h-full w-full">{inner}</div>
            )}
          </div>
        );
      })}

      {/* Glass dots */}
      {count > 1 && (
        <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.preventDefault(); e.stopPropagation(); go(() => i); }}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
