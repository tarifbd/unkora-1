'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Package, Briefcase, Leaf, Layers, Zap,
  ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck, Headphones,
} from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';

/* ─────────────────────────── static data ─────────────────────────── */

const HERO_SLIDES = [
  { title: 'The Ultimate Book Fair 2026', bg: 'bg-blue-600', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Summer Reading Collection',   bg: 'bg-orange-500', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Must Have Classics',          bg: 'bg-green-600', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop' },
];

const QUICK_CATS = [
  { icon: BookOpen,  title: 'Books',         count: '24.5k+', slug: '/books' },
  { icon: Package,   title: 'Baby Products', count: '8.2k+',  slug: '/categories/baby-products' },
  { icon: Briefcase, title: 'Leather Goods', count: '3.1k+',  slug: '/categories/leather-products' },
  { icon: Leaf,      title: 'Organic Foods', count: '1.5k+',  slug: '/categories/organic-foods' },
  { icon: Layers,    title: 'Handicrafts',   count: '5.4k+',  slug: '/categories/handicrafts' },
  { icon: Zap,       title: 'Electronics',   count: '12.3k+', slug: '/categories/electronics' },
];

const CAT_HIGHLIGHTS = [
  { title: 'Academic Books',    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990bc6?q=80&w=200&auto=format&fit=crop', tags: ['HSC', 'Admission', 'Job Prep'] },
  { title: 'Islamic Books',     image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=200&auto=format&fit=crop', tags: ['Hadith', 'Tafsir', 'History'] },
  { title: 'English Literature',image: 'https://images.unsplash.com/photo-1474932430478-3a7fb9065da0?q=80&w=200&auto=format&fit=crop', tags: ['Fiction', 'Poetry', 'Classics'] },
  { title: 'Self Development',  image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200&auto=format&fit=crop', tags: ['Mental Health', 'Productivity'] },
];

const SIMPLE_GRIDS = [
  { title: 'Stay Cool in Summer', items: [{ emoji: '🌬️', label: 'Fan' }, { emoji: '🌂', label: 'Umbrella' }, { emoji: '❄️', label: 'AC' }, { emoji: '🦟', label: 'Anti Mosquito' }] },
  { title: 'Beauty & Health',     items: [{ emoji: '🧴', label: 'Skin Care' }, { emoji: '🪒', label: 'Personal Care' }, { emoji: '👶', label: 'Baby Care' }, { emoji: '💇', label: 'Hair Care' }] },
  { title: 'Gear & Gadgets',      items: [{ emoji: '📱', label: 'Mobile' }, { emoji: '🎧', label: 'Headphone' }, { emoji: '⌚', label: 'Watch' }, { emoji: '📷', label: 'Camera' }] },
];

const RANK_DATA = {
  Fiction:    [{ title: 'Himur Deep',       author: 'Humayun Ahmed',    rating: 4.9, reviews: 210,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop' },
               { title: 'Paradoxical Sajid', author: 'Arif Azad',       rating: 4.8, reviews: 1450, image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=100&auto=format&fit=crop' },
               { title: 'Lohar Churi',       author: 'Samaresh Majumdar',rating: 4.7, reviews: 85,   image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=100&auto=format&fit=crop' }],
  'Non-Fiction':[{ title: 'Atomic Habits',  author: 'James Clear',      rating: 5.0, reviews: 4500, image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=100&auto=format&fit=crop' },
                  { title: 'Sapiens',        author: 'Yuval Noah Harari',rating: 4.9, reviews: 3200, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=100&auto=format&fit=crop' }],
  Islamic:    [{ title: 'Bela Furabar Age', author: 'Arif Azad',        rating: 4.8, reviews: 900,  image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=100&auto=format&fit=crop' }],
  Thriller:   [{ title: 'The Dark Hours',   author: 'Humayun Ahmed',    rating: 4.6, reviews: 320,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop' }],
  Productivity:[{ title: 'Deep Work',       author: 'Cal Newport',      rating: 4.7, reviews: 1200, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=100&auto=format&fit=crop' }],
  Hadith:     [{ title: 'Riyadhus Saliheen',author: 'Imam An-Nawawi',   rating: 5.0, reviews: 2100, image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=100&auto=format&fit=crop' }],
} as Record<string, { title: string; author: string; rating: number; reviews: number; image: string }[]>;

const RANK_SECTIONS = [
  { id: 'rank-1', title: 'Fiction',     tabs: ['Fiction',     'Short Stories','Thriller'],  default: 'Fiction' },
  { id: 'rank-2', title: 'Non-Fiction', tabs: ['Non-Fiction', 'Productivity', 'History'],   default: 'Non-Fiction' },
  { id: 'rank-3', title: 'Islamic',     tabs: ['Islamic',     'Hadith',       'History'],   default: 'Islamic' },
];

const AUTHORS = [
  { name: 'Humayun Ahmed',   image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop' },
  { name: 'Arif Azad',       image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop' },
  { name: 'Zafar Iqbal',     image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
  { name: 'Samaresh Majumdar',image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200&auto=format&fit=crop' },
  { name: 'Sunil Gangopadhyay',image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=200&auto=format&fit=crop' },
  { name: 'Rabindranath',    image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop' },
];

const KIDS_ITEMS = [
  { emoji: '🧼', label: 'Baby Wash' }, { emoji: '🧴', label: 'Lotions' }, { emoji: '🧸', label: 'Kids Toys' },
  { emoji: '🛒', label: 'Strollers' }, { emoji: '🍼', label: 'Feeding' },  { emoji: '✨', label: 'Powders' },
];

const FEATURES = [
  { icon: Truck,       title: 'Fast & Secure Delivery', subtitle: 'All over Bangladesh',    color: 'text-primary' },
  { icon: RotateCcw,   title: '7 Days Return',           subtitle: 'Happy return policy',    color: 'text-secondary' },
  { icon: ShieldCheck, title: '100% Genuine',            subtitle: 'Direct from publishers', color: 'text-green-500' },
  { icon: Headphones,  title: '24/7 Support',            subtitle: 'Call us anytime',        color: 'text-purple-500' },
];

/* ─────────────────────────── sub-components ─────────────────────────── */

function RankSection({ section }: { section: typeof RANK_SECTIONS[number] }) {
  const [activeTab, setActiveTab] = useState(section.default);
  const items = RANK_DATA[activeTab] ?? RANK_DATA[section.default] ?? [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-gray-900">{section.title}</h3>
        <Link href="/books" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
          See More <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 mb-6">
        {section.tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
          </button>
        ))}
      </div>
      {/* List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.title} className="flex gap-4 group cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center font-black text-lg text-gray-200 group-hover:text-primary transition-colors shrink-0">
              {index + 1}
            </div>
            <div className="w-16 h-20 bg-gray-50 rounded overflow-hidden shrink-0">
              <Image src={item.image} alt={item.title} width={64} height={80} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <h4 className="text-sm font-bold text-gray-800 line-clamp-1 mb-0.5 group-hover:text-primary transition-colors">{item.title}</h4>
              <p className="text-xs text-gray-500 mb-1">{item.author}</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded font-bold">★ {item.rating}</span>
                <span className="text-[10px] text-gray-400">({item.reviews})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */

export default function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const quickDealsRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);
  const authorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'left' ? -ref.current.clientWidth : ref.current.clientWidth, behavior: 'smooth' });
  };

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeatured(12),
  });

  const { data: recentData } = useQuery({
    queryKey: ['products', 'recent'],
    queryFn: () => productsApi.getAll({ limit: 8 }),
  });
  const recentProducts = recentData?.data ?? [];

  const slide = HERO_SLIDES[slideIndex];

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#f8fafc' }}>

      {/* ── 1: Hero ── */}
      <section className="bg-white py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Main Slider */}
          <div className={`lg:col-span-9 relative h-[220px] sm:h-[300px] md:h-[400px] rounded-xl lg:rounded-2xl overflow-hidden shadow-lg group ${slide.bg} transition-colors duration-500`}>
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover mix-blend-overlay opacity-50 md:opacity-60 transition-opacity duration-500"
              sizes="(max-width: 1024px) 100vw, 75vw"
              priority
            />
            <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 md:p-12 text-white">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3 md:mb-5 leading-tight max-w-[80%] md:max-w-lg">
                {slide.title}
              </h2>
              <Link
                href="/books"
                className="w-fit px-5 py-2 md:px-8 md:py-3 bg-white text-gray-900 font-bold text-sm md:text-base rounded-md md:rounded-lg hover:bg-secondary hover:text-white transition-all shadow-xl"
              >
                Shop Now
              </Link>
            </div>
            <button
              onClick={() => setSlideIndex(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length)}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? 'w-6 md:w-8 bg-white' : 'w-1.5 md:w-2 bg-white/50'}`}
                />
              ))}
            </div>
          </div>

          {/* Sidebar Promo */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 lg:flex flex-col gap-4 md:gap-6">
            <div className="flex-1 rounded-xl bg-secondary p-5 md:p-8 flex flex-col justify-center items-center text-center text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] md:text-xs uppercase font-black mb-1 opacity-80">Weekend Sale</p>
                <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4">Up to 60% OFF</h3>
                <Link href="/products" className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-secondary font-bold text-[10px] md:text-xs rounded hover:shadow-lg transition-all inline-block">
                  Shop Gadgets
                </Link>
              </div>
              <div className="absolute -right-4 -bottom-4 md:-right-8 md:-bottom-8 w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 rounded-xl p-5 md:p-8 flex flex-col justify-center items-center text-center text-white relative overflow-hidden group" style={{ backgroundColor: '#002f34' }}>
              <div className="relative z-10">
                <p className="text-[10px] md:text-xs uppercase font-black mb-1 opacity-80">Islamic Books</p>
                <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4">Special Ramadan</h3>
                <Link href="/books" className="px-3 py-1.5 md:px-4 md:py-2 font-bold text-[10px] md:text-xs rounded hover:shadow-lg transition-all inline-block" style={{ backgroundColor: '#ffcc00', color: '#002f34' }}>
                  Explore Now
                </Link>
              </div>
              <div className="absolute -left-6 -top-6 md:-left-10 md:-top-10 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2: Quick Categories ── */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
          {QUICK_CATS.map(({ icon: Icon, title, count, slug }) => (
            <Link
              key={slug}
              href={slug}
              className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center group cursor-pointer hover:shadow-xl transition-all hover:border-primary/50 hover:-translate-y-1 duration-300"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-gray-500">
                <Icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{title}</h3>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium">{count} Items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3: Popular Categories ── */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Popular Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAT_HIGHLIGHTS.map(({ title, image, tags }) => (
              <div key={title} className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                <div className="bg-accent/30 rounded-2xl p-6 h-full flex flex-col items-center text-center transition-all group-hover:bg-primary/5 group-hover:shadow-xl border border-transparent group-hover:border-primary/20">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-6 shadow-md border-4 border-white group-hover:border-primary transition-all">
                    <Image src={image} alt={title} width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-1 rounded border border-gray-100 group-hover:text-primary transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="mt-auto flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">
                    See More <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4: Simple Grids ── */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {SIMPLE_GRIDS.map(({ title, items }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">{title}</h3>
                <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                  See More <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {items.map(({ emoji, label }) => (
                  <Link
                    key={label}
                    href="/products"
                    className="flex flex-col items-center gap-2 p-4 bg-accent/30 rounded-xl cursor-pointer group hover:-translate-y-1 transition-transform"
                  >
                    <div className="text-3xl group-hover:scale-110 transition-transform">{emoji}</div>
                    <p className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">{label}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5: Rank Lists ── */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {RANK_SECTIONS.map(sec => <RankSection key={sec.id} section={sec} />)}
        </div>
      </section>

      {/* ── 6: Quick Deals ── */}
      <section className="py-12 bg-accent">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Quick Deals</h2>
              <p className="text-gray-500 font-medium text-sm">Grab them before they are gone!</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/products?isFeatured=true" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline group">
                View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex gap-2">
                <button onClick={() => scroll(quickDealsRef, 'left')} className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={() => scroll(quickDealsRef, 'right')} className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
          <div ref={quickDealsRef} className="flex gap-6 overflow-x-auto pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <div key={product.id} className="min-w-[240px] w-[240px] flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[240px] w-[240px] flex-shrink-0 bg-white rounded-lg border border-gray-100 h-80 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── 7: Authors Carousel ── */}
      <section className="py-12" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900">Weekly Popular Authors</h2>
            <div className="flex gap-2">
              <button onClick={() => scroll(authorsRef, 'left')} className="p-2 rounded-full bg-white border border-gray-100 hover:shadow-md transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll(authorsRef, 'right')} className="p-2 rounded-full bg-white border border-gray-100 hover:shadow-md transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div ref={authorsRef} className="flex gap-8 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {AUTHORS.map(author => (
              <div key={author.name} className="flex flex-col items-center gap-4 min-w-[120px]">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg group cursor-pointer">
                  <Image
                    src={author.image}
                    alt={author.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <p className="text-sm font-bold text-gray-800 text-center line-clamp-2">{author.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8: Kids Section ── */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 md:mb-8">Explore Our Kids&apos; Products</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
            {KIDS_ITEMS.map(({ emoji, label }) => (
              <Link key={label} href="/categories/baby-products" className="flex flex-col items-center gap-2 md:gap-3 group cursor-pointer text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 transition-transform">
                  {emoji}
                </div>
                <p className="text-xs md:text-sm font-bold text-gray-700 leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9: Recently Sold ── */}
      <section className="py-12 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Recently Sold</h2>
              <p className="text-gray-500 font-medium text-sm">What others are buying right now</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scroll(recentRef, 'left')} className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => scroll(recentRef, 'right')} className="p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div ref={recentRef} className="flex gap-6 overflow-x-auto pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {recentProducts.length > 0 ? (
              recentProducts.map(product => (
                <div key={product.id} className="min-w-[240px] w-[240px] flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[240px] w-[240px] flex-shrink-0 bg-white rounded-lg border border-gray-100 h-80 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── 10: Service Features ── */}
      <section className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map(({ icon: Icon, title, subtitle, color }) => (
            <div key={title} className="flex items-center gap-4 group">
              <div className={`w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h4>
                <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
