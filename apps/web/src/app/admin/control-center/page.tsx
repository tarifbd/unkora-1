'use client';

// Unified Control Center — every pending action and key metric in one place,
// with customizable, reorderable widgets (saved per-browser).
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertTriangle, ShoppingCart, Package, Clock, TrendingUp, Users, ShoppingBag,
  ArrowRight, ChevronRight, Settings2, Eye, EyeOff, GripVertical, RotateCcw, Loader2, Check,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';

const LS_KEY = 'admin-control-center-layout';

type WidgetId = 'attention' | 'revenue' | 'orders-status' | 'recent-orders' | 'top-products' | 'customers';

const DEFAULT_ORDER: WidgetId[] = ['attention', 'revenue', 'orders-status', 'recent-orders', 'top-products', 'customers'];

const WIDGET_META: Record<WidgetId, { title: string; subtitle: string }> = {
  'attention':     { title: 'Needs Attention', subtitle: 'Action queue across the store' },
  'revenue':       { title: 'Revenue', subtitle: 'Earnings at a glance' },
  'orders-status': { title: 'Orders by Status', subtitle: 'Pipeline breakdown' },
  'recent-orders': { title: 'Recent Orders', subtitle: 'Latest activity' },
  'top-products':  { title: 'Top Products', subtitle: 'Best sellers' },
  'customers':     { title: 'Customers', subtitle: 'Base & growth' },
};

type Layout = { order: WidgetId[]; hidden: WidgetId[] };

function loadLayout(): Layout {
  if (typeof window === 'undefined') return { order: DEFAULT_ORDER, hidden: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
    if (!raw) return { order: DEFAULT_ORDER, hidden: [] };
    // merge any new widgets added since the user last saved
    const order: WidgetId[] = [...(raw.order ?? []), ...DEFAULT_ORDER.filter((w) => !(raw.order ?? []).includes(w))];
    return { order, hidden: raw.hidden ?? [] };
  } catch { return { order: DEFAULT_ORDER, hidden: [] }; }
}

function num(v: unknown): number { return typeof v === 'number' ? v : Number(v ?? 0); }

