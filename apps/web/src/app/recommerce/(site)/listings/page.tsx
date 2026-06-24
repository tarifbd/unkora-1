'use client';

import Link from 'next/link';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { RECOMMERCE_CATEGORIES, GRADE_META, LOCATIONS } from '../../_constants/categories';

const ALL_LISTINGS = [
  { id: 1,  title: 'Samsung Galaxy S21',     titleBn: 'স্যামসাং গ্যালাক্সি S21',    price: 28000, grade: 'A' as const,  cat: 'electronics', location: 'ঢাকা',       views: 89,  daysAgo: 1 },
  { id: 2,  title: 'Dell Laptop Core i5',    titleBn: 'ডেল ল্যাপটপ Core i5',         price: 35000, grade: 'B' as const,  cat: 'electronics', location: 'চট্টগ্রাম', views: 45,  daysAgo: 2 },
  { id: 3,  title: 'Sony Smart TV 43"',      titleBn: 'সনি স্মার্ট টিভি ৪৩"',        price: 22000, grade: 'A+' as const, cat: 'electronics', location: 'ঢাকা',       views: 134, daysAgo: 1 },
  { id: 4,  title: 'Dining Table Set',       titleBn: 'ডাইনিং টেবিল সেট',            price: 12000, grade: 'B' as const,  cat: 'furniture',   location: 'সিলেট',      views: 67,  daysAgo: 3 },
  { id: 5,  title: 'iPhone 13 Pro',          titleBn: 'আইফোন ১৩ প্রো',               price: 65000, grade: 'A+' as const, cat: 'electronics', location: 'ঢাকা',       views: 210, daysAgo: 0 },
  { id: 6,  title: 'Yamaha Guitar',          titleBn: 'ইয়ামাহা গিটার',               price: 8500,  grade: 'A' as const,  cat: 'others',      location: 'ঢাকা',       views: 52,  daysAgo: 4 },
  { id: 7,  title: 'Baby Stroller',          titleBn: 'বেবি স্ট্রলার',                price: 4500,  grade: 'A' as const,  cat: 'kids',        location: 'রাজশাহী',   views: 38,  daysAgo: 2 },
  { id: 8,  title: 'Cricket Bat & Kit',      titleBn: 'ক্রিকেট ব্যাট ও কিট',         price: 3200,  grade: 'B' as const,  cat: 'sports',      location: 'ঢাকা',       views: 91,  daysAgo: 5 },
  { id: 9,  title: 'Office Chair',           titleBn: 'অফিস চেয়ার',                  price: 6500,  grade: 'A' as const,  cat: 'furniture',   location: 'ঢাকা',       views: 43,  daysAgo: 1 },
  { id: 10, title: 'Nikon DSLR Camera',      titleBn: 'নিকন ডিএসএলআর ক্যামেরা',     price: 42000, grade: 'A' as const,  cat: 'electronics', location: 'ঢাকা',       views: 175, daysAgo: 2 },
  { id: 11, title: 'PS4 Console + 2 Games',  titleBn: 'PS4 কনসোল + ২টি গেম',         price: 25000, grade: 'A+' as const, cat: 'gaming',      location: 'সিলেট',      views: 88,  daysAgo: 3 },
  { id: 12, title: 'Wooden Bookshelf',       titleBn: 'কাঠের বুকশেলফ',               price: 5500,  grade: 'B' as const,  cat: 'furniture',   location: 'চট্টগ্রাম', views: 29,  daysAgo: 6 },
];

