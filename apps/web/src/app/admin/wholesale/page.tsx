'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Search, Package, ChevronRight, DollarSign, Layers, ArrowUpRight } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { formatCurrency } from '@/lib/utils';

export default function WholesaleOverviewPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['wholesale-products', search, page],
    queryFn: () => productsApi.getAll({ search, page, limit: 30 }),
    staleTime: 30000,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wholesale Pricing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set tiered bulk pricing for products. Customers see lower prices as they order more.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-blue-900">How Wholesale Pricing Works</h3>
            <p className="text-xs text-blue-700 mt-0.5">
              Set minimum quantity thresholds and discounted prices. E.g., Buy 10+ = ৳80 each, Buy 50+ = ৳70 each.
              Select any product below to configure its wholesale tiers.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Base Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-muted/20 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img src={product.images[0].url} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{formatCurrency(Number(product.basePrice))}</p>
                        {product.salePrice && (
                          <p className="text-xs text-green-600">Sale: {formatCurrency(Number(product.salePrice))}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        product.stockQuantity === 0 ? 'text-red-600' :
                        product.stockQuantity <= 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{product.category?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/products/${product.id}/wholesale`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                          <DollarSign className="h-3.5 w-3.5" />
                          Set Tiers
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, meta.total)} of {meta.total} products
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
                  Previous
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
