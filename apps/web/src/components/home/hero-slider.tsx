'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

interface HeroBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  subtitle?: string;
  ctaText?: string;
  position: string;
  order?: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface StaticSlide {
  id: string;
  imageUrl: string;
  linkUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  badge?: string;
  accentColor: string;
}

const STATIC_SLIDES: StaticSlide[] = [
  {
    id: 's1',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/books',
    title: 'বাংলাদেশের সেরা বইয়ের দোকান',
    subtitle: '১ লাখেরও বেশি বই • সেরা দামে • দ্রুত ডেলিভারি',
    ctaText: 'বই দেখুন',
    badge: 'নতুন সংযোজন',
    accentColor: '#2563eb',
  },
  {
    id: 's2',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/flash-deals',
    title: 'মেগা সেল — ৭০% পর্যন্ত ছাড়!',
    subtitle: 'সীমিত সময়ের অফার • আজই সুযোগ নিন',
    ctaText: 'অফার দেখুন',
    badge: 'ফ্ল্যাশ সেল',
    accentColor: '#dc2626',
  },
  {
    id: 's3',
    imageUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/categories/organic-foods',
    title: 'খাঁটি অর্গানিক পণ্য',
    subtitle: 'সরাসরি উৎস থেকে • কোনো ভেজাল নেই',
    ctaText: 'কিনুন',
    badge: '১০০% অর্গানিক',
    accentColor: '#16a34a',
  },
  {
    id: 's4',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/categories/leather-products',
    title: 'হাতে তৈরি লেদার পণ্য',
    subtitle: 'প্রিমিয়াম মানের চামড়ার ব্যাগ, ওয়ালেট ও আরও',
    ctaText: 'দেখুন',
    badge: 'হস্তশিল্প',
    accentColor: '#92400e',
  },
];

const ROTATE_MS = 5000;

export function HeroSlider({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  const { data } = useQuery<HeroBanner[]>({
    queryKey: ['hero-slider-banners'],
    queryFn: () =>
      api.get('/design/banners').then(r => (r.data?.data ?? r.data ?? []) as HeroBanner[]).catch(() => []),
    staleTime: 60_000,
  });

  const now = Date.now();
  const adminSlides = (data ?? [])
    .filter(b => b.position === 'HERO_SLIDER' && b.isActive)
    .filter(b => (!b.startsAt || new Date(b.startsAt).getTime() <= now) && (!b.endsAt || new Date(b.endsAt).getTime() >= now))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const slides = adminSlides.length > 0
    ? adminSlides.map(s => ({
        id: s.id,
        imageUrl: s.imageUrl,
        linkUrl: s.linkUrl ?? '/',
        title: s.title,
        subtitle: s.subtitle ?? '',
        ctaText: s.ctaText ?? (lang === 'bn' ? 'দেখুন' : 'Shop Now'),
        accentColor: '#6366f1',
      } as StaticSlide))
    : STATIC_SLIDES;

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = slides.length;

  const goTo = useCallback((next: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setIdx((next + count) % count);
    setTimeout(() => setTransitioning(false), 600);
  }, [count, transitioning]);

  const prev = useCallback(() => goTo(idx - 1), [idx, goTo]);
  const next = useCallback(() => goTo(idx + 1), [idx, goTo]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % count), ROTATE_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count, paused]);

  const slide = slides[idx] ?? slides[0];
  if (!slide) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-gray-900 select-none"
      style={{ height: 'clamp(220px, 40vw, 480px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
        >
          <Image
            src={s.imageUrl}
            alt={s.title}
            fill
            priority={i === 0}
            unoptimized
            className={`object-cover transition-transform duration-[8000ms] ease-out ${i === idx ? 'scale-110' : 'scale-100'}`}
            sizes="(max-width: 768px) 100vw, 1400px"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Content */}
          <Link href={s.linkUrl} className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12 z-10">
            <div className="max-w-xl">
              {s.badge && (
                <span
                  className="inline-block mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white rounded-full"
                  style={{ backgroundColor: s.accentColor }}
                >
                  {s.badge}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-lg">
                {s.title}
              </h1>
              {s.subtitle && (
                <p className="text-white/75 text-sm sm:text-base mb-5 drop-shadow">
                  {s.subtitle}
                </p>
              )}
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-sm text-white shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: s.accentColor }}
              >
                {s.ctaText}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      ))}

      {/* Prev / Next arrows */}
      {count > 1 && (
        <>
          <button
            onClick={e => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={e => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.preventDefault(); goTo(i); }}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {count > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px] bg-white/20">
          <div
            key={idx}
            className="h-full bg-white/80"
            style={{ animation: `grow ${ROTATE_MS}ms linear forwards` }}
          />
        </div>
      )}

      <style>{`@keyframes grow { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
