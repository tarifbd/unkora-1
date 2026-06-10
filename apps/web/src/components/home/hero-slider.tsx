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

interface Slide {
  id: string;
  imageUrl: string;
  linkUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  badge?: string;
  accentColor: string;
  accentFrom: string;
  accentTo: string;
}

/* ─── 8 Category Slides ──────────────────────────────────────────────────── */
const CATEGORY_SLIDES: Slide[] = [
  {
    id: 'cat-books',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=books',
    title: 'বাংলাদেশের সেরা বইয়ের দোকান',
    subtitle: '১ লাখেরও বেশি বই • সেরা দামে • দ্রুত ডেলিভারি',
    ctaText: 'বই দেখুন',
    badge: '📚 বই',
    accentColor: '#2563eb',
    accentFrom: '#1d4ed8',
    accentTo: '#3b82f6',
  },
  {
    id: 'cat-baby',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=baby-products',
    title: 'শিশুর জন্য সেরা পণ্য',
    subtitle: 'ডায়াপার, খেলনা, শিশু পোশাক ও আরও অনেক কিছু',
    ctaText: 'শিশু পণ্য দেখুন',
    badge: '👶 শিশু পণ্য',
    accentColor: '#db2777',
    accentFrom: '#be185d',
    accentTo: '#ec4899',
  },
  {
    id: 'cat-leather',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=leather-products',
    title: 'হাতে তৈরি প্রিমিয়াম লেদার পণ্য',
    subtitle: 'ব্যাগ, ওয়ালেট, বেল্ট — খাঁটি চামড়ার তৈরি',
    ctaText: 'চামড়া পণ্য দেখুন',
    badge: '👜 চামড়া পণ্য',
    accentColor: '#92400e',
    accentFrom: '#78350f',
    accentTo: '#b45309',
  },
  {
    id: 'cat-organic',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=organic-foods',
    title: 'খাঁটি অর্গানিক খাবার',
    subtitle: 'মধু, বাদাম, মশলা — সরাসরি উৎস থেকে, কোনো ভেজাল নেই',
    ctaText: 'অর্গানিক পণ্য দেখুন',
    badge: '🌿 অর্গানিক',
    accentColor: '#16a34a',
    accentFrom: '#15803d',
    accentTo: '#22c55e',
  },
  {
    id: 'cat-islamic',
    imageUrl: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/islamic-lifestyle',
    title: 'ইসলামিক লাইফস্টাইল পণ্য',
    subtitle: 'জায়নামাজ, তাসবিহ, আতর, পাঞ্জাবি ও আরও',
    ctaText: 'ইসলামিক পণ্য দেখুন',
    badge: '🕌 ইসলামিক',
    accentColor: '#065f46',
    accentFrom: '#064e3b',
    accentTo: '#059669',
  },
  {
    id: 'cat-handicrafts',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=handicrafts',
    title: 'বাংলাদেশের ঐতিহ্যবাহী হস্তশিল্প',
    subtitle: 'নকশি কাঁথা, মাটির জিনিস, জামদানি ও বাঙালি শিল্প',
    ctaText: 'হস্তশিল্প দেখুন',
    badge: '🎨 হস্তশিল্প',
    accentColor: '#7c3aed',
    accentFrom: '#6d28d9',
    accentTo: '#8b5cf6',
  },
  {
    id: 'cat-electronics',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=electronics',
    title: 'সেরা দামে ইলেকট্রনিক্স পণ্য',
    subtitle: 'মোবাইল, ল্যাপটপ, গ্যাজেট — অফিশিয়াল ওয়ারেন্টি সহ',
    ctaText: 'ইলেকট্রনিক্স দেখুন',
    badge: '⚡ ইলেকট্রনিক্স',
    accentColor: '#0f172a',
    accentFrom: '#020617',
    accentTo: '#1e293b',
  },
  {
    id: 'cat-daily',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop',
    linkUrl: '/products?categorySlug=daily-needs',
    title: 'দৈনন্দিন প্রয়োজনীয় সব কিছু',
    subtitle: 'মুদি পণ্য, ব্যক্তিগত যত্ন, গৃহস্থালি — এক জায়গায়',
    ctaText: 'দৈনন্দিন পণ্য দেখুন',
    badge: '🛒 দৈনন্দিন',
    accentColor: '#ea580c',
    accentFrom: '#c2410c',
    accentTo: '#f97316',
  },
];

