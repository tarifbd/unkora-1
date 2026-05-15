'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Package, Briefcase, Leaf, Layers, Zap,
  ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck, Headphones, Star,
} from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { formatCurrency } from '@/lib/utils';

/* ─────────────────────────── static data ─────────────────────────── */

const HERO_SLIDES = [
  {
    title: 'The Ultimate Book Fair 2026',
    bg: 'from-blue-600 to-blue-800',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Summer Reading Collection',
    bg: 'from-orange-500 to-orange-700',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Must Have Classics',
    bg: 'from-emerald-600 to-emerald-800',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
  },
];

const QUICK_CATS = [
  { icon: BookOpen,  title: 'Books',          count: '24.5k+', slug: '/books' },
  { icon: Package,   title: 'Baby Products',  count: '8.2k+',  slug: '/categories/baby-products' },
  { icon: Briefcase, title: 'Leather Goods',  count: '3.1k+',  slug: '/categories/leather-products' },
  { icon: Leaf,      title: 'Organic Foods',  count: '1.5k+',  slug: '/categories/organic-foods' },
  { icon: Layers,    title: 'Handicrafts',    count: '5.4k+',  slug: '/categories/handicrafts' },
  { icon: Zap,       title: 'Electronics',    count: '12.3k+', slug: '/categories/electronics' },
];

const CAT_HIGHLIGHTS = [
  {
    title: 'Academic Books',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990bc6?q=80&w=200&auto=format&fit=crop',
    tags: ['HSC', 'Admission', 'Job Prep'],
    slug: '/categories/books',
  },
  {
    title: 'Islamic Books',
    image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=200&auto=format&fit=crop',
    tags: ['Hadith', 'Tafsir', 'History'],
    slug: '/categories/books',
  },
  {
    title: 'English Literature',
    image: 'https://images.unsplash.com/photo-1474932430478-3a7fb9065da0?q=80&w=200&auto=format&fit=crop',
    tags: ['Fiction', 'Poetry', 'Classics'],
    slug: '/books',
  },
  {
    title: 'Self Development',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200&auto=format&fit=crop',
    tags: ['Productivity', 'Mental Health'],
    slug: '/books',
  },
];

const SIMPLE_GRIDS = [
  {
    title: 'Stay Cool in Summer',
    items: [
      { emoji: '🌬️', label: 'Fan' },
      { emoji: '🌂', label: 'Umbrella' },
      { emoji: '❄️', label: 'AC' },
      { emoji: '🦟', label: 'Anti Mosquito' },
    ],
  },
  {
    title: 'Beauty & Health',
    items: [
      { emoji: '🧴', label: 'Skin Care' },
      { emoji: '🪒', label: 'Personal Care' },
      { emoji: '👶', label: 'Baby Care' },
      { emoji: '💇', label: 'Hair Care' },
    ],
  },
  {
    title: 'Gear & Gadgets',
    items: [
      { emoji: '📱', label: 'Mobile' },
      { emoji: '🎧', label: 'Headphone' },
      { emoji: '⌚', label: 'Watch' },
      { emoji: '📷', label: 'Camera' },
    ],
  },
];

const RANK_TABS = ['Bestsellers', 'New Arrivals', 'Top Rated'] as const;

const FEATURES = [
  { icon: Truck,       title: 'Fast & Secure Delivery', subtitle: 'All over Bangladesh',     color: 'text-primary' },
  { icon: RotateCcw,   title: '7 Days Return',           subtitle: 'Happy return policy',     color: 'text-secondary' },
  { icon: ShieldCheck, title: '100% Genuine',            subtitle: 'Direct from publishers',  color: 'text-green-500' },
  { icon: Headphones,  title: '24/7 Support',            subtitle: 'Call us anytime',         color: 'text-purple-500' },
];

/* ─────────────────────────── component ─────────────────────────── */

