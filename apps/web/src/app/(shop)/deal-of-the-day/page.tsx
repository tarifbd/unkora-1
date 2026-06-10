'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Sun, Clock, Flame, ShoppingCart, Zap, ArrowRight } from 'lucide-react';
import { productsApi, type Product } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useLanguage } from '@/lib/i18n/language-context';

function pad(n: number) { return String(n).padStart(2, '0'); }

function useCountdown(target: Date) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
      setT({ h: Math.floor(d / 3600), m: Math.floor((d % 3600) / 60), s: d % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

export default function DealOfTheDayPage() {
  const { lang } = useLanguage();
  const { addItem } = useCart();
  const endOfDay = useRef((() => { const d = new Date(); d.setHours(23, 59, 59, 0); return d; })()).current;
  const countdown = useCountdown(endOfDay);

  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['products', 'deal-of-day'],
    queryFn: () => productsApi.getAll({ limit: 12, hasDiscount: true, sortBy: 'salePrice', sortOrder: 'asc' } as Parameters<typeof productsApi.getAll>[0]),
    staleTime: 60_000,
  });
  const deals = (dealsData?.data ?? []).filter(p => p.salePrice && Number(p.salePrice) < Number(p.basePrice));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-700 via-orange-600 to-yellow-500 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-6 h-6 text-yellow-200 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-yellow-200 text-sm font-bold uppercase tracking-widest">
                {lang === 'bn' ? 'আজকের ডিল' : 'Deal of the Day'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              {lang === 'bn' ? 'আজকের সেরা অফার' : "Today's Best Deals"}
            </h1>
            <p className="text-orange-100 mt-1 text-sm">
              {lang === 'bn' ? 'প্রতিদিন নতুন অফার — মিডনাইটের আগেই কিনুন!' : 'Fresh deals every day — grab them before midnight!'}
            </p>
          </div>
          {/* Countdown */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-orange-200 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'ডিল শেষ হচ্ছে' : 'Deals end in'}
            </div>
            <div className="flex gap-2">
              {[
                { v: pad(countdown.h), l: lang === 'bn' ? 'ঘণ্টা' : 'HRS' },
                { v: pad(countdown.m), l: lang === 'bn' ? 'মিনিট' : 'MIN' },
                { v: pad(countdown.s), l: lang === 'bn' ? 'সেকেন্ড' : 'SEC' },
              ].map(({ v, l }, i) => (
                <div key={l} className="flex items-center gap-2">
                  <div className="bg-black/30 backdrop-blur-sm text-white rounded-xl px-3 py-2 text-center min-w-[52px]">
                    <div className="text-2xl font-black leading-none">{v}</div>
                    <div className="text-[9px] opacity-60 mt-0.5 uppercase tracking-wider">{l}</div>
                  </div>
                  {i < 2 && <span className="text-yellow-300 font-black text-xl">:</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-6">
        {/* Stats */}
        <div className="bg-white rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-orange-600 font-black">
            <Flame className="w-4 h-4" />
            <span>{isLoading ? '...' : deals.length} {lang === 'bn' ? 'টি ডিল আজকের জন্য' : 'deals available today'}</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-gray-500">{lang === 'bn' ? 'প্রতিদিন রাত ১২টায় রিফ্রেশ হয়' : 'Refreshes at midnight every day'}</span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl animate-pulse">
                <div className="h-44 bg-gray-200 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-9 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">☀️</div>
            <p className="text-gray-500 font-medium">
              {lang === 'bn' ? 'আজকের ডিল শীঘ্রই আসছে' : "Today's deals are coming soon"}
            </p>
            <Link href="/flash-deals" className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors">
              {lang === 'bn' ? 'ফ্ল্যাশ ডিল দেখুন' : 'See Flash Deals'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {deals.map(p => {
              const img = p.images?.[0]?.url;
              const salePrice = Number(p.salePrice ?? p.basePrice);
              const basePrice = Number(p.basePrice);
              const discount = Math.round((1 - salePrice / basePrice) * 100);
              const inStock = p.stockQuantity > 0;
              return (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                  <Link href={`/products/${p.slug}`} className="relative h-44 bg-gray-50 overflow-hidden flex-shrink-0 block">
                    {img ? (
                      <Image src={img} alt={p.name} fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized={img.includes('unsplash')} sizes="(max-width:640px) 50vw, 25vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl bg-gray-100">📦</div>
                    )}
                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">-{discount}%</span>
                  </Link>
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/products/${p.slug}`} className="flex-1">
                      <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{p.name}</p>
                    </Link>
                    <div className="flex items-baseline gap-1.5 mt-2 mb-2">
                      <span className="text-sm font-black text-gray-900">৳{salePrice.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 line-through">৳{basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1.5 mb-1.5">
                      <button
                        disabled={!inStock}
                        onClick={() => inStock && addItem.mutate({ productId: p.id, quantity: 1, guestData: { name: p.name, price: salePrice, image: img, slug: p.slug } })}
                        className={`flex-1 flex items-center justify-center gap-1 h-8 rounded-xl text-[10px] font-black transition-all ${inStock ? 'bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-md shadow-slate-900/40 hover:from-slate-600 hover:to-slate-800 active:scale-95 ring-1 ring-white/10' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                        <ShoppingCart className="w-3 h-3" />
                        {lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}
                      </button>
                    </div>
                    {inStock ? (
                      <Link href={`/checkout?productId=${p.id}&qty=1`}
                        className="flex items-center justify-center gap-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-xl text-[10px] font-black shadow-md shadow-orange-500/40 hover:from-orange-300 hover:to-orange-500 active:scale-95 transition-all ring-1 ring-white/20">
                        <Zap className="w-3 h-3" />
                        {lang === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}
                      </Link>
                    ) : (
                      <div className="h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-[10px] font-black">
                        {lang === 'bn' ? 'স্টক নেই' : 'Out of Stock'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
