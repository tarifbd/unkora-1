'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, TrendingDown, CheckCircle2, Search, X,
  Download, Loader2, Filter, Minus, Plus, BarChart3, RefreshCw,
  Boxes, DollarSign, Truck, Bell, Warehouse, Users, ShoppingCart,
  ArrowRight, Activity,
} from 'lucide-react';
import { inventoryApi, type InventoryProduct, type DashboardStats } from '@/lib/api/inventory';

const fmt = (n: number) => n.toLocaleString('en-BD');
const fmtMoney = (n: number) => '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const price = (p: InventoryProduct) => Number(p.salePrice ?? p.basePrice);
const stockValue = (p: InventoryProduct) => price(p) * p.stockQuantity;

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
  critical: { label: 'Critical',     bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-400', row: 'bg-orange-50/30' },
  low:      { label: 'Low',          bg: 'bg-yellow-50', text: 'text-yellow-600', bar: 'bg-yellow-400', row: 'bg-yellow-50/20' },
  ok:       { label: 'OK',           bg: 'bg-blue-50',   text: 'text-blue-600',   bar: 'bg-blue-400',   row: '' },
  good:     { label: 'Good',         bg: 'bg-green-50',  text: 'text-green-600',  bar: 'bg-green-400',  row: '' },
};

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  PURCHASE: 'Purchase', SALE: 'Sale', RETURN: 'Return',
  ADJUSTMENT_IN: 'Adjust In', ADJUSTMENT_OUT: 'Adjust Out',
  TRANSFER_IN: 'Transfer In', TRANSFER_OUT: 'Transfer Out',
  DAMAGE: 'Damage', RESERVED: 'Reserved', RESERVATION_RELEASED: 'Released',
  RESERVATION_CONFIRMED: 'Confirmed', INITIAL_STOCK: 'Initial', CORRECTION: 'Correction', EXPIRED: 'Expired',
};

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [adjProduct, setAdjProduct] = useState<InventoryProduct | null>(null);
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjNote, setAdjNote] = useState('');

  const { data: overview, isLoading } = useQuery({
    queryKey: ['inventory', filter],
    queryFn: () => inventoryApi.getOverview(1, 500, filter || undefined),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: () => inventoryApi.getDashboard(),
  });

  const adjustMutation = useMutation({
    mutationFn: (v: { productId: string; delta: number; note: string }) =>
      inventoryApi.adjust({ productId: v.productId, type: v.delta >= 0 ? 'PURCHASE' : 'ADJUSTMENT', quantity: v.delta, note: v.note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      setAdjProduct(null);
      setAdjDelta(0);
      setAdjNote('');
    },
  });

  const products = useMemo(() => {
    if (!overview?.data) return [];
    const q = search.trim().toLowerCase();
    return q ? overview.data.filter(p => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)) : overview.data;
  }, [overview?.data, search]);

  const totalValue = useMemo(() => products.reduce((s, p) => s + stockValue(p), 0), [products]);
  const stats = overview?.meta;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stock levels, movements, adjustments & purchase orders</p>
        </div>
        <button
          onClick={() => inventoryApi.exportCsv(products)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/inventory/stocks',          icon: Boxes,       label: 'Stocks',           color: 'text-blue-600',   bg: 'bg-blue-50',   desc: 'View all stock levels' },
          { href: '/admin/inventory/movements',       icon: Activity,    label: 'Movements',        color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Ledger of all changes' },
          { href: '/admin/inventory/adjustments',     icon: RefreshCw,   label: 'Adjustments',      color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Manual adjustments' },
          { href: '/admin/inventory/alerts',          icon: Bell,        label: 'Alerts',           color: 'text-red-600',    bg: 'bg-red-50',    desc: `${dashboard?.pendingAlerts ?? 0} pending` },
          { href: '/admin/inventory/warehouses',      icon: Warehouse,   label: 'Warehouses',       color: 'text-green-600',  bg: 'bg-green-50',  desc: 'Manage locations' },
          { href: '/admin/inventory/suppliers',       icon: Users,       label: 'Suppliers',        color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Vendor management' },
          { href: '/admin/inventory/purchase-orders', icon: ShoppingCart,label: 'Purchase Orders',  color: 'text-teal-600',   bg: 'bg-teal-50',   desc: `${dashboard?.pendingPurchaseOrders ?? 0} pending` },
          { href: '/admin/inventory',                 icon: BarChart3,   label: 'Stock Table',      color: 'text-gray-600',   bg: 'bg-gray-100',  desc: 'Quick adjustment view' },
        ].map(card => (
          <Link key={card.href + card.label} href={card.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow group">
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="font-bold text-gray-800 text-sm">{card.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Products', value: fmt(stats.total),    icon: Package,     color: 'bg-blue-100 text-blue-600' },
            { label: 'Out of Stock',   value: fmt(stats.outCount), icon: AlertTriangle,color: 'bg-red-100 text-red-600' },
            { label: 'Low Stock',      value: fmt(stats.lowCount), icon: TrendingDown, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Total Value',    value: fmtMoney(totalValue),icon: DollarSign,   color: 'bg-green-100 text-green-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">{s.label}</span>
                <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Movements */}
      {dashboard?.recentMovements && dashboard.recentMovements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-gray-900">Recent Movements</h2>
            <Link href="/admin/inventory/movements" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {dashboard.recentMovements.slice(0, 6).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.quantity > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{m.product?.name}</p>
                  <p className="text-xs text-gray-400">{m.warehouse?.name} · {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}</p>
                </div>
                <span className={`text-sm font-black ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="bg-transparent text-sm flex-1 outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
          <div className="flex gap-1">
            {[['', 'All'], ['out', 'Out'], ['low', 'Low'], ['ok', 'OK']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v ?? '')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === v ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['inventory'] })} className="p-2 rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs">Product</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Stock</th>
                  <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs">Status</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs">Value</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => {
                  const lvl = stockLevel(p.stockQuantity);
                  const cfg = LEVEL_CONFIG[lvl];
                  const img = p.images?.[0]?.url;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${cfg.row}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                            {img
                              ? <Image src={img} alt={p.name} width={36} height={36} className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-gray-300 m-2.5" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.sku ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-gray-900 text-base">{fmt(p.stockQuantity)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-700">{fmtMoney(stockValue(p))}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setAdjProduct(p); setAdjDelta(0); setAdjNote(''); }}
                          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline ml-auto"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust modal */}
      {adjProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Adjust Stock</h3>
              <button onClick={() => setAdjProduct(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-bold text-gray-800 mb-0.5">{adjProduct.name}</p>
            <p className="text-xs text-gray-400 mb-4">Current stock: {adjProduct.stockQuantity}</p>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setAdjDelta(d => d - 1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={adjDelta}
                onChange={e => setAdjDelta(Number(e.target.value))}
                className="flex-1 text-center text-xl font-black border border-gray-200 rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button onClick={() => setAdjDelta(d => d + 1)} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <input
              value={adjNote}
              onChange={e => setAdjNote(e.target.value)}
              placeholder="Note (optional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <button onClick={() => setAdjProduct(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => adjustMutation.mutate({ productId: adjProduct.id, delta: adjDelta, note: adjNote })}
                disabled={adjDelta === 0 || adjustMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
              >
                {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
