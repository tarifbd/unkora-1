'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, TrendingDown, CheckCircle2, Search, X,
  Download, Plus, History, ChevronDown, ChevronUp, Loader2,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Filter,
} from 'lucide-react';
import { inventoryApi, type InventoryProduct, type StockMovement } from '@/lib/api/inventory';

/* ─── helpers ──────────────────────────────────────────────────── */
function fmt(n: number) { return n.toLocaleString('en-BD'); }
function fmtCurrency(n: number) { return '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function stockValue(p: InventoryProduct) {
  return Number(p.salePrice ?? p.basePrice) * p.stockQuantity;
}

/* ─── KPI Card ──────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Stock Badge ───────────────────────────────────────────────── */
function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 border border-red-200">
      <X className="h-3 w-3" /> Out of Stock
    </span>
  );
  if (qty <= 5) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
      <AlertTriangle className="h-3 w-3" /> Low: {qty}
    </span>
  );
  if (qty <= 20) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
      <TrendingDown className="h-3 w-3" /> {qty}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
      <CheckCircle2 className="h-3 w-3" /> {qty}
    </span>
  );
}

/* ─── Movement History ──────────────────────────────────────────── */
function MovementHistory({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-history', productId],
    queryFn: () => inventoryApi.getHistory(productId),
  });

  const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
    PURCHASE: { label: 'Purchase', color: 'text-green-600 bg-green-50', sign: '+' },
    RETURN:   { label: 'Return',   color: 'text-blue-600 bg-blue-50',   sign: '+' },
    SALE:     { label: 'Sale',     color: 'text-red-600 bg-red-50',     sign: '-' },
    ADJUSTMENT: { label: 'Adjust', color: 'text-amber-600 bg-amber-50', sign:  '' },
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const movements = (data ?? []) as StockMovement[];
  if (!movements.length) return (
    <div className="py-8 text-center text-sm text-muted-foreground">No stock movements yet</div>
  );

  return (
    <div className="divide-y max-h-72 overflow-y-auto">
      {movements.map(m => {
        const cfg = TYPE_CONFIG[m.type] ?? { label: m.type, color: 'text-gray-600 bg-gray-50', sign: '' };
        const sign = m.quantity > 0 ? '+' : '';
        return (
          <div key={m.id} className="flex items-center gap-3 px-1 py-2.5 text-sm">
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className={`font-bold flex-shrink-0 ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {sign}{m.quantity}
            </span>
            <span className="flex-1 text-muted-foreground text-xs truncate">{m.note ?? '—'}</span>
            <span className="flex-shrink-0 text-[11px] text-muted-foreground">
              {new Date(m.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Adjust Form ───────────────────────────────────────────────── */
const MOVEMENT_TYPES = [
  { value: 'PURCHASE', label: '📦 Purchase / Stock In', positive: true },
  { value: 'RETURN',   label: '↩️ Customer Return',    positive: true },
  { value: 'ADJ_OUT',  label: '📉 Adjustment (Remove)', positive: false },
  { value: 'ADJ_IN',   label: '📈 Adjustment (Add)',    positive: true },
];

function AdjustForm({ product, onDone }: { product: InventoryProduct; onDone: () => void }) {
  const qc = useQueryClient();
  const [movType, setMovType] = useState('PURCHASE');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const selected = MOVEMENT_TYPES.find(t => t.value === movType)!;

  const mutation = useMutation({
    mutationFn: () => {
      const apiType = movType.startsWith('ADJ') ? 'ADJUSTMENT' : movType;
      const quantity = selected.positive ? Math.abs(Number(qty)) : -Math.abs(Number(qty));
      return inventoryApi.adjust({ productId: product.id, type: apiType, quantity, note: note || undefined });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      void qc.invalidateQueries({ queryKey: ['stock-history', product.id] });
      onDone();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg ?? 'Failed to adjust stock.');
    },
  });

  return (
    <form onSubmit={e => { e.preventDefault(); if (!qty || Number(qty) <= 0) { setErr('Enter a valid quantity.'); return; } setErr(''); mutation.mutate(); }} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Movement Type</label>
        <select value={movType} onChange={e => setMovType(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Quantity</label>
        <div className="relative">
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="Enter quantity"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
            {selected.positive ? (
              <span className="text-green-600">+{qty || '0'} units</span>
            ) : (
              <span className="text-red-600">-{qty || '0'} units</span>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Current: {product.stockQuantity} → After: {selected.positive ? product.stockQuantity + Number(qty || 0) : product.stockQuantity - Number(qty || 0)} units
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Note / Reason <span className="font-normal">(optional)</span></label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Received from Pathao supplier, Oct batch"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {err && <p className="text-xs text-destructive">{err}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
        <button type="submit" disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save Adjustment
        </button>
      </div>
    </form>
  );
}

/* ─── Detail Slide-Over ─────────────────────────────────────────── */
function ProductSlideOver({ product, onClose }: { product: InventoryProduct; onClose: () => void }) {
  const [tab, setTab] = useState<'adjust' | 'history'>('adjust');
  const price = Number(product.salePrice ?? product.basePrice);
  const img = product.images?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl border-l">
        {/* Header */}
        <div className="flex items-start gap-3 border-b p-4">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {img ? (
              <Image src={img} alt={product.name} width={56} height={56} className="h-full w-full object-cover" unoptimized={img.includes('unsplash')} />
            ) : (
              <div className="flex h-full items-center justify-center text-xl">📦</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-snug line-clamp-2">{product.name}</p>
            {product.sku && <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {product.sku}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">{product.category.name}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stock stats */}
        <div className="grid grid-cols-3 border-b divide-x text-center">
          <div className="py-3 px-2">
            <p className="text-xs text-muted-foreground">Current Stock</p>
            <p className="text-lg font-bold">{fmt(product.stockQuantity)}</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-xs text-muted-foreground">Unit Price</p>
            <p className="text-lg font-bold">{fmtCurrency(price)}</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-xs text-muted-foreground">Stock Value</p>
            <p className="text-lg font-bold">{fmtCurrency(price * product.stockQuantity)}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b">
          {([['adjust', '⚡ Adjust Stock'], ['history', '📋 History']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'adjust' ? (
            <AdjustForm product={product} onDone={onClose} />
          ) : (
            <MovementHistory productId={product.id} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
type FilterTab = 'all' | 'out' | 'low' | 'ok';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All Products' },
  { id: 'out', label: 'Out of Stock' },
  { id: 'low', label: 'Low Stock (≤5)' },
  { id: 'ok',  label: 'Well Stocked' },
];

export default function AdminInventoryPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InventoryProduct | null>(null);
  const [sortBy, setSortBy] = useState<'stock-asc' | 'stock-desc' | 'value-desc' | 'name'>('stock-asc');

  const { data: resp, isLoading } = useQuery({
    queryKey: ['admin-inventory', filter],
    queryFn: () => inventoryApi.getOverview(1, 200, filter === 'all' ? undefined : filter),
  });

  const allProducts: InventoryProduct[] = resp?.data ?? [];
  const meta = resp?.meta;

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q),
      );
    }
    switch (sortBy) {
      case 'stock-asc':  list.sort((a, b) => a.stockQuantity - b.stockQuantity); break;
      case 'stock-desc': list.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
      case 'value-desc': list.sort((a, b) => stockValue(b) - stockValue(a)); break;
      case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [allProducts, search, sortBy]);

  const totalStockValue = allProducts.reduce((sum, p) => sum + stockValue(p), 0);
  const outCount  = meta?.outCount ?? allProducts.filter(p => p.stockQuantity === 0).length;
  const lowCount  = meta?.lowCount ?? allProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const totalCount = meta?.total ?? allProducts.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage stock levels, track movements, and monitor supply health</p>
        </div>
        <button
          onClick={() => inventoryApi.exportCsv(filtered)}
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Products" value={fmt(totalCount)} icon={Package} color="bg-blue-100 text-blue-700" />
        <KpiCard label="Out of Stock" value={fmt(outCount)} sub="Needs restocking" icon={X} color="bg-red-100 text-red-600" />
        <KpiCard label="Low Stock (≤5)" value={fmt(lowCount)} sub="Order soon" icon={AlertTriangle} color="bg-amber-100 text-amber-700" />
        <KpiCard label="Total Stock Value" value={fmtCurrency(totalStockValue)} sub="Across all products" icon={RefreshCw} color="bg-green-100 text-green-700" />
      </div>

      {/* Filter + Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {FILTER_TABS.map(t => (
            <button key={t.id} onClick={() => { setFilter(t.id); setSearch(''); }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${filter === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
              {t.id === 'out' && outCount > 0 && <span className="ml-1.5 rounded-full bg-red-500 text-white text-[10px] px-1.5 py-0.5">{outCount}</span>}
              {t.id === 'low' && lowCount > 0 && <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.5">{lowCount}</span>}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, category…"
            className="w-full rounded-md border bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="stock-asc">Stock: Low → High</option>
            <option value="stock-desc">Stock: High → Low</option>
            <option value="value-desc">Value: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>

        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} products</p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-semibold">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground sm:table-cell">Category</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">SKU</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Unit Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Stock</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground lg:table-cell">Stock Value</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(product => {
                  const price = Number(product.salePrice ?? product.basePrice);
                  const img = product.images?.[0]?.url;
                  return (
                    <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            {img ? (
                              <Image src={img} alt={product.name} width={36} height={36} className="h-full w-full object-cover" unoptimized={img.includes('unsplash')} />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm">📦</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight line-clamp-1">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{product.category.name}</td>
                      {/* SKU */}
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{product.sku ?? '—'}</span>
                      </td>
                      {/* Price */}
                      <td className="px-4 py-3 font-semibold">{fmtCurrency(price)}</td>
                      {/* Stock */}
                      <td className="px-4 py-3"><StockBadge qty={product.stockQuantity} /></td>
                      {/* Value */}
                      <td className="hidden px-4 py-3 font-semibold text-muted-foreground lg:table-cell">
                        {fmtCurrency(price * product.stockQuantity)}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelected(product)}
                            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Adjust
                          </button>
                          <button
                            onClick={() => { setSelected(product); }}
                            className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                            title="View history"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground bg-muted/10">
            <span>Showing {filtered.length} of {totalCount} products</span>
            <span className="font-semibold">Total Value: {fmtCurrency(filtered.reduce((s, p) => s + stockValue(p), 0))}</span>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {selected && <ProductSlideOver product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
