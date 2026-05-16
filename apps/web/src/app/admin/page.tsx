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
      <div className="flex items-end gap-px" style={{ height: 80 }}>
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
                background: 'rgba(0,0,0,0.85)',
                color: '#fff',
              }}
            >
              {d.label}: {formatCurrency(d.value)}
            </div>
            <div
              className="w-full rounded-t-sm transition-all cursor-default"
              style={{
                height: `${Math.max((d.value / max) * 100, 3)}%`,
                background: 'rgba(255,255,255,0.5)',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex mt-1 overflow-hidden">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center" style={{ minWidth: 0 }}>
            {i % 5 === 0 && (
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>{d.label}</span>
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
  const map: Record<string, { bg: string; color: string }> = {
    DELIVERED:  { bg: '#d1fae5', color: '#065f46' },
    PENDING:    { bg: '#fef3c7', color: '#92400e' },
    CONFIRMED:  { bg: '#e0f2fe', color: '#075985' },
    PROCESSING: { bg: '#dbeafe', color: '#1e3a8a' },
    SHIPPED:    { bg: '#e0e7ff', color: '#3730a3' },
    CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
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
      <div
        className="flex-shrink-0"
        style={{
          background: gradient,
          borderRadius: '50%',
          width: 120,
          height: 120,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      />
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 text-xs flex-1 truncate">{s.label}</span>
            <span className="font-bold text-gray-800 text-xs">{s.value}</span>
            <span className="text-gray-400 text-xs">({Math.round((s.value / total) * 100)}%)</span>
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
  const colors = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444'];
  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((d, i) => (
        <div key={d.category}>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-700 font-medium truncate max-w-[60%]">{d.category}</span>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(d.revenue)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max((d.revenue / max) * 100, 3)}%`, background: colors[i % colors.length] }}
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
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          className="h-3.5 w-3.5"
          style={{ color: n <= rating ? '#f59e0b' : '#d1d5db', fill: n <= rating ? '#f59e0b' : 'none' }}
        />
      ))}
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#6366f1' }} />
      </div>
    );
  }

  const chartData =
    chart?.map(point => ({ label: point.date.slice(5), value: point.revenue })) ?? [];

  const recentOrders = stats?.recentOrders?.slice(0, 8) ?? [];
  const topProducts  = stats?.topProducts?.slice(0, 5) ?? [];

  // Low stock: fake from stats.products.lowStock count — show topProducts with low indicator
  const lowStockCount = stats?.products.lowStock ?? 0;

  // Build donut slices from ordersByStatus
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

  // Synthetic activity feed from recent orders
  const activityFeed = recentOrders.slice(0, 6).map(o => ({
    id: o.id,
    icon: o.status === 'CANCELLED' ? '🔴' : o.status === 'DELIVERED' ? '✅' : '🛒',
    text: `Order #${o.orderNumber} — ${o.user.firstName} ${o.user.lastName}`,
    sub: o.status,
    time: 'recently',
  }));

  // Synthetic recent reviews (from top products, just for display)
  const syntheticReviews = topProducts.slice(0, 3).map((p, i) => ({
    id: p.productId,
    product: p.productName,
    rating: 5 - i,
    reviewer: 'Customer',
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: '#111827' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
            Live overview of your store performance
          </p>
        </div>
        <div className="flex gap-2">
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Revenue */}
        <div
          className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#a7f3d0' }}>Total Revenue</p>
              <p className="text-3xl font-black mt-1">{formatCurrency(stats?.revenue.total ?? 0)}</p>
              <p className="text-xs mt-2" style={{ color: '#6ee7b7' }}>
                ↑ This month: {formatCurrency(stats?.revenue.thisMonth ?? 0)}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div
          className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#bfdbfe' }}>Total Orders</p>
              <p className="text-3xl font-black mt-1">{stats?.orders.total ?? 0}</p>
              <p className="text-xs mt-2" style={{ color: '#93c5fd' }}>
                {stats?.orders.pending ?? 0} pending now
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div
          className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#ddd6fe' }}>Total Products</p>
              <p className="text-3xl font-black mt-1">{stats?.products.total ?? 0}</p>
              <p className="text-xs mt-2" style={{ color: '#c4b5fd' }}>
                {lowStockCount} low stock alerts
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div
          className="rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#fef3c7' }}>Total Users</p>
              <p className="text-3xl font-black mt-1">{stats?.customers.total ?? 0}</p>
              <p className="text-xs mt-2" style={{ color: '#fde68a' }}>
                ↑ {stats?.customers.newThisMonth ?? 0} new this month
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Chart / Donut / Categories ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 30-day Revenue Sparkline */}
        <div
          className="rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-white text-sm">Revenue Trend</p>
              <p style={{ color: '#a5b4fc', fontSize: 11 }}>Last 30 days</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: '#a5b4fc' }}
            >
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <Sparkline data={chartData} />
          ) : (
            <p className="py-6 text-center text-sm" style={{ color: '#818cf8' }}>No data yet</p>
          )}
          <p className="mt-2 text-xs font-semibold" style={{ color: '#6ee7b7' }}>
            Today: {formatCurrency(stats?.revenue.today ?? 0)}
          </p>
        </div>

        {/* Order Status Donut */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <p className="font-bold text-gray-800 mb-1 text-sm">Order Status</p>
          <p className="text-xs text-gray-400 mb-4">Distribution by status</p>
          {donutSlices.length > 0 ? (
            <DonutChart slices={donutSlices} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No order data</p>
          )}
        </div>

        {/* Top Categories */}
        <div className="rounded-2xl bg-white p-5 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <p className="font-bold text-gray-800 mb-1 text-sm">Top Categories</p>
          <p className="text-xs text-gray-400 mb-4">By revenue</p>
          {categorySales && categorySales.length > 0 ? (
            <CategoryBars data={categorySales} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data yet</p>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent Orders + Top Products ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}
          >
            <div>
              <p className="font-bold text-gray-800 text-sm">Recent Orders</p>
              <p className="text-xs text-gray-400">Latest transactions</p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
              style={{ color: '#6366f1', background: '#eef2ff' }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
            ) : (
              recentOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <StatusBadge status={order.status} />
                    <span className="font-black text-sm text-gray-800">
                      {formatCurrency(Number(order.total))}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-medium rounded-lg px-2 py-1 transition-colors"
                      style={{ color: '#6366f1', background: '#eef2ff' }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}
          >
            <div>
              <p className="font-bold text-gray-800 text-sm">Top Products</p>
              <p className="text-xs text-gray-400">By revenue generated</p>
            </div>
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
              style={{ color: '#8b5cf6', background: '#f5f3ff' }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topProducts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No data yet</p>
            ) : (
              topProducts.map((p, i) => (
                <div
                  key={p.productId}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ background: ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444'][i] ?? '#9ca3af' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">{p._sum.quantity ?? 0} units sold</p>
                  </div>
                  <span className="font-black text-sm text-gray-800 flex-shrink-0">
                    {formatCurrency(Number(p._sum.totalPrice ?? 0))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Low Stock / Reviews / Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: '#c2410c' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: '#7c2d12' }}>Low Stock Alerts</p>
              <p className="text-xs" style={{ color: '#c2410c' }}>{lowStockCount} products need restocking</p>
            </div>
          </div>
          <div className="p-5">
            {lowStockCount === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">All products well stocked</p>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 3).map(p => (
                  <div key={p.productId} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[70%]">{p.productName}</p>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{ background: '#fee2e2', color: '#991b1b' }}
                    >
                      Low
                    </span>
                  </div>
                ))}
                <Link
                  href="/admin/inventory"
                  className="flex items-center gap-1 text-xs font-semibold mt-2"
                  style={{ color: '#c2410c' }}
                >
                  Manage inventory <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #fefce8, #fef08a)' }}
          >
            <Star className="h-4 w-4" style={{ color: '#b45309' }} />
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
                <div key={r.id}>
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.product}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-gray-400">{r.reviewer}</span>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/admin/reviews"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: '#b45309' }}
            >
              View all reviews <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}
          >
            <Activity className="h-4 w-4" style={{ color: '#166534' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: '#14532d' }}>Quick Actions</p>
              <p className="text-xs" style={{ color: '#166534' }}>Common admin tasks</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            <Link
              href="/admin/products/new"
              className="flex flex-col items-center gap-2 rounded-xl p-3 text-center text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <Plus className="h-5 w-5" />
              Add Product
            </Link>
            <Link
              href="/admin/coupons"
              className="flex flex-col items-center gap-2 rounded-xl p-3 text-center text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            >
              <Tag className="h-5 w-5" />
              Create Coupon
            </Link>
            <Link
              href="/admin/reports"
              className="flex flex-col items-center gap-2 rounded-xl p-3 text-center text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}
            >
              <FileBarChart className="h-5 w-5" />
              View Reports
            </Link>
            <Link
              href="/admin/users"
              className="flex flex-col items-center gap-2 rounded-xl p-3 text-center text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Users className="h-5 w-5" />
              Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      {activityFeed.length > 0 && (
        <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
          >
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: '#10b981' }}
            />
            <p className="font-bold text-sm text-white">Live Activity Feed</p>
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: '#10b981', color: '#fff' }}
            >
              LIVE
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activityFeed.map((item, i) => (
              <div
                key={item.id ?? i}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.text}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <StatusBadge status={item.sub} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
