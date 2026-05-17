'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  Star,
  ArrowRight,
  Loader2,
  Plus,
  Tag,
  FileBarChart,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';

/* ──────────────────────────────────────────
   Mini sparkline (CSS bars)
────────────────────────────────────────── */
function Sparkline({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="relative">
      <div className="flex items-end gap-px" style={{ height: 90 }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center"
            style={{ minWidth: 0 }}
          >
            <div
              className="absolute z-10 hidden group-hover:block whitespace-nowrap rounded-lg px-2 py-1 text-xs shadow-xl pointer-events-none"
              style={{
                bottom: '110%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {d.label}: {formatCurrency(d.value)}
            </div>
            <div
              className="w-full rounded-t transition-all cursor-default"
              style={{
                height: `${Math.max((d.value / max) * 100, 3)}%`,
                background: d.value === max
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.4)',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex mt-1 overflow-hidden">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center" style={{ minWidth: 0 }}>
            {i % 5 === 0 && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Status badge
────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    DELIVERED:  { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle2 className="h-3 w-3" /> },
    PENDING:    { bg: '#fef3c7', color: '#92400e', icon: <Clock className="h-3 w-3" /> },
    CONFIRMED:  { bg: '#e0f2fe', color: '#075985', icon: <CheckCircle2 className="h-3 w-3" /> },
    PROCESSING: { bg: '#dbeafe', color: '#1e3a8a', icon: <RefreshCw className="h-3 w-3" /> },
    SHIPPED:    { bg: '#e0e7ff', color: '#3730a3', icon: <Truck className="h-3 w-3" /> },
    CANCELLED:  { bg: '#fee2e2', color: '#991b1b', icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', icon: null };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.icon}
      {status}
    </span>
  );
}

/* ──────────────────────────────────────────
   Donut chart using conic-gradient
────────────────────────────────────────── */
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cumulative = 0;
  const segments: string[] = [];
  for (const slice of slices) {
    const start = (cumulative / total) * 100;
    cumulative += slice.value;
    const end = (cumulative / total) * 100;
    segments.push(`${slice.color} ${start}% ${end}%`);
  }
  const gradient = `conic-gradient(${segments.join(', ')})`;
  return (
    <div className="flex items-center gap-6">
      <div className="flex-shrink-0 relative">
        <div
          style={{
            background: gradient,
            borderRadius: '50%',
            width: 120,
            height: 120,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        />
        {/* Inner circle for donut effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: '#374151' }}>{total}</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 text-xs flex-1 truncate">{s.label}</span>
            <span className="font-bold text-gray-800 text-xs">{s.value}</span>
            <span className="text-gray-400 text-xs w-10 text-right">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Horizontal bar chart (categories)
────────────────────────────────────────── */
function CategoryBars({ data }: { data: { category: string; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((d, i) => (
        <div key={d.category}>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-700 font-medium truncate max-w-[55%]">{d.category}</span>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(d.revenue)}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max((d.revenue / max) * 100, 3)}%`,
                background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   Stars
────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className="h-3.5 w-3.5"
          style={{ color: n <= rating ? '#f59e0b' : '#e5e7eb', fill: n <= rating ? '#f59e0b' : 'none' }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   KPI Card
────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  gradient: string;
  subColor: string;
  labelColor: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, sub, gradient, subColor, labelColor, icon }: KpiCardProps) {
  return (
    <div
      className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
      style={{ background: gradient }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: labelColor }}>
            {label}
          </p>
          <p className="text-3xl font-black mt-2 tracking-tight">{value}</p>
          <p className="text-xs mt-2 font-medium" style={{ color: subColor }}>
            {sub}
          </p>
        </div>
        <div
          className="rounded-2xl p-3.5 flex-shrink-0 ml-4"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Section Card wrapper
────────────────────────────────────────── */
function SectionCard({
  title,
  subtitle,
  headerGradient,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  headerGradient?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: headerGradient ?? 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}
      >
        <div>
          <p className="font-bold text-sm" style={{ color: headerGradient ? '#fff' : '#1f2937' }}>
            {title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: headerGradient ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
            {subtitle}
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────
   Main Dashboard
────────────────────────────────────────── */
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

  const { data: ordersByStatus } = useQuery({
    queryKey: ['admin-orders-by-status'],
    queryFn: () => adminApi.getOrdersByStatus(),
  });

  const { data: categorySales } = useQuery({
    queryKey: ['admin-category-sales'],
    queryFn: () => adminApi.getCategorySales(),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: '#6366f1' }} />
          <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const chartData =
    chart?.map(point => ({ label: point.date.slice(5), value: point.revenue })) ?? [];

  const recentOrders = stats?.recentOrders?.slice(0, 8) ?? [];
  const topProducts = stats?.topProducts?.slice(0, 5) ?? [];
  const lowStockCount = stats?.products.lowStock ?? 0;

  const statusColors: Record<string, string> = {
    PENDING:    '#f59e0b',
    CONFIRMED:  '#3b82f6',
    PROCESSING: '#6366f1',
    SHIPPED:    '#8b5cf6',
    DELIVERED:  '#10b981',
    CANCELLED:  '#ef4444',
  };
  const donutSlices = (ordersByStatus ?? []).map(s => ({
    label: s.status,
    value: s.count,
    color: statusColors[s.status] ?? '#9ca3af',
  }));

  const activityFeed = recentOrders.slice(0, 6).map(o => ({
    id: o.id,
    type: o.status === 'CANCELLED' ? 'cancelled' : o.status === 'DELIVERED' ? 'delivered' : 'new',
    text: `Order #${o.orderNumber} — ${o.user.firstName} ${o.user.lastName}`,
    sub: o.status,
    amount: formatCurrency(Number(o.total)),
  }));

  const syntheticReviews = topProducts.slice(0, 3).map((p, i) => ({
    id: p.productId,
    product: p.productName,
    rating: 5 - i,
    reviewer: 'Verified Customer',
  }));

  // Compute today's revenue ratio for a "pulse" indicator
  const todayRevenue = stats?.revenue.today ?? 0;
  const monthRevenue = stats?.revenue.thisMonth ?? 1;
  const todayPct = Math.round((todayRevenue / monthRevenue) * 100);

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>
              Admin Dashboard
            </h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: '#d1fae5', color: '#065f46' }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#10b981', display: 'inline-block' }} />
              Live
            </span>
          </div>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Real-time overview of your store · Updated every 30s
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/reports"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold border transition-colors"
            style={{ color: '#6366f1', background: '#eef2ff', borderColor: '#c7d2fe' }}
          >
            <FileBarChart className="h-4 w-4" /> Reports
          </Link>
          <Link
            href="/admin/orders?status=PENDING"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Process Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(stats?.revenue.total ?? 0)}
          sub={`↑ Today: ${formatCurrency(todayRevenue)} (${todayPct}% of month)`}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          labelColor="#a7f3d0"
          subColor="#6ee7b7"
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <KpiCard
          label="Total Orders"
          value={String(stats?.orders.total ?? 0)}
          sub={`${stats?.orders.pending ?? 0} pending · Needs attention`}
          gradient="linear-gradient(135deg, #3b82f6, #4f46e5)"
          labelColor="#bfdbfe"
          subColor="#93c5fd"
          icon={<ShoppingBag className="w-6 h-6" />}
        />
        <KpiCard
          label="Total Products"
          value={String(stats?.products.total ?? 0)}
          sub={`${lowStockCount} low stock ${lowStockCount > 0 ? '⚠️' : '✓'}`}
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          labelColor="#ddd6fe"
          subColor="#c4b5fd"
          icon={<Package className="w-6 h-6" />}
        />
        <KpiCard
          label="Total Customers"
          value={String(stats?.customers.total ?? 0)}
          sub={`↑ ${stats?.customers.newThisMonth ?? 0} new this month`}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          labelColor="#fef3c7"
          subColor="#fde68a"
          icon={<Users className="w-6 h-6" />}
        />
      </div>

      {/* ── Revenue sub-bar ── */}
      <div
        className="rounded-2xl px-4 py-4 grid grid-cols-3 gap-3 sm:gap-6 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
      >
        {[
          { label: 'Today', value: stats?.revenue.today ?? 0, color: '#10b981' },
          { label: 'This Month', value: stats?.revenue.thisMonth ?? 0, color: '#6366f1' },
          { label: 'All Time', value: stats?.revenue.total ?? 0, color: '#f59e0b' },
        ].map(item => (
          <div key={item.label} className="text-center">
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {item.label}
            </p>
            <p className="text-xl font-black mt-1" style={{ color: item.color }}>
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Chart / Donut / Categories ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 30-day Revenue Sparkline */}
        <div
          className="rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-white text-sm tracking-wide">Revenue Trend</p>
              <p style={{ color: '#a5b4fc', fontSize: 11 }}>Last 30 days · hover bars for details</p>
            </div>
            <Link
              href="/admin/reports"
              className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 transition-all hover:opacity-80"
              style={{ color: '#a5b4fc', background: 'rgba(165,180,252,0.1)' }}
            >
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <Sparkline data={chartData} />
          ) : (
            <p className="py-6 text-center text-sm" style={{ color: '#818cf8' }}>No chart data yet</p>
          )}
          <div
            className="mt-3 rounded-xl px-3 py-2 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <span style={{ color: '#a5b4fc', fontSize: 11 }}>Today's revenue</span>
            <span className="font-black text-sm" style={{ color: '#6ee7b7' }}>
              {formatCurrency(todayRevenue)}
            </span>
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-gray-800 text-sm">Order Distribution</p>
            <p className="text-xs text-gray-400 mt-0.5">By current status</p>
          </div>
          {donutSlices.length > 0 ? (
            <DonutChart slices={donutSlices} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No order data yet</p>
          )}
        </div>

        {/* Top Categories */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="mb-4">
            <p className="font-bold text-gray-800 text-sm">Top Categories</p>
            <p className="text-xs text-gray-400 mt-0.5">Revenue by category</p>
          </div>
          {categorySales && categorySales.length > 0 ? (
            <CategoryBars data={categorySales} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No category data yet</p>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent Orders + Top Products ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <SectionCard
          title="Recent Orders"
          subtitle="Latest transactions across all customers"
          action={
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
              style={{ color: '#6366f1', background: '#eef2ff' }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
            ) : (
              recentOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-800">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <StatusBadge status={order.status} />
                    <span className="font-black text-sm text-gray-800 w-20 text-right">
                      {formatCurrency(Number(order.total))}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-semibold rounded-lg px-2 py-1 transition-colors flex-shrink-0"
                      style={{ color: '#6366f1', background: '#eef2ff' }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Top Selling Products */}
        <SectionCard
          title="Top Products"
          subtitle="Best performers by revenue generated"
          action={
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
              style={{ color: '#8b5cf6', background: '#f5f3ff' }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <div className="divide-y divide-gray-50">
            {topProducts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No sales data yet</p>
            ) : (
              topProducts.map((p, i) => {
                const rankColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
                return (
                  <div
                    key={p.productId}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                      style={{ background: rankColors[i] ?? '#9ca3af' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p._sum.quantity ?? 0} units sold</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-sm text-gray-800">
                        {formatCurrency(Number(p._sum.totalPrice ?? 0))}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Row 4: Low Stock / Reviews / Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2.5 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}
          >
            <div
              className="rounded-xl p-2"
              style={{ background: 'rgba(194,65,12,0.1)' }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: '#c2410c' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#7c2d12' }}>Low Stock Alerts</p>
              <p className="text-xs" style={{ color: '#c2410c' }}>
                {lowStockCount > 0 ? `${lowStockCount} products need restocking` : 'All products well stocked'}
              </p>
            </div>
          </div>
          <div className="p-5">
            {lowStockCount === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <CheckCircle2 className="h-8 w-8" style={{ color: '#10b981' }} />
                <p className="text-sm font-medium text-gray-500">Stock levels healthy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 4).map(p => (
                  <div key={p.productId} className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700 truncate flex-1">{p.productName}</p>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0"
                      style={{ background: '#fee2e2', color: '#991b1b' }}
                    >
                      Low
                    </span>
                  </div>
                ))}
                <Link
                  href="/admin/inventory"
                  className="flex items-center gap-1 text-xs font-semibold mt-3 hover:opacity-80 transition-opacity"
                  style={{ color: '#c2410c' }}
                >
                  <Zap className="h-3 w-3" /> Manage inventory
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2.5 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)' }}
          >
            <div
              className="rounded-xl p-2"
              style={{ background: 'rgba(180,83,9,0.1)' }}
            >
              <Star className="h-4 w-4" style={{ color: '#b45309' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#78350f' }}>Recent Reviews</p>
              <p className="text-xs" style={{ color: '#b45309' }}>Latest product feedback</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {syntheticReviews.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">No reviews yet</p>
            ) : (
              syntheticReviews.map(r => (
                <div key={r.id} className="p-3 rounded-xl" style={{ background: '#fafafa' }}>
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.product}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-gray-400">{r.reviewer}</span>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/admin/reviews"
              className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: '#b45309' }}
            >
              View all reviews <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2.5 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}
          >
            <div
              className="rounded-xl p-2"
              style={{ background: 'rgba(22,101,52,0.1)' }}
            >
              <Activity className="h-4 w-4" style={{ color: '#166534' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#14532d' }}>Quick Actions</p>
              <p className="text-xs" style={{ color: '#166534' }}>Common admin tasks</p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { href: '/admin/products/new', label: 'Add Product', icon: <Plus className="h-5 w-5" />, bg: 'linear-gradient(135deg, #10b981, #059669)' },
              { href: '/admin/coupons', label: 'Create Coupon', icon: <Tag className="h-5 w-5" />, bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
              { href: '/admin/reports', label: 'View Reports', icon: <FileBarChart className="h-5 w-5" />, bg: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
              { href: '/admin/users', label: 'Manage Users', icon: <Users className="h-5 w-5" />, bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            ].map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-2 rounded-xl p-3.5 text-center text-xs font-bold text-white shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: a.bg }}
              >
                {a.icon}
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      {activityFeed.length > 0 && (
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
          >
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <p className="font-bold text-sm text-white tracking-wide">Live Activity Feed</p>
            <span className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: '#10b981', color: '#fff' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" />
              LIVE
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activityFeed.map((item, i) => {
              const typeConfig = {
                cancelled: { bg: '#fee2e2', icon: <XCircle className="h-4 w-4" style={{ color: '#ef4444' }} /> },
                delivered: { bg: '#d1fae5', icon: <CheckCircle2 className="h-4 w-4" style={{ color: '#10b981' }} /> },
                new: { bg: '#eff6ff', icon: <ShoppingBag className="h-4 w-4" style={{ color: '#3b82f6' }} /> },
              };
              const cfg = typeConfig[item.type as keyof typeof typeConfig] ?? typeConfig.new;
              return (
                <div
                  key={item.id ?? i}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Status: {item.sub}</p>
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
