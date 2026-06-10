'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { booksApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  BookOpen, ChevronDown, X, Globe, BookMarked, PenLine,
  Building2, Layers, SlidersHorizontal, Check,
} from 'lucide-react';

const FILTER_ICONS: Record<string, React.ElementType> = {
  language: Globe,
  genre: BookMarked,
  author: PenLine,
  publisher: Building2,
  binding: Layers,
};

const FILTER_LABELS_EN: Record<string, string> = {
  language: 'Language',
  genre: 'Genre',
  author: 'Author',
  publisher: 'Publisher',
  binding: 'Format / Binding',
};

const FILTER_LABELS_BN: Record<string, string> = {
  language: 'ভাষা',
  genre: 'ঘরানা',
  author: 'লেখক',
  publisher: 'প্রকাশক',
  binding: 'বাঁধাই',
};

const FILTER_KEYS = ['language', 'genre', 'author', 'publisher', 'binding'] as const;
type FilterKey = typeof FILTER_KEYS[number];

interface DropdownFilterProps {
  filterKey: FilterKey;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  lang: string;
}

function DropdownFilter({ filterKey, options, value, onChange, lang }: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = FILTER_ICONS[filterKey] as React.ElementType;
  const label = lang === 'bn' ? FILTER_LABELS_BN[filterKey] : FILTER_LABELS_EN[filterKey];
  const hasValue = !!value;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all whitespace-nowrap ${
          hasValue
            ? 'border-primary bg-primary text-white shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:text-primary'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{hasValue ? value : label}</span>
        {hasValue ? (
          <X
            className="w-3.5 h-3.5 ml-1 opacity-80 hover:opacity-100"
            onClick={e => { e.stopPropagation(); onChange(''); }}
          />
        ) : (
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && options.length > 0 && (
        <div className="absolute top-full left-0 mt-2 z-40 w-56 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt === value ? '' : opt); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left"
              >
                <span className={value === opt ? 'font-bold text-primary' : 'text-gray-700'}>{opt}</span>
                {value === opt && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BooksPageInner() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  }, [searchParams]);

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

  const activeCount = Object.keys(filters).filter(k => !['sortBy','sortOrder'].includes(k)).length;

  const filterOptions: Record<FilterKey, string[]> = {
    language:  opts?.languages ?? [],
    genre:     opts?.genres ?? [],
    author:    opts?.authors ?? [],
    publisher: (opts?.publishers ?? []).filter(Boolean) as string[],
    binding:   (opts?.bindings ?? []).filter(Boolean) as string[],
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black text-gray-900">{b.title}</h1>
            {data && (
              <span className="text-sm text-gray-400 font-medium">
                ({data.meta.total} {lang === 'bn' ? 'টি বই' : 'books'})
              </span>
            )}
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5">
          {/* Desktop: horizontal dropdown filter bar */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {lang === 'bn' ? 'ফিল্টার' : 'Filter by'}
              </span>
            </div>
            {FILTER_KEYS.map(key => (
              <DropdownFilter
                key={key}
                filterKey={key}
                options={filterOptions[key]}
                value={filters[key] ?? ''}
                onChange={v => setFilter(key, v)}
                lang={lang}
              />
            ))}
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'সব মুছুন' : 'Clear all'}
              </button>
            )}
          </div>

          {/* Mobile: filter toggle button */}
          <div className="flex sm:hidden items-center justify-between">
            <button
              onClick={() => setShowMobileFilters(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {lang === 'bn' ? 'ফিল্টার' : 'Filters'}
              {activeCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-xs text-red-500 font-semibold hover:underline">
                {lang === 'bn' ? 'সব মুছুন' : 'Clear all'}
              </button>
            )}
          </div>

          {/* Mobile: expanded filter panels */}
          {showMobileFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2 sm:hidden">
              {FILTER_KEYS.map(key => {
                const Icon = FILTER_ICONS[key] as React.ElementType;
                const label = lang === 'bn' ? FILTER_LABELS_BN[key] : FILTER_LABELS_EN[key];
                return (
                  <div key={key}>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      <Icon className="w-3.5 h-3.5" />{label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {filterOptions[key].slice(0, 10).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFilter(key, opt === filters[key] ? '' : opt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            filters[key] === opt
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">{lang === 'bn' ? 'সক্রিয়:' : 'Active:'}</span>
              {Object.entries(filters)
                .filter(([k]) => !['sortBy','sortOrder'].includes(k))
                .map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 text-xs font-semibold">
                    {v}
                    <button onClick={() => setFilter(k, '')} className="hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Product grid */}
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
        <div className="h-14 bg-white rounded-2xl animate-pulse mb-5" />
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
