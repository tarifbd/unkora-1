'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Flame, ShoppingCart, Zap, ChevronLeft, ChevronRight, Clock, Heart } from 'lucide-react';
import api from '@/lib/api';
import { productsApi, type Product } from '@/lib/api/products';
import { useCart } from '@/lib/hooks/use-cart';
import { useLanguage } from '@/lib/i18n/language-context';

/* ── Countdown ── */
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

/* ── Flash Deal Product Card ── */
function FlashCard({ product, lang }: { product: Product; lang: string }) {
  const { addItem } = useCart();
  const img = product.images?.[0]?.url;
  const salePrice = Number(product.salePrice ?? product.basePrice);
  const basePrice = Number(product.basePrice);
  const hasDiscount = product.salePrice && salePrice < basePrice;
  const discount = hasDiscount ? Math.round((1 - salePrice / basePrice) * 100) : 0;
  const inStock = product.stockQuantity > 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
      <Link href={`/products/${product.slug}`} className="relative h-52 bg-gray-50 overflow-hidden flex-shrink-0 block">
        {img ? (
          <Image src={img} alt={product.name} fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized={img.includes('unsplash') || img.includes('picsum')}
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl bg-gray-100">📦</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">-{discount}%</span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
            </span>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        {product.category?.name && (
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 truncate">{product.category.name}</p>
        )}
        <Link href={`/products/${product.slug}`} className="flex-1">
          <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </p>
          {product.bookDetail?.author && (
            <p className="text-xs text-gray-400 truncate mt-1">{product.bookDetail.author}</p>
          )}
        </Link>

        <div className="flex items-baseline gap-2 mt-2 mb-3">
          <span className="text-lg font-black text-gray-900">৳{salePrice.toLocaleString('en-BD')}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">৳{basePrice.toLocaleString('en-BD')}</span>
          )}
        </div>

        {/* ADD TO CART + Wishlist */}
        <div className="flex gap-2 mb-2">
          <button
            disabled={!inStock}
            onClick={() => inStock && addItem.mutate({ productId: product.id, quantity: 1, guestData: { name: product.name, price: salePrice, image: img, slug: product.slug } })}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-black transition-all ${inStock ? 'bg-[#1e293b] text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'কার্টে যোগ' : 'ADD TO CART'}
          </button>
          <button
            aria-label="Wishlist"
            className="w-9 h-9 flex-shrink-0 rounded-xl border border-orange-200 bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
            <Heart className="w-4 h-4 text-orange-500" fill="currentColor" />
          </button>
        </div>

        {/* BUY NOW */}
        {inStock ? (
          <Link href={`/checkout?productId=${product.id}&qty=1`}
            className="flex items-center justify-center gap-1.5 h-9 bg-orange-500 text-white rounded-xl text-xs font-black hover:bg-orange-600 active:scale-95 transition-all">
            <Zap className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'এখনই কিনুন' : 'BUY NOW'}
          </Link>
        ) : (
          <div className="h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-xs font-black">
            {lang === 'bn' ? 'অনুপলব্ধ' : 'OUT OF STOCK'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse flex flex-col">
      <div className="h-52 bg-gray-200 flex-shrink-0" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="h-2 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-2/5 mt-1" />
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-9 bg-gray-200 rounded-xl" />
          <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
        </div>
        <div className="h-9 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

interface FlashDealItem {
  id: string;
  title: string;
  discountType: string;
  discountValue: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  products: Product[];
}

export default function FlashDealsPage() {
  const { lang } = useLanguage();
  const [page, setPage] = useState(1);
  const limit = 24;

  /* Active flash deals from flash-deals API */
  const { data: flashDeals, isLoading: loadingDeals } = useQuery<FlashDealItem[]>({
    queryKey: ['flash-deals-active'],
    queryFn: () => api.get('/flash-deals').then(r => r.data?.data ?? r.data ?? []),
    staleTime: 60_000,
  });

  /* Fallback: all discounted products */
  const { data: discountedData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'discounted', page],
    queryFn: () => productsApi.getAll({ limit, page, hasDiscount: true, sortBy: 'salePrice', sortOrder: 'asc' }),
    staleTime: 60_000,
  });

  const discountedProducts = discountedData?.data ?? [];
  const totalPages = discountedData?.meta?.totalPages ?? 1;

  /* Collect products from flash deals */
  const flashDealProducts: Product[] = flashDeals?.flatMap(d => d.products ?? []) ?? [];
  const allProducts = flashDealProducts.length > 0 ? flashDealProducts : discountedProducts;
  const isLoading = loadingDeals || (flashDealProducts.length === 0 && loadingProducts);

  /* Countdown to midnight */
  const endOfDay = useRef((() => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    return d;
  })()).current;
  const countdown = useCountdown(endOfDay);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-red-700 via-red-600 to-orange-500 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-yellow-300 animate-bounce" />
              <span className="text-yellow-200 text-sm font-bold uppercase tracking-widest">
                {lang === 'bn' ? 'ফ্ল্যাশ ডিল' : 'Flash Deals'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              {lang === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited Time Offers'}
            </h1>
            <p className="text-orange-100 mt-1 text-sm">
              {lang === 'bn' ? 'সেরা দামে সেরা পণ্য — সময় শেষ হওয়ার আগেই কিনুন!' : 'Best products at the best prices — before time runs out!'}
            </p>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-orange-200 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'অফার শেষ হচ্ছে' : 'Offer ends in'}
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

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-5">

        {/* Stats bar */}
        <div className="bg-white rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-red-600 font-black">
            <Flame className="w-4 h-4" />
            <span>
              {isLoading ? '...' : allProducts.length}{' '}
              {lang === 'bn' ? 'পণ্য ডিলে' : 'products on deal'}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-gray-500">
            {lang === 'bn' ? 'সর্বোচ্চ ৭০% পর্যন্ত ছাড়' : 'Up to 70% discount'}
          </span>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-gray-500">
            {lang === 'bn' ? '⚡ সীমিত স্টক' : '⚡ Limited stock'}
          </span>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😔</div>
            <p className="text-gray-500 font-medium">
              {lang === 'bn' ? 'এই মুহূর্তে কোনো ফ্ল্যাশ ডিল নেই' : 'No flash deals at the moment'}
            </p>
            <Link href="/products" className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
              {lang === 'bn' ? 'সব পণ্য দেখুন' : 'Browse All Products'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allProducts.map(p => <FlashCard key={p.id} product={p} lang={lang} />)}
          </div>
        )}

        {/* Pagination (for discounted products fallback) */}
        {!isLoading && flashDealProducts.length === 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