const ROTATE_MS = 4500;

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

  const slides: Slide[] = adminSlides.length > 0
    ? adminSlides.map(s => ({
        id: s.id,
        imageUrl: s.imageUrl,
        linkUrl: s.linkUrl ?? '/',
        title: s.title,
        subtitle: s.subtitle ?? '',
        ctaText: s.ctaText ?? (lang === 'bn' ? 'দেখুন' : 'Shop Now'),
        accentColor: '#6366f1',
        accentFrom: '#4f46e5',
        accentTo: '#818cf8',
      }))
    : CATEGORY_SLIDES;

  const count = slides.length;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [animKey, setAnimKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((next: number) => {
    const resolved = (next + count) % count;
    setDir(resolved === (idx + 1) % count || (idx === count - 1 && resolved === 0) ? 'next' : 'prev');
    setIdx(resolved);
    setAnimKey(k => k + 1);
  }, [idx, count]);

  const prev = useCallback(() => {
    setDir('prev');
    setIdx(i => (i - 1 + count) % count);
    setAnimKey(k => k + 1);
  }, [count]);

  const next = useCallback(() => {
    setDir('next');
    setIdx(i => (i + 1) % count);
    setAnimKey(k => k + 1);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    timer.current = setInterval(() => {
      setDir('next');
      setIdx(i => (i + 1) % count);
      setAnimKey(k => k + 1);
    }, ROTATE_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count, paused]);

  const slide = slides[idx] ?? slides[0];
  if (!slide) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-gray-900 select-none h-[220px] sm:h-[300px] md:h-[390px] lg:h-[460px] xl:h-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* ── Slides ────────────────────────────────────────────────────────── */}
      {slides.map((s, i) => {
        const isActive = i === idx;
        return (
          <div
            key={s.id}
            className="absolute inset-0"
            style={{
              zIndex: isActive ? 10 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {/* Background image — always rendered to preload, Ken Burns only when active */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ opacity: isActive ? 1 : 0, transition: 'opacity 600ms ease-in-out' }}
            >
              <Image
                src={s.imageUrl}
                alt={s.title}
                fill
                priority={i === 0}
                unoptimized
                className="object-cover"
                style={isActive
                  ? { animation: `hs-kenburns ${ROTATE_MS + 2000}ms ease-out forwards` }
                  : { transform: 'scale(1)' }}
                sizes="(max-width: 768px) 100vw, 1400px"
              />
            </div>

            {/* Color accent gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(105deg, ${s.accentFrom}dd 0%, ${s.accentFrom}88 35%, transparent 65%)`,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 600ms ease-in-out',
              }}
            />
            {/* Dark base overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Shimmer sweep — fires on entry */}
            {isActive && (
              <div
                key={`shimmer-${animKey}`}
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ zIndex: 5 }}
              >
                <div style={{ animation: 'hs-shimmer 900ms ease-out forwards', animationDelay: '100ms' }}
                  className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent -left-24"
                />
              </div>
            )}

            {/* ── Slide Content ──────────────────────────────────────────── */}
            {isActive && (
              <Link
                href={s.linkUrl}
                key={`content-${animKey}`}
                className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 md:p-12"
                style={{
                  zIndex: 10,
                  animation: `hs-slide-${dir} 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                }}
              >
                <div className="max-w-2xl">
                  {/* Badge */}
                  {s.badge && (
                    <span
                      className="inline-block mb-2 sm:mb-3 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white rounded-full shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${s.accentFrom}, ${s.accentTo})`,
                        animation: 'hs-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms both',
                      }}
                    >
                      {s.badge}
                    </span>
                  )}

                  {/* Title */}
                  <h1
                    className="text-xl sm:text-2xl md:text-3xl lg:text-[2.4rem] font-black text-white leading-tight mb-1.5 sm:mb-2 drop-shadow-lg"
                    style={{ animation: 'hs-fadeup 600ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both' }}
                  >
                    {s.title}
                  </h1>

                  {/* Subtitle — hidden on very small phones to save space */}
                  {s.subtitle && (
                    <p
                      className="hidden sm:block text-white/80 text-sm sm:text-base mb-4 sm:mb-5 drop-shadow max-w-lg line-clamp-2"
                      style={{ animation: 'hs-fadeup 600ms cubic-bezier(0.16, 1, 0.3, 1) 370ms both' }}
                    >
                      {s.subtitle}
                    </p>
                  )}

                  {/* Subtitle short — only on very small phones */}
                  {s.subtitle && (
                    <p className="sm:hidden text-white/75 text-[11px] mb-2.5 drop-shadow line-clamp-1"
                      style={{ animation: 'hs-fadeup 600ms cubic-bezier(0.16, 1, 0.3, 1) 370ms both' }}>
                      {s.subtitle}
                    </p>
                  )}

                  {/* CTA */}
                  <span
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-xl hover:brightness-110 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${s.accentFrom}, ${s.accentTo})`,
                      animation: 'hs-fadeup 600ms cubic-bezier(0.16, 1, 0.3, 1) 470ms both',
                      boxShadow: `0 8px 32px ${s.accentColor}66`,
                    }}
                  >
                    {s.ctaText}
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        );
      })}

      {/* ── Category dot tabs ─────────────────────────────────────────────── */}
      {count > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={e => { e.preventDefault(); goTo(i); }}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300 rounded-full overflow-hidden"
              style={{
                width: i === idx ? 24 : 7,
                height: 7,
                background: i === idx
                  ? `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})`
                  : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Prev / Next ───────────────────────────────────────────────────── */}
      {count > 1 && (
        <>
          <button
            onClick={e => { e.preventDefault(); prev(); }}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={e => { e.preventDefault(); next(); }}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      {count > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-black/20">
          <div
            key={`pb-${animKey}`}
            className="h-full"
            style={{
              animation: `hs-grow ${ROTATE_MS}ms linear forwards`,
              background: `linear-gradient(90deg, ${slide.accentFrom}, ${slide.accentTo})`,
            }}
          />
        </div>
      )}

      {/* ── Keyframe animations ───────────────────────────────────────────── */}
      <style>{`
        @keyframes hs-slide-next {
          0%   { transform: translateX(5%) scale(1.03); opacity: 0; filter: blur(6px); }
          55%  { filter: blur(0px); }
          70%  { transform: translateX(-0.8%) scale(1.005); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes hs-slide-prev {
          0%   { transform: translateX(-5%) scale(1.03); opacity: 0; filter: blur(6px); }
          55%  { filter: blur(0px); }
          70%  { transform: translateX(0.8%) scale(1.005); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes hs-kenburns {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.14) translate(-1.5%, -0.5%); }
        }
        @keyframes hs-fadeup {
          0%   { transform: translateY(22px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes hs-pop {
          0%   { transform: scale(0.6) translateY(10px); opacity: 0; }
          65%  { transform: scale(1.1) translateY(-2px);  opacity: 1; }
          100% { transform: scale(1)   translateY(0);      opacity: 1; }
        }
        @keyframes hs-shimmer {
          0%   { transform: translateX(-150%) skewX(-15deg); opacity: 1; }
          100% { transform: translateX(350%)  skewX(-15deg); opacity: 0; }
        }
        @keyframes hs-grow {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
