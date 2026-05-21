'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Package, Briefcase, Leaf, Layers, Zap,
  ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck, Headphones,
  Flame, Star, Tag, ArrowRight,
} from 'lucide-react';
import { productsApi, categoriesApi, type Product } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { useLanguage } from '@/lib/i18n/language-context';

/* ─────────────────────────── static data ─────────────────────────── */

const HERO_BG   = ['bg-blue-600', 'bg-orange-500', 'bg-green-600'];
const HERO_IMGS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
];

const HERO_SLIDES = [
  { bg: '#0f172a', headline: 'বাংলাদেশের সেরা বইয়ের দোকান', subtext: '১ লাখেরও বেশি বই • সেরা দামে', cta: 'বই দেখুন →', ctaHref: '/books' },
  { bg: '#14532d', headline: 'খাঁটি অর্গানিক পণ্য', subtext: 'প্রকৃতির কাছ থেকে সরাসরি আপনার কাছে', cta: 'অর্গানিক দেখুন →', ctaHref: '/categories/organic-foods' },
  { bg: '#1e1b4b', headline: 'মেগা সেল চলছে!', subtext: '৭০% পর্যন্ত ছাড় • সীমিত সময়', cta: 'অফার দেখুন →', ctaHref: '/products' },
] as const;

const HERO_BOOKS = [
  { title: 'Atomic Habits',          price: '৳420', img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=200' },
  { title: 'প্যারাডক্সিক্যাল সাজিদ', price: '৳180', img: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=200' },
  { title: 'Sapiens',                price: '৳520', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=200' },
];

const CAT_IMGS = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990bc6?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1474932430478-3a7fb9065da0?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200&auto=format&fit=crop',
];

const CAT_HREFS = ['/books?genre=Academic', '/books?genre=Islamic', '/books', '/books?genre=Self-Help'];

const QUICK_CATS = [
  { icon: BookOpen,  slug: '/products?categorySlug=books' },
  { icon: Package,   slug: '/products?categorySlug=baby-products' },
  { icon: Briefcase, slug: '/products?categorySlug=leather-products' },
  { icon: Leaf,      slug: '/products?categorySlug=organic-foods' },
  { icon: Layers,    slug: '/products?categorySlug=handicrafts' },
  { icon: Zap,       slug: '/products?categorySlug=electronics' },
];

const CAT_EMOJI: Record<string, string> = {
  books: '📚', 'baby-products': '👶', 'leather-products': '👜',
  'organic-foods': '🌿', handicrafts: '🎨', electronics: '⚡',
  'daily-needs': '🛒', default: '🏷️',
};

const GRID_EMOJIS = [
  ['🌬️','🌂','❄️','🦟'],
  ['🧴','🪒','👶','💇'],
  ['📱','🎧','⌚','📷'],
];

const KIDS_ITEMS = [
  { emoji: '🧼', slugLabel: 'Baby Wash' },
  { emoji: '🧴', slugLabel: 'Lotions' },
  { emoji: '🧸', slugLabel: 'Kids Toys' },
  { emoji: '🛒', slugLabel: 'Strollers' },
  { emoji: '🍼', slugLabel: 'Feeding' },
  { emoji: '✨', slugLabel: 'Powders' },
];

const AUTHORS = [
  { name: 'হুমায়ূন আহমেদ', nameEn: 'Humayun Ahmed',    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', href: '/books?author=হুমায়ূন আহমেদ' },
  { name: 'আরিফ আজাদ',      nameEn: 'Arif Azad',        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop', href: '/books?author=আরিফ আজাদ' },
  { name: 'জাফর ইকবাল',      nameEn: 'Zafar Iqbal',      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', href: '/books?author=মুহম্মদ জাফর ইকবাল' },
  { name: 'সমরেশ মজুমদার',   nameEn: 'Samaresh Majumdar',image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200&auto=format&fit=crop', href: '/books?author=সমরেশ মজুমদার' },
  { name: 'James Clear',      nameEn: 'James Clear',       image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=200&auto=format&fit=crop', href: '/books?author=James Clear' },
  { name: 'রবীন্দ্রনাথ',      nameEn: 'Rabindranath',     image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&auto=format&fit=crop', href: '/books?author=রবীন্দ্রনাথ ঠাকুর' },
];

const RANK_DATA = {
  Fiction:     [{ title: 'হিমুর দ্বিতীয় প্রহর',  titleEn: 'Himur Dwitiy Prohor',  author: 'হুমায়ূন আহমেদ',         rating: 4.9, reviews: 210,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop', href: '/products/himur-dwitiy-prohor' },
               { title: 'প্যারাডক্সিক্যাল সাজিদ', titleEn: 'Paradoxical Sajid',    author: 'আরিফ আজাদ',              rating: 4.8, reviews: 1450, image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=100&auto=format&fit=crop', href: '/products/paradoxical-sajid' },
               { title: 'লোহার চুড়ি',             titleEn: 'Lohar Churi',          author: 'সমরেশ মজুমদার',           rating: 4.7, reviews: 85,   image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=100&auto=format&fit=crop', href: '/products/lohar-churi' }],
  'Non-Fiction':[{ title: 'Atomic Habits',         titleEn: 'Atomic Habits',         author: 'James Clear',             rating: 5.0, reviews: 4500, image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=100&auto=format&fit=crop', href: '/products/atomic-habits' },
                 { title: 'Sapiens',               titleEn: 'Sapiens',               author: 'Yuval Noah Harari',       rating: 4.9, reviews: 3200, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=100&auto=format&fit=crop', href: '/products/sapiens' },
                 { title: 'The Psychology of Money',titleEn: 'The Psychology of Money',author: 'Morgan Housel',          rating: 4.8, reviews: 1800, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=100&auto=format&fit=crop', href: '/products/the-psychology-of-money' }],
  Islamic:     [{ title: 'বেলা ফুরাবার আগে',       titleEn: 'Bela Furabar Age',      author: 'আরিফ আজাদ',              rating: 4.8, reviews: 900,  image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=100&auto=format&fit=crop', href: '/products/bela-furabar-age' },
               { title: 'নবী জীবনী',               titleEn: 'Nabi Jiboni',           author: 'ড. আলী মুহাম্মদ সাল্লাবী',rating: 4.9, reviews: 540,  image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=100&auto=format&fit=crop', href: '/products/nabi-jiboni' }],
  Thriller:    [{ title: 'পদ্মা নদীর মাঝি',        titleEn: 'Padma Nadir Majhi',     author: 'মানিক বন্দ্যোপাধ্যায়',   rating: 4.6, reviews: 320,  image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=100&auto=format&fit=crop', href: '/products/padma-nadir-majhi' }],
  Productivity:[{ title: 'Deep Work',               titleEn: 'Deep Work',             author: 'Cal Newport',             rating: 4.7, reviews: 1200, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=100&auto=format&fit=crop', href: '/products/deep-work' }],
  Hadith:      [{ title: 'রিয়াদুস সালেহীন',        titleEn: 'Riyadhus Saliheen',     author: 'ইমাম নববী',              rating: 5.0, reviews: 2100, image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=100&auto=format&fit=crop', href: '/products/riyadus-salehin' }],
} as Record<string, { title: string; titleEn: string; author: string; rating: number; reviews: number; image: string; href: string }[]>;

const FLASH_DEALS = [
  { id: 'fd1', title: 'প্যারাডক্সিক্যাল সাজিদ', titleEn: 'Paradoxical Sajid', price: 180, originalPrice: 350, sold: 182, total: 200, image: 'https://images.unsplash.com/photo-1544948191-c83610230351?q=80&w=300&auto=format&fit=crop', href: '/products/paradoxical-sajid' },
  { id: 'fd2', title: 'Atomic Habits',            titleEn: 'Atomic Habits',        price: 420, originalPrice: 600, sold: 95,  total: 120, image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=300&auto=format&fit=crop', href: '/products/atomic-habits' },
  { id: 'fd3', title: 'হিমুর দ্বিতীয় প্রহর',  titleEn: 'Himur Dwitiy Prohor',  price: 160, originalPrice: 250, sold: 140, total: 150, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&auto=format&fit=crop', href: '/products/himur-dwitiy-prohor' },
  { id: 'fd4', title: 'বেলা ফুরাবার আগে',       titleEn: 'Bela Furabar Age',     price: 200, originalPrice: 320, sold: 77,  total: 100, image: 'https://images.unsplash.com/photo-1585036156171-3839efc229b7?q=80&w=300&auto=format&fit=crop', href: '/products/bela-furabar-age' },
  { id: 'fd5', title: 'অর্গানিক মধু ৫০০গ্রাম',  titleEn: 'Organic Honey 500g',   price: 380, originalPrice: 550, sold: 63,  total: 80,  image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=300&auto=format&fit=crop', href: '/categories/organic-foods' },
  { id: 'fd6', title: 'লেদার বাইফোল্ড মানিব্যাগ', titleEn: 'Leather Bifold Wallet', price: 650, originalPrice: 1200, sold: 44, total: 60, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=300&auto=format&fit=crop', href: '/categories/leather-products' },
];

const PROMO_BANNERS = [
  { id: 'pb1', title: 'বই উৎসব',       titleEn: 'Book Festival',    sub: 'সকল বইয়ে ২০% ছাড়',         subEn: '20% off all books',       gradient: 'from-blue-600 to-blue-800',   emoji: '📚', href: '/books' },
  { id: 'pb2', title: 'অর্গানিক স্টোর', titleEn: 'Organic Store',   sub: 'প্রাকৃতিক পণ্য সংগ্রহ',       subEn: 'Natural products collection', gradient: 'from-green-600 to-green-800', emoji: '🌿', href: '/categories/organic-foods' },
  { id: 'pb3', title: 'ফ্রি শিপিং',    titleEn: 'Free Shipping',   sub: '৫০০ টাকার উপরে অর্ডারে',     subEn: 'Orders above ৳500',           gradient: 'from-orange-500 to-red-600',  emoji: '🚚', href: '/shipping-policy' },
];

const BEST_SELLER_TABS = [
  { key: 'all',        labelBn: 'সব',          labelEn: 'All',       category: undefined },
  { key: 'books',      labelBn: 'বই',          labelEn: 'Books',     category: 'books' },
  { key: 'organic',   labelBn: 'অর্গানিক',    labelEn: 'Organic',   category: 'organic-foods' },
  { key: 'leather',   labelBn: 'লেদার',       labelEn: 'Leather',   category: 'leather-products' },
  { key: 'handicraft', labelBn: 'হস্তশিল্প',  labelEn: 'Handicraft', category: 'handicrafts' },
];

const BOOK_SHELF_TABS = [
  { key: 'fiction',         labelBn: 'উপন্যাস',      labelEn: 'Fiction',      color: 'bg-blue-600' },
  { key: 'islamic-books',   labelBn: 'ইসলামিক',      labelEn: 'Islamic',      color: 'bg-green-600' },
  { key: 'academic',        labelBn: 'একাডেমিক',     labelEn: 'Academic',     color: 'bg-purple-600' },
  { key: 'self-help',       labelBn: 'আত্মউন্নয়ন',  labelEn: 'Self Help',    color: 'bg-orange-500' },
  { key: 'childrens-books', labelBn: 'শিশু-কিশোর',   labelEn: "Children's",   color: 'bg-pink-500' },
];

const RANK_SECTIONS = [
  { id: 'rank-1', title: 'কল্পকাহিনী',   titleEn: 'Fiction',     tabs: ['Fiction', 'Thriller'],              tabsBn: ['কল্পকাহিনী', 'থ্রিলার'],          default: 'Fiction' },
  { id: 'rank-2', title: 'নন-ফিকশন',     titleEn: 'Non-Fiction', tabs: ['Non-Fiction', 'Productivity'],      tabsBn: ['নন-ফিকশন', 'প্রোডাক্টিভিটি'],    default: 'Non-Fiction' },
  { id: 'rank-3', title: 'ইসলামিক',      titleEn: 'Islamic',     tabs: ['Islamic', 'Hadith'],                tabsBn: ['ইসলামিক', 'হাদীস'],               default: 'Islamic' },
];

/* ─────────────────────────── components ─────────────────────────── */

function NewsletterForm({ lang }: { lang: string }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  return done ? (
    <div className="flex items-center justify-center gap-2 text-green-300 font-bold text-lg py-4">
      <span>✓</span>
      <span>{lang === 'bn' ? 'সাবস্ক্রাইব সফল হয়েছে! ধন্যবাদ।' : 'Subscribed successfully! Thank you.'}</span>
    </div>
  ) : (
    <form onSubmit={e => { e.preventDefault(); if (email) setDone(true); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder={lang === 'bn' ? 'আপনার ইমেইল লিখুন' : 'Enter your email'}
        className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
      />
      <button type="submit" className="px-7 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 whitespace-nowrap">
        {lang === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
      </button>
    </form>
  );
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000));
      setTimeLeft({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

function FlashDealCard({ deal, lang }: { deal: typeof FLASH_DEALS[number]; lang: string }) {
  const pct = Math.round((deal.sold / deal.total) * 100);
  const discount = Math.round((1 - deal.price / deal.originalPrice) * 100);
  return (
    <Link href={deal.href} className="min-w-[170px] w-[170px] flex-shrink-0 bg-white rounded-xl overflow-hidden group hover:shadow-lg transition-all border border-gray-100">
      <div className="relative h-40 bg-gray-50 overflow-hidden">
        <Image src={deal.image} alt={deal.titleEn} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized={deal.image.includes('unsplash')} sizes="170px" />
        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">-{discount}%</div>
      </div>
      <div className="p-2.5">
        <p className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-2 leading-tight group-hover:text-primary transition-colors">{lang === 'bn' ? deal.title : deal.titleEn}</p>
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-sm font-black text-red-500">৳{deal.price}</span>
          <span className="text-[10px] text-gray-400 line-through">৳{deal.originalPrice}</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[9px] text-gray-400">{lang === 'bn' ? `${deal.sold}টি বিক্রি` : `${deal.sold} sold`}</p>
      </div>
    </Link>
  );
}

function BookShelfCard({ product }: { product: Product }) {
  const price = Number(product.salePrice ?? product.basePrice);
  const original = product.salePrice && Number(product.salePrice) < Number(product.basePrice) ? Number(product.basePrice) : null;
  const discount = original ? Math.round((1 - price / original) * 100) : null;
  const img = product.images?.[0]?.url;
  return (
    <Link href={`/products/${product.slug}`} className="min-w-[130px] w-[130px] flex-shrink-0 group">
      <div className="relative h-[175px] bg-gray-100 rounded-lg overflow-hidden mb-2 shadow-sm group-hover:shadow-md transition-shadow">
        {img ? (
          <Image src={img} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-400" sizes="130px" unoptimized={img.includes('unsplash')} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-50 to-indigo-100">📚</div>
        )}
        {discount && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1 py-0.5 rounded">-{discount}%</span>
        )}
      </div>
      <p className="text-[11px] font-bold text-gray-800 line-clamp-2 mb-0.5 leading-snug group-hover:text-primary transition-colors">{product.name}</p>
      {product.bookDetail && (
        <p className="text-[10px] text-gray-400 truncate mb-1">{product.bookDetail.author}</p>
      )}
      <div className="flex items-center gap-1">
        <span className="text-xs font-black text-primary">৳{price}</span>
        {original && <span className="text-[10px] text-gray-400 line-through">৳{original}</span>}
      </div>
    </Link>
  );
}

function RankSection({ section }: { section: typeof RANK_SECTIONS[number] }) {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState(section.default);
  const items = RANK_DATA[activeTab] ?? RANK_DATA[section.default] ?? [];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-gray-900">{lang === 'bn' ? section.title : section.titleEn}</h3>
        <Link href="/books" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
          {t.common.seeMore} <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 border-b border-gray-100 mb-4">
        {section.tabs.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-xs font-bold transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            {lang === 'bn' ? section.tabsBn[idx] : tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <Link key={item.href} href={item.href} className="flex gap-3 group cursor-pointer items-center">
            <span className={`w-6 text-center font-black text-sm flex-shrink-0 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-gray-200'}`}>
              {index + 1}
            </span>
            <div className="w-10 h-13 rounded overflow-hidden flex-shrink-0 bg-gray-50" style={{ height: '52px' }}>
              <Image src={item.image} alt={item.titleEn} width={40} height={52} unoptimized className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{lang === 'bn' ? item.title : item.titleEn}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.author}</p>
              <span className="text-[9px] bg-yellow-50 text-yellow-600 px-1 py-0.5 rounded font-bold">★ {item.rating}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */

export default function HomePage() {
  const { lang, t } = useLanguage();
  const h = t.home;
  const [slideIndex, setSlideIndex] = useState(0);
  const [bestTab, setBestTab] = useState('all');
  const [bookShelfTab, setBookShelfTab] = useState('fiction');

  const quickDealsRef  = useRef<HTMLDivElement>(null);
  const recentRef      = useRef<HTMLDivElement>(null);
  const authorsRef     = useRef<HTMLDivElement>(null);
  const flashRef       = useRef<HTMLDivElement>(null);
  const newArrivalRef  = useRef<HTMLDivElement>(null);
  const bookShelfRef   = useRef<HTMLDivElement>(null);

  const flashEnd = useRef(new Date(Date.now() + 8 * 3600 * 1000)).current;
  const countdown = useCountdown(flashEnd);

  const [slideKey, setSlideKey] = useState(0);

  const goToSlide = useCallback((idx: number | ((i: number) => number)) => {
    setSlideIndex(idx);
    setSlideKey(k => k + 1);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex(i => (i + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, [slideKey]);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'left' ? -ref.current.clientWidth : ref.current.clientWidth, behavior: 'smooth' });
  };

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeatured(12),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-roots'],
    queryFn: () => categoriesApi.getRoots(),
  });

  const { data: recentData } = useQuery({
    queryKey: ['products', 'recent'],
    queryFn: () => productsApi.getAll({ limit: 8 }),
  });
  const recentProducts = recentData?.data ?? [];

  const { data: newArrivalData } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productsApi.getAll({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' } as Parameters<typeof productsApi.getAll>[0]),
  });
  const newArrivals = newArrivalData?.data ?? [];

  const { data: bestData } = useQuery({
    queryKey: ['products', 'bestsellers', bestTab],
    queryFn: () => productsApi.getAll({
      limit: 8,
      ...(bestTab !== 'all' ? { categorySlug: BEST_SELLER_TABS.find(tab => tab.key === bestTab)?.category } : {}),
    } as Parameters<typeof productsApi.getAll>[0]),
  });
  const bestProducts = bestData?.data ?? [];

  const { data: bookShelfData } = useQuery({
    queryKey: ['products', 'book-shelf', bookShelfTab],
    queryFn: () => productsApi.getAll({ categorySlug: bookShelfTab, limit: 10 } as Parameters<typeof productsApi.getAll>[0]),
  });
  const shelfBooks = bookShelfData?.data ?? [];

  const { data: organicData } = useQuery({
    queryKey: ['products', 'organic'],
    queryFn: () => productsApi.getAll({ categorySlug: 'organic-foods', limit: 6 } as Parameters<typeof productsApi.getAll>[0]),
  });
  const organicProducts = organicData?.data ?? [];

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#f8fafc' }}>

      {/* ── 1: Hero + Flash Sale + Hot Categories ── */}
      <section className="w-full bg-gray-50 py-3 px-3 md:px-4">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-stretch gap-3">

          {/* LEFT: Hero Banner */}
          <Link href="/products"
            className="relative rounded-2xl overflow-hidden bg-gray-800 group flex items-end flex-shrink-0
                       h-[240px] sm:h-[300px] md:h-[340px] xl:w-[380px] xl:h-auto xl:min-h-[460px]">
            <Image
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=900&auto=format&fit=crop"
              alt="Shop Now" fill unoptimized priority
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width:1280px) 100vw, 380px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="relative z-10 p-5 sm:p-7 xl:p-8">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1.5">
                {lang === 'bn' ? 'স্বাগতম UNKORA-তে' : 'Welcome to UNKORA'}
              </p>
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white leading-tight mb-4">
                {lang === 'bn' ? <>বাংলাদেশের সেরা<br />অনলাইন মার্কেটপ্লেস</> : <>Bangladesh&apos;s Best<br />Online Marketplace</>}
              </h1>
              <span className="inline-flex items-center gap-2 bg-white text-gray-900 font-black text-sm px-4 py-2.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                {lang === 'bn' ? 'কেনাকাটা করুন' : 'Explore Now'}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* RIGHT: Flash Sale + Hot Categories + Featured Products */}
          <div className="flex flex-col gap-3 min-w-0 xl:flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Flash Sale Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-blue-600 min-h-[190px] flex flex-col justify-between p-5">
                <Image src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop"
                  alt="Flash Sale" fill unoptimized className="object-cover opacity-20" sizes="(max-width:640px) 100vw, 300px" />
                <div className="relative z-10">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">{lang === 'bn' ? 'সীমিত সময়' : 'Limited Time'}</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">{lang === 'bn' ? 'সিজন শেষ সেল' : 'End of Season Sale'}</h3>
                  <p className="text-blue-200 text-xs mt-1">{lang === 'bn' ? 'ফ্ল্যাশ সেলে সীমিত অফার' : 'Limited offers in Flash Sale'}</p>
                </div>
                <div className="relative z-10 flex gap-1.5 mt-3 flex-wrap">
                  {[
                    { val: String(Math.floor(countdown.h / 24)).padStart(2, '0'), label: lang === 'bn' ? 'দিন' : 'DAY' },
                    { val: pad(countdown.h % 24), label: lang === 'bn' ? 'ঘন্টা' : 'HRS' },
                    { val: pad(countdown.m), label: lang === 'bn' ? 'মিনিট' : 'MIN' },
                    { val: pad(countdown.s), label: lang === 'bn' ? 'সেকেন্ড' : 'SEC' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[40px] border border-white/30">
                      <span className="text-base font-black text-white leading-none">{val}</span>
                      <span className="text-[9px] font-bold text-blue-200 mt-0.5">{label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/products" className="relative z-10 mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors w-fit">
                  {lang === 'bn' ? 'অফার দেখুন' : 'Shop Deals'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Hot Categories */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🔥</span>
                  <h3 className="font-black text-gray-900 text-sm">{lang === 'bn' ? 'জনপ্রিয় বিভাগ' : 'Hot Categories'}</h3>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(allCategories.length > 0 ? allCategories.slice(0, 8) : [
                    { id: '1', slug: 'books',            name: lang === 'bn' ? 'বই' : 'Books' },
                    { id: '2', slug: 'baby-products',    name: lang === 'bn' ? 'শিশু পণ্য' : 'Baby' },
                    { id: '3', slug: 'leather-products', name: lang === 'bn' ? 'চামড়া পণ্য' : 'Leather' },
                    { id: '4', slug: 'organic-foods',    name: lang === 'bn' ? 'অর্গানিক' : 'Organic' },
                    { id: '5', slug: 'handicrafts',      name: lang === 'bn' ? 'হস্তশিল্প' : 'Crafts' },
                    { id: '6', slug: 'electronics',      name: lang === 'bn' ? 'ইলেকট্রনিক্স' : 'Electronics' },
                    { id: '7', slug: 'daily-needs',      name: lang === 'bn' ? 'দৈনন্দিন' : 'Daily' },
                    { id: '8', slug: 'default',          name: lang === 'bn' ? 'আরো' : 'More' },
                  ] as { id: string; slug: string; name: string }[]).map(cat => (
                    <Link key={cat.id} href={`/products?categorySlug=${cat.slug}`}
                      className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-xl transition-colors">
                        {CAT_EMOJI[cat.slug] ?? CAT_EMOJI.default}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Featured Products horizontal scroll */}
            <div className="bg-white rounded-2xl p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary" />
                  {lang === 'bn' ? 'ফিচার্ড পণ্য' : 'Featured Products'}
                </h3>
                <Link href="/products?isFeatured=true" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline">
                  {lang === 'bn' ? 'সব দেখুন' : 'View all'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
                {featuredProducts.length > 0 ? (
                  featuredProducts.slice(0, 8).map(product => (
                    <Link key={product.id} href={`/products/${product.slug}`}
                      className="flex-shrink-0 w-[120px] sm:w-[130px] group">
                      <div className="relative w-full h-[90px] sm:h-[100px] rounded-lg overflow-hidden bg-gray-50 mb-1.5">
                        {product.images?.[0]?.url ? (
                          <Image src={product.images[0].url} alt={product.name} fill
                            unoptimized={product.images[0].url.includes('unsplash')}
                            className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="130px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl text-gray-200">📦</div>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-700 line-clamp-2 leading-tight mb-0.5 group-hover:text-primary transition-colors">{product.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-primary">৳{Number(product.salePrice ?? product.basePrice).toLocaleString('en-BD')}</span>
                        {product.salePrice && Number(product.salePrice) < Number(product.basePrice) && (
                          <span className="text-[10px] text-gray-400 line-through">৳{Number(product.basePrice).toLocaleString('en-BD')}</span>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-[130px] animate-pulse">
                      <div className="w-full h-[100px] rounded-lg bg-gray-100 mb-1.5" />
                      <div className="h-3 bg-gray-100 rounded mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2: Flash Deals ── */}
      <section className="py-8 md:py-10" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg"><Flame className="w-5 h-5 text-red-400" /></div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white">{lang === 'bn' ? 'ফ্ল্যাশ ডিল' : 'Flash Deals'}</h2>
                <p className="text-xs text-gray-400">{lang === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited time offers'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 items-center">
                {[{ val: pad(countdown.h), label: lang === 'bn' ? 'ঘন্টা' : 'HRS' }, { val: pad(countdown.m), label: lang === 'bn' ? 'মিনিট' : 'MIN' }, { val: pad(countdown.s), label: lang === 'bn' ? 'সেকেন্ড' : 'SEC' }].map(({ val, label }, i) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="bg-red-500 text-white rounded px-2 py-1 text-center min-w-[40px]">
                      <div className="text-lg font-black leading-none">{val}</div>
                      <div className="text-[8px] font-bold opacity-80">{label}</div>
                    </div>
                    {i < 2 && <span className="text-red-400 font-black">:</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={() => scroll(flashRef, 'left')} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => scroll(flashRef, 'right')} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          <div ref={flashRef} className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {FLASH_DEALS.map(deal => <FlashDealCard key={deal.id} deal={deal} lang={lang} />)}
          </div>
        </div>
      </section>

      {/* ── 3: Book World — tabbed shelf with real API data ── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">📚 {lang === 'bn' ? 'বইয়ের জগৎ' : 'Book World'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{lang === 'bn' ? 'বিভাগ অনুযায়ী বই বেছে নিন' : 'Browse books by category'}</p>
            </div>
            <Link href="/books" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
              {lang === 'bn' ? 'সব বই' : 'All Books'} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {BOOK_SHELF_TABS.map(tab => (
              <button key={tab.key} onClick={() => setBookShelfTab(tab.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0
                  ${bookShelfTab === tab.key ? `${tab.color} text-white shadow-sm` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {lang === 'bn' ? tab.labelBn : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Book shelf scroll */}
          <div className="relative">
            <button onClick={() => scroll(bookShelfRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center border border-gray-100 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div ref={bookShelfRef} className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth px-1">
              {shelfBooks.length > 0 ? (
                shelfBooks.map(product => <BookShelfCard key={product.id} product={product} />)
              ) : (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="min-w-[130px] w-[130px] flex-shrink-0 animate-pulse">
                    <div className="h-[175px] bg-gray-100 rounded-lg mb-2" />
                    <div className="h-3 bg-gray-100 rounded mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))
              )}
            </div>
            <button onClick={() => scroll(bookShelfRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center border border-gray-100 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 4: Promo Banners ── */}
      <section className="py-5 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROMO_BANNERS.map(b => (
            <Link key={b.id} href={b.href}
              className={`bg-gradient-to-r ${b.gradient} rounded-xl p-4 flex items-center gap-3 group hover:scale-[1.02] transition-transform`}>
              <div className="text-3xl">{b.emoji}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-black text-sm">{lang === 'bn' ? b.title : b.titleEn}</h3>
                <p className="text-white/75 text-xs truncate">{lang === 'bn' ? b.sub : b.subEn}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5: New Arrivals ── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900">{lang === 'bn' ? 'নতুন আগমন' : 'New Arrivals'}</h2>
                <p className="text-xs text-gray-400">{lang === 'bn' ? 'সর্বশেষ যোগ হওয়া পণ্য' : 'Latest additions'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/products?sortBy=createdAt&sortOrder=desc" className="text-primary text-xs font-bold hover:underline hidden sm:block">{t.common.viewAll}</Link>
              <div className="flex gap-1.5">
                <button onClick={() => scroll(newArrivalRef, 'left')} className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:shadow-md transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => scroll(newArrivalRef, 'right')} className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 hover:shadow-md transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          <div ref={newArrivalRef} className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {newArrivals.length > 0 ? (
              newArrivals.map(product => (
                <div key={product.id} className="min-w-[200px] w-[200px] flex-shrink-0"><ProductCard product={product} /></div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="min-w-[200px] w-[200px] flex-shrink-0 bg-gray-200 rounded-xl h-72 animate-pulse" />)
            )}
          </div>
        </div>
      </section>

      {/* ── 6: Best Sellers ── */}
      <section className="py-8 md:py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-secondary" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900">{lang === 'bn' ? 'বেস্ট সেলার' : 'Best Sellers'}</h2>
                <p className="text-xs text-gray-400">{lang === 'bn' ? 'সর্বাধিক বিক্রিত পণ্য' : 'Most popular products'}</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {BEST_SELLER_TABS.map(tab => (
                <button key={tab.key} onClick={() => setBestTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${bestTab === tab.key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary'}`}>
                  {lang === 'bn' ? tab.labelBn : tab.labelEn}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {bestProducts.length > 0 ? (
              bestProducts.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-72 animate-pulse" />)
            )}
          </div>
          <div className="flex justify-center mt-6">
            <Link href="/products" className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md text-sm">
              {lang === 'bn' ? 'সকল পণ্য দেখুন' : 'View All Products'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7: Rankings ── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-black text-gray-900">{lang === 'bn' ? '📊 র‍্যাংকিং' : '📊 Rankings'}</h2>
            <Link href="/books" className="text-primary text-xs font-bold hover:underline">{t.common.seeMore}</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {RANK_SECTIONS.map(sec => <RankSection key={sec.id} section={sec} />)}
          </div>
        </div>
      </section>

      {/* ── 8: Organic Products Showcase ── */}
      {organicProducts.length > 0 && (
        <section className="py-8 md:py-10" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900">🌿 {lang === 'bn' ? 'অর্গানিক পণ্য' : 'Organic Products'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{lang === 'bn' ? 'প্রকৃতির সেরা উপহার' : 'Nature\'s finest gifts'}</p>
              </div>
              <Link href="/categories/organic-foods" className="text-green-700 text-xs font-bold hover:underline flex items-center gap-1">
                {t.common.viewAll} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {organicProducts.map(product => (
                <Link key={product.id} href={`/products/${product.slug}`}
                  className="bg-white rounded-xl p-3 group hover:shadow-md transition-all border border-green-100">
                  <div className="relative h-24 bg-gray-50 rounded-lg overflow-hidden mb-2">
                    {product.images?.[0]?.url ? (
                      <Image src={product.images[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="150px" unoptimized={product.images[0].url.includes('unsplash')} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-gray-700 line-clamp-2 leading-tight mb-1 group-hover:text-green-700 transition-colors">{product.name}</p>
                  <span className="text-xs font-black text-green-700">৳{Number(product.salePrice ?? product.basePrice)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 9: Authors ── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg md:text-xl font-black text-gray-900">{h.weeklyAuthors}</h2>
            <div className="flex gap-1.5">
              <button onClick={() => scroll(authorsRef, 'left')} className="p-1.5 rounded-full bg-gray-50 border border-gray-100 hover:shadow-md transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => scroll(authorsRef, 'right')} className="p-1.5 rounded-full bg-gray-50 border border-gray-100 hover:shadow-md transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div ref={authorsRef} className="flex gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {AUTHORS.map(author => (
              <Link key={author.href} href={author.href} className="flex flex-col items-center gap-3 min-w-[100px] group">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-primary transition-all shadow-sm">
                  <Image src={author.image} alt={author.nameEn} width={80} height={80} unoptimized
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <p className="text-xs font-bold text-gray-700 text-center line-clamp-2 group-hover:text-primary transition-colors">
                  {lang === 'bn' ? author.name : author.nameEn}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10: Browse by Genre ── */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-black text-gray-900">{lang === 'bn' ? 'বিষয় অনুযায়ী বই' : 'Browse by Genre'}</h2>
            <Link href="/books" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">{lang === 'bn' ? 'সব বই' : 'All Books'} <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: 'উপন্যাস',       labelEn: 'Fiction',       href: '/books?genre=Fiction',       color: 'bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-600'   },
              { label: 'ইসলামিক',       labelEn: 'Islamic',       href: '/books?genre=Islamic',       color: 'bg-green-50  text-green-700  border-green-200  hover:bg-green-600'  },
              { label: 'আত্মউন্নয়ন',  labelEn: 'Self-Help',     href: '/books?genre=Self-Help',     color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-500'  },
              { label: 'নন-ফিকশন',     labelEn: 'Non-Fiction',   href: '/books?genre=Non-Fiction',   color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-600'  },
              { label: 'থ্রিলার',       labelEn: 'Thriller',      href: '/books?genre=Thriller',      color: 'bg-red-50    text-red-700    border-red-200    hover:bg-red-600'     },
              { label: 'শিশু-কিশোর',   labelEn: "Children's",    href: "/books?genre=Children's",    color: 'bg-pink-50   text-pink-700   border-pink-200   hover:bg-pink-500'    },
              { label: 'বিজ্ঞান',       labelEn: 'Science',       href: '/books?genre=Science',       color: 'bg-cyan-50   text-cyan-700   border-cyan-200   hover:bg-cyan-600'    },
              { label: 'ইতিহাস',        labelEn: 'History',       href: '/books?genre=History',       color: 'bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-500'   },
              { label: 'একাডেমিক',     labelEn: 'Academic',      href: '/books?genre=Academic',      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600'  },
              { label: 'কবিতা',         labelEn: 'Poetry',        href: '/books?genre=Poetry',        color: 'bg-rose-50   text-rose-700   border-rose-200   hover:bg-rose-500'    },
              { label: 'মুক্তিযুদ্ধ',  labelEn: 'Liberation War',href: '/books?genre=Liberation+War',color: 'bg-lime-50   text-lime-700   border-lime-200   hover:bg-lime-600'    },
              { label: 'রান্না ও রেসিপি',labelEn: 'Cooking',     href: '/books?genre=Cooking',       color: 'bg-teal-50   text-teal-700   border-teal-200   hover:bg-teal-600'    },
            ].map(g => (
              <Link key={g.href} href={g.href}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all hover:text-white hover:border-transparent hover:shadow-sm ${g.color}`}>
                {lang === 'bn' ? g.label : g.labelEn}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11: Reviews ── */}
      <section className="py-10 md:py-12" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">{lang === 'bn' ? 'ক্রেতাদের মতামত' : 'What Our Customers Say'}</h2>
            <p className="text-gray-500 text-xs">{lang === 'bn' ? '১০,০০০+ সন্তুষ্ট ক্রেতা' : '10,000+ happy customers'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'রাকিব হাসান',   nameEn: 'Rakib Hasan',   loc: 'ঢাকা',      locEn: 'Dhaka',      rating: 5, text: 'অসাধারণ সার্ভিস! অর্ডার করার ২৪ ঘন্টার মধ্যে বই পেয়ে গেছি।', textEn: 'Amazing service! Got my book within 24 hours. Packaging was excellent.', avatar: '👨' },
              { name: 'তানিয়া আক্তার', nameEn: 'Tania Akter',  loc: 'চট্টগ্রাম', locEn: 'Chittagong', rating: 5, text: 'দাম অনেক কম, বই একদম অরিজিনাল। Unkora থেকেই এখন সব বই কিনি।',    textEn: 'Great prices, genuine books. I buy all my books from Unkora now.',          avatar: '👩' },
              { name: 'আরিফ রহমান',    nameEn: 'Arif Rahman',   loc: 'রাজশাহী',   locEn: 'Rajshahi',   rating: 5, text: 'অর্গানিক পণ্যগুলো সত্যিই ভালো মানের। মধু আর বাদাম দুটোই খাঁটি।',  textEn: 'The organic products are genuinely high quality. Pure honey and nuts.',       avatar: '👨' },
            ].map(review => (
              <div key={review.name} className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-gray-700 text-xs leading-relaxed mb-4 italic">&ldquo;{lang === 'bn' ? review.text : review.textEn}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-lg">{review.avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{lang === 'bn' ? review.name : review.nameEn}</p>
                    <p className="text-[10px] text-gray-400">{lang === 'bn' ? review.loc : review.locEn}</p>
                  </div>
                  <span className="ml-auto text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12: Newsletter ── */}
      <section className="py-14" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-4xl mb-3">📬</div>
          <h2 className="text-xl md:text-2xl font-black text-white mb-2">{lang === 'bn' ? 'অফার মিস করতে চান না?' : 'Never Miss a Deal?'}</h2>
          <p className="text-blue-200 text-xs mb-7">{lang === 'bn' ? 'সাবস্ক্রাইব করুন এবং প্রতিদিনের সেরা অফার সবার আগে পান' : 'Subscribe and get the best daily deals before anyone else'}</p>
          <NewsletterForm lang={lang} />
          <p className="text-blue-300/50 text-xs mt-4">{lang === 'bn' ? 'স্প্যাম নেই। যেকোনো সময় আনসাবস্ক্রাইব করা যাবে।' : 'No spam. Unsubscribe anytime.'}</p>
        </div>
      </section>

      {/* ── 13: Service Features ── */}
      <section className="max-w-7xl mx-auto px-4 py-10 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {([
            { icon: Truck,       title: h.features.delivery, subtitle: h.features.deliverySub, color: 'text-primary',    bg: 'bg-primary/5' },
            { icon: RotateCcw,   title: h.features.return,   subtitle: h.features.returnSub,   color: 'text-secondary',  bg: 'bg-secondary/5' },
            { icon: ShieldCheck, title: h.features.genuine,  subtitle: h.features.genuineSub,  color: 'text-green-500',  bg: 'bg-green-50' },
            { icon: Headphones,  title: h.features.support,  subtitle: h.features.supportSub,  color: 'text-purple-500', bg: 'bg-purple-50' },
          ] as const).map(({ icon: Icon, title, subtitle, color, bg }) => (
            <div key={title} className="flex items-start gap-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">{title}</h4>
                <p className="text-[10px] text-gray-500">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