export default function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [rankTab, setRankTab] = useState<typeof RANK_TABS[number]>('Bestsellers');

  // Auto-advance hero
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const prevSlide = () => setSlideIndex(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setSlideIndex(i => (i + 1) % HERO_SLIDES.length);

  // API data
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeatured(12),
  });

  const { data: recentData } = useQuery({
    queryKey: ['products', 'recent'],
    queryFn: () => productsApi.getAll({ limit: 8 }),
  });
  const recentProducts = recentData?.data ?? [];

  return (
    <div className="flex flex-col bg-gray-50">

      {/* ── Section 1: Hero Slider ── */}
      <section className="bg-white">
        <div className="container py-3">
          <div className="flex gap-3">
            {/* Main slider — 9/12 */}
            <div className="relative w-full lg:w-3/4 overflow-hidden rounded-xl group">
              <div
                className="flex transition-transform duration-500 ease-in-out h-64 md:h-80"
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                {HERO_SLIDES.map((slide, i) => (
                  <div
                    key={i}
                    className={`relative shrink-0 w-full h-full bg-gradient-to-r ${slide.bg} rounded-xl overflow-hidden`}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-cover opacity-40"
                      sizes="(max-width: 768px) 100vw, 75vw"
                      priority={i === 0}
                    />
                    <div className="absolute inset-0 flex items-center px-10">
                      <div>
                        <p className="text-white/70 text-sm mb-2">Featured Collection</p>
                        <h2 className="text-white font-bold text-2xl md:text-3xl max-w-sm leading-tight">{slide.title}</h2>
                        <Link
                          href="/books"
                          className="mt-4 inline-block bg-white text-gray-900 text-sm font-semibold px-5 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                          Shop Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slideIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar promo cards — 3/12, desktop only */}
            <div className="hidden lg:flex flex-col gap-3 w-1/4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex-1 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Weekend Sale</p>
                  <h3 className="text-white font-bold text-lg leading-tight mt-1">Up to 60% OFF</h3>
                </div>
                <Link href="/products" className="text-xs text-white underline font-medium">Shop Now →</Link>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex-1 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Special Ramadan</p>
                  <h3 className="text-white font-bold text-lg leading-tight mt-1">Islamic Books</h3>
                </div>
                <Link href="/books" className="text-xs text-amber-400 underline font-medium">Explore →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Quick Categories ── */}
      <section className="bg-white border-b">
        <div className="container py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_CATS.map(({ icon: Icon, title, count, slug }) => (
              <Link
                key={slug}
                href={slug}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-accent transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-primary flex items-center justify-center transition-colors">
                  <Icon className="h-6 w-6 text-gray-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-semibold text-gray-800 text-center">{title}</span>
                <span className="text-xs text-gray-400">{count} items</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Featured Products ("Quick Deals") ── */}
      {featuredProducts.length > 0 && (
        <section className="bg-white border-b">
          <div className="container py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Quick Deals</h2>
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">HOT</span>
              </div>
              <Link href="/products?isFeatured=true" className="text-sm text-primary font-medium hover:underline">
                View All →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {featuredProducts.map(product => (
                <div key={product.id} className="shrink-0 w-44 md:w-48">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 4: Category Highlights ── */}
      <section className="bg-white border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Browse by Category</h2>
            <Link href="/books" className="text-sm text-primary font-medium hover:underline">See All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CAT_HIGHLIGHTS.map(({ title, image, tags, slug }) => (
              <Link
                key={title}
                href={slug}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="relative h-20 w-20 rounded-full overflow-hidden">
                  <Image src={image} alt={title} fill className="object-cover" sizes="80px" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 text-center group-hover:text-primary transition-colors">{title}</h3>
                <div className="flex flex-wrap gap-1 justify-center">
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <span className="text-xs text-primary font-medium">See More →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Simple Grids ── */}
      <section className="bg-white border-b">
        <div className="container py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SIMPLE_GRIDS.map(({ title, items }) => (
              <div key={title} className="border border-gray-100 rounded-xl p-4">
                <h3 className="font-bold text-sm text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map(({ emoji, label }) => (
                    <Link
                      key={label}
                      href="/products"
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-sm text-gray-700">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Rank Lists ── */}
      <section className="bg-white border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Book Rankings</h2>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
              {RANK_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setRankTab(tab)}
                  className={`px-3 py-1.5 transition-colors ${rankTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Fiction', 'Non-Fiction', 'Islamic'] as const).map((col, colIdx) => (
              <div key={col} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700">{col}</h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {featuredProducts.slice(colIdx * 3, colIdx * 3 + 5).map((product, rank) => {
                    const price = product.salePrice ?? product.basePrice;
                    const image = product.images?.[0]?.url;
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <span className={`text-lg font-black w-6 shrink-0 ${rank === 0 ? 'text-amber-500' : rank === 1 ? 'text-gray-400' : rank === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                          {rank + 1}
                        </span>
                        <div className="relative h-10 w-8 shrink-0 rounded overflow-hidden bg-gray-100">
                          {image && <Image src={image} alt={product.name} fill className="object-cover" sizes="32px" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
                          {product.bookDetail && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{product.bookDetail.author}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-xs font-semibold text-primary">
                          {formatCurrency(Number(price))}
                        </div>
                      </Link>
                    );
                  })}
                  {featuredProducts.slice(colIdx * 3, colIdx * 3 + 5).length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-gray-400">No data available</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: Recently Added carousel ── */}
      {recentProducts.length > 0 && (
        <section className="bg-white border-b">
          <div className="container py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recently Added</h2>
              <Link href="/products" className="text-sm text-primary font-medium hover:underline">View All →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {recentProducts.map(product => (
                <div key={product.id} className="shrink-0 w-44 md:w-48">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 8: Service Features ── */}
      <section className="bg-white">
        <div className="container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, subtitle, color }) => (
              <div key={title} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
