'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const categorySlug = searchParams.get('categorySlug') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice }],
    queryFn: () => productsApi.getAll({ page, limit: 20, categorySlug, search, sortBy, sortOrder, minPrice, maxPrice }),
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
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* Active filters */}
      {(minPrice || maxPrice || categorySlug) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categorySlug && <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">{categorySlug} <button onClick={() => setParam('categorySlug', undefined)}><X className="h-3 w-3" /></button></span>}
          {(minPrice || maxPrice) && <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">৳{minPrice ?? 0}–{maxPrice ?? '∞'} <button onClick={() => { setParam('minPrice', undefined); setParam('maxPrice', undefined); }}><X className="h-3 w-3" /></button></span>}
        </div>
      )}

      <ProductGrid products={data?.data ?? []} loading={isLoading} />

      {/* Pagination */}
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
