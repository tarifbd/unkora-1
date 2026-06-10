'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { productsApi, type Product } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { isPreorderProduct } from '@/lib/preorder';
import { useLanguage } from '@/lib/i18n/language-context';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse flex flex-col">
      <div className="aspect-[4/3] bg-gray-200 flex-shrink-0" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="h-2 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-5 bg-gray-200 rounded w-2/5 mt-1" />
        <div className="h-9 bg-gray-200 rounded-xl mt-1" />
      </div>
    </div>
  );
}

export default function PreorderPage() {
  const { lang } = useLanguage();

  // Admin-marked pre-order products
  const { data: markedData, isLoading: loadingMarked } = useQuery({
    queryKey: ['products', 'preorder', 'marked'],
    queryFn: () => productsApi.getAll({ preorder: true, limit: 60 }),
    staleTime: 60_000,
  });

  // Low/zero-stock products (lowest stock first) — out-of-stock items auto pre-order
  const { data: lowStockData, isLoading: loadingLow } = useQuery({
    queryKey: ['products', 'preorder', 'low-stock'],
    queryFn: () => productsApi.getAll({ limit: 60, sortBy: 'stockQuantity', sortOrder: 'asc' }),
    staleTime: 60_000,
  });

  const products = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of markedData?.data ?? []) map.set(p.id, p);
    for (const p of lowStockData?.data ?? []) {
      if (isPreorderProduct(p)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [markedData, lowStockData]);

  const isLoading = loadingMarked || loadingLow;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6 sm:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #064e3b, #0d9488)' }}>
        <div className="absolute -right-8 -top-8 opacity-10">
          <CalendarClock className="w-40 h-40" />
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
            <CalendarClock className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'প্রি-অর্ডার' : 'Pre-Order'}
          </span>
          <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-black">
            {lang === 'bn' ? 'প্রি-অর্ডার সংগ্রহ' : 'Pre-Order Collection'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            {lang === 'bn'
              ? 'এই পণ্যগুলো এখনই অর্ডার করে রাখুন — স্টকে আসার সাথে সাথে সবার আগে আপনার কাছে পৌঁছে যাবে।'
              : 'Reserve these items now — out-of-stock and upcoming products you can secure before anyone else.'}
          </p>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center gap-3">
          <PackageOpen className="h-14 w-14 text-emerald-300" />
          <h2 className="font-bold text-lg">
            {lang === 'bn' ? 'এখন কোনো প্রি-অর্ডার পণ্য নেই' : 'No pre-order products right now'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {lang === 'bn'
              ? 'পণ্য স্টকে না থাকলে বা admin প্রি-অর্ডার হিসেবে চিহ্নিত করলে সেগুলো এখানে দেখা যাবে।'
              : 'Products that go out of stock or are marked as pre-order by admin will appear here automatically.'}
          </p>
          <Link
            href="/products"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:from-emerald-500 hover:to-emerald-600 transition-all"
          >
            {lang === 'bn' ? 'সব পণ্য দেখুন' : 'Browse Products'}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {lang === 'bn'
              ? `${products.length}টি পণ্য প্রি-অর্ডারের জন্য উপলব্ধ`
              : `${products.length} item${products.length !== 1 ? 's' : ''} available for pre-order`}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