const SORT_OPTIONS = [
  { value: 'newest',    labelBn: 'নতুন আগে',       labelEn: 'Newest First' },
  { value: 'price_asc', labelBn: 'কম দাম আগে',    labelEn: 'Price: Low to High' },
  { value: 'price_desc',labelBn: 'বেশি দাম আগে',  labelEn: 'Price: High to Low' },
  { value: 'popular',   labelBn: 'জনপ্রিয়',        labelEn: 'Most Popular' },
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const [lang, setLang]         = useState<'bn' | 'en'>('bn');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ]   = useState(searchParams.get('q') ?? '');
  const [selCat, setSelCat]     = useState(searchParams.get('cat') ?? '');
  const [selGrades, setSelGrades] = useState<string[]>([]);
  const [selLoc, setSelLoc]     = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort]         = useState('newest');

  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;

  const filtered = useMemo(() => {
    let list = [...ALL_LISTINGS];
    if (searchQ) list = list.filter(i => i.title.toLowerCase().includes(searchQ.toLowerCase()) || i.titleBn.includes(searchQ));
    if (selCat)  list = list.filter(i => i.cat === selCat);
    if (selGrades.length) list = list.filter(i => selGrades.includes(i.grade));
    if (selLoc)  list = list.filter(i => i.location === selLoc);
    if (minPrice) list = list.filter(i => i.price >= Number(minPrice));
    if (maxPrice) list = list.filter(i => i.price <= Number(maxPrice));
    if (sort === 'price_asc')  list.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'popular')    list.sort((a, b) => b.views - a.views);
    if (sort === 'newest')     list.sort((a, b) => a.daysAgo - b.daysAgo);
    return list;
  }, [searchQ, selCat, selGrades, selLoc, minPrice, maxPrice, sort]);

  const toggleGrade = (g: string) => setSelGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const activeFiltersCount = [selCat, selLoc, ...selGrades, minPrice, maxPrice].filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{L('বিভাগ', 'Category')}</p>
        <div className="space-y-1">
          <button onClick={() => setSelCat('')}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${!selCat ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            {L('সব বিভাগ', 'All Categories')}
          </button>
          {RECOMMERCE_CATEGORIES.map(cat => (
            <button key={cat.slug} onClick={() => setSelCat(cat.slug)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${selCat === cat.slug ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{cat.emoji}</span>
              <span>{lang === 'bn' ? cat.labelBn : cat.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grade */}
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{L('গ্রেড', 'Grade')}</p>
        <div className="space-y-1.5">
          {(Object.entries(GRADE_META) as [string, typeof GRADE_META[keyof typeof GRADE_META]][]).map(([grade, meta]) => (
            <label key={grade} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selGrades.includes(grade)} onChange={() => toggleGrade(grade)}
                className="w-3.5 h-3.5 accent-amber-500" />
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${meta.color}`}>{grade}</span>
              <span className="text-xs text-gray-600">{lang === 'bn' ? meta.label : meta.labelEn}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{L('মূল্য (৳)', 'Price (৳)')}</p>
        <div className="flex gap-2">
          <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder={L('সর্বনিম্ন', 'Min')}
            className="w-full border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400" type="number" />
          <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder={L('সর্বোচ্চ', 'Max')}
            className="w-full border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400" type="number" />
        </div>
      </div>

      {/* Location */}
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">{L('অবস্থান', 'Location')}</p>
        <select value={selLoc} onChange={e => setSelLoc(e.target.value)}
          className="w-full border rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400">
          <option value="">{L('সব অবস্থান', 'All Locations')}</option>
          {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      {activeFiltersCount > 0 && (
        <button onClick={() => { setSelCat(''); setSelGrades([]); setSelLoc(''); setMinPrice(''); setMaxPrice(''); }}
          className="w-full text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 justify-center py-1.5">
          <X className="w-3.5 h-3.5" /> {L('ফিল্টার মুছুন', 'Clear Filters')}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-white border-b py-3 px-4 sticky top-[109px] z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-3 items-center">
          <div className="flex-1 flex gap-0 border rounded-xl overflow-hidden">
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder={L('বিজ্ঞাপন খুঁজুন...', 'Search listings...')}
              className="flex-1 px-4 py-2.5 text-sm outline-none" />
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 relative">
            <SlidersHorizontal className="w-4 h-4" />
            {L('ফিল্টার', 'Filter')}
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <ChevronDown className="w-4 h-4" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400">
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{lang === 'bn' ? o.labelBn : o.labelEn}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border p-4 sticky top-[170px] max-h-[calc(100vh-180px)] overflow-y-auto">
            <FilterSidebar />
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-black text-gray-900">{L('ফিল্টার', 'Filters')}</p>
                <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{filtered.length}</span> {L('টি বিজ্ঞাপন পাওয়া গেছে', 'listings found')}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border p-16 text-center text-gray-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-bold text-gray-600">{L('কোনো বিজ্ঞাপন পাওয়া যায়নি', 'No listings found')}</p>
              <p className="text-sm mt-1">{L('ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন', 'Try changing your filters')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map(item => {
                const grade = GRADE_META[item.grade];
                const catEmoji = RECOMMERCE_CATEGORIES.find(c => c.slug === item.cat)?.emoji ?? '📦';
                return (
                  <Link key={item.id} href={`/recommerce/listings/${item.id}`}
                    className="bg-white rounded-2xl border hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-4xl opacity-30">{catEmoji}</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                        {lang === 'bn' ? item.titleBn : item.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-amber-600">৳ {item.price.toLocaleString('bn-BD')}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${grade.color}`}>{item.grade}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>📍 {item.location}</span>
                        <span>{item.daysAgo === 0 ? L('আজ', 'Today') : `${item.daysAgo}d`}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ListingsContent />
    </Suspense>
  );
}
