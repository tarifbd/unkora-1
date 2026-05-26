'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Loader2, Trash2, Pencil, ChevronUp, ChevronDown,
  Package, Star, AlertTriangle, XCircle, CheckCircle2, SlidersHorizontal,
  MoreVertical, Eye, Copy, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { productsApi, categoriesApi, type Product } from '@/lib/api/products';
import { formatCurrency } from '@/lib/utils';

type SortField = 'name' | 'basePrice' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-200">
      <XCircle className="h-3 w-3" /> Out of Stock
    </span>
  );
  if (qty <= 10) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-600 border border-yellow-200">
      <AlertTriangle className="h-3 w-3" /> Low ({qty})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600 border border-green-200">
      <CheckCircle2 className="h-3 w-3" /> {qty}
    </span>
  );
}

function ToggleSwitch({ checked, onChange, loading }: { checked: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50
        ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200
        ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: SortOrder }) {
  if (sortBy !== field) return <ChevronUp className="h-3 w-3 text-muted-foreground/40" />;
  return sortOrder === 'asc'
    ? <ChevronUp className="h-3 w-3 text-primary" />
    : <ChevronDown className="h-3 w-3 text-primary" />;
}

function DeleteModal({ product, onConfirm, onCancel, loading }: {
  product: Product; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl mx-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Delete Product</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <span className="font-medium text-foreground">"{product.name}"</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkDeleteModal({ count, onConfirm, onCancel, loading }: {
  count: number; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl mx-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Delete {count} Products</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This will permanently delete {count} selected product{count !== 1 ? 's' : ''}. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete {count} Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'normal'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock' | 'lowStock'>('all');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [openKebab, setOpenKebab] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const searchTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer[0]) clearTimeout(searchTimer[0]);
    searchTimer[1](setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400));
  };

  const queryParams = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    isFeatured: featuredFilter === 'featured' ? true : featuredFilter === 'normal' ? false : undefined,
    inStock: stockFilter === 'inStock' ? true : undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', queryParams],
    queryFn: () => productsApi.getAll(queryParams),
  });

  const { data: statsTotal } = useQuery({
    queryKey: ['admin-products-stats-total'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 1 }),
  });
  const { data: statsFeatured } = useQuery({
    queryKey: ['admin-products-stats-featured'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 1, isFeatured: true }),
  });
  const { data: statsInStock } = useQuery({
    queryKey: ['admin-products-stats-instock'],
    queryFn: () => productsApi.getAll({ page: 1, limit: 1, inStock: true }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => categoriesApi.getAll(),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Record<string, unknown> }) =>
      productsApi.update(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-products-stats-featured'] });
    },
    onSettled: () => setTogglingId(null),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-products-stats-total'] });
      setDeleteTarget(null);
      setSelected(prev => { const s = new Set(prev); s.delete(deleteProduct.variables as string); return s; });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await productsApi.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-products-stats-total'] });
      setSelected(new Set());
      setShowBulkDeleteModal(false);
    },
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  const allSelected = products.length > 0 && products.every(p => selected.has(p.id));
  const someSelected = selected.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); products.forEach(p => s.delete(p.id)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); products.forEach(p => s.add(p.id)); return s; });
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const handleToggleFeatured = async (product: Product) => {
    setTogglingId(product.id);
    updateProduct.mutate({ id: product.id, data: { isFeatured: !product.isFeatured } });
  };

  const handleToggleActive = async (product: Product) => {
    setTogglingId(product.id);
    updateProduct.mutate({ id: product.id, data: { isActive: !product.isActive } });
  };

  const handleBulkActivate = () => {
    selected.forEach(id => updateProduct.mutate({ id, data: { isActive: true } }));
    setSelected(new Set());
  };

  const handleBulkDeactivate = () => {
    selected.forEach(id => updateProduct.mutate({ id, data: { isActive: false } }));
    setSelected(new Set());
  };

  const statCards = [
    { label: 'Total Products', value: statsTotal?.meta.total ?? '-', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Featured', value: statsFeatured?.meta.total ?? '-', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'In Stock', value: statsInStock?.meta.total ?? '-', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    {
      label: 'Out of Stock',
      value: (statsTotal?.meta.total ?? 0) - (statsInStock?.meta.total ?? 0) > 0
        ? (statsTotal?.meta.total ?? 0) - (statsInStock?.meta.total ?? 0)
        : '-',
      icon: XCircle, color: 'text-red-600', bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold">Products</h1>
          {meta && <p className="text-sm text-muted-foreground">{meta.total} products found</p>}
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk actions toolbar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-primary/5 border-primary/20 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button onClick={handleBulkActivate}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
              Activate
            </button>
            <button onClick={handleBulkDeactivate}
              className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors">
              Deactivate
            </button>
            <button onClick={() => setShowBulkDeleteModal(true)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors">
              Delete ({selected.size})
            </button>
            <button onClick={() => setSelected(new Set())}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search name, SKU..."
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={categoryId}
          onChange={e => { setCategoryId(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
        >
          <option value="">All Categories</option>
          {categoriesData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={featuredFilter}
          onChange={e => { setFeaturedFilter(e.target.value as typeof featuredFilter); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Types</option>
          <option value="featured">Featured</option>
          <option value="normal">Not Featured</option>
        </select>

        <select
          value={stockFilter}
          onChange={e => { setStockFilter(e.target.value as typeof stockFilter); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Stock</option>
          <option value="inStock">In Stock</option>
          <option value="outOfStock">Out of Stock</option>
        </select>

        <button
          onClick={() => { setSearch(''); setDebouncedSearch(''); setCategoryId(''); setFeaturedFilter('all'); setStockFilter('all'); setSortBy('createdAt'); setSortOrder('desc'); setPage(1); }}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" /> Reset
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground min-w-[220px]">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Product <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">SKU</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    <button onClick={() => handleSort('basePrice')} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                      Price <SortIcon field="basePrice" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">Stock</th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground xl:table-cell">Featured</th>
                  <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground xl:table-cell">Active</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-muted-foreground">
                      <Package className="mx-auto h-8 w-8 mb-2 opacity-30" />
                      No products found
                    </td>
                  </tr>
                ) : products.map(product => (
                  <tr key={product.id}
                    className={`hover:bg-muted/20 transition-colors ${selected.has(product.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-gray-300 accent-primary cursor-pointer"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted border">
                          {product.images?.[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full items-center justify-center text-base">📦</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight line-clamp-1">{product.name}</p>
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-yellow-600">
                              <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="hidden px-4 py-3 lg:table-cell">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                        {product.sku}
                      </code>
                    </td>

                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {product.category?.name ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {product.salePrice && Number(product.salePrice) < Number(product.basePrice) ? (
                        <div>
                          <p className="font-semibold text-green-600">{formatCurrency(Number(product.salePrice))}</p>
                          <p className="text-xs text-muted-foreground line-through">{formatCurrency(Number(product.basePrice))}</p>
                        </div>
                      ) : (
                        <p className="font-semibold">{formatCurrency(Number(product.basePrice))}</p>
                      )}
                    </td>

                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex justify-center">
                        <StockBadge qty={product.stockQuantity} />
                      </div>
                    </td>

                    <td className="hidden px-4 py-3 xl:table-cell">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={product.isFeatured}
                          onChange={() => handleToggleFeatured(product)}
                          loading={togglingId === product.id}
                        />
                      </div>
                    </td>

                    <td className="hidden px-4 py-3 xl:table-cell">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={product.isActive}
                          onChange={() => handleToggleActive(product)}
                          loading={togglingId === product.id}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setOpenKebab(openKebab === product.id ? null : product.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openKebab === product.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenKebab(null)} />
                            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border bg-card shadow-lg overflow-hidden">
                              <Link href={`/admin/products/${product.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                                onClick={() => setOpenKebab(null)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit Product
                              </Link>
                              <Link href={`/products/${product.slug}`} target="_blank"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                                onClick={() => setOpenKebab(null)}>
                                <Eye className="h-4 w-4 text-muted-foreground" /> View in Store
                              </Link>
                              <button
                                onClick={() => { handleToggleFeatured(product); setOpenKebab(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                                <Star className="h-4 w-4 text-muted-foreground" />
                                {product.isFeatured ? 'Remove Featured' : 'Mark Featured'}
                              </button>
                              <button
                                onClick={() => { handleToggleActive(product); setOpenKebab(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                                <Copy className="h-4 w-4 text-muted-foreground" />
                                {product.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <div className="border-t" />
                              <button
                                onClick={() => { setDeleteTarget(product); setOpenKebab(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
              const p = meta.totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= meta.totalPages - 3 ? meta.totalPages - 6 + i
                : page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground font-medium' : 'border hover:bg-accent'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={() => deleteProduct.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteProduct.isPending}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          count={selected.size}
          onConfirm={() => bulkDeleteMutation.mutate(Array.from(selected))}
          onCancel={() => setShowBulkDeleteModal(false)}
          loading={bulkDeleteMutation.isPending}
        />
      )}
    </div>
  );
}
