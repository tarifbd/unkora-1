'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, X, SlidersHorizontal, ChevronDown, Package,
  Star, Tag, Zap, CheckSquare, Square, RotateCcw, LayoutGrid, Grid2X2, List,
} from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type GridCols = 2 | 3 | 4 | 'list';
const PRICE_MAX = 10000;

const PRICE_PRESETS = [
  { label: 'Under ৳500', min: 0, max: 500 },
  { label: '৳500 – ৳1,000', min: 500, max: 1000 },
  { label: '৳1,000 – ৳2,500', min: 1000, max: 2500 },
  { label: '৳2,500+', min: 2500, max: PRICE_MAX },
];

const TAG_OPTIONS = [
  { value: 'flash-deal', label: 'Flash Deals', icon: Zap, color: 'text-orange-500' },
  { value: 'bestseller', label: 'Best Seller', icon: Star, color: 'text-yellow-500' },
  { value: 'sale', label: 'On Sale', icon: Tag, color: 'text-red-500' },
];

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

  useEffect(() => {
    const up = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', up); };
  }, [onMouseMove]);

  return (
    <div className="px-1">
      <div ref={trackRef} className="relative h-1.5 rounded-full bg-gray-200 my-4 mx-2">
        <div className="absolute h-full rounded-full bg-primary" style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
        <button className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md cursor-grab" style={{ left: `${pct(min)}%` }} onMouseDown={() => { dragging.current = 'min'; }} />
        <button className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md cursor-grab" style={{ left: `${pct(max)}%` }} onMouseDown={() => { dragging.current = 'max'; }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-gray-800">৳{min.toLocaleString()}</span>
        <span className="font-semibold text-gray-800">৳{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b last:border-b-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{title}</span>
          {badge !== undefined && badge > 0 && <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function CategoryDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [gridCols, setGridCols] = useState<GridCols>(3);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(PRICE_MAX);
  const [priceInputMin, setPriceInputMin] = useState('');
  const [priceInputMax, setPriceInputMax] = useState('');

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const isFeatured = searchParams.get('isFeatured') === 'true';
  const tagsParam = searchParams.get('tags') ?? '';
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { categorySlug: slug, page, minPrice, maxPrice, inStock, isFeatured, tags: tagsParam, sortBy, sortOrder }],
    queryFn: () => productsApi.getAll({
      categorySlug: slug, page, limit: 20,
      minPrice, maxPrice,
      inStock: inStock || undefined,
      isFeatured: isFeatured || undefined,
      tags: tags.length ? tags.join(',') : undefined,
      sortBy, sortOrder: sortOrder as 'asc' | 'desc',
    }),
  });

  const title = category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const setParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const applyPrice = (min: number, max: number) => {
    setParams({
      minPrice: min > 0 ? String(min) : undefined,
      maxPrice: max < PRICE_MAX ? String(max) : undefined,
    });
    setDrawerOpen(false);
  };

  const toggleTag = (tag: string) => {
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    setParams({ tags: next.length ? next.join(',') : undefined });
  };

  const clearAll = () => {
    router.push(pathname);
    setPriceInputMin(''); setPriceInputMax('');
    setSliderMin(0); setSliderMax(PRICE_MAX);
    setDrawerOpen(false);
  };

  const activeCount = [minPrice || maxPrice, inStock, isFeatured, ...tags].filter(Boolean).length;

  const gridClass =
    gridCols === 2 ? 'grid-cols-2' :
    gridCols === 3 ? 'grid-cols-2 sm:grid-cols-3' :
    'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';

  const FilterContent = () => (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-black text-gray-800">Filters</span>
          {activeCount > 0 && <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {data && (
        <div className="px-4 py-2.5 bg-primary/5 border-b">
          <p className="text-xs text-primary font-semibold">{data.meta.total.toLocaleString()} products</p>
        </div>
      )}

      {/* Price Range */}
      <Section title="Price Range" badge={(minPrice || maxPrice) ? 1 : 0}>
        <PriceSlider min={sliderMin} max={sliderMax} onChange={(min, max) => { setSliderMin(min); setSliderMax(max); }} />
        <div className="flex items-center gap-2 mt-3">
          <input type="number" placeholder="Min" value={priceInputMin} onChange={e => { setPriceInputMin(e.target.value); setSliderMin(Number(e.target.value) || 0); }} className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
          <span className="text-gray-300 text-xs">—</span>
          <input type="number" placeholder="Max" value={priceInputMax} onChange={e => { setPriceInputMax(e.target.value); setSliderMax(Number(e.target.value) || PRICE_MAX); }} className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
        </div>
        <button onClick={() => applyPrice(sliderMin, sliderMax)} className="w-full mt-2.5 bg-primary text-white rounded-lg py-2 text-xs font-bold hover:bg-primary/90 transition-colors">Apply</button>
        <div className="mt-3 space-y-1">
          {PRICE_PRESETS.map(p => (
            <button key={p.label} onClick={() => { setSliderMin(p.min); setSliderMax(p.max); applyPrice(p.min, p.max); }}
              className={`w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors ${minPrice === (p.min || undefined) && maxPrice === (p.max < PRICE_MAX ? p.max : undefined) ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Tags */}
      <Section title="Product Type" badge={tags.length}>
        <div className="space-y-2">
          {TAG_OPTIONS.map(t => {
            const active = tags.includes(t.value);
            return (
              <button key={t.value} onClick={() => toggleTag(t.value)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                {active ? <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" /> : <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />}
                <t.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-primary' : t.color}`} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Featured */}
      <Section title="Special" badge={isFeatured ? 1 : 0}>
        <button onClick={() => setParams({ isFeatured: !isFeatured ? 'true' : undefined })}
          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${isFeatured ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
          {isFeatured ? <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" /> : <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />}
          <Star className={`w-3.5 h-3.5 flex-shrink-0 ${isFeatured ? 'text-primary' : 'text-yellow-400'}`} />
          <span className="font-medium">Featured Only</span>
        </button>
      </Section>

      {/* Availability */}
      <Section title="Availability" badge={inStock ? 1 : 0}>
        <button onClick={() => setParams({ inStock: !inStock ? 'true' : undefined })}
          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${inStock ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
          {inStock ? <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" /> : <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />}
          <span className="font-medium">In Stock Only</span>
        </button>
      </Section>
    </div>
  );

  return (
    <div className="container py-6">
      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-white z-10">
              <span className="font-bold text-sm">Filters</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-3"><FilterContent /></div>
          </aside>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">{title}</h1>
          {data && <p className="mt-1 text-sm text-gray-500">{data.meta.total.toLocaleString()} products</p>}
          {category?.description && <p className="mt-2 text-sm text-gray-500">{category.description}</p>}
        </div>
        <button onClick={() => setDrawerOpen(true)} className="lg:hidden flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 shadow-sm flex-shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{activeCount}</span>}
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-4">
          <FilterContent />
        </aside>

        <div className="flex-1 min-w-0">
          {/* Sort + grid bar */}
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-gray-400 font-medium">Sort</span>
              <div className="relative">
                <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [sb, so] = e.target.value.split(':'); setParams({ sortBy: sb, sortOrder: so }); }}
                  className="appearance-none rounded-lg border bg-gray-50 pl-2.5 pr-7 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium">
                  <option value="createdAt:desc">Newest</option>
                  <option value="createdAt:asc">Oldest</option>
                  <option value="basePrice:asc">Price: Low → High</option>
                  <option value="basePrice:desc">Price: High → Low</option>
                  <option value="name:asc">Name A–Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              {([2, 3, 4, 'list'] as const).map(v => (
                <button key={v} onClick={() => setGridCols(v)} className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-colors ${gridCols === v ? 'border-gray-800 bg-gray-800 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}>
                  {v === 2 && <Grid2X2 className="h-3.5 w-3.5" />}
                  {v === 3 && <LayoutGrid className="h-3.5 w-3.5" />}
                  {v === 4 && <SlidersHorizontal className="h-3.5 w-3.5" />}
                  {v === 'list' && <List className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Active chips */}
          {activeCount > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  ৳{(minPrice ?? 0).toLocaleString()} – ৳{maxPrice ? maxPrice.toLocaleString() : '∞'}
                  <button onClick={() => setParams({ minPrice: undefined, maxPrice: undefined })}><X className="h-3 w-3" /></button>
                </span>
              )}
              {isFeatured && <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Featured <button onClick={() => setParams({ isFeatured: undefined })}><X className="h-3 w-3" /></button></span>}
              {inStock && <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">In Stock <button onClick={() => setParams({ inStock: undefined })}><X className="h-3 w-3" /></button></span>}
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {TAG_OPTIONS.find(t => t.value === tag)?.label ?? tag}
                  <button onClick={() => toggleTag(tag)}><X className="h-3 w-3" /></button>
                </span>
              ))}
              <button onClick={clearAll} className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-100">
                <RotateCcw className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}

          {/* Products */}
          {isLoading ? (
            <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-100" />)}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-700">No products found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
              {activeCount > 0 && <button onClick={clearAll} className="mt-1 text-sm text-primary font-semibold hover:underline">Clear all filters</button>}
            </div>
          ) : gridCols === 'list' ? (
            <div className="space-y-2.5">
              {(data?.data ?? []).map(product => <ProductCard key={product.id} product={product} listView />)}
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
              {(data?.data ?? []).map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center gap-1.5">
              <button onClick={() => setParams({ page: String(page - 1) })} disabled={page === 1} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
              {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === data.meta.totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | 'e')[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i-1] as number) > 1) acc.push('e'); acc.push(p); return acc; }, [])
                .map((p, i) => p === 'e' ? (
                  <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setParams({ page: String(p) })} className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
                ))}
              <button onClick={() => setParams({ page: String(page + 1) })} disabled={page === data.meta.totalPages} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-40">Next ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
