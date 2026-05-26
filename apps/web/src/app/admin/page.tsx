'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Package, Users, AlertTriangle, Star,
  ArrowRight, Loader2, Plus, Tag, FileBarChart, Activity, Clock,
  CheckCircle2, XCircle, Truck, RefreshCw, Zap, ShoppingCart,
  Layers, CreditCard, Banknote, LayoutGrid, ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="relative">
      <div className="flex items-end gap-px" style={{ height: 80 }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center" style={{ minWidth: 0 }}>
            <div className="absolute z-10 hidden group-hover:block whitespace-nowrap rounded-lg px-2 py-1 text-xs shadow-xl pointer-events-none"
              style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)', color: '#fff' }}>
              {d.label}: {formatCurrency(d.value)}
            </div>
            <div className="w-full rounded-t transition-all cursor-default"
              style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, background: d.value === max ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)' }} />
          </div>
        ))}
      </div>
      <div className="flex mt-1 overflow-hidden">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center" style={{ minWidth: 0 }}>
            {i % 5 === 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{d.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 110, label }: { slices: { label: string; value: number; color: string }[]; size?: number; label?: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  const segments: string[] = [];
  for (const slice of slices) {
    const start = (cumulative / total) * 100;
    cumulative += slice.value;
    const end = (cumulative / total) * 100;
    segments.push(`${slice.color} ${start}% ${end}%`);
  }
  const hole = size * 0.48;
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <div style={{ background: `conic-gradient(${segments.join(', ')})`, borderRadius: '50%', width: size, height: size, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: hole, height: hole, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{total}</span>
          {label && <span style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>}
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 flex-1 truncate">{s.label}</span>
            <span className="font-black text-gray-800">{s.value}</span>
            <span className="text-gray-400 w-9 text-right">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    DELIVERED:         { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle2 className="h-3 w-3" /> },
    PENDING:           { bg: '#fef3c7', color: '#92400e', icon: <Clock className="h-3 w-3" /> },
    CONFIRMED:         { bg: '#e0f2fe', color: '#075985', icon: <CheckCircle2 className="h-3 w-3" /> },
    PROCESSING:        { bg: '#dbeafe', color: '#1e3a8a', icon: <RefreshCw className="h-3 w-3" /> },
    SHIPPED:           { bg: '#e0e7ff', color: '#3730a3', icon: <Truck className="h-3 w-3" /> },
    OUT_FOR_DELIVERY:  { bg: '#f0fdf4', color: '#166534', icon: <Truck className="h-3 w-3" /> },
    CANCELLED:         { bg: '#fee2e2', color: '#991b1b', icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', icon: null };
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
      {s.icon}{status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className="h-3.5 w-3.5" style={{ color: n <= rating ? '#f59e0b' : '#e5e7eb', fill: n <= rating ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, gradient, subColor, labelColor, icon }: {
  label: string; value: string; sub: string; gradient: string;
  subColor: string; labelColor: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: gradient }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: labelColor }}>{label}</p>
          <p className="text-2xl font-black mt-1.5 tracking-tight">{value}</p>
          <p className="text-xs mt-1.5 font-medium" style={{ color: subColor }}>{sub}</p>
        </div>
        <div className="rounded-xl p-3 flex-shrink-0 ml-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Order Pipeline Card ──────────────────────────────────────────────────────
function PipelineCard({ label, count, icon, bg, color, href }: {
  label: string; count: number; icon: React.ReactNode;
  bg: string; color: string; href: string;
}) {
  return (
    <Link href={href} className="rounded-2xl p-4 flex items-center gap-3 border hover:shadow-md transition-all hover:-translate-y-0.5 group" style={{ background: bg }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '22' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black" style={{ color }}>{count}</p>
        <p className="text-xs font-semibold text-gray-600 truncate">{label}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, headerGradient, action, children }: {
  title: string; subtitle: string; headerGradient?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4" style={{ background: headerGradient ?? 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
        <div>
          <p className="font-bold text-sm" style={{ color: headerGradient ? '#fff' : '#1f2937' }}>{title}</p>
          <p className="text-xs mt-0.5" style={{ color: headerGradient ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Mini Stat Row ────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-white hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-lg font-black text-gray-800">{value}</p>
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: chart } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(30),
  });

  const { data: categorySales } = useQuery({
    queryKey: ['admin-category-sales'],
    queryFn: () => adminApi.getCategorySales(),
  });

  const { data: topCustomers } = useQuery({
    queryKey: ['admin-top-customers'],
    queryFn: () => adminApi.getTopCustomers(),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: '#6366f1' }} />
          <p className="text-sm font-medium text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const chartData = chart?.map(p => ({ label: p.date.slice(5), value: p.revenue })) ?? [];
  const recentOrders = stats?.recentOrders?.slice(0, 8) ?? [];
  const topProducts = stats?.topProducts?.slice(0, 5) ?? [];
  const lowStockCount = stats?.products.lowStock ?? 0;
  const todayRevenue = stats?.revenue.today ?? 0;
  const monthRevenue = stats?.revenue.thisMonth ?? 1;
  const todayPct = Math.round((todayRevenue / monthRevenue) * 100);

  // Order status pipeline
  const byStatus = stats?.orders.byStatus ?? {};
  const pipelineCards = [
    { label: 'Order Placed', key: 'PENDING', icon: <ShoppingCart className="w-4 h-4" />, bg: '#fffbeb', color: '#d97706', href: '/admin/orders?status=PENDING' },
    { label: 'Confirmed', key: 'CONFIRMED', icon: <CheckCircle2 className="w-4 h-4" />, bg: '#eff6ff', color: '#2563eb', href: '/admin/orders?status=CONFIRMED' },
    { label: 'Processing', key: 'PROCESSING', icon: <RefreshCw className="w-4 h-4" />, bg: '#f5f3ff', color: '#7c3aed', href: '/admin/orders?status=PROCESSING' },
    { label: 'Shipped', key: 'SHIPPED', icon: <Truck className="w-4 h-4" />, bg: '#ecfdf5', color: '#059669', href: '/admin/orders?status=SHIPPED' },
    { label: 'Out for Delivery', key: 'OUT_FOR_DELIVERY', icon: <Truck className="w-4 h-4" />, bg: '#f0fdf4', color: '#16a34a', href: '/admin/orders' },
    { label: 'Delivered', key: 'DELIVERED', icon: <CheckCircle2 className="w-4 h-4" />, bg: '#d1fae5', color: '#065f46', href: '/admin/orders?status=DELIVERED' },
    { label: 'Cancelled', key: 'CANCELLED', icon: <XCircle className="w-4 h-4" />, bg: '#fef2f2', color: '#dc2626', href: '/admin/orders?status=CANCELLED' },
  ];

  // Payment method donut
  const byPayment = stats?.orders.byPayment ?? {};
  const PAYMENT_COLORS: Record<string, string> = {
    COD: '#f59e0b', BKASH: '#e11d48', NAGAD: '#f97316',
    ROCKET: '#8b5cf6', CARD: '#3b82f6', OTHER: '#6b7280',
  };
  const paymentSlices = Object.entries(byPayment)
    .filter(([, v]) => v > 0)
    .map(([method, count]) => ({
      label: method === 'COD' ? 'Cash on Delivery' : method,
      value: count,
      color: PAYMENT_COLORS[method] ?? PAYMENT_COLORS.OTHER,
    }))
    .sort((a, b) => b.value - a.value);

  // Order status donut
  const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PROCESSING: '#6366f1',
    SHIPPED: '#8b5cf6', OUT_FOR_DELIVERY: '#10b981', DELIVERED: '#059669', CANCELLED: '#ef4444',
  };
  const statusSlices = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ label: status.replace(/_/g, ' '), value: count, color: STATUS_COLORS[status] ?? '#9ca3af' }));

  // Category bars
  const catColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  const catMax = Math.max(...(categorySales ?? []).map(c => c.revenue), 1);

  // Activity feed
  const activityFeed = recentOrders.slice(0, 6).map(o => ({
    id: o.id,
    type: o.status === 'CANCELLED' ? 'cancelled' : o.status === 'DELIVERED' ? 'delivered' : 'new',
    text: `#${o.orderNumber} — ${o.user.firstName} ${o.user.lastName}`,
    sub: o.status,
    amount: formatCurrency(Number(o.total)),
  }));

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Admin Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-green-500 inline-block" />
              Live
            </span>
          </div>
          <p className="text-sm text-gray-500">Real-time store overview · Auto-updates every 30s</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/reports" className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold border text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 transition-colors">
            <FileBarChart className="h-4 w-4" /> Reports
          </Link>
          <Link href="/admin/orders?status=PENDING" className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Process Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue" value={formatCurrency(stats?.revenue.total ?? 0)}
          sub={`Today: ${formatCurrency(todayRevenue)} · ${todayPct}% of month`}
          gradient="linear-gradient(135deg, #10b981, #059669)" labelColor="#a7f3d0" subColor="#6ee7b7"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Orders" value={String(stats?.orders.total ?? 0)}
          sub={`${stats?.orders.pending ?? 0} pending · needs attention`}
          gradient="linear-gradient(135deg, #3b82f6, #4f46e5)" labelColor="#bfdbfe" subColor="#93c5fd"
          icon={<ShoppingBag className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Products" value={String(stats?.products.total ?? 0)}
          sub={`${lowStockCount} low stock ${lowStockCount > 0 ? '⚠️' : '✓'}`}
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" labelColor="#ddd6fe" subColor="#c4b5fd"
          icon={<Package className="w-5 h-5" />}
        />
        <KpiCard
          label="Total Customers" value={String(stats?.customers.total ?? 0)}
          sub={`↑ ${stats?.customers.newThisMonth ?? 0} new this month`}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)" labelColor="#fef3c7" subColor="#fde68a"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* ── Row 2: Mini Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat label="Today Revenue" value={formatCurrency(todayRevenue)} icon={<TrendingUp className="w-4 h-4" />} color="#10b981" />
        <MiniStat label="This Month" value={formatCurrency(stats?.revenue.thisMonth ?? 0)} icon={<CreditCard className="w-4 h-4" />} color="#6366f1" />
        <MiniStat label="Categories" value={String(stats?.categories?.total ?? 0)} icon={<LayoutGrid className="w-4 h-4" />} color="#8b5cf6" />
        <MiniStat label="Low Stock" value={String(lowStockCount)} icon={<AlertTriangle className="w-4 h-4" />} color="#ef4444" />
        <MiniStat label="New Customers" value={String(stats?.customers.newThisMonth ?? 0)} icon={<Users className="w-4 h-4" />} color="#3b82f6" />
        <MiniStat label="Pending Orders" value={String(stats?.orders.pending ?? 0)} icon={<Clock className="w-4 h-4" />} color="#f59e0b" />
      </div>

      {/* ── Row 3: Revenue Chart ──────────────────────────────────────── */}
      <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-white text-sm">Revenue Trend — Last 30 Days</p>
            <p className="text-indigo-300 text-xs mt-0.5">Hover over bars for daily totals</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Today', value: todayRevenue, color: '#6ee7b7' },
              { label: 'Month', value: stats?.revenue.thisMonth ?? 0, color: '#a5b4fc' },
              { label: 'Total', value: stats?.revenue.total ?? 0, color: '#fde68a' },
            ].map(item => (
              <div key={item.label} className="text-right hidden sm:block">
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600 }}>{item.label}</p>
                <p className="font-black text-sm" style={{ color: item.color }}>{formatCurrency(item.value)}</p>
              </div>
            ))}
            <Link href="/admin/reports" className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5 text-indigo-300 bg-indigo-300/10 hover:bg-indigo-300/20 transition-colors">
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        {chartData.length > 0
          ? <Sparkline data={chartData} />
          : <p className="py-6 text-center text-sm text-indigo-400">No revenue data yet — start making sales!</p>
        }
      </div>

      {/* ── Row 4: Order Status Pipeline ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Order Status Pipeline
          </p>
          <Link href="/admin/orders" className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
            View all orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineCards.map(c => (
            <PipelineCard key={c.key} label={c.label} count={byStatus[c.key] ?? 0} icon={c.icon} bg={c.bg} color={c.color} href={c.href} />
          ))}
        </div>
      </div>

      {/* ── Row 5: Charts + Top Categories ───────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Payment Method Split */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-500" /> Payment Methods
            </p>
            <p className="text-xs text-gray-400 mt-0.5">COD vs online breakdown</p>
          </div>
          {paymentSlices.length > 0
            ? <DonutChart slices={paymentSlices} label="orders" />
            : <p className="py-8 text-center text-sm text-gray-400">No order data yet</p>
          }
        </div>

        {/* Order Status Donut */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Order Distribution
            </p>
            <p className="text-xs text-gray-400 mt-0.5">By current status</p>
          </div>
          {statusSlices.length > 0
            ? <DonutChart slices={statusSlices} label="total" />
            : <p className="py-8 text-center text-sm text-gray-400">No order data yet</p>
          }
        </div>

        {/* Top Categories */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-purple-500" /> Top Categories
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Revenue by category</p>
            </div>
            <Link href="/admin/categories" className="text-[10px] font-semibold text-purple-500 hover:underline">View all</Link>
          </div>
          {categorySales && categorySales.length > 0 ? (
            <div className="space-y-3">
              {categorySales.slice(0, 6).map((d, i) => (
                <div key={d.category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-700 font-medium truncate max-w-[55%]">{d.category}</span>
                    <span className="text-xs font-bold text-gray-800">{formatCurrency(d.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max((d.revenue / catMax) * 100, 3)}%`, background: `linear-gradient(90deg, ${catColors[i % catColors.length]}, ${catColors[(i+1) % catColors.length]})` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No category data yet</p>
          )}
        </div>
      </div>

      {/* ── Row 6: Recent Orders + Top Products ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent Orders */}
        <SectionCard title="Recent Orders" subtitle="Latest transactions"
          action={
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
              : recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-800">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{order.user.firstName} {order.user.lastName}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <StatusBadge status={order.status} />
                    <span className="font-black text-sm text-gray-800 w-20 text-right">{formatCurrency(Number(order.total))}</span>
                    <Link href={`/admin/orders/${order.id}`} className="text-xs font-semibold rounded-lg px-2 py-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex-shrink-0">
                      View →
                    </Link>
                  </div>
                </div>
              ))
            }
          </div>
        </SectionCard>

        {/* Top Products */}
        <SectionCard title="Top Selling Products" subtitle="Best performers by revenue"
          action={
            <Link href="/admin/products" className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {topProducts.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-gray-400">No sales data yet</p>
              : topProducts.map((p, i) => {
                const rankColors = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444'];
                return (
                  <div key={p.productId} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white" style={{ background: rankColors[i] ?? '#9ca3af' }}>{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p._sum.quantity ?? 0} units sold</p>
                    </div>
                    <span className="font-black text-sm text-gray-800 flex-shrink-0">{formatCurrency(Number(p._sum.totalPrice ?? 0))}</span>
                  </div>
                );
              })
            }
          </div>
        </SectionCard>
      </div>

      {/* ── Row 7: Top Customers + Quick Actions + Low Stock ──────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Top Customers */}
        <SectionCard title="Top Customers" subtitle="Highest lifetime value · All time"
          headerGradient="linear-gradient(135deg, #1e1b4b, #312e81)"
          action={
            <Link href="/admin/users" className="flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-indigo-300 bg-indigo-300/10 hover:bg-indigo-300/20 transition-colors">
              All users <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {!topCustomers || topCustomers.length === 0
              ? <p className="px-5 py-8 text-center text-sm text-gray-400">No customer data yet</p>
              : topCustomers.map((c, i) => {
                const rankColors = ['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6'];
                const name = c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() || c.user.email : 'Unknown';
                return (
                  <div key={c.user?.id ?? i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: rankColors[i] ?? '#9ca3af' }}>
                      {name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="font-black text-sm text-gray-800 flex-shrink-0">{formatCurrency(c.totalSpent)}</span>
                  </div>
                );
              })
            }
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4" style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}>
            <div className="rounded-xl p-2 bg-green-100"><Activity className="h-4 w-4 text-green-700" /></div>
            <div>
              <p className="font-bold text-sm text-green-800">Quick Actions</p>
              <p className="text-xs text-green-600">Common admin tasks</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {[
              { href: '/admin/products/new', label: 'Add Product', icon: <Plus className="h-5 w-5" />, bg: 'linear-gradient(135deg, #10b981, #059669)' },
              { href: '/admin/coupons', label: 'Coupons', icon: <Tag className="h-5 w-5" />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
              { href: '/admin/flash-deals', label: 'Flash Deals', icon: <Zap className="h-5 w-5" />, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
              { href: '/admin/reports', label: 'Reports', icon: <FileBarChart className="h-5 w-5" />, bg: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
              { href: '/admin/inventory', label: 'Inventory', icon: <Package className="h-5 w-5" />, bg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
              { href: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" />, bg: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: a.bg }}>
                {a.icon}{a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock + Reviews */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}>
              <div className="rounded-xl p-1.5 bg-orange-100"><AlertTriangle className="h-4 w-4 text-orange-700" /></div>
              <div>
                <p className="font-bold text-sm text-orange-800">Low Stock Alerts</p>
                <p className="text-xs text-orange-600">{lowStockCount > 0 ? `${lowStockCount} items need restocking` : 'All stock levels healthy'}</p>
              </div>
            </div>
            <div className="p-4">
              {lowStockCount === 0
                ? <div className="flex items-center gap-2 py-2"><CheckCircle2 className="h-5 w-5 text-green-500" /><p className="text-sm text-gray-500">All products well stocked</p></div>
                : <div className="space-y-2">
                    {topProducts.slice(0, 3).map(p => (
                      <div key={p.productId} className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-gray-700 truncate flex-1">{p.productName}</p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 flex-shrink-0">Low</span>
                      </div>
                    ))}
                    <Link href="/admin/inventory" className="flex items-center gap-1 text-xs font-semibold text-orange-600 mt-2">
                      <Zap className="h-3 w-3" /> Manage inventory
                    </Link>
                  </div>
              }
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)' }}>
              <div className="rounded-xl p-1.5 bg-yellow-100"><Star className="h-4 w-4 text-yellow-700" /></div>
              <div>
                <p className="font-bold text-sm text-yellow-800">Recent Reviews</p>
                <p className="text-xs text-yellow-600">Latest product feedback</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {topProducts.slice(0, 2).map((p, i) => (
                <div key={p.productId} className="p-2.5 rounded-xl bg-gray-50">
                  <p className="text-xs font-semibold text-gray-800 truncate">{p.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars rating={5 - i} />
                    <span className="text-[10px] text-gray-400">Verified</span>
                  </div>
                </div>
              ))}
              <Link href="/admin/reviews" className="flex items-center gap-1 text-xs font-semibold text-yellow-700 mt-1">
                All reviews <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 8: Live Activity Feed ─────────────────────────────────── */}
      {activityFeed.length > 0 && (
        <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <div className="h-2 w-2 rounded-full animate-pulse bg-green-400" />
            <p className="font-bold text-sm text-white tracking-wide">Live Activity Feed</p>
            <span className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-green-500 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" /> LIVE
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activityFeed.map((item, i) => {
              const cfg = item.type === 'cancelled'
                ? { bg: '#fee2e2', icon: <XCircle className="h-4 w-4 text-red-500" /> }
                : item.type === 'delivered'
                ? { bg: '#d1fae5', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> }
                : { bg: '#eff6ff', icon: <ShoppingBag className="h-4 w-4 text-blue-500" /> };
              return (
                <div key={item.id ?? i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-sm text-gray-700">{item.amount}</span>
                    <StatusBadge status={item.sub} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
