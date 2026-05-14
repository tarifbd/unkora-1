'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { booksApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';
import { BookOpen, ChevronDown, X } from 'lucide-react';

export default function BooksPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['books', filters, page],
    queryFn: () => booksApi.getAll({ ...filters, page, limit: 20 }),
  });

  const { data: opts } = useQuery({
    queryKey: ['book-filter-options'],
    queryFn: () => booksApi.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const setFilter = (k: string, v: string) => { setFilters(f => v ? { ...f, [k]: v } : Object.fromEntries(Object.entries(f).filter(([key]) => key !== k))); setPage(1); };
  const clearAll = () => { setFilters({}); setPage(1); };

  const activeCount = Object.keys(filters).length;

  const SelectFilter = ({ k, label, options }: { k: string; label: string; options: string[] }) => (
    <div className="relative">
      <select value={filters[k] ?? ''} onChange={e => setFilter(k, e.target.value)}
        className="w-full appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-brand-600" />
        <h1 className="font-serif text-2xl font-bold">Books</h1>
        {data && <span className="text-sm text-muted-foreground">({data.meta.total} books)</span>}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border bg-muted/30 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <SelectFilter k="author" label="All Authors" options={opts?.authors ?? []} />
          <SelectFilter k="genre" label="All Genres" options={opts?.genres ?? []} />
          <SelectFilter k="language" label="Language" options={opts?.languages ?? []} />
          <SelectFilter k="publisher" label="Publisher" options={(opts?.publishers ?? []).filter(Boolean) as string[]} />
          <SelectFilter k="binding" label="Binding" options={(opts?.bindings ?? []).filter(Boolean) as string[]} />
        </div>

        {activeCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {Object.entries(filters).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1 rounded-full bg-background border px-3 py-0.5 text-xs">
                {v} <button onClick={() => setFilter(k, '')}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <button onClick={clearAll} className="text-xs text-destructive hover:underline">Clear all</button>
          </div>
        )}
      </div>

      <ProductGrid products={data?.data ?? []} loading={isLoading} />

      {data && data.meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
