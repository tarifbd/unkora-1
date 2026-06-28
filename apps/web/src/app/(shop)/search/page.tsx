'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { searchApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';
import { useLanguage } from '@/lib/i18n/language-context';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const { lang } = useLanguage();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.length > 0,
  });

  return (
    <div className="container py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search results for</span>
        </div>
        <h1 className="font-serif text-2xl font-bold">&ldquo;{query}&rdquo;</h1>
        {data && (
          <p className="mt-1 text-sm text-muted-foreground">{data.total} results found</p>
        )}
      </div>

      {!query && (
        <div className="py-12 text-center text-muted-foreground">
          <Search className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>Enter a search term to find products</p>
        </div>
      )}

      {query && isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center"><AlertCircle className="w-8 h-8 text-red-300" /></div>
          <p className="text-base font-bold text-gray-700">{lang === 'bn' ? 'অনুসন্ধান লোড করা যায়নি' : 'Could not load search results'}</p>
          <p className="text-sm text-gray-400">{lang === 'bn' ? 'আপনার ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।' : 'Check your connection and try again.'}</p>
          <button onClick={() => refetch()} className="mt-1 text-sm text-primary font-semibold hover:underline flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}</button>
        </div>
      ) : query ? (
        <ProductGrid products={data?.hits ?? []} loading={isLoading} />
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
