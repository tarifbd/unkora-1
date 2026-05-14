'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { formatCurrency } from '@/lib/utils';

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => productsApi.getAll({ page, limit: 20, search: search || undefined }),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new"
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Category</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
              <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Stock</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((product: { id: string; name: string; slug: string; basePrice: string; salePrice?: string; stockQuantity: number; images?: Array<{ url: string }>; category?: { name: string } }) => (
              <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {product.images?.[0] ? (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                      ) : <div className="flex h-full items-center justify-center text-sm">📦</div>}
                    </div>
                    <span className="font-medium line-clamp-1">{product.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{product.category?.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold">{formatCurrency(Number(product.salePrice ?? product.basePrice))}</span>
                  {product.salePrice && Number(product.salePrice) < Number(product.basePrice) && (
                    <span className="ml-1 text-xs text-muted-foreground line-through">{formatCurrency(Number(product.basePrice))}</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-destructive'}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/products/${product.id}/edit`}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => confirmDelete(product.id, product.name)}
                      className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
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
