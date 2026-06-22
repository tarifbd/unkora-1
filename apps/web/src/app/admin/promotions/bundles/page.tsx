'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, Package, Tag, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRef {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  salePrice?: number;
  images?: { url: string; isPrimary: boolean }[];
}

interface BundleItem {
  id: string;
  productId: string;
  quantity: number;
  product: ProductRef;
}

interface BundleOffer {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string | number;
  minItems: number;
  maxUses?: number;
  usedCount: number;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  createdAt: string;
  items: BundleItem[];
  _count?: { items: number };
}

interface FormState {
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minItems: string;
  maxUses: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: { productId: string; productName: string; quantity: number }[];
}

type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultForm: FormState = {
  title: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minItems: '2',
  maxUses: '',
  startDate: '',
  endDate: '',
  isActive: true,
  items: [],
};

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Product Search Dropdown ───────────────────────────────────────────────────

function ProductSearch({
  selectedItems,
  onAdd,
  onRemove,
}: {
  selectedItems: FormState['items'];
  onAdd: (item: { productId: string; productName: string; quantity: number }) => void;
  onRemove: (productId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(v), 350);
    setOpen(true);
  };

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['bundle-product-search', debouncedQuery],
    queryFn: () =>
      api.get('/products', { params: { search: debouncedQuery, limit: 10 } }).then((r) => {
        const list = r.data?.data ?? r.data;
        return Array.isArray(list) ? list : [];
      }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 10_000,
  });

  const selectedIds = new Set(selectedItems.map((i) => i.productId));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Products</label>

      {/* Selected tags */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedItems.map((item) => (
            <span
              key={item.productId}
              className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-full px-2.5 py-1"
            >
              {item.productName}
              <button
                type="button"
                onClick={() => onRemove(item.productId)}
                className="ml-0.5 hover:text-orange-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search products..."
          className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}

        {open && debouncedQuery && (
          <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {!searchResults || searchResults.length === 0 ? (
              <p className="text-xs text-gray-400 p-3">No products found</p>
            ) : (
              searchResults.map((p: ProductRef) => {
                const already = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={already}
                    onClick={() => {
                      if (!already) {
                        onAdd({ productId: p.id, productName: p.name, quantity: 1 });
                        setQuery('');
                        setDebouncedQuery('');
                        setOpen(false);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-orange-50 ${already ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="line-clamp-1">{p.name}</span>
                    {already && <span className="text-xs text-gray-400">Added</span>}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────

function BundleCard({
  bundle,
  onEdit,
  onDelete,
  onToggle,
}: {
  bundle: BundleOffer;
  onEdit: (b: BundleOffer) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const MAX_TAGS = 3;
  const products = bundle.items ?? [];
  const shown = products.slice(0, MAX_TAGS);
  const extra = products.length - MAX_TAGS;

  const discountLabel =
    bundle.discountType === 'PERCENTAGE'
      ? `${Number(bundle.discountValue)}% OFF`
      : `৳${Number(bundle.discountValue)} OFF`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{bundle.title}</h3>
          {bundle.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{bundle.description}</p>
          )}
        </div>
        <span className="shrink-0 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {discountLabel}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          Min {bundle.minItems} items
        </span>
        {bundle.maxUses && (
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {bundle.usedCount}/{bundle.maxUses} used
          </span>
        )}
        {(bundle.startDate || bundle.endDate) && (
          <span>
            {formatDate(bundle.startDate)} – {formatDate(bundle.endDate)}
          </span>
        )}
      </div>

      {/* Product tags */}
      {products.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((item) => (
            <span
              key={item.id}
              className="bg-gray-100 text-gray-600 text-xs rounded-md px-2 py-0.5 line-clamp-1 max-w-[140px]"
            >
              {item.product?.name ?? item.productId}
            </span>
          ))}
          {extra > 0 && (
            <span className="bg-gray-100 text-gray-500 text-xs rounded-md px-2 py-0.5">
              +{extra} more
            </span>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <button
          onClick={() => onToggle(bundle.id)}
          className="flex items-center gap-1.5 text-xs font-medium"
        >
          {bundle.isActive ? (
            <>
              <ToggleRight className="w-5 h-5 text-green-500" />
              <span className="text-green-600">Active</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">Inactive</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(bundle)}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(bundle.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function BundleModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: BundleOffer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) return defaultForm;
    return {
      title: initial.title,
      description: initial.description ?? '',
      discountType: initial.discountType,
      discountValue: String(Number(initial.discountValue)),
      minItems: String(initial.minItems),
      maxUses: initial.maxUses ? String(initial.maxUses) : '',
      startDate: initial.startDate ? initial.startDate.slice(0, 16) : '',
      endDate: initial.endDate ? initial.endDate.slice(0, 16) : '',
      isActive: initial.isActive,
      items: (initial.items ?? []).map((i) => ({
        productId: i.productId,
        productName: i.product?.name ?? i.productId,
        quantity: i.quantity,
      })),
    };
  });

  const set = (key: keyof FormState, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minItems: parseInt(form.minItems, 10),
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
        items: form.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
      if (initial) {
        return api.patch(`/bundles/admin/${initial.id}`, payload).then((r) => r.data);
      }
      return api.post('/bundles/admin', payload).then((r) => r.data);
    },
    onSuccess: () => {
      toast.success(initial ? 'Bundle updated' : 'Bundle created');
      onSaved();
      onClose();
    },
    onError: () => toast.error('Failed to save bundle'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.discountValue || isNaN(parseFloat(form.discountValue)))
      return toast.error('Valid discount value is required');
    save.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
          <h2 className="font-bold text-lg text-gray-900">
            {initial ? 'Edit Bundle Offer' : 'Create Bundle Offer'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Buy 3, Get 20% Off"
              className={inputCls}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => set('discountType', e.target.value as 'PERCENTAGE' | 'FIXED')}
                className={inputCls}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => set('discountValue', e.target.value)}
                placeholder={form.discountType === 'PERCENTAGE' ? '0–100' : 'Amount'}
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Min Items & Max Uses */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Items</label>
              <input
                type="number"
                min="2"
                value={form.minItems}
                onChange={(e) => set('minItems', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => set('maxUses', e.target.value)}
                placeholder="Unlimited"
                className={inputCls}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Product search */}
          <ProductSearch
            selectedItems={form.items}
            onAdd={(item) => set('items', [...form.items, item])}
            onRemove={(productId) =>
              set(
                'items',
                form.items.filter((i) => i.productId !== productId),
              )
            }
          />

          {/* Active toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'Save Changes' : 'Create Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminBundlesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BundleOffer | undefined>(undefined);

  const queryKey = ['admin-bundles', tab, page];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (tab === 'ACTIVE') params.isActive = 'true';
      if (tab === 'INACTIVE') params.isActive = 'false';
      return api
        .get('/bundles/admin/all', { params })
        .then((r) => r.data);
    },
    staleTime: 30_000,
  });

  const bundles: BundleOffer[] = data?.data ?? [];
  const meta = data?.meta;

  // Stats (from ALL query, always present)
  const { data: statsData } = useQuery({
    queryKey: ['admin-bundles', 'ALL', 1, 'stats'],
    queryFn: () =>
      api.get('/bundles/admin/all', { params: { page: 1, limit: 1000 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const allBundles: BundleOffer[] = statsData?.data ?? [];
  const totalActive = allBundles.filter((b) => b.isActive).length;
  const totalInactive = allBundles.filter((b) => !b.isActive).length;

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ['admin-bundles'] }),
    [qc],
  );

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bundles/admin/${id}/toggle`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bundles/admin/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Bundle deleted');
      invalidate();
    },
    onError: () => toast.error('Failed to delete bundle'),
  });

  const handleDelete = (id: string) => {
    if (!confirm('Delete this bundle offer? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  };

  const handleEdit = (b: BundleOffer) => {
    setEditing(b);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(undefined);
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'INACTIVE', label: 'Inactive' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundle Offers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create "Buy X products, get Y% off" promotions
          </p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Bundle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Bundles', value: allBundles.length, color: 'text-gray-900' },
          { label: 'Active', value: totalActive, color: 'text-green-600' },
          { label: 'Inactive', value: totalInactive, color: 'text-gray-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-red-500 text-sm">Failed to load bundle offers.</div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No bundle offers yet</p>
          <p className="text-xs mt-1">Click "Create Bundle" to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={(id) => toggleMutation.mutate(id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <BundleModal
          initial={editing}
          onClose={handleCloseModal}
          onSaved={invalidate}
        />
      )}
    </div>
  );
}
