'use client';

import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X, LayoutGrid, Grid3X3, Grid2X2, List, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-context';

type GridCols = 2 | 3 | 4 | 'list';

type TranslationType = ReturnType<typeof useLanguage>['t'];

function FilterPanel({
  categories,
  categorySlug,
  setCategory,
  minPriceInput,
  setMinPriceInput,
  maxPriceInput,
  setMaxPriceInput,
  minPrice,
  maxPrice,
  inStock,
  hasActiveFilters,
  setParam,
  clearAllFilters,
  totalProducts,
  t,
}: {
  categories: { id: string; slug: string; name: string; _count?: { products: number } }[] | undefined;
  categorySlug: string | undefined;
  setCategory: (slug: string | undefined) => void;
  minPriceInput: string;
  setMinPriceInput: (v: string) => void;
  maxPriceInput: string;
  setMaxPriceInput: (v: string) => void;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStock: true | undefined;
  hasActiveFilters: boolean;
  setParam: (k: string, v: string | undefined) => void;
  clearAllFilters: () => void;
  totalProducts: number | undefined;
  t: TranslationType;
}) {
  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-bold">{t.products.filterCategories}</span>
          {categorySlug && (
            <button onClick={() => setCategory(undefined)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
          <button
            onClick={() => setCategory(undefined)}
            className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors ${
              !categorySlug ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent'
            }`}
          >
            <span>{t.products.allCategories}</span>
            {totalProducts && !categorySlug && <span className="text-xs opacity-70">{totalProducts}</span>}
          </button>
          {categories?.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.slug)}
              className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors ${
                categorySlug === cat.slug ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-accent'
              }`}
            >
              <span>{cat.name}</span>
              {cat._count && <span className="text-xs opacity-60">{cat._count.products}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-bold">{t.products.priceRange}</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.products.priceMin}</label>
              <input
                type="number"
                placeholder="0"
                value={minPriceInput}
                onChange={e => setMinPriceInput(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                min={0}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.products.priceMax}</label>
              <input
                type="number"
                placeholder="∞"
                value={maxPriceInput}
                onChange={e => setMaxPriceInput(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                min={0}
              />
            </div>
          </div>
          <button
            onClick={() => {
              setParam('minPrice', minPriceInput || undefined);
              setParam('maxPrice', maxPriceInput || undefined);
            }}
            className="w-full rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.products.applyFilter}
          </button>
          {(minPrice || maxPrice) && (
            <button
              onClick={() => {
                setMinPriceInput('');
                setMaxPriceInput('');
                setParam('minPrice', undefined);
                setParam('maxPrice', undefined);
              }}
              className="w-full text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t.products.clearFilter}
            </button>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-bold">{t.products.availability}</span>
        </div>
        <div className="p-4">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={inStock === true}
              onChange={e => setParam('inStock', e.target.checked ? 'true' : undefined)}
              className="h-4 w-4 rounded border accent-primary"
            />
            <span className="text-sm">{t.products.inStockOnly}</span>
          </label>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full rounded-xl border border-destructive/30 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          {t.products.clearAllFilters}
        </button>
      )}
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [gridCols, setGridCols] = useState<GridCols>(3);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const categorySlug = searchParams.get('categorySlug') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice, inStock }],
    queryFn: () =>
      productsApi.getAll({ page, limit: 20, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice, inStock }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => categoriesApi.getAll(),
  });

  const setParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== undefined) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const setCategory = (slug: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('categorySlug', slug);
    else params.delete('categorySlug');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
    setDrawerOpen(false);
  };

  const clearAllFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`${pathname}?${params.toString()}`);
    setDrawerOpen(false);
  };

  const hasActiveFilters = !!(categorySlug || minPrice || maxPrice || inStock);

  const activeCategoryName =
    categories?.find(c => c.slug === categorySlug)?.name ??
    (categorySlug
      ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : undefined);

  const filterPanelProps = {
    categories,
    categorySlug,
    setCategory,
    minPriceInput,
    setMinPriceInput,
    maxPriceInput,
    setMaxPriceInput,
    minPrice,
    maxPrice,
    inStock,
    hasActiveFilters,
    setParam,
    clearAllFilters,
    totalProducts: data?.meta.total,
    t,
  };

  const gridClass =
    gridCols === 2
      ? 'grid-cols-2'
      : gridCols === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="container py-4 sm:py-6">

      {/* Mobile filter drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-background shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-3 sticky top-0 bg-background z-10">
              <span className="font-semibold">{t.products.filters}</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel {...filterPanelProps} />
            </div>
          </aside>
        </div>
      )}

      {/* Page header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold">
            {categorySlug ? activeCategoryName : search ? `${t.products.resultsFor} "${search}"` : t.products.allProducts}
          </h1>
          {data && (
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {data.meta.total} {t.products.productsFound}
            </p>
          )}
        </div>

        {/* Mobile: filter button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition-colors flex-shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t.products.filters}
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {[categorySlug, minPrice || maxPrice, inStock].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">

          {/* Sort + grid switcher bar */}
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 sm:px-4 sm:py-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap">{t.products.sort}</span>
              <div className="relative">
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={e => {
                    const [sb, so] = e.target.value.split(':');
                    setParam('sortBy', sb);
                    setParam('sortOrder', so);
                  }}
                  className="appearance-none rounded-md border bg-background pl-2.5 pr-7 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="createdAt:desc">{t.products.sortNewest}</option>
                  <option value="createdAt:asc">{t.products.sortOldest}</option>
                  <option value="basePrice:asc">{t.products.sortPriceAsc}</option>
                  <option value="basePrice:desc">{t.products.sortPriceDesc}</option>
                  <option value="name:asc">{t.products.sortAlphabetical}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Grid switcher */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {([2, 3, 4, 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setGridCols(v)}
                  title={v === 'list' ? t.products.listView : `${v} columns`}
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md border transition-colors ${
                    gridCols === v ? 'border-gray-800 bg-gray-800 text-white' : 'hover:bg-accent'
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
          {hasActiveFilters && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {categorySlug && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {activeCategoryName ?? categorySlug}
                  <button onClick={() => setCategory(undefined)}><X className="h-3 w-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  ৳{minPrice ?? 0}–{maxPrice ?? '∞'}
                  <button onClick={() => { setMinPriceInput(''); setMaxPriceInput(''); setParam('minPrice', undefined); setParam('maxPrice', undefined); }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {inStock && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {t.products.inStock} <button onClick={() => setParam('inStock', undefined)}><X className="h-3 w-3" /></button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="rounded-full border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
              >
                {t.products.clearAll}
              </button>
            </div>
          )}

          {/* Product grid / list */}
          {isLoading ? (
            <div className={`grid gap-3 sm:gap-4 ${gridClass}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border bg-muted" />
              ))}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-lg font-medium">{t.products.noProductsFound}</p>
              <p className="text-sm text-muted-foreground">{t.products.tryAdjustingFilters}</p>
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
            <div className="mt-8 flex flex-wrap justify-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setParam('page', String(page - 1))}
                disabled={page === 1}
                className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-40"
              >
                ‹
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
                    <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setParam('page', String(p))}
                      className={`h-9 w-9 rounded-md text-sm transition-colors ${
                        p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setParam('page', String(page + 1))}
                disabled={page === data.meta.totalPages}
                className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
