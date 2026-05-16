'use client';

import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X, LayoutGrid, Grid3X3, Grid2X2, List } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api/products';
import { ProductCard } from '@/components/product/product-card';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [gridCols, setGridCols] = useState<2 | 3 | 4 | 'list'>(3);

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
  };

  const clearAllFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = !!(categorySlug || minPrice || maxPrice || inStock);

  const activeCategoryName =
    categories?.find(c => c.slug === categorySlug)?.name ??
    (categorySlug
      ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : undefined);

  return (
    <div className="container py-6">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {categorySlug
              ? activeCategoryName
              : search
                ? `Results for "${search}"`
                : 'All Products'}
          </h1>
          {data && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {data.meta.total} products found
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-5">

          {/* Categories */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <span className="text-sm font-bold">Categories</span>
              {categorySlug && (
                <button
                  onClick={() => setCategory(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="p-2 space-y-0.5">
              <button
                onClick={() => setCategory(undefined)}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors ${
                  !categorySlug
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-accent'
                }`}
              >
                <span>All Categories</span>
                {data && !categorySlug && (
                  <span className="text-xs opacity-70">{data.meta.total}</span>
                )}
              </button>
              {categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors ${
                    categorySlug === cat.slug
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-accent'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count && (
                    <span className="text-xs opacity-60">{cat._count.products}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <span className="text-sm font-bold">Price Range (৳)</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Min</label>
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
                  <label className="mb-1 block text-xs text-muted-foreground">Max</label>
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
                Apply Price Filter
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
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <span className="text-sm font-bold">Availability</span>
            </div>
            <div className="p-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={inStock === true}
                  onChange={e => setParam('inStock', e.target.checked ? 'true' : undefined)}
                  className="h-4 w-4 rounded border accent-primary"
                />
                <span className="text-sm">In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="w-full rounded-xl border border-destructive/30 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="min-w-0 flex-1">
          {/* Sort + Grid switcher bar */}
          <div className="mb-4 flex items-center justify-between rounded-xl border bg-card px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={e => {
                  const [sb, so] = e.target.value.split(':');
                  setParam('sortBy', sb);
                  setParam('sortOrder', so);
                }}
                className="rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="createdAt:desc">Newest</option>
                <option value="createdAt:asc">Oldest</option>
                <option value="basePrice:asc">Price: Low to High</option>
                <option value="basePrice:desc">Price: High to Low</option>
                <option value="name:asc">Name A–Z</option>
              </select>
            </div>

            {/* Grid view switcher */}
            <div className="flex items-center gap-1">
              {([2, 3, 4, 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setGridCols(v)}
                  title={v === 'list' ? 'List view' : `${v} columns`}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                    gridCols === v
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'hover:bg-accent'
                  }`}
                >
                  {v === 2 && <Grid2X2 className="h-4 w-4" />}
                  {v === 3 && <LayoutGrid className="h-4 w-4" />}
                  {v === 4 && <Grid3X3 className="h-4 w-4" />}
                  {v === 'list' && <List className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mb-3 flex flex-wrap gap-2">
              {categorySlug && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {activeCategoryName ?? categorySlug}
                  <button onClick={() => setCategory(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  ৳{minPrice ?? 0}–{maxPrice ?? '∞'}
                  <button
                    onClick={() => {
                      setMinPriceInput('');
                      setMaxPriceInput('');
                      setParam('minPrice', undefined);
                      setParam('maxPrice', undefined);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {inStock && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  In Stock{' '}
                  <button onClick={() => setParam('inStock', undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Product grid */}
          {isLoading ? (
            <div
              className={`grid gap-4 ${
                gridCols === 2
                  ? 'grid-cols-2'
                  : gridCols === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : gridCols === 4
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-1'
              }`}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border bg-muted" />
              ))}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : gridCols === 'list' ? (
            <div className="space-y-3">
              {(data?.data ?? []).map(product => (
                <ProductCard key={product.id} product={product} listView />
              ))}
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                gridCols === 2
                  ? 'grid-cols-2'
                  : gridCols === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              }`}
            >
              {(data?.data ?? []).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setParam('page', String(p))}
                  className={`h-9 w-9 rounded-md text-sm transition-colors ${
                    p === page
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-accent'
                  }`}
                >
                  {p}
                </button>
              ))}
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
