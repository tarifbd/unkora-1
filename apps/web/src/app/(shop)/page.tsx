'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck, Headphones,
  Flame, Star, ArrowRight, ShoppingCart, Zap, CheckCircle, Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import { productsApi, categoriesApi, type Product, type Category } from '@/lib/api/products';
import api from '@/lib/api';
import { useLanguage } from '@/lib/i18n/language-context';
import { useCart } from '@/lib/hooks/use-cart';

/* ─────────────────────── static data ─────────────────────────────── */

const CAT_EMOJI: Record<string, string> = {
  books: '📚', 'baby-products': '👶', 'leather-products': '👜',
  'organic-foods': '🌿', handicrafts: '🎨', electronics: '⚡',
  'daily-needs': '🛒', 'islamic-lifestyle': '🕌', default: '🏷️',
};

const AUTHORS = [
  { name: 'হুমায়ূন আহমেদ', nameEn: 'Humayun Ahmed',     image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', href: '/books?author=হুমায়ূন আহমেদ' },
  { name: 'আরিফ আজাদ',      nameEn: 'Arif Azad',         image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop', href: '/books?author=আরিফ আজাদ' },
  { name: 'জাফর ইকবাল',      nameEn: 'Zafar Iqbal',       image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', href: '/books?author=মুহম্মদ জাফর ইকবাল' },
  { name: 'সমরেশ মজুমদার',   nameEn: 'Samaresh Majumdar', image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200&auto=format&fit=crop', href: '/books?author=সমরেশ মজুমদার' },
  { name: 'James Clear',      nameEn: 'James Clear',        image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=200&auto=format&fit=crop', href: '/books?author=James Clear' },
  { name: 'রবীন্দ্রনাথ',      nameEn: 'Rabindranath',      image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop', href: '/books?author=রবীন্দ্রনাথ ঠাকুর' },
  { name: 'মানিক বন্দ্যোপাধ্যায়', nameEn: 'Manik Bandyopadhyay', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop', href: '/books?author=মানিক বন্দ্যোপাধ্যায়' },
];

const RANK_DATA: Record<string, { title: string; titleEn: string; author: string; rating: number; reviews: number; image: string; href: string }[]> = {
  Fiction:      [{ title: 'হিমুর দ্বিতীয় প্রহর',   titleEn: 'Himur Dwitiy Prohor',   author: 'হুমায়ূন আহমেদ',          rating: 4.9, reviews: 210,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=80&auto=format&fit=crop',  href: '/products/himur-dwitiy-prohor' },
                 { title: 'প্যারাডক্সিক্যাল সাজিদ',  titleEn: 'Paradoxical Sajid',     author: 'আরিফ আজাদ',               rating: 4.8, reviews: 1450, image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=80&auto=format&fit=crop', href: '/products/paradoxical-sajid' },
                 { title: 'লোহার চুড়ি',              titleEn: 'Lohar Churi',           author: 'সমরেশ মজুমদার',            rating: 4.7, reviews: 85,   image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=80&auto=format&fit=crop', href: '/products/lohar-churi' },
                 { title: 'পদ্মা নদীর মাঝি',          titleEn: 'Padma Nadir Majhi',     author: 'মানিক বন্দ্যোপাধ্যায়',    rating: 4.6, reviews: 320,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=80&auto=format&fit=crop',  href: '/products/padma-nadir-majhi' }],
  'Non-Fiction':[{ title: 'Atomic Habits',            titleEn: 'Atomic Habits',          author: 'James Clear',              rating: 5.0, reviews: 4500, image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=80&auto=format&fit=crop', href: '/products/atomic-habits' },
                 { title: 'Sapiens',                  titleEn: 'Sapiens',                author: 'Yuval Noah Harari',        rating: 4.9, reviews: 3200, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=80&auto=format&fit=crop',  href: '/products/sapiens' },
                 { title: 'The Psychology of Money',  titleEn: 'Psychology of Money',    author: 'Morgan Housel',            rating: 4.8, reviews: 1800, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=80&auto=format&fit=crop',  href: '/products/the-psychology-of-money' },
                 { title: 'Deep Work',                titleEn: 'Deep Work',              author: 'Cal Newport',              rating: 4.7, reviews: 1200, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=80&auto=format&fit=crop',  href: '/products/deep-work' }],
  Islamic:      [{ title: 'বেলা ফুরাবার আগে',          titleEn: 'Bela Furabar Age',      author: 'আরিফ আজাদ',               rating: 4.8, reviews: 900,  image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=80&auto=format&fit=crop', href: '/products/bela-furabar-age' },
                 { title: 'নবী জীবনী',                 titleEn: 'Nabi Jiboni',           author: 'ড. আলী মুহাম্মদ সাল্লাবী', rating: 4.9, reviews: 540,  image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=80&auto=format&fit=crop', href: '/products/nabi-jiboni' },
                 { title: 'প্যারাডক্সিক্যাল সাজিদ',  titleEn: 'Paradoxical Sajid',     author: 'আরিফ আজাদ',               rating: 4.8, reviews: 1450, image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=80&auto=format&fit=crop', href: '/products/paradoxical-sajid' }],
};

const FLASH_DEALS = [
  { id: 'fd1', title: 'প্যারাডক্সিক্যাল সাজিদ', titleEn: 'Paradoxical Sajid',   author: 'আরিফ আজাদ',        price: 180, originalPrice: 350,  image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=200&auto=format&fit=crop', href: '/products/paradoxical-sajid' },
  { id: 'fd2', title: 'Atomic Habits',             titleEn: 'Atomic Habits',       author: 'James Clear',      price: 420, originalPrice: 600,  image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=200&auto=format&fit=crop', href: '/products/atomic-habits' },
  { id: 'fd3', title: 'হিমুর দ্বিতীয় প্রহর',    titleEn: 'Himur Dwitiy Prohor', author: 'হুমায়ূন আহমেদ',   price: 160, originalPrice: 250,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop', href: '/products/himur-dwitiy-prohor' },
  { id: 'fd4', title: 'বেলা ফুরাবার আগে',         titleEn: 'Bela Furabar Age',    author: 'আরিফ আজাদ',       price: 200, originalPrice: 320,  image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=200&auto=format&fit=crop', href: '/products/bela-furabar-age' },
  { id: 'fd5', title: 'অর্গানিক মধু ৫০০গ্রাম',   titleEn: 'Organic Honey 500g',  author: 'সুন্দরবন',         price: 380, originalPrice: 550,  image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=200&auto=format&fit=crop', href: '/categories/organic-foods' },
  { id: 'fd6', title: 'লেদার মানিব্যাগ — জেন্টস',  titleEn: 'Leather Bifold Wallet', author: 'UNKORA',        price: 650, originalPrice: 1200, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=200&auto=format&fit=crop', href: '/categories/leather-products' },
  { id: 'fd7', title: 'Sapiens',                   titleEn: 'Sapiens',             author: 'Yuval Noah Harari', price: 420, originalPrice: 580, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200&auto=format&fit=crop', href: '/products/sapiens' },
  { id: 'fd8', title: 'নবী জীবনী',                 titleEn: 'Nabi Jiboni',        author: 'ড. সাল্লাবী',     price: 320, originalPrice: 450,  image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=200&auto=format&fit=crop', href: '/products/nabi-jiboni' },
];

const BOOK_SHELF_TABS = [
  { key: 'fiction',         labelBn: 'উপন্যাস',     labelEn: 'Fiction' },
  { key: 'islamic-books',   labelBn: 'ইসলামিক',     labelEn: 'Islamic' },
  { key: 'academic',        labelBn: 'একাডেমিক',    labelEn: 'Academic' },
  { key: 'self-help',       labelBn: 'আত্মউন্নয়ন', labelEn: 'Self Help' },
  { key: 'childrens-books', labelBn: 'শিশু-কিশোর',  labelEn: "Children's" },
  { key: 'non-fiction',     labelBn: 'নন-ফিকশন',    labelEn: 'Non-Fiction' },
];

const BEST_TABS = [
  { key: 'all',        labelBn: 'সব',         labelEn: 'All',        category: undefined },
  { key: 'books',      labelBn: 'বই',         labelEn: 'Books',      category: 'books' },
  { key: 'organic',    labelBn: 'অর্গানিক',   labelEn: 'Organic',   category: 'organic-foods' },
  { key: 'leather',    labelBn: 'লেদার',      labelEn: 'Leather',   category: 'leather-products' },
  { key: 'handicraft', labelBn: 'হস্তশিল্প',  labelEn: 'Crafts',    category: 'handicrafts' },
];

const RANK_SECTIONS = [
  { id: 'r1', titleBn: 'কল্পকাহিনী',  titleEn: 'Fiction',     tabs: ['Fiction'],       tabsBn: ['কল্পকাহিনী'],      default: 'Fiction',      accent: '#2563eb' },
  { id: 'r2', titleBn: 'নন-ফিকশন',    titleEn: 'Non-Fiction', tabs: ['Non-Fiction'],   tabsBn: ['নন-ফিকশন'],        default: 'Non-Fiction',  accent: '#7c3aed' },
  { id: 'r3', titleBn: 'ইসলামিক',     titleEn: 'Islamic',     tabs: ['Islamic'],       tabsBn: ['ইসলামিক'],         default: 'Islamic',      accent: '#16a34a' },
];

const GENRES = [
  { label: 'উপন্যাস',       labelEn: 'Fiction',       href: '/books?genre=Fiction',       bg: '#dbeafe', color: '#1d4ed8' },
  { label: 'ইসলামিক',       labelEn: 'Islamic',       href: '/books?genre=Islamic',       bg: '#dcfce7', color: '#15803d' },
  { label: 'আত্মউন্নয়ন',  labelEn: 'Self-Help',     href: '/books?genre=Self-Help',     bg: '#ffedd5', color: '#c2410c' },
  { label: 'নন-ফিকশন',     labelEn: 'Non-Fiction',   href: '/books?genre=Non-Fiction',   bg: '#ede9fe', color: '#6d28d9' },
  { label: 'থ্রিলার',       labelEn: 'Thriller',      href: '/books?genre=Thriller',      bg: '#fee2e2', color: '#b91c1c' },
  { label: 'শিশু-কিশোর',   labelEn: "Children's",    href: "/books?genre=Children's",    bg: '#fce7f3', color: '#be185d' },
  { label: 'বিজ্ঞান',       labelEn: 'Science',       href: '/books?genre=Science',       bg: '#cffafe', color: '#0e7490' },
  { label: 'ইতিহাস',        labelEn: 'History',       href: '/books?genre=History',       bg: '#fef9c3', color: '#a16207' },
  { label: 'একাডেমিক',     labelEn: 'Academic',      href: '/books?genre=Academic',      bg: '#e0e7ff', color: '#4338ca' },
  { label: 'কবিতা',         labelEn: 'Poetry',        href: '/books?genre=Poetry',        bg: '#fce7f3', color: '#9d174d' },
  { label: 'মুক্তিযুদ্ধ',  labelEn: 'Liberation War',href: '/books?genre=Liberation+War',bg: '#dcfce7', color: '#166534' },
  { label: 'রান্না',        labelEn: 'Cooking',       href: '/books?genre=Cooking',       bg: '#fef3c7', color: '#b45309' },
];

/* ─────────────────────── helpers ─────────────────────────────────── */

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

/* ─────────────────────── promo banner row ─────────────────────────── */

type PromoBannerItem = { id: string; imageUrl: string; linkUrl?: string; title: string };

function PromoBannerRow({ banners }: { banners: PromoBannerItem[] }) {
  if (banners.length === 0) return null;
  return (
    <section className="py-3 px-3 md:px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
        {banners.slice(0, 3).map(b =>
          b.linkUrl ? (
            <Link key={b.id} href={b.linkUrl}
              className="relative rounded-xl overflow-hidden h-28 md:h-32 block group hover:scale-[1.02] transition-all shadow-sm flex-shrink-0">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/30 transition-all" />
              <span className="absolute bottom-2 left-3 text-white font-bold text-xs drop-shadow">{b.title}</span>
            </Link>
          ) : (
            <div key={b.id} className="relative rounded-xl overflow-hidden h-28 md:h-32">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-3 text-white font-bold text-xs drop-shadow">{b.title}</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* ─────────────────────── shared UI components ─────────────────────── */

function SectionHeader({ titleBn, titleEn, href, accentColor = '#f97316', lang }: {
  titleBn: string; titleEn: string; href: string; accentColor?: string; lang: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
        <h2 className="text-base md:text-lg font-black text-gray-900">
          {lang === 'bn' ? titleBn : titleEn}
        </h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all hover:text-white"
        style={{ color: accentColor, borderColor: accentColor }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = accentColor; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      >
        {lang === 'bn' ? 'সব দেখুন' : 'View All'} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/* ── Product card — matches screenshot design ── */
function MiniCard({ product, lang }: { product: Product; lang: string }) {
  const { addItem } = useCart();
  const img = product.images?.[0]?.url;
  const salePrice = Number(product.salePrice ?? product.basePrice);
  const basePrice = Number(product.basePrice);
  const hasDiscount = product.salePrice && salePrice < basePrice;
  const discountPct = hasDiscount ? Math.round((1 - salePrice / basePrice) * 100) : 0;
  const inStock = product.stockQuantity > 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative h-44 bg-gray-50 overflow-hidden flex-shrink-0 block">
        {img ? (
          <Image src={img} alt={product.name} fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 180px"
            unoptimized={img.includes('unsplash')} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-4xl">📦</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">-{discountPct}%</span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-full">
              {lang === 'bn' ? 'স্টক নেই' : 'Out of Stock'}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {product.category?.name && (
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 truncate">
            {product.category.name}
          </p>
        )}
        <Link href={`/products/${product.slug}`} className="flex-1">
          <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </p>
          {product.bookDetail?.author && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{product.bookDetail.author}</p>
          )}
        </Link>

        <div className="flex items-baseline gap-1.5 mt-2 mb-2.5">
          <span className="text-sm font-black text-gray-900">৳{salePrice.toLocaleString('en-BD')}</span>
          {hasDiscount && <span className="text-[10px] text-gray-400 line-through">৳{basePrice.toLocaleString('en-BD')}</span>}
        </div>

        {/* ADD TO CART + Wishlist */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); if (inStock) addItem.mutate({ productId: product.id, quantity: 1, guestData: { name: product.name, price: salePrice, image: img, slug: product.slug } }); }}
            disabled={!inStock}
            className={`relative flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[11px] font-black transition-all overflow-hidden ${inStock ? 'bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-900/40 hover:from-slate-600 hover:to-slate-800 active:scale-95 ring-1 ring-white/10' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
            {lang === 'bn' ? 'কার্টে যোগ করুন' : 'ADD TO CART'}
          </button>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Wishlist"
            className="w-9 h-9 flex-shrink-0 rounded-xl border border-orange-200 bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center hover:from-orange-100 hover:to-orange-200 shadow-sm transition-all active:scale-95"
          >
            <Heart className="w-4 h-4 text-orange-500" fill="currentColor" />
          </button>
        </div>

        {/* BUY NOW */}
        {inStock ? (
          <Link href={`/checkout?productId=${product.id}&qty=1`} onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 h-9 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-orange-500/40 hover:from-orange-300 hover:to-orange-500 active:scale-95 transition-all ring-1 ring-white/20">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            {lang === 'bn' ? 'এখনই কিনুন' : 'BUY NOW'}
          </Link>
        ) : (
          <div className="h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-[11px] font-black">
            {lang === 'bn' ? 'স্টক নেই' : 'OUT OF STOCK'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse flex flex-col">
      <div className="h-44 bg-gray-200 flex-shrink-0" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="h-2 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-2/5 mt-1" />
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-9 bg-gray-200 rounded-xl" />
          <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
        </div>
        <div className="h-9 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

/* ── Flash deal card — same design, fixed width for horizontal scroll ── */
function FlashCard({ product, lang }: { product: Product; lang: string }) {
  const { addItem } = useCart();
  const [imgErr, setImgErr] = useState(false);
  const img = product.images?.[0]?.url;
  const salePrice = Number(product.salePrice ?? product.basePrice);
  const basePrice = Number(product.basePrice);
  const hasDiscount = product.salePrice && salePrice < basePrice;
  const discount = hasDiscount ? Math.round((1 - salePrice / basePrice) * 100) : 0;
  const inStock = product.stockQuantity > 0;
  if (imgErr || !img) return null;
  return (
    <div className="flex-shrink-0 w-[175px] group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative h-[170px] bg-gray-50 overflow-hidden flex-shrink-0 block">
        <Image src={img} alt={product.name} fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          unoptimized={img.includes('unsplash') || img.includes('picsum')}
          sizes="160px" onError={() => setImgErr(true)} />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">-{discount}%</span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1 rounded-full">
              {lang === 'bn' ? 'স্টক নেই' : 'Out of Stock'}
            </span>
          </div>
        )}
      </Link>
      <div className="p-2.5 flex flex-col flex-1">
        {product.category?.name && (
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-0.5 truncate">{product.category.name}</p>
        )}
        <Link href={`/products/${product.slug}`} className="flex-1">
          <p className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </p>
          {product.bookDetail?.author && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{product.bookDetail.author}</p>
          )}
        </Link>
        <div className="flex items-baseline gap-1 mt-1.5 mb-2">
          <span className="text-sm font-black text-gray-900">৳{salePrice.toLocaleString('en-BD')}</span>
          {hasDiscount && <span className="text-[10px] text-gray-400 line-through">৳{basePrice.toLocaleString('en-BD')}</span>}
        </div>
        <div className="flex gap-1.5 mb-1.5">
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); if (inStock) addItem.mutate({ productId: product.id, quantity: 1, guestData: { name: product.name, price: salePrice, image: img, slug: product.slug } }); }}
            disabled={!inStock}
            className={`flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-[10px] font-black transition-all overflow-hidden ${inStock ? 'bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-md shadow-slate-900/40 hover:from-slate-600 hover:to-slate-800 active:scale-95 ring-1 ring-white/10' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            <ShoppingCart className="w-3 h-3 flex-shrink-0" />
            <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
          </button>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Wishlist"
            className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-b from-orange-50 to-orange-100 border border-orange-200 flex items-center justify-center hover:from-orange-100 hover:to-orange-200 shadow-sm transition-all active:scale-95">
            <Heart className="w-3.5 h-3.5 text-orange-500" fill="currentColor" />
          </button>
        </div>
        {inStock ? (
          <Link href={`/checkout?productId=${product.id}&qty=1`} onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 text-white rounded-lg text-[10px] font-black shadow-md shadow-orange-500/40 hover:from-orange-300 hover:to-orange-500 active:scale-95 transition-all ring-1 ring-white/20">
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span>{lang === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}</span>
          </Link>
        ) : (
          <div className="h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 text-[10px] font-black">
            {lang === 'bn' ? 'নেই' : 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Ranking row ── */
function RankRow({ item, index, lang }: { item: typeof RANK_DATA['Fiction'][number]; index: number; lang: string }) {
  const medalColor = index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-gray-300';
  return (
    <Link href={item.href} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 group">
      <span className={`w-5 text-center font-black text-sm flex-shrink-0 ${medalColor}`}>{index + 1}</span>
      <div className="w-9 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100">
        <Image src={item.image} alt={item.titleEn} width={36} height={48} className="w-full h-full object-cover" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{lang === 'bn' ? item.title : item.titleEn}</p>
        <p className="text-[9px] text-gray-400 mt-0.5 truncate">{item.author}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] text-yellow-500">★</span>
          <span className="text-[9px] font-bold text-gray-600">{item.rating}</span>
          <span className="text-[9px] text-gray-400">({item.reviews.toLocaleString()})</span>
        </div>
      </div>
    </Link>
  );
}

/* ── Featured product item — hides itself if image fails to load ── */
function FeaturedItem({ p, lang }: { product?: never; p: Product; lang: string }) {
  const [hidden, setHidden] = useState(false);
  const url = p.images?.[0]?.url;
  if (!url || hidden) return null;
  const price = Number(p.salePrice ?? p.basePrice);
  const hasDiscount = p.salePrice && Number(p.salePrice) < Number(p.basePrice);
  const discountPct = hasDiscount ? Math.round((1 - Number(p.salePrice) / Number(p.basePrice)) * 100) : 0;
  return (
    <Link href={`/products/${p.slug}`}
      className="flex-shrink-0 w-[115px] group flex flex-col">
      <div className="relative w-full h-[150px] rounded-xl overflow-hidden bg-gray-100 mb-1.5 flex-shrink-0">
        <Image src={url} alt={p.name} fill
          className="object-cover group-hover:scale-105 transition-transform duration-400"
          sizes="115px" unoptimized={url.includes('unsplash')}
          onError={() => setHidden(true)} />
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            -{discountPct}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold text-gray-700 line-clamp-2 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors flex-1">
        {p.name}
      </p>
      <span className="text-[11px] font-black text-red-600">৳{price.toLocaleString('en-BD')}</span>
    </Link>
  );
}

/* ─────────────────────── main page ─────────────────────────────────── */

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [bestTab, setBestTab]         = useState('all');
  const [bookShelfTab, setBookShelfTab] = useState('fiction');
  const [slideIndex, setSlideIndex]   = useState(0);
  const [slideKey, setSlideKey]       = useState(0);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone]   = useState(false);

  const flashRef     = useRef<HTMLDivElement>(null);
  const shelfRef     = useRef<HTMLDivElement>(null);
  const authorsRef   = useRef<HTMLDivElement>(null);
  const flashEnd     = useRef(new Date(Date.now() + 8 * 3600 * 1000)).current;
  const countdown    = useCountdown(flashEnd);

  const goToSlide = useCallback((fn: (i: number) => number) => { setSlideIndex(fn); setSlideKey(k => k + 1); }, []);
  useEffect(() => { const id = setInterval(() => setSlideIndex(i => (i + 1) % 3), 5000); return () => clearInterval(id); }, [slideKey]);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'l' | 'r') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'l' ? -ref.current.clientWidth * 0.8 : ref.current.clientWidth * 0.8, behavior: 'smooth' });
  };

  const HERO_SLIDES = [
    { bg: 'from-green-900 to-green-700', img: 'https://images.unsplash.com/photo-1556909114-4d4a51b2f17e?q=80&w=1200&auto=format&fit=crop',  headlineBn: 'বাংলাদেশে পণ্য কিনুন',          headlineEn: 'Shop Products in Bangladesh',    subBn: 'সেরা দামে সেরা পণ্য — সরাসরি আপনার দোরগোড়ায়', subEn: 'Best products at best prices — delivered to your door', ctaBn: 'এখনই কিনুন', ctaEn: 'Shop Now', href: '/products' },
    { bg: 'from-blue-900 to-blue-700',   img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',  headlineBn: 'বাংলাদেশের সেরা বইয়ের দোকান',   headlineEn: "Bangladesh's Best Bookstore",    subBn: '১ লাখেরও বেশি বই · সেরা দামে',       subEn: '100,000+ books · Best prices',   ctaBn: 'বই দেখুন',    ctaEn: 'Shop Books',   href: '/books' },
    { bg: 'from-red-900 to-orange-700',  img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop', headlineBn: 'মেগা সেল চলছে!',               headlineEn: 'Mega Sale is Live!',             subBn: '৭০% পর্যন্ত ছাড় · সীমিত সময়',      subEn: 'Up to 70% off · Limited time',   ctaBn: 'অফার দেখুন', ctaEn: 'See Deals',    href: '/flash-deals' },
  ] as const;

  /* API data */
  const { data: featuredProducts = [], isError: featuredError } = useQuery({ queryKey: ['products', 'featured'], queryFn: () => productsApi.getFeatured(12) });
  const { data: allCategories = [] }    = useQuery({ queryKey: ['categories-roots'],    queryFn: () => categoriesApi.getRoots() });
  const { data: newArrivalData, isError: newArrivalsError } = useQuery({ queryKey: ['products', 'new-arrivals'], queryFn: () => productsApi.getAll({ limit: 12, sortBy: 'createdAt', sortOrder: 'desc' } as Parameters<typeof productsApi.getAll>[0]) });
  const newArrivals = newArrivalData?.data ?? [];
  const { data: bestData, isError: bestError } = useQuery({ queryKey: ['products', 'bestsellers', bestTab], queryFn: () => productsApi.getAll({ limit: 12, ...(bestTab !== 'all' ? { categorySlug: BEST_TABS.find(t => t.key === bestTab)?.category } : {}) } as Parameters<typeof productsApi.getAll>[0]) });
  const bestProducts = bestData?.data ?? [];
  const { data: shelfData, isError: shelfError } = useQuery({ queryKey: ['products', 'shelf', bookShelfTab], queryFn: () => productsApi.getAll({ categorySlug: bookShelfTab, limit: 12 } as Parameters<typeof productsApi.getAll>[0]) });
  const shelfBooks = shelfData?.data ?? [];
  const { data: organicData } = useQuery({ queryKey: ['products', 'organic'], queryFn: () => productsApi.getAll({ categorySlug: 'organic-foods', limit: 6 } as Parameters<typeof productsApi.getAll>[0]) });
  const organicProducts = organicData?.data ?? [];
  const { data: dailyData } = useQuery({ queryKey: ['products', 'daily-needs'], queryFn: () => productsApi.getAll({ categorySlug: 'daily-needs', limit: 6 } as Parameters<typeof productsApi.getAll>[0]) });
  const dailyProducts = dailyData?.data ?? [];
  const { data: babyData } = useQuery({ queryKey: ['products', 'baby-products'], queryFn: () => productsApi.getAll({ categorySlug: 'baby-products', limit: 6 } as Parameters<typeof productsApi.getAll>[0]) });
  const babyProducts = babyData?.data ?? [];
  const { data: leatherData } = useQuery({ queryKey: ['products', 'leather-products'], queryFn: () => productsApi.getAll({ categorySlug: 'leather-products', limit: 6 } as Parameters<typeof productsApi.getAll>[0]) });
  const leatherProducts = leatherData?.data ?? [];
  const { data: handicraftsData } = useQuery({ queryKey: ['products', 'handicrafts'], queryFn: () => productsApi.getAll({ categorySlug: 'handicrafts', limit: 6 } as Parameters<typeof productsApi.getAll>[0]) });
  const handicraftProducts = handicraftsData?.data ?? [];
  const { data: electronicsData } = useQuery({ queryKey: ['products', 'electronics'], queryFn: () => productsApi.getAll({ categorySlug: 'electronics', limit: 6 } as Parameters<typeof productsApi.getAll>[0]) });
  const electronicsProducts = electronicsData?.data ?? [];
  const { data: flashData, isError: flashError } = useQuery({ queryKey: ['products', 'flash-deals'], queryFn: () => productsApi.getAll({ limit: 20 } as Parameters<typeof productsApi.getAll>[0]) });
  const flashProducts = (flashData?.data ?? []).filter(p => p.salePrice && Number(p.salePrice) < Number(p.basePrice) && p.images?.[0]?.url).slice(0, 12);

  type PromoBanner = { id: string; imageUrl: string; linkUrl?: string; title: string; isActive: boolean };
  const fetchPromo = (pos: string) =>
    api.get(`/design/banners?position=${pos}&limit=10`).then(r => (r.data?.data ?? []) as PromoBanner[]).catch(() => [] as PromoBanner[]);

  const { data: promo1Raw } = useQuery<PromoBanner[]>({ queryKey: ['promo-banners', 'PROMO_1'], queryFn: () => fetchPromo('PROMO_1') });
  const { data: promo2Raw } = useQuery<PromoBanner[]>({ queryKey: ['promo-banners', 'PROMO_2'], queryFn: () => fetchPromo('PROMO_2') });
  const { data: promo3Raw } = useQuery<PromoBanner[]>({ queryKey: ['promo-banners', 'PROMO_3'], queryFn: () => fetchPromo('PROMO_3') });
  const { data: promo4Raw } = useQuery<PromoBanner[]>({ queryKey: ['promo-banners', 'PROMO_4'], queryFn: () => fetchPromo('PROMO_4') });

  const promo1 = (promo1Raw ?? []).filter(b => b.isActive);
  const promo2 = (promo2Raw ?? []).filter(b => b.isActive);
  const promo3 = (promo3Raw ?? []).filter(b => b.isActive);
  const promo4 = (promo4Raw ?? []).filter(b => b.isActive);

  // Show a banner when all main product queries fail (API unreachable)
  const apiDown = newArrivalsError && bestError && flashError && featuredError && shelfError;

  const slide = HERO_SLIDES[slideIndex] ?? HERO_SLIDES[0];

  return (
    <div style={{ backgroundColor: '#f5f5f5' }}>
      {/* API unreachable banner */}
      {apiDown && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-amber-800">
          <span>⚠️</span>
          <span>{lang === 'bn' ? 'API সংযোগ সমস্যা — সার্ভার চালু আছে কিনা দেখুন।' : 'API connection error — please check if the server is running.'}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — keep as is
      ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-gray-100 py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-stretch gap-3">

          {/* Hero Banner */}
          <div className="relative rounded-xl overflow-hidden flex-shrink-0 h-[220px] sm:h-[280px] xl:w-[360px] xl:h-auto xl:min-h-[440px] cursor-pointer group"
            onClick={() => window.location.href = slide.href}>
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-700`} />
            <Image src={slide.img} alt="hero" fill unoptimized priority className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500" sizes="(max-width:1280px) 100vw, 360px" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 xl:p-8">
              <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-white leading-tight mb-2">
                {lang === 'bn' ? slide.headlineBn : slide.headlineEn}
              </h1>
              <p className="text-white/70 text-xs mb-5">{lang === 'bn' ? slide.subBn : slide.subEn}</p>
              <span className="inline-flex items-center gap-2 bg-white text-gray-900 font-black text-sm px-5 py-2.5 rounded-lg w-fit group-hover:bg-yellow-400 transition-colors duration-300">
                {lang === 'bn' ? slide.ctaBn : slide.ctaEn} <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            {/* Slide dots */}
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {[0,1,2].map(i => (
                <button key={i} onClick={e => { e.stopPropagation(); goToSlide(() => i); }}
                  className={`rounded-full transition-all ${i === slideIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`} />
              ))}
            </div>
          </div>

          {/* Right: Flash Sale mini banner + Categories */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Flash Sale teaser */}
              <div className="relative bg-gradient-to-br from-red-600 to-orange-500 rounded-xl p-5 overflow-hidden min-h-[160px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
                    <span className="text-yellow-200 text-xs font-bold uppercase tracking-widest animate-pulse">{lang === 'bn' ? 'ফ্ল্যাশ সেল' : 'Flash Sale'}</span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight">{lang === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited Time Deals'}</h3>
                  <p className="text-orange-100 text-xs mt-1">{lang === 'bn' ? '৭০% পর্যন্ত ছাড়' : 'Up to 70% discount'}</p>
                </div>
                <div className="flex gap-1.5 items-center">
                  {[{ v: pad(countdown.h), l: lang === 'bn' ? 'ঘণ্টা' : 'HRS' }, { v: pad(countdown.m), l: lang === 'bn' ? 'মিনিট' : 'MIN' }, { v: pad(countdown.s), l: lang === 'bn' ? 'সেকেন্ড' : 'SEC' }].map(({ v, l }, i) => (
                    <div key={l} className="flex items-center gap-1">
                      <div className="bg-black/30 backdrop-blur-sm text-white rounded-md px-2 py-1 text-center min-w-[36px]">
                        <div className="text-sm font-black leading-none">{v}</div>
                        <div className="text-[8px] opacity-70 mt-0.5">{l}</div>
                      </div>
                      {i < 2 && <span className="text-yellow-300 font-black text-xs">:</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hot Categories */}
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🔥</span>
                  <h3 className="font-black text-gray-900 text-sm">{lang === 'bn' ? 'বিভাগ' : 'Categories'}</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(allCategories.length > 0 ? allCategories.slice(0, 8) : [
                    { id:'1', slug:'books',            name: lang === 'bn' ? 'বই' : 'Books' },
                    { id:'2', slug:'baby-products',    name: lang === 'bn' ? 'শিশু পণ্য' : 'Baby' },
                    { id:'3', slug:'leather-products', name: lang === 'bn' ? 'চামড়া' : 'Leather' },
                    { id:'4', slug:'organic-foods',    name: lang === 'bn' ? 'অর্গানিক' : 'Organic' },
                    { id:'5', slug:'handicrafts',      name: lang === 'bn' ? 'হস্তশিল্প' : 'Crafts' },
                    { id:'6', slug:'electronics',      name: lang === 'bn' ? 'ইলেকট্রনিক্স' : 'Electronics' },
                    { id:'7', slug:'daily-needs',      name: lang === 'bn' ? 'দৈনন্দিন' : 'Daily' },
                    { id:'8', slug:'default',          name: lang === 'bn' ? 'আরো' : 'More' },
                  ] as { id: string; slug: string; name: string }[]).map(cat => (
                    <Link key={cat.id} href={`/products?categorySlug=${cat.slug}`}
                      className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-blue-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-lg transition-colors">
                        {CAT_EMOJI[cat.slug] ?? CAT_EMOJI.default}
                      </div>
                      <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Featured Products horizontal mini */}
            <div className="bg-white rounded-xl p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h3 className="font-black text-gray-900 text-sm">{lang === 'bn' ? 'ফিচার্ড পণ্য' : 'Featured Products'}</h3>
                </div>
                <Link href="/products?isFeatured=true" className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5 hover:underline">
                  {lang === 'bn' ? 'সব দেখুন' : 'View all'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                {featuredProducts.length > 0
                  ? featuredProducts
                      .filter(p => p.images?.[0]?.url)
                      .slice(0, 8)
                      .map(p => <FeaturedItem key={p.id} p={p} lang={lang} />)
                  : Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[115px] animate-pulse">
                      <div className="w-full h-[150px] rounded-xl bg-gray-200 mb-1.5" />
                      <div className="h-3 bg-gray-200 rounded mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CATEGORIES STRIP — auto-updates from API
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-900 text-sm">{lang === 'bn' ? 'বিভাগ অনুযায়ী কেনাকাটা করুন' : 'Shop by Category'}</h2>
            <Link href="/products" className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5 hover:underline">
              {lang === 'bn' ? 'সব দেখুন' : 'All'} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(allCategories.length > 0
              ? allCategories.slice(0, 12) as (Category & { children?: Category[] })[]
              : [
                { id:'1', slug:'books',              name: lang === 'bn' ? 'বই' : 'Books',           imageUrl: undefined, color: '#2563eb' },
                { id:'2', slug:'baby-products',      name: lang === 'bn' ? 'শিশু পণ্য' : 'Baby',     imageUrl: undefined, color: '#ec4899' },
                { id:'3', slug:'leather-products',   name: lang === 'bn' ? 'লেদার' : 'Leather',       imageUrl: undefined, color: '#92400e' },
                { id:'4', slug:'organic-foods',      name: lang === 'bn' ? 'অর্গানিক' : 'Organic',   imageUrl: undefined, color: '#16a34a' },
                { id:'5', slug:'handicrafts',        name: lang === 'bn' ? 'হস্তশিল্প' : 'Crafts',   imageUrl: undefined, color: '#7c3aed' },
                { id:'6', slug:'islamic-lifestyle',  name: lang === 'bn' ? 'ইসলামিক' : 'Islamic',    imageUrl: undefined, color: '#065f46' },
                { id:'7', slug:'daily-needs',        name: lang === 'bn' ? 'দৈনন্দিন' : 'Daily',     imageUrl: undefined, color: '#b45309' },
                { id:'8', slug:'default',            name: lang === 'bn' ? 'আরো' : 'More',            imageUrl: undefined, color: '#6b7280' },
              ] as (Category & { children?: Category[] })[]
            ).map(cat => (
              <Link key={cat.id}
                href={cat.slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : cat.slug === 'default' ? '/categories' : `/products?categorySlug=${cat.slug}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 group">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl transition-transform group-hover:scale-105 shadow-sm border-2 border-white"
                  style={{ backgroundColor: cat.color ?? '#f3f4f6' }}
                >
                  {cat.imageUrl ? (
                    <Image src={cat.imageUrl} alt={cat.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <span>{CAT_EMOJI[cat.slug] ?? CAT_EMOJI.default}</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-gray-700 text-center w-16 leading-tight truncate">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO ROW 1 — after categories */}
      <PromoBannerRow banners={promo1} />

      {/* ═══════════════════════════════════════════════════════════════
          FLASH DEALS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-5 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg shadow-red-200 animate-pulse">
                <Flame className="w-4 h-4 animate-bounce" />
                <span className="font-black text-sm">{lang === 'bn' ? 'ফ্ল্যাশ ডিল' : 'Flash Deals'}</span>
              </div>
              <div className="flex gap-1 items-center">
                {[{ v: pad(countdown.h), l: 'H' }, { v: pad(countdown.m), l: 'M' }, { v: pad(countdown.s), l: 'S' }].map(({ v, l }, i) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="bg-gray-900 text-white rounded px-2 py-1 text-center min-w-[32px]">
                      <div className="text-sm font-black leading-none">{v}</div>
                      <div className="text-[7px] opacity-60">{l}</div>
                    </div>
                    {i < 2 && <span className="text-gray-400 font-black text-xs">:</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/products" className="text-[11px] font-bold text-orange-500 hover:underline">{lang === 'bn' ? 'সব দেখুন' : 'View All'}</Link>
              <button onClick={() => scroll(flashRef, 'l')} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
              <button onClick={() => scroll(flashRef, 'r')} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
            </div>
          </div>
          <div ref={flashRef} className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {flashProducts.length > 0
              ? flashProducts.map(p => <FlashCard key={p.id} product={p} lang={lang} />)
              : Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[175px] animate-pulse">
                  <div className="w-full h-[200px] rounded-2xl bg-gray-200 mb-2" />
                  <div className="h-3 bg-gray-200 rounded mb-1 mx-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 mx-2 mb-2" />
                  <div className="h-7 bg-gray-200 rounded mx-2" />
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* PROMO ROW 2 — after flash deals */}
      <PromoBannerRow banners={promo2} />

      {/* ═══════════════════════════════════════════════════════════════
          BOOK WORLD — tabbed shelf
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-2 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-base font-black text-gray-900">📚 {lang === 'bn' ? 'বইয়ের জগৎ' : 'Book World'}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                {BOOK_SHELF_TABS.map(tab => (
                  <button key={tab.key} onClick={() => setBookShelfTab(tab.key)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${bookShelfTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {lang === 'bn' ? tab.labelBn : tab.labelEn}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => scroll(shelfRef, 'l')} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => scroll(shelfRef, 'r')} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
              </div>
            </div>
          </div>
          <div ref={shelfRef} className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {shelfBooks.length > 0 ? shelfBooks.map(p => (
              <div key={p.id} className="flex-shrink-0 w-[190px]"><MiniCard product={p} lang={lang} /></div>
            )) : Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[190px]"><SkeletonCard /></div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
            <Link href="/books" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
              {lang === 'bn' ? 'সব বই দেখুন' : 'View All Books'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ISLAMIC LIFESTYLE BANNER — right after book world
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto">
          <a href="/islamic-lifestyle" className="block rounded-2xl overflow-hidden relative group cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #34d399 0%, transparent 40%)' }} />
            <div className="relative flex flex-col sm:flex-row items-center justify-between px-6 py-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🕌</span>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Islamic Lifestyle</span>
                </div>
                <h2 className="text-white font-black text-xl sm:text-2xl leading-tight mb-1">
                  {lang === 'bn' ? 'ইসলামিক লাইফস্টাইল' : 'Islamic Lifestyle'}
                </h2>
                <p className="text-emerald-200 text-sm max-w-md">
                  {lang === 'bn'
                    ? 'নামাজের সরঞ্জাম, ইসলামিক বই, আতর, তাসবিহ ও আরও অনেক কিছু'
                    : 'Prayer essentials, Islamic books, perfumes, tasbih and more'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['🕌 নামাজ', '📖 বই', '✨ কুরআন', '🌹 আতর', '📿 তাসবিহ'].map(tag => (
                    <span key={tag} className="text-xs bg-white/10 text-emerald-100 px-2.5 py-1 rounded-full border border-white/20">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2 bg-white text-emerald-800 font-bold px-5 py-2.5 rounded-xl group-hover:bg-emerald-50 transition-colors text-sm">
                {lang === 'bn' ? 'দেখুন' : 'Explore'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          </a>
        </div>
      </section>

      {/* PROMO ROW 3 — after book world */}
      <PromoBannerRow banners={promo3} />

      {/* ═══════════════════════════════════════════════════════════════
          NEW ARRIVALS — 6-column grid
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="নতুন আগমন" titleEn="New Arrivals" href="/products?sortBy=createdAt&sortOrder=desc" accentColor="#f97316" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {newArrivals.length > 0
              ? newArrivals.slice(0, 12).map(p => <MiniCard key={p.id} product={p} lang={lang} />)
              : Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            }
          </div>
        </div>
      </section>

      {/* PROMO ROW 4 — after new arrivals */}
      <PromoBannerRow banners={promo4} />

      {/* ═══════════════════════════════════════════════════════════════
          BEST SELLERS — tabbed 6-column grid
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-violet-600 rounded-full" />
              <h2 className="text-base font-black text-gray-900">{lang === 'bn' ? 'বেস্ট সেলার' : 'Best Sellers'}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {BEST_TABS.map(tab => (
                <button key={tab.key} onClick={() => setBestTab(tab.key)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${bestTab === tab.key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {lang === 'bn' ? tab.labelBn : tab.labelEn}
                </button>
              ))}
              <Link href="/products" className="text-[11px] font-bold text-orange-500 hover:underline ml-1">{lang === 'bn' ? 'সব দেখুন' : 'All'}</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {bestProducts.length > 0
              ? bestProducts.slice(0, 12).map(p => <MiniCard key={p.id} product={p} lang={lang} />)
              : Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            }
          </div>
          <div className="mt-4 flex justify-center">
            <Link href="/products" className="px-8 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors">
              {lang === 'bn' ? 'সকল পণ্য দেখুন' : 'View All Products'}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          RANKINGS — 3 column
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-base font-black text-gray-900">📊 {lang === 'bn' ? 'র‍্যাংকিং' : 'Rankings'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RANK_SECTIONS.map(sec => (
              <div key={sec.id} className="bg-white rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100"
                  style={{ borderTop: `3px solid ${sec.accent}` }}>
                  <h3 className="font-black text-sm text-gray-900">{lang === 'bn' ? sec.titleBn : sec.titleEn}</h3>
                  <Link href="/books" className="text-[11px] font-bold text-orange-500 hover:underline flex items-center gap-0.5">
                    {lang === 'bn' ? 'সব দেখুন' : 'All'} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="px-4 py-1 divide-y divide-gray-50">
                  {(RANK_DATA[sec.default] ?? []).map((item, idx) => (
                    <RankRow key={item.href} item={item} index={idx} lang={lang} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LEATHER PRODUCTS BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/categories/leather-products" className="block rounded-2xl overflow-hidden relative group cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1c0a00 0%, #3b1a08 40%, #5c2d0e 100%)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #b45309 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d97706 0%, transparent 40%)' }} />
            <div className="relative flex flex-col sm:flex-row items-center justify-between px-6 py-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👜</span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Leather Collection</span>
                </div>
                <h2 className="text-white font-black text-xl sm:text-2xl leading-tight mb-1">
                  {lang === 'bn' ? 'লেদার পণ্য সংগ্রহ' : 'Leather Products'}
                </h2>
                <p className="text-amber-200 text-sm max-w-md">
                  {lang === 'bn'
                    ? 'প্রিমিয়াম চামড়ার ব্যাগ, ওয়ালেট, বেল্ট ও আরও অনেক কিছু'
                    : 'Premium leather bags, wallets, belts and much more'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['👜 ব্যাগ', '👛 ওয়ালেট', '🧣 বেল্ট', '🎒 ব্যাকপ্যাক', '💼 অফিস ব্যাগ'].map(tag => (
                    <span key={tag} className="text-xs bg-white/10 text-amber-100 px-2.5 py-1 rounded-full border border-white/20">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2 bg-white text-amber-900 font-bold px-5 py-2.5 rounded-xl group-hover:bg-amber-50 transition-colors text-sm">
                {lang === 'bn' ? 'দেখুন' : 'Explore'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
            {/* subtle top-right decorative circle like Islamic banner */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-700/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LEATHER PRODUCTS GRID
      ═══════════════════════════════════════════════════════════════ */}
      {leatherProducts.length > 0 && (
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="চামড়া পণ্য" titleEn="Leather Products" href="/products?categorySlug=leather-products" accentColor="#92400e" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {leatherProducts.map(p => <MiniCard key={p.id} product={p} lang={lang} />)}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HANDICRAFTS
      ═══════════════════════════════════════════════════════════════ */}
      {handicraftProducts.length > 0 && (
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="হস্তশিল্প" titleEn="Handicrafts" href="/products?categorySlug=handicrafts" accentColor="#7c3aed" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {handicraftProducts.map(p => <MiniCard key={p.id} product={p} lang={lang} />)}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ELECTRONICS
      ═══════════════════════════════════════════════════════════════ */}
      {electronicsProducts.length > 0 && (
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="ইলেকট্রনিক্স" titleEn="Electronics" href="/products?categorySlug=electronics" accentColor="#0284c7" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {electronicsProducts.map(p => <MiniCard key={p.id} product={p} lang={lang} />)}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DAILY NEEDS
      ═══════════════════════════════════════════════════════════════ */}
      {dailyProducts.length > 0 && (
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="দৈনিক পণ্য" titleEn="Daily Needs" href="/products?categorySlug=daily-needs" accentColor="#f59e0b" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {dailyProducts.map(p => <MiniCard key={p.id} product={p} lang={lang} />)}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BABY PRODUCTS
      ═══════════════════════════════════════════════════════════════ */}
      {babyProducts.length > 0 && (
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="শিশু পণ্য" titleEn="Baby Products" href="/products?categorySlug=baby-products" accentColor="#ec4899" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {babyProducts.map(p => <MiniCard key={p.id} product={p} lang={lang} />)}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ORGANIC PRODUCTS
      ═══════════════════════════════════════════════════════════════ */}
      {organicProducts.length > 0 && (
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <SectionHeader titleBn="অর্গানিক পণ্য" titleEn="Organic Products" href="/categories/organic-foods" accentColor="#16a34a" lang={lang} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {organicProducts.map(p => <MiniCard key={p.id} product={p} lang={lang} />)}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          AUTHORS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-pink-500 rounded-full" />
              <h2 className="text-base font-black text-gray-900">{lang === 'bn' ? '✍️ জনপ্রিয় লেখক' : '✍️ Popular Authors'}</h2>
            </div>
            <div className="flex gap-1">
              <button onClick={() => scroll(authorsRef, 'l')} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
              <button onClick={() => scroll(authorsRef, 'r')} className="p-1 rounded border border-gray-200 hover:bg-gray-50"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
            </div>
          </div>
          <div ref={authorsRef} className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {AUTHORS.map(author => (
              <Link key={author.href} href={author.href} className="flex flex-col items-center gap-2 min-w-[80px] group flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-blue-500 transition-all">
                  <Image src={author.image} alt={author.nameEn} width={64} height={64} unoptimized className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-400" />
                </div>
                <p className="text-[11px] font-bold text-gray-700 text-center line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                  {lang === 'bn' ? author.name : author.nameEn}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BROWSE BY GENRE
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-indigo-500 rounded-full" />
            <h2 className="text-base font-black text-gray-900">{lang === 'bn' ? 'বিষয় অনুযায়ী বই' : 'Browse by Genre'}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <Link key={g.href} href={g.href}
                className="px-4 py-2 rounded-full text-xs font-bold border transition-all hover:opacity-80"
                style={{ backgroundColor: g.bg, color: g.color, borderColor: g.color + '40' }}>
                {lang === 'bn' ? g.label : g.labelEn}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CUSTOMER REVIEWS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-yellow-500 rounded-full" />
            <h2 className="text-base font-black text-gray-900">{lang === 'bn' ? '⭐ ক্রেতাদের মতামত' : '⭐ Customer Reviews'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'রাকিব হাসান',    nameEn: 'Rakib Hasan',   loc: 'ঢাকা',      locEn: 'Dhaka',      rating: 5, textBn: 'অসাধারণ সার্ভিস! অর্ডার করার ২৪ ঘন্টার মধ্যে বই পেয়ে গেছি। প্যাকেজিং একদম পারফেক্ট।', textEn: 'Amazing service! Got my book within 24 hours. Packaging was perfect.' },
              { name: 'তানিয়া আক্তার',  nameEn: 'Tania Akter',  loc: 'চট্টগ্রাম', locEn: 'Chittagong', rating: 5, textBn: 'দাম অনেক কম, বই একদম অরিজিনাল। UNKORA থেকেই এখন সব বই কিনি।', textEn: 'Great prices, genuine books. I buy all my books from UNKORA now.' },
              { name: 'আরিফ রহমান',      nameEn: 'Arif Rahman',   loc: 'রাজশাহী',   locEn: 'Rajshahi',   rating: 5, textBn: 'অর্গানিক পণ্যগুলো সত্যিই ভালো মানের। মধু আর কালিজিরা দুটোই খাঁটি।', textEn: 'The organic products are genuinely high quality. Pure honey and black seed.' },
            ].map(r => (
              <div key={r.name} className="border border-gray-100 rounded-xl p-4">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-xs leading-relaxed mb-3 italic">&ldquo;{lang === 'bn' ? r.textBn : r.textEn}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-black text-blue-700">
                    {(lang === 'bn' ? r.name : r.nameEn).charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{lang === 'bn' ? r.name : r.nameEn}</p>
                    <p className="text-[10px] text-gray-400">{lang === 'bn' ? r.loc : r.locEn}</p>
                  </div>
                  <span className="ml-auto text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">✓ {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          NEWSLETTER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-4 px-3 md:px-4">
        <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f2340)' }}>
          <div className="max-w-xl mx-auto px-6 py-10 text-center">
            <div className="text-3xl mb-2">📬</div>
            <h2 className="text-lg font-black text-white mb-1">{lang === 'bn' ? 'অফার মিস করতে চান না?' : 'Never Miss a Deal?'}</h2>
            <p className="text-blue-300 text-xs mb-5">{lang === 'bn' ? 'সাবস্ক্রাইব করুন — সেরা অফার সবার আগে পান' : 'Subscribe and get the best deals first'}</p>
            {newsletterDone ? (
              <div className="flex items-center justify-center gap-2 text-green-300 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                {lang === 'bn' ? 'সাবস্ক্রাইব করা হয়েছে! ধন্যবাদ।' : 'Subscribed! Thank you.'}
              </div>
            ) : (
              <form className="flex gap-2 max-w-sm mx-auto" onSubmit={e => {
                e.preventDefault();
                if (!newsletterEmail) return;
                setNewsletterDone(true);
                toast.success(lang === 'bn' ? 'সাবস্ক্রাইব সফল হয়েছে!' : 'Successfully subscribed!', {
                  description: lang === 'bn' ? 'সেরা অফার সবার আগে পাবেন।' : 'You will get the best deals first.',
                });
              }}>
                <input
                  type="email" required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার ইমেইল' : 'Your email'}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-400 text-xs focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button type="submit" className="px-5 py-2.5 bg-orange-500 text-white text-xs font-black rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap">
                  {lang === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SERVICE FEATURES
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-4 px-3 md:px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Truck,       color: '#2563eb', bg: '#dbeafe', titleBn: 'দ্রুত ডেলিভারি',    titleEn: 'Fast Delivery',   subBn: 'ঢাকায় ২৪ ঘন্টায়', subEn: 'Dhaka in 24 hours' },
              { icon: RotateCcw,   color: '#d97706', bg: '#fef3c7', titleBn: '৭ দিনে রিটার্ন',   titleEn: '7-Day Returns',   subBn: 'সহজ রিটার্ন পলিসি', subEn: 'Easy return policy' },
              { icon: ShieldCheck, color: '#16a34a', bg: '#dcfce7', titleBn: '১০০% অরিজিনাল',   titleEn: '100% Original',   subBn: 'গ্যারান্টিড অরিজিনাল', subEn: 'Guaranteed genuine' },
              { icon: Headphones,  color: '#7c3aed', bg: '#ede9fe', titleBn: '২৪/৭ সাপোর্ট',    titleEn: '24/7 Support',    subBn: 'সার্বক্ষণিক সহায়তা', subEn: 'Always available' },
            ].map(({ icon: Icon, color, bg, titleBn, titleEn, subBn, subEn }) => (
              <div key={titleEn} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{lang === 'bn' ? titleBn : titleEn}</p>
                  <p className="text-[10px] text-gray-400">{lang === 'bn' ? subBn : subEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