export default function ControlCenterPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const [layout, setLayout] = useState<Layout>({ order: DEFAULT_ORDER, hidden: [] });
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);

  useEffect(() => { setLayout(loadLayout()); }, []);

  const persist = useCallback((next: Layout) => {
    setLayout(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const toggleHidden = (id: WidgetId) => {
    const hidden = layout.hidden.includes(id)
      ? layout.hidden.filter((h) => h !== id)
      : [...layout.hidden, id];
    persist({ ...layout, hidden });
  };

  const onDrop = (target: WidgetId) => {
    if (!dragId || dragId === target) return;
    const order = [...layout.order];
    const from = order.indexOf(dragId);
    const to = order.indexOf(target);
    order.splice(from, 1);
    order.splice(to, 0, dragId);
    persist({ ...layout, order });
    setDragId(null);
  };

  const reset = () => persist({ order: DEFAULT_ORDER, hidden: [] });

  // ── Derived action items ──────────────────────────────────────────────
  const pendingOrders = num(stats?.orders?.pending);
  const lowStock = num(stats?.products?.lowStock);
  const abandoned = num(stats?.orders?.abandonedCarts);

  const actionItems = useMemo(() => [
    { label: 'Pending Orders', value: pendingOrders, href: '/admin/orders?status=PENDING', icon: Clock, color: '#d97706', bg: '#fffbeb', urgent: pendingOrders > 0 },
    { label: 'Low Stock Items', value: lowStock, href: '/admin/inventory/low-stock-alerts', icon: Package, color: '#dc2626', bg: '#fef2f2', urgent: lowStock > 0 },
    { label: 'Abandoned Carts', value: abandoned, href: '/admin/orders/incomplete', icon: ShoppingCart, color: '#7c3aed', bg: '#f5f3ff', urgent: abandoned > 0 },
  ], [pendingOrders, lowStock, abandoned]);

  const totalAttention = pendingOrders + lowStock + abandoned;

  const visible = layout.order.filter((id) => !layout.hidden.includes(id));

  // ── Widget renderers ──────────────────────────────────────────────────
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'attention':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actionItems.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href}
                  className="rounded-xl border p-4 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 group"
                  style={{ background: a.bg }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.color + '22' }}>
                    <Icon className="h-5 w-5" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-black" style={{ color: a.color }}>{a.value}</p>
                    <p className="text-xs font-semibold text-gray-600 truncate">{a.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        );
      case 'revenue': {
        const cells = [
          { label: 'Total Revenue', value: formatCurrency(num(stats?.revenue?.total)), color: '#059669' },
          { label: 'This Month', value: formatCurrency(num(stats?.revenue?.thisMonth)), color: '#4f46e5' },
          { label: 'Today', value: formatCurrency(num(stats?.revenue?.today)), color: '#db2777' },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cells.map((c) => (
              <div key={c.label} className="rounded-xl border bg-white p-4">
                <p className="text-xs font-medium text-gray-500">{c.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        );
      }
      case 'orders-status': {
        const byStatus = stats?.orders?.byStatus ?? {};
        const entries = Object.entries(byStatus);
        const total = entries.reduce((s, [, v]) => s + num(v), 0) || 1;
        return (
          <div className="rounded-xl border bg-white p-4 space-y-2.5">
            {entries.length === 0 ? <p className="text-sm text-gray-400">No order data.</p> : entries.map(([status, count]) => (
              <div key={status} className="flex items-center gap-3 text-sm">
                <span className="w-32 text-gray-600 capitalize truncate">{status.toLowerCase().replace(/_/g, ' ')}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(num(count) / total) * 100}%` }} />
                </div>
                <span className="w-10 text-right font-bold text-gray-800">{num(count)}</span>
              </div>
            ))}
          </div>
        );
      }
      case 'recent-orders':
        return (
          <div className="rounded-xl border bg-white divide-y">
            {(stats?.recentOrders ?? []).slice(0, 6).map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <ShoppingBag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-sm text-gray-700">#{o.orderNumber}</span>
                <span className="text-xs text-gray-500 flex-1 truncate">{o.user?.firstName} {o.user?.lastName}</span>
                <span className="text-[11px] font-bold uppercase text-gray-400">{o.status}</span>
                <span className="text-sm font-black text-gray-800">{formatCurrency(num(o.total))}</span>
              </Link>
            ))}
            {(stats?.recentOrders ?? []).length === 0 && <p className="px-4 py-6 text-sm text-gray-400">No recent orders.</p>}
          </div>
        );
      case 'top-products':
        return (
          <div className="rounded-xl border bg-white divide-y">
            {(stats?.topProducts ?? []).slice(0, 6).map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{p.productName}</span>
                <span className="text-xs text-gray-500">{num(p._sum?.quantity)} sold</span>
                <span className="text-sm font-black text-gray-800">{formatCurrency(num(p._sum?.totalPrice))}</span>
              </div>
            ))}
            {(stats?.topProducts ?? []).length === 0 && <p className="px-4 py-6 text-sm text-gray-400">No sales data.</p>}
          </div>
        );
      case 'customers': {
        const cells = [
          { label: 'Total Customers', value: num(stats?.customers?.total), icon: Users, color: '#0891b2' },
          { label: 'New This Month', value: num(stats?.customers?.newThisMonth), icon: TrendingUp, color: '#16a34a' },
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {cells.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.color + '18' }}>
                    <Icon className="h-5 w-5" style={{ color: c.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-800">{c.value}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            Control Center
            {totalAttention > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-bold">
                <AlertTriangle className="h-3 w-3" /> {totalAttention} need action
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Everything that needs you, in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
          <button onClick={() => setEditing((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              editing ? 'bg-indigo-600 text-white' : 'border text-gray-600 hover:bg-gray-50'
            }`}>
            {editing ? <><Check className="h-3.5 w-3.5" /> Done</> : <><Settings2 className="h-3.5 w-3.5" /> Customize</>}
          </button>
        </div>
      </div>

      {/* Hidden widgets tray (edit mode) */}
      {editing && layout.hidden.length > 0 && (
        <div className="rounded-xl border border-dashed bg-gray-50 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Hidden widgets — click to restore</p>
          <div className="flex flex-wrap gap-2">
            {layout.hidden.map((id) => (
              <button key={id} onClick={() => toggleHidden(id)}
                className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                <Eye className="h-3 w-3" /> {WIDGET_META[id].title}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((id) => (
            <section
              key={id}
              draggable={editing}
              onDragStart={() => setDragId(id)}
              onDragOver={(e) => editing && e.preventDefault()}
              onDrop={() => onDrop(id)}
              className={`rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden ${
                editing ? 'ring-2 ring-dashed ring-indigo-200 cursor-move' : ''
              } ${dragId === id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  {editing && <GripVertical className="h-4 w-4 text-gray-300" />}
                  <div>
                    <p className="font-bold text-sm text-gray-800">{WIDGET_META[id].title}</p>
                    <p className="text-[11px] text-gray-400">{WIDGET_META[id].subtitle}</p>
                  </div>
                </div>
                {editing ? (
                  <button onClick={() => toggleHidden(id)} title="Hide widget"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <EyeOff className="h-4 w-4" />
                  </button>
                ) : (
                  id === 'attention' && totalAttention > 0 && (
                    <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      Manage <ArrowRight className="h-3 w-3" />
                    </Link>
                  )
                )}
              </div>
              <div className="p-4">{renderWidget(id)}</div>
            </section>
          ))}
          {visible.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-gray-400">
              All widgets hidden. Click <span className="font-semibold">Customize</span> to restore them.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
