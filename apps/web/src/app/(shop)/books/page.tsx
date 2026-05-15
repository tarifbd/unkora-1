'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { booksApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';
import { useLanguage } from '@/lib/i18n/language-context';
import { BookOpen, ChevronDown, X } from 'lucide-react';

function BooksPageInner() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const b = t.books;

  useEffect(() => {
    const genre    = searchParams.get('genre');
    const author   = searchParams.get('author');
    const language = searchParams.get('language');
    const sortBy   = searchParams.get('sortBy');
    const sortOrder= searchParams.get('sortOrder');
    const tag      = searchParams.get('tag');

    const init: Record<string, string> = {};
    if (genre)     init.genre    = genre;
    if (author)    init.author   = author;
    if (language)  init.language = language;
    if (sortBy)    init.sortBy   = sortBy;
    if (sortOrder) init.sortOrder= sortOrder;

    if (tag) {
      const tagMap: Record<string, string> = {
        'Academic Books': 'Academic',
        'Islamic Books':  'Islamic',
        'Fiction':        'Fiction',
        'Self-Help':      'Self-Help',
        'Non-Fiction':    'Non-Fiction',
        "Children's":     "Children's",
        'Productivity':   'Productivity',
      };
      if (tagMap[tag]) init.genre = tagMap[tag];
      else if (tag === 'Authors') init.sortBy = 'bookDetail.author';
    }

    if (Object.keys(init).length > 0) setFilters(init);
  }, []); // eslint-disable-line

  const { data, isLoading } = useQuery({
    queryKey: ['books', filters, page],
    queryFn: () => booksApi.getAll({ ...filters, page, limit: 20 }),
  });

  const { data: opts } = useQuery({
    queryKey: ['book-filter-options'],
    queryFn: () => booksApi.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const setFilter = (k: string, v: string) => {
    setFilters(f =>
      v
        ? { ...f, [k]: v }
        : Object.fromEntries(Object.entries(f).filter(([key]) => key !== k)),
    );
    setPage(1);
  };
  const clearAll = () => { setFilters({}); setPage(1); };

  const activeCount = Object.keys(filters).length;
  const activeLabel = filters.genre ?? filters.author ?? filters.language ?? null;

  const SelectFilter = ({ k, label, options }: { k: string; label: string; options: string[] }) => (
    <div className="relative">
      <select
        value={filters[k] ?? ''}
        onChange={e => setFilter(k, e.target.value)}
        className="w-full appearance-none rounded-md border-2 border-gray-200 bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:border-primary transition-colors"
      >
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Page title */}
        <div className="mb-6 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black text-gray-900">{b.title}</h1>
          {data && (
            <span className="text-sm text-gray-500 font-medium">
              ({data.meta.total} {lang === 'bn' ? 'টি বই' : 'books'})
            </span>
          )}
        </div>

        {/* Active filter breadcrumb chip */}
        {activeLabel && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">{b.showingFor}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 border border-green-300 px-3 py-1 text-sm font-bold">
              {activeLabel}
              <button onClick={clearAll} className="ml-1 hover:text-green-600 transition-colors" aria-label="Clear filter">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <SelectFilter k="author"    label={b.allAuthors} options={opts?.authors ?? []} />
            <SelectFilter k="genre"     label={b.allGenres}  options={opts?.genres ?? []} />
            <SelectFilter k="language"  label={b.language}   options={opts?.languages ?? []} />
            <SelectFilter k="publisher" label={b.publisher}  options={(opts?.publishers ?? []).filter(Boolean) as string[]} />
            <SelectFilter k="binding"   label={b.binding}    options={(opts?.bindings ?? []).filter(Boolean) as string[]} />
          </div>

          {activeCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {Object.entries(filters).map(([k, v]) => (
                <span
                  key={k}
                  className="flex items-center gap-1 rounded-full bg-white border-2 border-green-200 text-green-800 px-3 py-0.5 text-xs font-semibold"
                >
                  {v}
                  <button onClick={() => setFilter(k, '')} className="hover:text-green-600 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline">
                {b.clearAll}
              </button>
            </div>
          )}
        </div>

        <ProductGrid products={data?.data ?? []} loading={isLoading} />

        {data && data.meta.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-md text-sm font-semibold transition-colors ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'border-2 border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <BooksPageInner />
    </Suspense>
  );
}
