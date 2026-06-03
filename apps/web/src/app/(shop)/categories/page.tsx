'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package } from 'lucide-react';
import { categoriesApi, type Category } from '@/lib/api/products';
import { useLanguage } from '@/lib/i18n/language-context';

const CAT_EMOJI: Record<string, string> = {
  books: '📚',
  'baby-products': '👶',
  'leather-products': '👜',
  'organic-foods': '🌿',
  handicrafts: '🎨',
  electronics: '⚡',
  'daily-needs': '🛒',
  'islamic-lifestyle': '🕌',
  default: '🏷️',
};

const CAT_GRADIENT: Record<string, string> = {
  books: 'from-blue-500 to-blue-700',
  'baby-products': 'from-pink-400 to-pink-600',
  'leather-products': 'from-amber-700 to-amber-900',
  'organic-foods': 'from-green-500 to-green-700',
  handicrafts: 'from-purple-500 to-purple-700',
  electronics: 'from-gray-600 to-gray-800',
  'daily-needs': 'from-orange-400 to-orange-600',
  'islamic-lifestyle': 'from-emerald-600 to-emerald-800',
  default: 'from-primary to-primary/80',
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function CategoryCard({ cat, lang }: { cat: Category; lang: string }) {
  const emoji = CAT_EMOJI[cat.slug] ?? CAT_EMOJI.default;
  const gradient = CAT_GRADIENT[cat.slug] ?? CAT_GRADIENT.default;
  const href = cat.slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : `/products?categorySlug=${cat.slug}`;
  const productCount = cat._count?.products ?? 0;

  return (
    <Link href={href}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Image / gradient banner */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden flex-shrink-0`}>
        {cat.imageUrl ? (
          <>
            <Image src={cat.imageUrl} alt={cat.name} fill
              className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
              unoptimized sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{emoji}</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm leading-snug">
            {cat.name}
          </h3>
          {cat.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cat.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          {productCount > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Package className="w-3 h-3" />
              {productCount.toLocaleString('en-BD')}{' '}
              {lang === 'bn' ? 'পণ্য' : 'products'}
            </span>
          )}
          <span className="ml-auto text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
            {lang === 'bn' ? 'দেখুন' : 'Browse'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesPage() {
  const { lang } = useLanguage();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: () => categoriesApi.getRoots(),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs text-gray-400 mb-2">
            <Link href="/" className="hover:text-primary">{lang === 'bn' ? 'হোম' : 'Home'}</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-700 font-medium">{lang === 'bn' ? 'সকল বিভাগ' : 'All Categories'}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {lang === 'bn' ? 'সকল বিভাগ' : 'All Categories'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {lang === 'bn'
              ? 'আপনার পছন্দের বিভাগ বেছে নিন এবং সেরা পণ্য আবিষ্কার করুন'
              : 'Choose your favourite category and discover the best products'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📂</div>
            <p className="text-gray-500">{lang === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No categories found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map(cat => (
              <CategoryCard key={cat.id} cat={cat} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
