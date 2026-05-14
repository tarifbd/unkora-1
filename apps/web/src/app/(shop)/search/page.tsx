'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { searchApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const { data, isLoading } = useQuery({
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

      {query && <ProductGrid products={data?.hits ?? []} loading={isLoading} />}
    </div>
  );
}
