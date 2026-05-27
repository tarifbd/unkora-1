'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Star, ArrowRight, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { ProductCard } from '@/components/product/product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';

/* ── Sub-categories ──────────────────────────────────────────── */
const SUB_CATS = [
  { slug: 'prayer-essentials',  icon: '🕌', label: 'নামাজের সরঞ্জাম', en: 'Prayer Essentials',  color: 'from-emerald-950 to-emerald-900', glow: '#10b981' },
  { slug: 'islamic-books',      icon: '📖', label: 'ইসলামিক বই',      en: 'Islamic Books',       color: 'from-slate-900 to-slate-800',     glow: '#6366f1' },
  { slug: 'quran-accessories',  icon: '✨', label: 'কুরআন অ্যাক্সেসরিজ', en: 'Quran Accessories', color: 'from-amber-950 to-amber-900',     glow: '#f59e0b' },
  { slug: 'islamic-clothing',   icon: '👘', label: 'পোশাক',            en: 'Islamic Clothing',    color: 'from-teal-950 to-teal-900',       glow: '#14b8a6' },
  { slug: 'perfumes-oud',       icon: '🌹', label: 'আতর ও ঊদ',         en: 'Perfumes & Oud',      color: 'from-rose-950 to-rose-900',       glow: '#f43f5e' },
  { slug: 'tasbih',             icon: '📿', label: 'তাসবিহ',           en: 'Tasbih & Dhikr',      color: 'from-violet-950 to-violet-900',   glow: '#8b5cf6' },
  { slug: 'islamic-home-decor', icon: '🏮', label: 'হোম ডেকোর',        en: 'Islamic Home Decor',  color: 'from-orange-950 to-orange-900',   glow: '#f97316' },
  { slug: 'kids-islamic',       icon: '⭐', label: 'শিশু ইসলামিক',     en: "Kids' Islamic",       color: 'from-cyan-950 to-cyan-900',       glow: '#06b6d4' },
];

/* ── Featured brands / collections ──────────────────────────── */
const COLLECTIONS = [
  {
    id: 'ramadan',
    title: 'রমজান কালেকশন',
    titleEn: 'Ramadan Collection',
    desc: 'রমজানের জন্য বিশেষভাবে কিউরেটেড পণ্য সমূহ',
    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=600&auto=format&fit=crop',
    href: '/categories/islamic-lifestyle?collection=ramadan',
    badge: 'Exclusive',
    badgeColor: '#f59e0b',
  },
  {
    id: 'premium-prayer',
    title: 'প্রিমিয়াম নামাজের সেট',
    titleEn: 'Premium Prayer Set',
    desc: 'জায়নামাজ, তাসবিহ, আতর — একসাথে গিফট প্যাক',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=600&auto=format&fit=crop',
    href: '/categories/islamic-lifestyle?collection=prayer-set',
    badge: 'Gift Pack',
    badgeColor: '#10b981',
  },
  {
    id: 'arabic-calligraphy',
    title: 'আরবি ক্যালিগ্রাফি আর্ট',
    titleEn: 'Arabic Calligraphy Art',
    desc: 'হাতে তৈরি ক্যালিগ্রাফি পেইন্টিং ও ওয়াল আর্ট',
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=600&auto=format&fit=crop',
    href: '/categories/islamic-lifestyle?collection=calligraphy',
    badge: 'Handmade',
    badgeColor: '#8b5cf6',
  },
];

/* ── Why choose section items ────────────────────────────────── */
const WHY_ITEMS = [
  { icon: '✅', title: '১০০% হালাল', desc: 'সব পণ্য যাচাইকৃত হালাল মান সম্পন্ন' },
  { icon: '🌍', title: 'বিশ্বমানের পণ্য', desc: 'সৌদি আরব, তুরস্ক ও ইন্দোনেশিয়া থেকে আমদানিকৃত' },
  { icon: '🚚', title: 'দ্রুত ডেলিভারি', desc: 'সারা বাংলাদেশে ২-৪ কার্যদিবসে পৌঁছে দিই' },
  { icon: '💚', title: 'ইসলামিক স্কলার অনুমোদিত', desc: 'বিশেষজ্ঞদের দ্বারা পর্যালোচনা করা পণ্য তালিকা' },
];

