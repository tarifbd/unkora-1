'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, TrendingDown, CheckCircle2, Search, X,
  Download, History, Loader2, Filter, Minus, Plus, BarChart3,
  RefreshCw, ArrowUpDown, Boxes, DollarSign, ShoppingBag, Pencil,
} from 'lucide-react';
import { inventoryApi, type InventoryProduct, type StockMovement } from '@/lib/api/inventory';

/* ─── helpers ─────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString('en-BD');
const fmtMoney = (n: number) => '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const price = (p: InventoryProduct) => Number(p.salePrice ?? p.basePrice);
const stockValue = (p: InventoryProduct) => price(p) * p.stockQuantity;

/* ─── Stock status ────────────────────────────────────────────────── */
type StockLevel = 'out' | 'critical' | 'low' | 'ok' | 'good';
function stockLevel(qty: number): StockLevel {
  if (qty === 0) return 'out';
  if (qty <= 3) return 'critical';
  if (qty <= 10) return 'low';
  if (qty <= 30) return 'ok';
  return 'good';
}
const LEVEL_CONFIG: Record<StockLevel, { label: string; bg: string; text: string; bar: string; row: string }> = {
  out:      { label: 'Out of Stock', bg: 'bg-red-50',    text: 'text-red-600',    bar: 'bg-red-400',    row: 'bg-red-50/40' },
  critical: { label: 'Critical',     bg: 'bg-red-50',    text: 'text-red-600',    bar: 'bg-red-400',    row: 'bg-red-50/20' },
  low:      { label: 'Low Stock',    bg: 'bg-amber-50',  text: 'text-amber-700',  bar: 'bg-amber-400',  row: 'bg-amber-50/20' },
  ok:       { label: 'Normal',       bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-400',   row: '' },
  good:     { label: 'Well Stocked', bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-400',  row: '' },
};

function StockBadge({ qty }: { qty: number }) {
  const level = stockLevel(qty);
  const cfg = LEVEL_CONFIG[level];
  const Icon = qty === 0 ? X : qty <= 3 ? AlertTriangle : qty <= 10 ? TrendingDown : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${cfg.bg} px-2.5 py-1 text-xs font-bold ${cfg.text} border border-current/20`}>
      <Icon className="h-3 w-3" /> {qty === 0 ? 'Out' : fmt(qty)}
    </span>
  );
}

function StockBar({ qty, max }: { qty: number; max: number }) {
  const level = stockLevel(qty);
  const pct = max > 0 ? Math.min(100, (qty / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${LEVEL_CONFIG[level].bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{fmt(qty)}</span>
    </div>
  );
}

/* ─── KPI Card ────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: { value: string; up: boolean };
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend && (
          <span className={`text-xs font-bold ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Movement History ────────────────────────────────────────────── */
function MovementHistory({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-history', productId],
    queryFn: () => inventoryApi.getHistory(productId),
  });

  const TYPE_CFG: Record<string, { label: string; bg: string; text: string; sign: string }> = {
    PURCHASE:   { label: 'Purchase',  bg: 'bg-green-100', text: 'text-green-700', sign: '+' },
    RETURN:     { label: 'Return',    bg: 'bg-blue-100',  text: 'text-blue-700',  sign: '+' },
    SALE:       { label: 'Sale',      bg: 'bg-red-100',   text: 'text-red-700',   sign: '-' },
    ADJUSTMENT: { label: 'Adjust',   bg: 'bg-amber-100', text: 'text-amber-700', sign: '±' },
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>;
  const moves = (data ?? []) as StockMovement[];
  if (!moves.length) return <div className="py-12 text-center text-sm text-gray-400">No stock movements yet</div>;

  return (
    <div className="divide-y max-h-80 overflow-y-auto">
      {moves.map(m => {
        const cfg = TYPE_CFG[m.type] ?? { label: m.type, bg: 'bg-gray-100', text: 'text-gray-700', sign: '' };
        return (
          <div key={m.id} className="flex items-center gap-3 py-3 text-sm">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text} flex-shrink-0`}>{cfg.label}</span>
            <span className={`font-black flex-shrink-0 w-12 ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {m.quantity > 0 ? '+' : ''}{m.quantity}
            </span>
            <span className="flex-1 text-gray-500 text-xs truncate">{m.note ?? '—'}</span>
            <span className="flex-shrink-0 text-[10px] text-gray-400 whitespace-nowrap">
              {new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Adjust Form ─────────────────────────────────────────────────── */
const MOV_TYPES = [
  { value: 'PURCHASE',  label: '📦 Stock In (Purchase / Received)',  delta: +1 },
  { value: 'RETURN',    label: '↩️ Customer Return',                 delta: +1 },
  { value: 'ADJ_IN',    label: '📈 Manual Adjustment (Add)',          delta: +1 },
  { value: 'ADJ_OUT',   label: '📉 Manual Adjustment (Remove)',       delta: -1 },
  { value: 'SALE',      label: '🛒 Manual Sale Record',               delta: -1 },
];

function AdjustForm({ product, onDone }: { product: InventoryProduct; onDone: () => void }) {
  const qc = useQueryClient();
  const [movType, setMovType] = useState('PURCHASE');
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const selected = MOV_TYPES.find(t => t.value === movType)!;
  const qtyNum = Math.abs(Number(qty) || 0);
  const newStock = product.stockQuantity + selected.delta * qtyNum;

  const mutation = useMutation({
    mutationFn: () => {
      const apiType = movType.startsWith('ADJ') ? 'ADJUSTMENT' : movType;
      return inventoryApi.adjust({ productId: product.id, type: apiType, quantity: selected.delta * qtyNum, note: note || undefined });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-inventory'] }); qc.invalidateQueries({ queryKey: ['stock-history', product.id] }); onDone(); },
    onError: (e: unknown) => setErr(((e as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Failed.'),
  });

  return (
    <form onSubmit={e => { e.preventDefault(); if (!qtyNum) { setErr('Enter a valid quantity.'); return; } setErr(''); mutation.mutate(); }} className="space-y-4">
      {/* Preview */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
        <div className="text-center flex-1">
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-2xl font-black">{fmt(product.stockQuantity)}</p>
        </div>
        <div className={`text-2xl font-black ${selected.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {selected.delta > 0 ? '+' : '-'}{qtyNum}
        </div>
        <div className="text-gray-400 text-xl">=</div>
        <div className="text-center flex-1">
          <p className="text-xs text-gray-500">After</p>
          <p className={`text-2xl font-black ${newStock < 0 ? 'text-red-600' : newStock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
            {newStock < 0 ? '⚠' : fmt(newStock)}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Movement Type</label>
        <select value={movType} onChange={e => setMovType(e.target.value)}
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          {MOV_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantity</label>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setQty(q => String(Math.max(1, Number(q) - 1)))}
            className="h-10 w-10 flex-shrink-0 rounded-xl border hover:bg-gray-50 flex items-center justify-center">
            <Minus className="h-4 w-4" />
          </button>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
            className="flex-1 rounded-xl border bg-white px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="button" onClick={() => setQty(q => String(Number(q) + 1))}
            className="h-10 w-10 flex-shrink-0 rounded-xl border hover:bg-gray-50 flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note <span className="font-normal text-gray-400">(optional)</span></label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Received from supplier, Oct batch"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {err && <p className="text-xs text-red-600 font-medium">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onDone} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={mutation.isPending || newStock < 0}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}

/* ─── Slide-Over Panel ────────────────────────────────────────────── */
function ProductSlideOver({ product, defaultTab = 'adjust', onClose }: {
  product: InventoryProduct; defaultTab?: 'adjust' | 'history'; onClose: () => void;
}) {
  const [tab, setTab] = useState<'adjust' | 'history'>(defaultTab);
  const img = product.images?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b p-5 bg-gray-50">
          <div className="h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-sm">
            {img ? <Image src={img} alt={product.name} width={64} height={64} className="h-full w-full object-cover" unoptimized={img.includes('unsplash')} />
              : <div className="flex h-full items-center justify-center text-2xl">📦</div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-snug line-clamp-2">{product.name}</p>
            {product.sku && <p className="text-xs font-mono text-gray-500 mt-0.5">SKU: {product.sku}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{product.category.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-200 transition-colors flex-shrink-0">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 border-b divide-x bg-white">
          {[
            { label: 'Stock', value: fmt(product.stockQuantity) },
            { label: 'Unit Price', value: fmtMoney(price(product)) },
            { label: 'Total Value', value: fmtMoney(stockValue(product)) },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-black text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['adjust', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-700'}`}>
              {t === 'adjust' ? '⚡ Adjust Stock' : '📋 Movement History'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'adjust' ? <AdjustForm product={product} onDone={onClose} /> : <MovementHistory productId={product.id} />}
        </div>

        <div className="border-t p-4 bg-gray-50">
          <Link href={`/admin/products/${product.id}/edit`}
            className="flex items-center justify-center gap-2 w-full rounded-xl border py-2.5 text-sm font-semibold hover:bg-white transition-colors">
            <Pencil className="h-4 w-4" /> Edit Product Details
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
type FilterTab = 'all' | 'out' | 'low' | 'ok';
type SortKey = 'stock-asc' | 'stock-desc' | 'value-desc' | 'name' | 'price-desc';

export default function AdminInventoryPage() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('stock-asc');
  const [selected, setSelected] = useState<{ product: InventoryProduct; tab: 'adjust' | 'history' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkQty, setBulkQty] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const qc = useQueryClient();

  const { data: resp, isLoading, refetch } = useQuery({
    queryKey: ['admin-inventory', filter],
    queryFn: () => inventoryApi.getOverview(1, 500, filter === 'all' ? undefined : filter),
  });

  const allProducts: InventoryProduct[] = resp?.data ?? [];
  const meta = resp?.meta;
  const maxStock = useMemo(() => Math.max(...allProducts.map(p => p.stockQuantity), 1), [allProducts]);

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q) || p.category.name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'stock-asc':   list.sort((a, b) => a.stockQuantity - b.stockQuantity); break;
      case 'stock-desc':  list.sort((a, b) => b.stockQuantity - a.stockQuantity); break;
      case 'value-desc':  list.sort((a, b) => stockValue(b) - stockValue(a)); break;
      case 'price-desc':  list.sort((a, b) => price(b) - price(a)); break;
      case 'name':        list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [allProducts, search, sortBy]);

  const totalCount   = meta?.total ?? allProducts.length;
  const outCount     = meta?.outCount ?? allProducts.filter(p => p.stockQuantity === 0).length;
  const lowCount     = meta?.lowCount ?? allProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
  const totalValue   = allProducts.reduce((s, p) => s + stockValue(p), 0);
  const filteredValue = filtered.reduce((s, p) => s + stockValue(p), 0);

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

  const bulkAdjust = useMutation({
    mutationFn: async () => {
      const qty = Number(bulkQty);
      if (!qty) return;
      for (const id of selectedIds) {
        await inventoryApi.adjust({ productId: id, type: 'ADJUSTMENT', quantity: qty });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-inventory'] }); setSelectedIds(new Set()); setShowBulk(false); setBulkQty(''); },
  });

  const FILTER_TABS: { id: FilterTab; label: string; count?: number; color?: string }[] = [
    { id: 'all', label: 'All Products', count: totalCount },
    { id: 'out', label: 'Out of Stock', count: outCount, color: 'bg-red-500' },
    { id: 'low', label: 'Low Stock', count: lowCount, color: 'bg-amber-500' },
    { id: 'ok',  label: 'Well Stocked' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Boxes className="h-7 w-7 text-primary" /> Inventory Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor stock levels, adjust quantities, and track all movements</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => inventoryApi.exportCsv(filtered)}
            className="flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total SKUs" value={fmt(totalCount)} sub="Active products" icon={Package} color="bg-blue-100 text-blue-600" />
        <KpiCard label="Out of Stock" value={fmt(outCount)} sub={outCount > 0 ? 'Needs restocking' : 'All stocked'} icon={X} color={outCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} />
        <KpiCard label="Low Stock" value={fmt(lowCount)} sub="≤10 units left" icon={AlertTriangle} color={lowCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'} />
        <KpiCard label="Total Stock Value" value={fmtMoney(totalValue)} sub="Across all products" icon={DollarSign} color="bg-green-100 text-green-600" />
      </div>

      {/* Category breakdown */}
      {allProducts.length > 0 && (() => {
        const byCategory: Record<string, { count: number; value: number; out: number }> = {};
        allProducts.forEach(p => {
          const cat = p.category.name;
          if (!byCategory[cat]) byCategory[cat] = { count: 0, value: 0, out: 0 };
          byCategory[cat].count++;
          byCategory[cat].value += stockValue(p);
          if (p.stockQuantity === 0) byCategory[cat].out++;
        });
        const cats = Object.entries(byCategory).sort((a, b) => b[1].value - a[1].value);
        return (
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-gray-800">Stock by Category</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {cats.map(([cat, info]) => (
                <div key={cat} className="rounded-xl bg-gray-50 p-3 text-center hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSearch(cat)}>
                  <p className="text-xs font-bold text-gray-600 truncate">{cat}</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5">{info.count}</p>
                  <p className="text-[10px] text-gray-400">{fmtMoney(info.value)}</p>
                  {info.out > 0 && <p className="text-[10px] text-red-500 font-bold">{info.out} out</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl border bg-gray-50 p-1">
          {FILTER_TABS.map(t => (
            <button key={t.id} onClick={() => { setFilter(t.id); setSearch(''); setSelectedIds(new Set()); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${filter === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full ${t.color ?? 'bg-gray-400'} text-white text-[10px] px-1.5 py-0.5 leading-none`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, SKU, category…"
            className="w-full rounded-xl border bg-white pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" /></button>}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="stock-asc">Stock ↑ (Low first)</option>
            <option value="stock-desc">Stock ↓ (High first)</option>
            <option value="value-desc">Value ↓</option>
            <option value="price-desc">Price ↓</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {selectedIds.size > 0 && (
            <button onClick={() => setShowBulk(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all">
              <ShoppingBag className="h-3.5 w-3.5" /> Bulk Adjust ({selectedIds.size})
            </button>
          )}
          <p className="text-xs text-gray-400">{filtered.length} products · {fmtMoney(filteredValue)}</p>
        </div>
      </div>

      {/* Bulk adjust modal */}
      {showBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <h3 className="font-bold text-lg">Bulk Stock Adjustment</h3>
            <p className="text-sm text-gray-500">{selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected</p>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Quantity (+ to add, - to remove)</label>
              <input type="number" value={bulkQty} onChange={e => setBulkQty(e.target.value)} placeholder="e.g. 10 or -5"
                className="w-full rounded-xl border px-3 py-2 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBulk(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={() => bulkAdjust.mutate()} disabled={!bulkQty || bulkAdjust.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                {bulkAdjust.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-400">Loading inventory…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center bg-white">
          <Package className="mb-3 h-14 w-14 text-gray-200" />
          <p className="font-bold text-gray-600">No products found</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Product</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 sm:table-cell">Category</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 md:table-cell">SKU</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Stock</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 lg:table-cell">Value</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 xl:table-cell">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(product => {
                  const lvl = stockLevel(product.stockQuantity);
                  const cfg = LEVEL_CONFIG[lvl];
                  const img = product.images?.[0]?.url;
                  const isChecked = selectedIds.has(product.id);
                  return (
                    <tr key={product.id}
                      className={`hover:bg-primary/[0.02] transition-colors ${cfg.row} ${isChecked ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(product.id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 shadow-sm">
                            {img
                              ? <Image src={img} alt={product.name} width={40} height={40} className="h-full w-full object-cover" unoptimized={img.includes('unsplash')} />
                              : <div className="flex h-full items-center justify-center text-lg">📦</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 line-clamp-1 leading-tight">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{product.category.name}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{product.sku ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800">{fmtMoney(price(product))}</td>
                      <td className="px-4 py-3">
                        <StockBar qty={product.stockQuantity} max={maxStock} />
                      </td>
                      <td className="hidden px-4 py-3 font-semibold text-gray-600 lg:table-cell">{fmtMoney(stockValue(product))}</td>
                      <td className="hidden px-4 py-3 xl:table-cell"><StockBadge qty={product.stockQuantity} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelected({ product, tab: 'adjust' })}
                            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all">
                            <Plus className="h-3.5 w-3.5" /> Adjust
                          </button>
                          <button onClick={() => setSelected({ product, tab: 'history' })}
                            className="rounded-lg border px-2 py-1.5 text-xs hover:bg-gray-50 transition-colors" title="View history">
                            <History className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t px-5 py-3 bg-gray-50 text-xs text-gray-500">
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{totalCount}</strong> products
              {selectedIds.size > 0 && <span className="ml-2 text-primary font-bold">· {selectedIds.size} selected</span>}
            </span>
            <span className="font-bold text-gray-700">Visible Value: {fmtMoney(filteredValue)}</span>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {selected && (
        <ProductSlideOver
          product={selected.product}
          defaultTab={selected.tab}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
