'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const categorySlug = searchParams.get('categorySlug') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

  // Count active filters (excluding sort which is always set)
  const activeFilterCount = [minPrice, maxPrice, inStock].filter(Boolean).length;

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice, inStock }],
    queryFn: () => productsApi.getAll({ page, limit: 20, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice, inStock }),
  });

  const setParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">
          {categorySlug ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Products'}
          {data && <span className="ml-2 text-sm font-normal text-muted-foreground">({data.meta.total})</span>}
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={e => { const [sb, so] = e.target.value.split(':'); setParam('sortBy', sb); setParam('sortOrder', so); }}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="createdAt:desc">Newest</option>
            <option value="basePrice:asc">Price: Low to High</option>
            <option value="basePrice:desc">Price: High to Low</option>
            <option value="name:asc">Name A-Z</option>
          </select>
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="rounded-xl border bg-card p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setMinPriceInput('');
                  setMaxPriceInput('');
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('minPrice');
                  params.delete('maxPrice');
                  params.delete('inStock');
                  params.delete('page');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Price Range */}
          <div>
            <p className="mb-2 text-sm font-medium">Price Range (৳)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPriceInput}
                onChange={e => setMinPriceInput(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                min={0}
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPriceInput}
                onChange={e => setMaxPriceInput(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                min={0}
              />
              <button
                onClick={() => {
                  setParam('minPrice', minPriceInput || undefined);
                  setParam('maxPrice', maxPriceInput || undefined);
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>

          {/* In Stock */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inStock"
              checked={inStock === true}
              onChange={e => setParam('inStock', e.target.checked ? 'true' : undefined)}
              className="h-4 w-4 rounded border-gray-300 accent-primary"
            />
            <label htmlFor="inStock" className="text-sm cursor-pointer select-none">In Stock Only</label>
          </div>
        </div>
      )}

      {(minPrice || maxPrice || categorySlug || inStock) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categorySlug && <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">{categorySlug} <button onClick={() => setParam('categorySlug', undefined)}><X className="h-3 w-3" /></button></span>}
          {(minPrice || maxPrice) && <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">৳{minPrice ?? 0}–{maxPrice ?? '∞'} <button onClick={() => { setMinPriceInput(''); setMaxPriceInput(''); setParam('minPrice', undefined); setParam('maxPrice', undefined); }}><X className="h-3 w-3" /></button></span>}
          {inStock && <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">In Stock <button onClick={() => setParam('inStock', undefined)}><X className="h-3 w-3" /></button></span>}
        </div>
      )}

      <ProductGrid products={data?.data ?? []} loading={isLoading} />

      {data && data.meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setParam('page', String(p))}
              className={`h-9 w-9 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