/* ── Islamic geometric SVG pattern ──────────────────────────── */
function GeometricPattern({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="islamic-geo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* 8-pointed star */}
          <g fill="none" stroke="currentColor" strokeWidth="0.5">
            <polygon points="40,4 50,30 76,30 56,46 64,72 40,56 16,72 24,46 4,30 30,30" />
            <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
            <circle cx="40" cy="40" r="16" />
            <line x1="40" y1="4" x2="40" y2="76" />
            <line x1="4" y1="40" x2="76" y2="40" />
            <line x1="16" y1="16" x2="64" y2="64" />
            <line x1="64" y1="16" x2="16" y2="64" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-geo)" color="white" />
    </svg>
  );
}

/* ── Arabic calligraphy SVG ──────────────────────────────────── */
function BismillahSVG({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="font-serif text-3xl sm:text-4xl text-white/90 tracking-wide"
        style={{ fontFamily: "'Lora', serif", direction: 'rtl', textShadow: '0 0 30px rgba(167,243,208,0.3)' }}
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export function IslamicLifestyleClient() {
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['islamic-lifestyle-products', activeTab],
    queryFn: () => productsApi.getAll({ categorySlug: activeTab === 'all' ? 'islamic-lifestyle' : activeTab, limit: 12 }),
    staleTime: 60000,
  });

  const productList = Array.isArray(products) ? products : (products as any)?.data ?? [];

  return (
    <div className="min-h-screen bg-[#0a0f0a]">

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <section className="relative min-h-[600px] sm:min-h-[680px] flex items-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#061a0e] via-[#0a2015] to-[#061210]" />
        <GeometricPattern opacity={0.07} />
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-700/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-teal-600/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-amber-600/8 blur-3xl" />
        </div>
        {/* Top & bottom gold lines */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Bismillah */}
          <BismillahSVG className="mb-6" />

          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-emerald-900/50 border border-emerald-700/50 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-[0.15em]">Islamic Lifestyle Collection</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            ইসলামিক{' '}
            <span className="relative">
              <span style={{ background: 'linear-gradient(135deg, #10b981, #34d399, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                লাইফস্টাইল
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" style={{ height: '6px' }}>
                <path d="M0 4 Q50 0 100 4 Q150 8 200 4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            বিশ্বমানের হালাল পণ্য — নামাজের সরঞ্জাম থেকে আতর পর্যন্ত,<br className="hidden sm:block" />
            আপনার ইসলামিক জীবনযাত্রাকে আরও সুন্দর করুন
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-white text-sm shadow-lg transition-all hover:scale-105 hover:shadow-emerald-900/50 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #047857, #10b981)', boxShadow: '0 8px 24px rgba(4,120,87,0.35)' }}
            >
              <Sparkles className="w-4 h-4" />
              পণ্য দেখুন
            </Link>
            <Link
              href="/categories/islamic-lifestyle?collection=ramadan"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-amber-300 text-sm border border-amber-600/40 bg-amber-900/20 backdrop-blur-sm hover:bg-amber-900/40 transition-all hover:scale-105"
            >
              <Star className="w-4 h-4" />
              রমজান স্পেশাল
            </Link>
          </div>

          {/* Trust stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12">
            {[
              { n: '৫০০+', l: 'হালাল পণ্য' },
              { n: '১২,০০০+', l: 'সন্তুষ্ট গ্রাহক' },
              { n: '১০০%', l: 'অথেনটিক' },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-black text-white">{n}</div>
                <div className="text-xs text-white/40 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SUB-CATEGORIES ══════════════════════════════════════════ */}
      <section className="relative bg-[#0c130c] py-14 sm:py-18">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <GeometricPattern opacity={0.04} />
        </div>
        {/* Gold top border */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Browse by Category</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">সকল ক্যাটাগরি</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {SUB_CATS.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-b border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-1 text-center"
                style={{
                  background: `linear-gradient(135deg, rgba(6,78,59,0.3), rgba(6,29,16,0.6))`,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `inset 0 0 30px ${cat.glow}15, 0 0 20px ${cat.glow}10` }} />

                <div
                  className="text-3xl w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform duration-300"
                  style={{ boxShadow: `0 4px 12px ${cat.glow}20` }}
                >
                  {cat.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-white/90 leading-tight">{cat.label}</p>
                  <p className="text-[9px] text-white/30 mt-0.5">{cat.en}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED COLLECTIONS ════════════════════════════════════ */}
      <section className="bg-[#080d08] py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Featured</p>
              <h2 className="text-2xl font-black text-white">স্পেশাল কালেকশন</h2>
            </div>
            <Link href="/categories/islamic-lifestyle" className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              সব দেখুন <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLLECTIONS.map((col, i) => (
              <Link key={col.id} href={col.href}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] sm:aspect-auto sm:h-64 block"
              >
                <Image src={col.image} alt={col.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 to-transparent" />
                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <span
                    className="inline-flex items-center self-start rounded-full px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider mb-2"
                    style={{ background: col.badgeColor }}
                  >
                    {col.badge}
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight mb-1">{col.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{col.desc}</p>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-3 group-hover:gap-2 transition-all">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS ════════════════════════════════════════════════ */}
      <section id="products" className="bg-[#0a100a] py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Our Products</p>
              <h2 className="text-2xl font-black text-white">ইসলামিক পণ্য সমূহ</h2>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-2xl p-1 border border-white/8 overflow-x-auto [scrollbar-width:none]">
              {[{ key: 'all', label: 'সব' }, ...SUB_CATS.slice(0,5).map(c => ({ key: c.slug, label: c.icon + ' ' + c.label }))].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="[&_.skeleton]:bg-white/5 [&_.skeleton]:from-white/5 [&_.skeleton]:via-white/10 [&_.skeleton]:to-white/5">
              <ProductGridSkeleton count={8} />
            </div>
          ) : productList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {productList.map((product: any) => (
                <div key={product.id} className="[&_.bg-white]:bg-[#111a11] [&_.border-gray-100]:border-white/8 [&_.text-gray-800]:text-white/90 [&_.text-gray-400]:text-white/40 [&_.bg-gray-50]:bg-white/5 [&_.hover\\:shadow-xl]:hover:shadow-emerald-900/30">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-24 space-y-4">
              <div className="text-6xl mb-4">🕌</div>
              <h3 className="text-xl font-black text-white/70">পণ্য শীঘ্রই আসছে</h3>
              <p className="text-white/30 text-sm max-w-sm mx-auto">এই ক্যাটাগরিতে নতুন পণ্য যোগ করা হচ্ছে। আমাদের নিউজলেটার সাবস্ক্রাইব করুন।</p>
              <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-bold hover:text-emerald-300 transition-colors mt-4">
                হোম পেজে ফিরুন <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {productList.length > 0 && (
            <div className="text-center mt-10">
              <Link
                href="/categories/islamic-lifestyle"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-white text-sm border border-emerald-700/40 bg-emerald-900/20 hover:bg-emerald-900/40 transition-all hover:scale-105"
              >
                সব পণ্য দেখুন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══ WHY CHOOSE ══════════════════════════════════════════════ */}
      <section className="relative bg-[#060b06] py-14 sm:py-18 overflow-hidden">
        <GeometricPattern opacity={0.05} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-600/25 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Why Choose Us</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">আমরা কেন আলাদা</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_ITEMS.map((item, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-3xl border border-white/6 bg-gradient-to-b from-white/4 to-transparent hover:border-emerald-700/40 transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(4,120,87,0.12), transparent 70%)' }} />
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-black text-white text-base mb-2">{item.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#064e3b] to-[#065f46]" />
        <GeometricPattern opacity={0.08} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <BismillahSVG className="mb-6 opacity-60" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            আপনার ইসলামিক পণ্য <br className="sm:hidden" />
            <span style={{ background: 'linear-gradient(90deg,#34d399,#a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              সেল করুন UNKORA তে
            </span>
          </h2>
          <p className="text-white/60 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
            আপনার হালাল পণ্য লক্ষ মুসলিম গ্রাহকের কাছে পৌঁছে দিন। আজই সেলার হিসেবে যোগ দিন।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/publish"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}
            >
              <Zap className="w-4 h-4" />
              সেলার হিসেবে যোগ দিন
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white/80 text-sm border border-white/15 bg-white/5 hover:bg-white/10 transition-all hover:scale-105">
              হোম পেজ
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
