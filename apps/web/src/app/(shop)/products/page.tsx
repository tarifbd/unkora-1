'use client';

import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, X, LayoutGrid, Grid3X3, Grid2X2, List,
  SlidersHorizontal, ChevronDown, ChevronRight, Zap, Star,
  Tag, CheckSquare, Square, RotateCcw, Package,
} from 'lucide-react';
import { productsApi, categoriesApi, type Category } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-context';

type GridCols = 2 | 3 | 4 | 'list';

type CategoryWithChildren = Category & { children?: Category[] };

// ─── Price Range Slider ─────────────────────────────────────────────────────

const PRICE_MAX = 10000;

function PriceSlider({
  min, max, onChange,
}: {
  min: number; max: number; onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);

  const pct = (v: number) => Math.round((v / PRICE_MAX) * 100);

  const fromPct = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * PRICE_MAX / 100) * 100;
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
    window.addEventListener('touchmove', e => onMouseMove(e.touches[0] as unknown as MouseEvent));
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const minPct = pct(min);
  const maxPct = pct(max);

  return (
    <div className="px-1">
      <div
        ref={trackRef}
        className="relative h-1.5 rounded-full bg-gray-200 my-4 mx-2"
      >
        {/* Active track */}
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        {/* Min handle */}
        <button
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-grab active:cursor-grabbing"
          style={{ left: `${minPct}%` }}
          onMouseDown={() => { dragging.current = 'min'; }}
          onTouchStart={() => { dragging.current = 'min'; }}
          aria-label="Minimum price"
        />
        {/* Max handle */}
        <button
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-grab active:cursor-grabbing"
          style={{ left: `${maxPct}%` }}
          onMouseDown={() => { dragging.current = 'max'; }}
          onTouchStart={() => { dragging.current = 'max'; }}
          aria-label="Maximum price"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span className="font-semibold text-gray-800">৳{min.toLocaleString()}</span>
        <span className="font-semibold text-gray-800">৳{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────

function Section({
  title, children, defaultOpen = true, badge,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Filter Panel ───────────────────────────────────────────────────────────

interface FilterState {
  categorySlug: string | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStock: boolean;
  isFeatured: boolean;
  tags: string[];
}

const PRICE_PRESETS = [
  { label: 'Under ৳500', min: 0, max: 500 },
  { label: '৳500 – ৳1,000', min: 500, max: 1000 },
  { label: '৳1,000 – ৳2,500', min: 1000, max: 2500 },
  { label: '৳2,500+', min: 2500, max: PRICE_MAX },
];

const TAG_OPTIONS = [
  { value: 'flash-deal', label: 'Flash Deals', icon: Zap, color: 'text-orange-500' },
  { value: 'new-arrival', label: 'New Arrival', icon: Package, color: 'text-blue-500' },
  { value: 'bestseller', label: 'Best Seller', icon: Star, color: 'text-yellow-500' },
  { value: 'sale', label: 'On Sale', icon: Tag, color: 'text-red-500' },
];

function FilterPanel({
  filters,
  categories,
  onFilter,
  onClear,
  totalProducts,
  activeCount,
}: {
  filters: FilterState;
  categories: CategoryWithChildren[] | undefined;
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

  // Sync slider when filters reset externally
  useEffect(() => {
    setSliderMin(filters.minPrice ?? 0);
    setSliderMax(filters.maxPrice ?? PRICE_MAX);
    setPriceInputMin(filters.minPrice ? String(filters.minPrice) : '');
    setPriceInputMax(filters.maxPrice ? String(filters.maxPrice) : '');
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrice = (min: number, max: number) => {
    onFilter({
      minPrice: min > 0 ? min : undefined,
      maxPrice: max < PRICE_MAX ? max : undefined,
    });
  };

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFilter({ tags: next });
  };

  const parentCats = categories?.filter(c => !('parentId' in c) || !(c as unknown as { parentId: string }).parentId) ?? [];

  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-black text-gray-800">Filters</span>
          {activeCount > 0 && (
            <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Results count */}
      {totalProducts !== undefined && (
        <div className="px-4 py-2.5 bg-primary/5 border-b">
          <p className="text-xs text-primary font-semibold">{totalProducts.toLocaleString()} products found</p>
        </div>
      )}

      {/* Categories */}
      <Section title="Categories" badge={filters.categorySlug ? 1 : 0}>
        <div className="space-y-0.5 -mx-1">
          <button
            onClick={() => onFilter({ categorySlug: undefined })}
            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${
              !filters.categorySlug
                ? 'bg-primary text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>All Categories</span>
            {totalProducts !== undefined && !filters.categorySlug && (
              <span className="text-xs opacity-70">{totalProducts}</span>
            )}
          </button>

          {parentCats.map(cat => {
            const hasChildren = cat.children && cat.children.length > 0;
            const isExpanded = expandedCats[cat.id];
            const isSelected = filters.categorySlug === cat.slug;
            const childSelected = cat.children?.some(c => c.slug === filters.categorySlug);

            return (
              <div key={cat.id}>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onFilter({ categorySlug: cat.slug })}
                    className={`flex-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                      isSelected || childSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat._count?.products !== undefined && (
                      <span className="text-xs opacity-50 mr-1">{cat._count.products}</span>
                    )}
                  </button>
                  {hasChildren && (
                    <button
                      onClick={() => setExpandedCats(s => ({ ...s, [cat.id]: !s[cat.id] }))}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>

                {hasChildren && isExpanded && (
                  <div className="ml-3 pl-3 border-l border-gray-100 mt-0.5 space-y-0.5">
                    {cat.children!.map(child => (
                      <button
                        key={child.id}
                        onClick={() => onFilter({ categorySlug: child.slug })}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-left transition-colors ${
                          filters.categorySlug === child.slug
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{child.name}</span>
                        {child._count?.products !== undefined && (
                          <span className="opacity-40">{child._count.products}</span>
                        )}
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
      <Section title="Price Range" badge={(filters.minPrice || filters.maxPrice) ? 1 : 0}>
        {/* Slider */}
        <PriceSlider
          min={sliderMin}
          max={sliderMax}
          onChange={(min, max) => {
            setSliderMin(min);
            setSliderMax(max);
            setPriceInputMin(min > 0 ? String(min) : '');
            setPriceInputMax(max < PRICE_MAX ? String(max) : '');
          }}
        />

        {/* Manual inputs */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min"
              value={priceInputMin}
              onChange={e => {
                setPriceInputMin(e.target.value);
                setSliderMin(Number(e.target.value) || 0);
              }}
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-center"
              min={0}
            />
          </div>
          <span className="text-gray-300 text-xs">—</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max"
              value={priceInputMax}
              onChange={e => {
                setPriceInputMax(e.target.value);
                setSliderMax(Number(e.target.value) || PRICE_MAX);
              }}
              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-center"
              min={0}
            />
          </div>
        </div>

        <button
          onClick={() => applyPrice(sliderMin, sliderMax)}
          className="w-full mt-2.5 bg-primary text-white rounded-lg py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          Apply
        </button>

        {/* Quick presets */}
        <div className="mt-3 space-y-1">
          {PRICE_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => {
                setSliderMin(p.min);
                setSliderMax(p.max);
                setPriceInputMin(p.min > 0 ? String(p.min) : '');
                setPriceInputMax(p.max < PRICE_MAX ? String(p.max) : '');
                applyPrice(p.min, p.max);
              }}
              className={`w-full text-left rounded-lg px-3 py-1.5 text-xs transition-colors ${
                filters.minPrice === (p.min || undefined) && filters.maxPrice === (p.max < PRICE_MAX ? p.max : undefined)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Tags */}
      <Section title="Product Type" badge={filters.tags.length}>
        <div className="space-y-2">
          {TAG_OPTIONS.map(t => {
            const active = filters.tags.includes(t.value);
            return (
              <button
                key={t.value}
                onClick={() => toggleTag(t.value)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {active ? (
                  <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" />
                ) : (
                  <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />
                )}
                <t.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-primary' : t.color}`} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Featured */}
      <Section title="Special" badge={(filters.isFeatured ? 1 : 0)}>
        <button
          onClick={() => onFilter({ isFeatured: !filters.isFeatured })}
          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
            filters.isFeatured ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filters.isFeatured ? (
            <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" />
          ) : (
            <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />
          )}
          <Star className={`w-3.5 h-3.5 flex-shrink-0 ${filters.isFeatured ? 'text-primary' : 'text-yellow-400'}`} />
          <span className="font-medium">Featured Products</span>
        </button>
      </Section>

      {/* Availability */}
      <Section title="Availability" badge={filters.inStock ? 1 : 0}>
        <button
          onClick={() => onFilter({ inStock: !filters.inStock })}
          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
            filters.inStock ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filters.inStock ? (
            <CheckSquare className="w-4 h-4 flex-shrink-0 text-primary" />
          ) : (
            <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />
          )}
          <span className="font-medium">In Stock Only</span>
        </button>
      </Section>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [gridCols, setGridCols] = useState<GridCols>(3);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const filters: FilterState = { categorySlug, minPrice, maxPrice, inStock, isFeatured, tags };

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice, inStock, isFeatured, tags: tagsParam }],
    queryFn: () =>
      productsApi.getAll({
        page, limit: 20, categorySlug, search, sortBy, sortOrder,
        minPrice, maxPrice,
        inStock: inStock || undefined,
        isFeatured: isFeatured || undefined,
        tags: tags.length ? tags.join(',') : undefined,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-roots'],
    queryFn: () => categoriesApi.getRoots(),
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
    categorySlug, minPrice || maxPrice, inStock, isFeatured, ...tags,
  ].filter(Boolean).length;

  const activeCategoryName =
    (categories as CategoryWithChildren[] | undefined)
      ?.flatMap(c => [c, ...(c.children ?? [])])
      .find(c => c.slug === categorySlug)?.name;

  const gridClass =
    gridCols === 2 ? 'grid-cols-2' :
    gridCols === 3 ? 'grid-cols-2 sm:grid-cols-3' :
    'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';

  const filterPanelProps = {
    filters,
    categories: categories as CategoryWithChildren[] | undefined,
    onFilter,
    onClear: clearAllFilters,
    totalProducts: data?.meta.total,
    activeCount,
  };

  return (
    <div className="container py-4 sm:py-6">

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-white z-10">
              <span className="font-bold text-sm">Filters</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-3">
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>
        </div>
      )}

      {/* Page header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold">
            {categorySlug
              ? (activeCategoryName ?? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
              : search
                ? `Results for "${search}"`
                : 'All Products'}
          </h1>
          {data && (
            <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
              {data.meta.total.toLocaleString()} products found
            </p>
          )}
        </div>

        {/* Mobile filter button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex-shrink-0 shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-4">
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">

          {/* Sort bar + grid switcher */}
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 sm:px-4 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:block text-xs text-gray-400 whitespace-nowrap font-medium">Sort by</span>
              <div className="relative">
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={e => {
                    const [sb, so] = e.target.value.split(':');
                    setParams({ sortBy: sb, sortOrder: so });
                  }}
                  className="appearance-none rounded-lg border bg-gray-50 pl-2.5 pr-7 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium"
                >
                  <option value="createdAt:desc">Newest First</option>
                  <option value="createdAt:asc">Oldest First</option>
                  <option value="basePrice:asc">Price: Low → High</option>
                  <option value="basePrice:desc">Price: High → Low</option>
                  <option value="name:asc">Name A–Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {([2, 3, 4, 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setGridCols(v)}
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border transition-colors ${
                    gridCols === v ? 'border-gray-800 bg-gray-800 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                  }`}
                >
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
            <div className="mb-3 flex flex-wrap gap-1.5">
              {categorySlug && (
                <Chip label={activeCategoryName ?? categorySlug} onRemove={() => onFilter({ categorySlug: undefined })} />
              )}
              {(minPrice || maxPrice) && (
                <Chip
                  label={`৳${(minPrice ?? 0).toLocaleString()} – ৳${maxPrice ? maxPrice.toLocaleString() : '∞'}`}
                  onRemove={() => onFilter({ minPrice: undefined, maxPrice: undefined })}
                />
              )}
              {isFeatured && <Chip label="Featured" onRemove={() => onFilter({ isFeatured: false })} />}
              {inStock && <Chip label="In Stock" onRemove={() => onFilter({ inStock: false })} />}
              {tags.map(tag => (
                <Chip key={tag} label={TAG_OPTIONS.find(t => t.value === tag)?.label ?? tag} onRemove={() => onFilter({ tags: tags.filter(t => t !== tag) })} />
              ))}
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-700">{t.products.noProductsFound}</p>
              <p className="text-sm text-gray-400">{t.products.tryAdjustingFilters}</p>
              {activeCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-1 text-sm text-primary font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : gridCols === 'list' ? (
            <div className="space-y-2.5">
              {(data?.data ?? []).map(product => (
                <ProductCard key={product.id} product={product} listView />
              ))}
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
              {(data?.data ?? []).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center gap-1.5">
              <button
                onClick={() => setParams({ page: String(page - 1) })}
                disabled={page === 1}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                ‹ Prev
              </button>
              {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === data.meta.totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setParams({ page: String(p) })}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                        p === page ? 'bg-primary text-white' : 'border hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setParams({ page: String(page + 1) })}
                disabled={page === data.meta.totalPages}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
