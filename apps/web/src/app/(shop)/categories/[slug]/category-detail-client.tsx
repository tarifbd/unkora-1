'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api/products';
import { ProductGrid } from '@/components/product/product-grid';

export default function CategoryDetailClient({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { categorySlug: slug, page }],
    queryFn: () => productsApi.getAll({ categorySlug: slug, page, limit: 20 }),
  });

  const title = category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold">{title}</h1>
        {data && <p className="mt-1 text-sm text-muted-foreground">{data.meta.total} products</p>}
        {category?.description && <p className="mt-2 text-muted-foreground">{category.description}</p>}
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
