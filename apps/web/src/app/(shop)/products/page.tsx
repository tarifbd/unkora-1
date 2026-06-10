'use client';

import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, X, LayoutGrid, Grid3X3, Grid2X2, List,
  SlidersHorizontal, ChevronDown, ChevronRight, Zap, Star,
  Tag, CheckSquare, Square, RotateCcw, Package, Search,
  BookOpen, Globe, Feather, Building2, BookMarked, Percent,
  CalendarClock, TrendingUp,
} from 'lucide-react';
import { productsApi, categoriesApi, booksApi, type Category } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-context';

type GridCols = 2 | 3 | 4 | 'list';
type CategoryWithChildren = Category & { children?: Category[] };

const PRICE_MAX = 10000;

// ─── Price Slider ──────────────────────────────────────────────────────────────
function PriceSlider({ min, max, onChange }: { min: number; max: number; onChange: (min: number, max: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);
  const pct = (v: number) => Math.round((v / PRICE_MAX) * 100);
  const fromPct = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * PRICE_MAX / 100) * 100;
  }, []);
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const v = fromPct(e.clientX);
    if (dragging.current === 'min') onChange(Math.min(v, max - 100), max);
    else onChange(min, Math.max(v, min + 100));
  }, [min, max, onChange, fromPct]);
  const onMouseUp = useCallback(() => { dragging.current = null; }, []);
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [onMouseMove, onMouseUp]);
  return (
    <div className="px-1">
      <div ref={trackRef} className="relative h-1.5 rounded-full bg-gray-200 my-4 mx-2">
        <div className="absolute h-full rounded-full bg-primary" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
        <button className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md hover:scale-110 transition-transform cursor-grab" style={{ left: `${pct(min)}%` }} onMouseDown={() => { dragging.current = 'min'; }} onTouchStart={() => { dragging.current = 'min'; }} />
        <button className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md hover:scale-110 transition-transform cursor-grab" style={{ left: `${pct(max)}%` }} onMouseDown={() => { dragging.current = 'max'; }} onTouchStart={() => { dragging.current = 'max'; }} />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="font-bold text-gray-800">৳{min.toLocaleString()}</span>
        <span className="font-bold text-gray-800">৳{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Collapsible Section ───────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, badge }: {
  title: string; icon?: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; badge?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
          <span className="text-sm font-bold text-gray-800">{title}</span>
          {badge !== undefined && badge > 0 && <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── CheckRow ─────────────────────────────────────────────────────────────────
function CheckRow({ label, active, onClick, count, icon: Icon, iconClass }: {
  label: string; active: boolean; onClick: () => void; count?: number; icon?: React.ElementType; iconClass?: string;
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors text-left ${active ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
      {active ? <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" /> : <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />}
      {Icon && <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-primary' : (iconClass ?? 'text-gray-400')}`} />}
      <span className="flex-1 font-medium truncate">{label}</span>
      {count !== undefined && <span className="text-[11px] text-gray-400 flex-shrink-0">{count}</span>}
    </button>
  );
}

// ─── Filter State ──────────────────────────────────────────────────────────────
interface FilterState {
  categorySlug: string | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStock: boolean;
  isFeatured: boolean;
  tags: string[];
  language: string | undefined;
  genre: string | undefined;
  author: string | undefined;
  publisher: string | undefined;
  binding: string | undefined;
  hasDiscount: boolean;
  preorder: boolean;
}

const PRICE_PRESETS = [
  { label: 'Under ৳200', min: 0, max: 200 },
  { label: '৳200 – ৳500', min: 200, max: 500 },
  { label: '৳500 – ৳1,000', min: 500, max: 1000 },
  { label: '৳1,000 – ৳2,500', min: 1000, max: 2500 },
  { label: '৳2,500+', min: 2500, max: PRICE_MAX },
];

const TAG_OPTIONS = [
  { value: 'flash-deal', label: 'Flash Deals', labelBn: 'ফ্ল্যাশ ডিল', icon: Zap, color: 'text-orange-500' },
  { value: 'new-arrival', label: 'New Arrival', labelBn: 'নতুন আসা', icon: Package, color: 'text-blue-500' },
  { value: 'bestseller', label: 'Best Seller', labelBn: 'বেস্ট সেলার', icon: Star, color: 'text-yellow-500' },
  { value: 'sale', label: 'On Sale', labelBn: 'সেলে', icon: Tag, color: 'text-red-500' },
];

const QUICK_FILTERS = [
  { label: 'Flash Deals', labelBn: 'ফ্ল্যাশ ডিল', icon: Zap, tag: 'flash-deal' as string | null, discount: false, preorder: false, color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' },
  { label: 'New Arrivals', labelBn: 'নতুন বই', icon: Package, tag: 'new-arrival' as string | null, discount: false, preorder: false, color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
  { label: 'Best Sellers', labelBn: 'বেস্ট সেলার', icon: Star, tag: 'bestseller' as string | null, discount: false, preorder: false, color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
  { label: 'On Sale', labelBn: 'সেলে', icon: Percent, tag: null as string | null, discount: true, preorder: false, color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
  { label: 'Pre-Order', labelBn: 'প্রি-অর্ডার', icon: CalendarClock, tag: null as string | null, discount: false, preorder: true, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
];

const LANGUAGES = [
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'English', label: 'English' },
  { value: 'Arabic', label: 'عربي (Arabic)' },
  { value: 'Urdu', label: 'اردو (Urdu)' },
  { value: 'Hindi', label: 'हिंदी (Hindi)' },
];

const BINDINGS = [
  { value: 'Hardcover', label: 'Hardcover' },
  { value: 'Paperback', label: 'Paperback' },
  { value: 'E-Book', label: 'E-Book / Digital' },
  { value: 'Spiral', label: 'Spiral Bound' },
];

// ─── Filter Panel ──────────────────────────────────────────────────────────────
function FilterPanel({ filters, categories, filterOptions, onFilter, onClear, totalProducts, activeCount }: {
  filters: FilterState;
  categories: CategoryWithChildren[] | undefined;
  filterOptions: { genres: string[]; authors: string[]; publishers: string[]; bindings: string[]; } | undefined;
  onFilter: (partial: Partial<FilterState>) => void;
  onClear: () => void;
  totalProducts?: number;
  activeCount: number;
}) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [sliderMin, setSliderMin] = useState(filters.minPrice ?? 0);
  const [sliderMax, setSliderMax] = useState(filters.maxPrice ?? PRICE_MAX);
  const [priceInputMin, setPriceInputMin] = useState(filters.minPrice ? String(filters.minPrice) : '');
  const [priceInputMax, setPriceInputMax] = useState(filters.maxPrice ? String(filters.maxPrice) : '');
  const [authorSearch, setAuthorSearch] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  const [showAllPublishers, setShowAllPublishers] = useState(false);

  useEffect(() => {
    setSliderMin(filters.minPrice ?? 0);
    setSliderMax(filters.maxPrice ?? PRICE_MAX);
    setPriceInputMin(filters.minPrice ? String(filters.minPrice) : '');
    setPriceInputMax(filters.maxPrice ? String(filters.maxPrice) : '');
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrice = (min: number, max: number) => {
    onFilter({ minPrice: min > 0 ? min : undefined, maxPrice: max < PRICE_MAX ? max : undefined });
  };

  const parentCats = categories?.filter(c => !('parentId' in c) || !(c as unknown as { parentId: string }).parentId) ?? [];

  const allGenres = filterOptions?.genres ?? [];
  const visibleGenres = showAllGenres ? allGenres : allGenres.slice(0, 8);

  const filteredAuthors = (filterOptions?.authors ?? []).filter(a => !authorSearch || a.toLowerCase().includes(authorSearch.toLowerCase()));
  const visibleAuthors = showAllAuthors ? filteredAuthors : filteredAuthors.slice(0, 6);

  const allPublishers = filterOptions?.publishers ?? [];
  const visiblePublishers = showAllPublishers ? allPublishers : allPublishers.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-black text-gray-800">Filters</span>
          {activeCount > 0 && <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset all
          </button>
        )}
      </div>
      {totalProducts !== undefined && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <p className="text-xs text-primary font-semibold">{totalProducts.toLocaleString()} products found</p>
        </div>
      )}

      {/* Categories */}
      <Section title="Categories" icon={BookMarked} badge={filters.categorySlug ? 1 : 0}>
        <div className="space-y-0.5 -mx-1">
          <button onClick={() => onFilter({ categorySlug: undefined })} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${!filters.categorySlug ? 'bg-primary text-white font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
            <span>All Categories</span>
            {!filters.categorySlug && totalProducts !== undefined && <span className="text-xs opacity-70">{totalProducts}</span>}
          </button>
          {parentCats.map(cat => {
            const hasChildren = cat.children && cat.children.length > 0;
            const isExpanded = expandedCats[cat.id];
            const isSelected = filters.categorySlug === cat.slug;
            const childSelected = cat.children?.some(c => c.slug === filters.categorySlug);
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => onFilter({ categorySlug: cat.slug })} className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${isSelected || childSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <span>{cat.name}</span>
                    {cat._count?.products !== undefined && <span className="text-xs opacity-50 mr-1">{cat._count.products}</span>}
                  </button>
                  {hasChildren && (
                    <button onClick={() => setExpandedCats(s => ({ ...s, [cat.id]: !s[cat.id] }))} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-3 pl-3 border-l border-gray-100 mt-0.5 space-y-0.5">
                    {cat.children!.map(child => (
                      <button key={child.id} onClick={() => onFilter({ categorySlug: child.slug })} className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-left transition-colors ${filters.categorySlug === child.slug ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <span>{child.name}</span>
                        {child._count?.products !== undefined && <span className="opacity-40">{child._count.products}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Price Range */}
      <Section title="Price Range" icon={Tag} badge={(filters.minPrice || filters.maxPrice) ? 1 : 0}>
        <PriceSlider min={sliderMin} max={sliderMax} onChange={(min, max) => { setSliderMin(min); setSliderMax(max); setPriceInputMin(min > 0 ? String(min) : ''); setPriceInputMax(max < PRICE_MAX ? String(max) : ''); }} />
        <div className="flex items-center gap-2 mt-3">
          <input type="number" placeholder="Min ৳" value={priceInputMin} onChange={e => { setPriceInputMin(e.target.value); setSliderMin(Number(e.target.value) || 0); }} className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
          <span className="text-gray-300 text-xs">—</span>
          <input type="number" placeholder="Max ৳" value={priceInputMax} onChange={e => { setPriceInputMax(e.target.value); setSliderMax(Number(e.target.value) || PRICE_MAX); }} className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
        </div>
        <button onClick={() => applyPrice(sliderMin, sliderMax)} className="w-full mt-2.5 bg-primary text-white rounded-lg py-2 text-xs font-bold hover:bg-primary/90 transition-colors">Apply Price</button>
        <div className="mt-3 space-y-1">
          {PRICE_PRESETS.map(p => (
            <button key={p.label} onClick={() => { setSliderMin(p.min); setSliderMax(p.max); setPriceInputMin(p.min > 0 ? String(p.min) : ''); setPriceInputMax(p.max < PRICE_MAX ? String(p.max) : ''); applyPrice(p.min, p.max); }} className={`w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors ${filters.minPrice === (p.min || undefined) && filters.maxPrice === (p.max < PRICE_MAX ? p.max : undefined) ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>{p.label}</button>
          ))}
        </div>
      </Section>

      {/* Discount */}
      <Section title="Discount" icon={Percent} badge={filters.hasDiscount ? 1 : 0}>
        <CheckRow label="On Sale / Discounted" active={filters.hasDiscount} onClick={() => onFilter({ hasDiscount: !filters.hasDiscount })} icon={Tag} iconClass="text-red-400" />
      </Section>

      {/* Book Language */}
      <Section title="Language" icon={Globe} badge={filters.language ? 1 : 0} defaultOpen={false}>
        <div className="space-y-0.5">
          {LANGUAGES.map(l => (
            <CheckRow key={l.value} label={l.label} active={filters.language === l.value} onClick={() => onFilter({ language: filters.language === l.value ? undefined : l.value })} />
          ))}
        </div>
      </Section>

      {/* Genre */}
      {allGenres.length > 0 && (
        <Section title="Genre" icon={BookOpen} badge={filters.genre ? 1 : 0} defaultOpen={false}>
          <div className="space-y-0.5">
            {visibleGenres.map(g => (
              <CheckRow key={g} label={g} active={filters.genre === g} onClick={() => onFilter({ genre: filters.genre === g ? undefined : g })} />
            ))}
            {allGenres.length > 8 && (
              <button onClick={() => setShowAllGenres(v => !v)} className="w-full text-left text-xs text-primary font-semibold px-2.5 py-1.5 hover:bg-primary/5 rounded-lg transition-colors">
                {showAllGenres ? '▲ Show less' : `▼ Show all ${allGenres.length} genres`}
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Author */}
      {(filterOptions?.authors?.length ?? 0) > 0 && (
        <Section title="Author" icon={Feather} badge={filters.author ? 1 : 0} defaultOpen={false}>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search author..." value={authorSearch} onChange={e => setAuthorSearch(e.target.value)} className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-0.5 max-h-44 overflow-y-auto">
            {visibleAuthors.map(a => (
              <CheckRow key={a} label={a} active={filters.author === a} onClick={() => onFilter({ author: filters.author === a ? undefined : a })} />
            ))}
            {!authorSearch && filteredAuthors.length > 6 && (
              <button onClick={() => setShowAllAuthors(v => !v)} className="w-full text-left text-xs text-primary font-semibold px-2.5 py-1.5 hover:bg-primary/5 rounded-lg transition-colors">
                {showAllAuthors ? '▲ Show less' : `▼ ${filteredAuthors.length - 6} more authors`}
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Publisher */}
      {allPublishers.length > 0 && (
        <Section title="Publisher" icon={Building2} badge={filters.publisher ? 1 : 0} defaultOpen={false}>
          <div className="space-y-0.5">
            {visiblePublishers.map(p => (
              <CheckRow key={p as string} label={p as string} active={filters.publisher === p} onClick={() => onFilter({ publisher: filters.publisher === p ? undefined : p as string })} />
            ))}
            {allPublishers.length > 5 && (
              <button onClick={() => setShowAllPublishers(v => !v)} className="w-full text-left text-xs text-primary font-semibold px-2.5 py-1.5 hover:bg-primary/5 rounded-lg transition-colors">
                {showAllPublishers ? '▲ Show less' : `▼ ${allPublishers.length - 5} more publishers`}
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Binding */}
      <Section title="Format / Binding" icon={BookMarked} badge={filters.binding ? 1 : 0} defaultOpen={false}>
        <div className="space-y-0.5">
          {BINDINGS.map(b => (
            <CheckRow key={b.value} label={b.label} active={filters.binding === b.value} onClick={() => onFilter({ binding: filters.binding === b.value ? undefined : b.value })} />
          ))}
        </div>
      </Section>

      {/* Product Type / Tags */}
      <Section title="Product Type" icon={Tag} badge={filters.tags.length}>
        <div className="space-y-0.5">
          {TAG_OPTIONS.map(t => {
            const active = filters.tags.includes(t.value);
            return <CheckRow key={t.value} label={t.label} active={active} onClick={() => { const next = active ? filters.tags.filter(x => x !== t.value) : [...filters.tags, t.value]; onFilter({ tags: next }); }} icon={t.icon} iconClass={t.color} />;
          })}
        </div>
      </Section>

      {/* Availability */}
      <Section title="Availability" icon={Package} badge={(filters.inStock ? 1 : 0) + (filters.preorder ? 1 : 0)}>
        <div className="space-y-0.5">
          <CheckRow label="In Stock Only" active={filters.inStock} onClick={() => onFilter({ inStock: !filters.inStock })} />
          <CheckRow label="Pre-Order Available" active={filters.preorder} onClick={() => onFilter({ preorder: !filters.preorder })} icon={CalendarClock} iconClass="text-emerald-500" />
        </div>
      </Section>

      {/* Featured */}
      <Section title="Special" icon={Star} badge={filters.isFeatured ? 1 : 0} defaultOpen={false}>
        <CheckRow label="Featured Products" active={filters.isFeatured} onClick={() => onFilter({ isFeatured: !filters.isFeatured })} icon={Star} iconClass="text-yellow-400" />
      </Section>
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ label, icon: Icon, active, children }: {
  label: string; icon?: React.ElementType; active: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
          active ? 'bg-primary text-white border-primary shadow-primary/30' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border rounded-2xl shadow-xl min-w-[220px] max-h-80 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors ml-0.5"><X className="h-3 w-3" /></button>
    </span>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang } = useLanguage();

  const [gridCols, setGridCols] = useState<GridCols>(3);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropAuthorSearch, setDropAuthorSearch] = useState('');

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const categorySlug = searchParams.get('categorySlug') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const isFeatured = searchParams.get('isFeatured') === 'true';
  const tagsParam = searchParams.get('tags') ?? '';
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  const language = searchParams.get('language') ?? undefined;
  const genre = searchParams.get('genre') ?? undefined;
  const author = searchParams.get('author') ?? undefined;
  const publisher = searchParams.get('publisher') ?? undefined;
  const binding = searchParams.get('binding') ?? undefined;
  const hasDiscount = searchParams.get('hasDiscount') === 'true';
  const preorder = searchParams.get('preorder') === 'true';

  const filters: FilterState = { categorySlug, minPrice, maxPrice, inStock, isFeatured, tags, language, genre, author, publisher, binding, hasDiscount, preorder };

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice, inStock, isFeatured, tagsParam, language, genre, author, publisher, binding, hasDiscount, preorder }],
    queryFn: () => productsApi.getAll({
      page, limit: 24, categorySlug, search, sortBy, sortOrder,
      minPrice, maxPrice,
      inStock: inStock || undefined,
      isFeatured: isFeatured || undefined,
      tags: tags.length ? tags.join(',') : undefined,
      language, genre, author, publisher, binding,
      hasDiscount: hasDiscount || undefined,
      preorder: preorder || undefined,
    }),
  });

  const { data: categories } = useQuery({ queryKey: ['categories-roots'], queryFn: () => categoriesApi.getRoots() });

  const { data: filterOptions } = useQuery({
    queryKey: ['books-filter-options'],
    queryFn: () => booksApi.getFilterOptions(),
    staleTime: 10 * 60 * 1000,
  });

  const setParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const onFilter = useCallback((partial: Partial<FilterState>) => {
    const updates: Record<string, string | undefined> = {};
    if ('categorySlug' in partial) updates.categorySlug = partial.categorySlug;
    if ('minPrice' in partial) updates.minPrice = partial.minPrice != null ? String(partial.minPrice) : undefined;
    if ('maxPrice' in partial) updates.maxPrice = partial.maxPrice != null ? String(partial.maxPrice) : undefined;
    if ('inStock' in partial) updates.inStock = partial.inStock ? 'true' : undefined;
    if ('isFeatured' in partial) updates.isFeatured = partial.isFeatured ? 'true' : undefined;
    if ('tags' in partial) updates.tags = partial.tags?.length ? partial.tags.join(',') : undefined;
    if ('language' in partial) updates.language = partial.language;
    if ('genre' in partial) updates.genre = partial.genre;
    if ('author' in partial) updates.author = partial.author;
    if ('publisher' in partial) updates.publisher = partial.publisher;
    if ('binding' in partial) updates.binding = partial.binding;
    if ('hasDiscount' in partial) updates.hasDiscount = partial.hasDiscount ? 'true' : undefined;
    if ('preorder' in partial) updates.preorder = partial.preorder ? 'true' : undefined;
    setParams(updates);
    setDrawerOpen(false);
  }, [setParams]);

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`${pathname}?${params.toString()}`);
    setDrawerOpen(false);
  }, [search, router, pathname]);

  const activeCount = [
    categorySlug, minPrice || maxPrice, inStock, isFeatured, hasDiscount, preorder,
    language, genre, author, publisher, binding, ...tags,
  ].filter(Boolean).length;

  const activeCategoryName = (categories as CategoryWithChildren[] | undefined)
    ?.flatMap(c => [c, ...(c.children ?? [])])
    .find(c => c.slug === categorySlug)?.name;

  const gridClass = gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';

  const filterPanelProps = {
    filters,
    categories: categories as CategoryWithChildren[] | undefined,
    filterOptions: filterOptions ? {
      genres: filterOptions.genres ?? [],
      authors: filterOptions.authors ?? [],
      publishers: (filterOptions.publishers ?? []) as string[],
      bindings: (filterOptions.bindings ?? []) as string[],
    } : undefined,
    onFilter,
    onClear: clearAllFilters,
    totalProducts: data?.meta.total,
    activeCount,
  };

  const pageTitle = categorySlug
    ? (activeCategoryName ?? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : search ? `Results for "${search}"` : lang === 'bn' ? 'সব পণ্য' : 'All Products';

  return (
    <div className="container py-4 sm:py-6">
      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-white z-10">
              <span className="font-bold text-sm">Filters {activeCount > 0 && `(${activeCount})`}</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <FilterPanel {...filterPanelProps} />
          </aside>
        </div>
      )}

      {/* Page header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold">{pageTitle}</h1>
          {data && <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{data.meta.total.toLocaleString()} products found</p>}
        </div>
        <button onClick={() => setDrawerOpen(true)} className="lg:hidden flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex-shrink-0 shadow-sm">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{activeCount}</span>}
        </button>
      </div>

      {/* Quick filter strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_FILTERS.map(qf => {
          const isActive = qf.tag ? filters.tags.includes(qf.tag) : qf.preorder ? filters.preorder : filters.hasDiscount;
          return (
            <button
              key={qf.label}
              onClick={() => {
                if (qf.tag) {
                  const next = filters.tags.includes(qf.tag) ? filters.tags.filter(t => t !== qf.tag) : [...filters.tags, qf.tag as string];
                  onFilter({ tags: next });
                } else if (qf.preorder) {
                  onFilter({ preorder: !filters.preorder });
                } else {
                  onFilter({ hasDiscount: !filters.hasDiscount });
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${isActive ? 'bg-primary text-white border-primary shadow-sm' : qf.color}`}
            >
              <qf.icon className="w-3.5 h-3.5" />
              {lang === 'bn' ? qf.labelBn : qf.label}
            </button>
          );
        })}
        {filters.language && (
          <button onClick={() => onFilter({ language: undefined })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
            <Globe className="w-3.5 h-3.5" /> {filters.language} <X className="w-3 h-3" />
          </button>
        )}
        {filters.genre && (
          <button onClick={() => onFilter({ genre: undefined })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200 flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5" /> {filters.genre} <X className="w-3 h-3" />
          </button>
        )}
        {filters.author && (
          <button onClick={() => onFilter({ author: undefined })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap bg-teal-50 text-teal-700 border-teal-200 flex-shrink-0">
            <Feather className="w-3.5 h-3.5" /> {filters.author} <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Desktop filter bar — dropdowns */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap mb-4 pb-3 border-b border-gray-100">
        {/* Category */}
        <FilterDropdown label={activeCategoryName ?? 'Category'} icon={BookMarked} active={!!categorySlug}>
          <div className="p-2 space-y-0.5">
            <button onClick={() => onFilter({ categorySlug: undefined })} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${!categorySlug ? 'bg-primary text-white font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>All Categories</button>
            {(categories as CategoryWithChildren[] | undefined)?.filter(c => !('parentId' in c) || !(c as unknown as { parentId: string }).parentId).map(cat => (
              <button key={cat.id} onClick={() => onFilter({ categorySlug: cat.slug })} className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${filters.categorySlug === cat.slug ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                <span>{cat.name}</span>
                {cat._count?.products !== undefined && <span className="text-xs opacity-50">{cat._count.products}</span>}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Price */}
        <FilterDropdown label={(minPrice || maxPrice) ? `৳${(minPrice ?? 0).toLocaleString()}–${maxPrice ? '৳' + maxPrice.toLocaleString() : '∞'}` : 'Price'} icon={Tag} active={!!(minPrice || maxPrice)}>
          <div className="p-2 space-y-1">
            <button onClick={() => onFilter({ minPrice: undefined, maxPrice: undefined })} className={`w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors ${!minPrice && !maxPrice ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>All Prices</button>
            {PRICE_PRESETS.map(p => (
              <button key={p.label} onClick={() => onFilter({ minPrice: p.min > 0 ? p.min : undefined, maxPrice: p.max < PRICE_MAX ? p.max : undefined })} className={`w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors ${minPrice === (p.min || undefined) && maxPrice === (p.max < PRICE_MAX ? p.max : undefined) ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>{p.label}</button>
            ))}
          </div>
        </FilterDropdown>

        {/* Language */}
        <FilterDropdown label={language ?? 'Language'} icon={Globe} active={!!language}>
          <div className="p-2 space-y-0.5">
            {LANGUAGES.map(l => (
              <CheckRow key={l.value} label={l.label} active={filters.language === l.value} onClick={() => onFilter({ language: filters.language === l.value ? undefined : l.value })} />
            ))}
          </div>
        </FilterDropdown>

        {/* Genre */}
        {(filterOptions?.genres?.length ?? 0) > 0 && (
          <FilterDropdown label={genre ?? 'Genre'} icon={BookOpen} active={!!genre}>
            <div className="p-2 space-y-0.5">
              {(filterOptions?.genres ?? []).map(g => (
                <CheckRow key={g} label={g} active={filters.genre === g} onClick={() => onFilter({ genre: filters.genre === g ? undefined : g })} />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* Author */}
        {(filterOptions?.authors?.length ?? 0) > 0 && (
          <FilterDropdown label={author ?? 'Author'} icon={Feather} active={!!author}>
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Search author..." value={dropAuthorSearch} onChange={e => setDropAuthorSearch(e.target.value)} className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-0.5">
                {(filterOptions?.authors ?? []).filter(a => !dropAuthorSearch || a.toLowerCase().includes(dropAuthorSearch.toLowerCase())).map(a => (
                  <CheckRow key={a} label={a} active={filters.author === a} onClick={() => onFilter({ author: filters.author === a ? undefined : a })} />
                ))}
              </div>
            </div>
          </FilterDropdown>
        )}

        {/* Publisher */}
        {(filterOptions?.publishers?.length ?? 0) > 0 && (
          <FilterDropdown label={publisher ?? 'Publisher'} icon={Building2} active={!!publisher}>
            <div className="p-2 space-y-0.5">
              {(filterOptions?.publishers ?? []).map(p => (
                <CheckRow key={p as string} label={p as string} active={filters.publisher === p} onClick={() => onFilter({ publisher: filters.publisher === p ? undefined : p as string })} />
              ))}
            </div>
          </FilterDropdown>
        )}

        {/* Format / Binding */}
        <FilterDropdown label={binding ?? 'Format'} icon={BookMarked} active={!!binding}>
          <div className="p-2 space-y-0.5">
            {BINDINGS.map(b => (
              <CheckRow key={b.value} label={b.label} active={filters.binding === b.value} onClick={() => onFilter({ binding: filters.binding === b.value ? undefined : b.value })} />
            ))}
          </div>
        </FilterDropdown>

        {/* Type / Tags / Availability */}
        <FilterDropdown
          label="Type"
          icon={Tag}
          active={tags.length > 0 || hasDiscount || inStock || preorder || isFeatured}
        >
          <div className="p-2 space-y-0.5">
            {TAG_OPTIONS.map(t => {
              const act = filters.tags.includes(t.value);
              return <CheckRow key={t.value} label={t.label} active={act} onClick={() => { const next = act ? filters.tags.filter(x => x !== t.value) : [...filters.tags, t.value]; onFilter({ tags: next }); }} icon={t.icon} iconClass={t.color} />;
            })}
            <CheckRow label="On Sale / Discounted" active={filters.hasDiscount} onClick={() => onFilter({ hasDiscount: !filters.hasDiscount })} icon={Tag} iconClass="text-red-400" />
            <CheckRow label="In Stock Only" active={filters.inStock} onClick={() => onFilter({ inStock: !filters.inStock })} />
            <CheckRow label="Pre-Order Available" active={filters.preorder} onClick={() => onFilter({ preorder: !filters.preorder })} icon={CalendarClock} iconClass="text-emerald-500" />
            <CheckRow label="Featured" active={filters.isFeatured} onClick={() => onFilter({ isFeatured: !filters.isFeatured })} icon={Star} iconClass="text-yellow-400" />
          </div>
        </FilterDropdown>

        {/* Clear all */}
        {activeCount > 0 && (
          <button onClick={clearAllFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors ml-auto">
            <RotateCcw className="w-3.5 h-3.5" /> Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Sort bar + product count */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 sm:px-4 shadow-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="hidden sm:block text-xs text-gray-400 whitespace-nowrap font-medium">Sort:</span>
          <div className="relative flex-1 max-w-[200px]">
            <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [sb, so] = e.target.value.split(':'); setParams({ sortBy: sb, sortOrder: so }); }} className="w-full appearance-none rounded-lg border bg-gray-50 pl-2.5 pr-7 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium">
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="basePrice:asc">Price: Low → High</option>
              <option value="basePrice:desc">Price: High → Low</option>
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="salePrice:desc">Highest Original Price</option>
              <option value="stockQuantity:desc">Most Stock</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {([2, 3, 4, 'list'] as const).map(v => (
            <button key={v} onClick={() => setGridCols(v)} className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-colors ${gridCols === v ? 'border-gray-800 bg-gray-800 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}>
              {v === 2 && <Grid2X2 className="h-3.5 w-3.5" />}
              {v === 3 && <LayoutGrid className="h-3.5 w-3.5" />}
              {v === 4 && <Grid3X3 className="h-3.5 w-3.5" />}
              {v === 'list' && <List className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 items-center">
          {categorySlug && <Chip label={activeCategoryName ?? categorySlug} onRemove={() => onFilter({ categorySlug: undefined })} />}
          {(minPrice || maxPrice) && <Chip label={`৳${(minPrice ?? 0).toLocaleString()} – ৳${maxPrice ? maxPrice.toLocaleString() : '∞'}`} onRemove={() => onFilter({ minPrice: undefined, maxPrice: undefined })} />}
          {isFeatured && <Chip label="Featured" onRemove={() => onFilter({ isFeatured: false })} />}
          {inStock && <Chip label="In Stock" onRemove={() => onFilter({ inStock: false })} />}
          {hasDiscount && <Chip label="On Sale" onRemove={() => onFilter({ hasDiscount: false })} />}
          {preorder && <Chip label="Pre-Order" onRemove={() => onFilter({ preorder: false })} />}
          {language && <Chip label={language} onRemove={() => onFilter({ language: undefined })} />}
          {genre && <Chip label={genre} onRemove={() => onFilter({ genre: undefined })} />}
          {author && <Chip label={author} onRemove={() => onFilter({ author: undefined })} />}
          {publisher && <Chip label={publisher} onRemove={() => onFilter({ publisher: undefined })} />}
          {binding && <Chip label={binding} onRemove={() => onFilter({ binding: undefined })} />}
          {tags.map(tag => <Chip key={tag} label={TAG_OPTIONS.find(t => t.value === tag)?.label ?? tag} onRemove={() => onFilter({ tags: tags.filter(t => t !== tag) })} />)}
          <button onClick={clearAllFilters} className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors">
            <RotateCcw className="w-3 h-3" /> Clear all
          </button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
          <p className="text-base font-bold text-gray-700">{t.products.noProductsFound}</p>
          <p className="text-sm text-gray-400">{t.products.tryAdjustingFilters}</p>
          {activeCount > 0 && <button onClick={clearAllFilters} className="mt-1 text-sm text-primary font-semibold hover:underline flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Clear all filters</button>}
        </div>
      ) : gridCols === 'list' ? (
        <div className="space-y-2.5">{(data?.data ?? []).map(product => <ProductCard key={product.id} product={product} listView />)}</div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>{(data?.data ?? []).map(product => <ProductCard key={product.id} product={product} />)}</div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-8 flex flex-wrap justify-center gap-1.5">
          <button onClick={() => setParams({ page: String(page - 1) })} disabled={page === 1} className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === data.meta.totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis'); acc.push(p); return acc; }, [])
            .map((p, i) => p === 'ellipsis' ? (
              <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">…</span>
            ) : (
              <button key={p} onClick={() => setParams({ page: String(p) })} className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
            ))}
          <button onClick={() => setParams({ page: String(page + 1) })} disabled={page === data.meta.totalPages} className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
