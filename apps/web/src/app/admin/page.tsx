'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  Clock,
  DollarSign,
  CalendarDays,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';

function CSSBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="relative">
      <div className="flex items-end gap-px h-40 overflow-hidden">
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center"
            style={{ minWidth: 0 }}
          >
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-lg pointer-events-none">
              {d.label}: {formatCurrency(d.value)}
            </div>
            <div
              className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors cursor-default"
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
        ))}
      </div>
      {/* X-axis labels — show every 5th */}
      <div className="flex mt-1 overflow-hidden">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center"
            style={{ minWidth: 0 }}
          >
            {i % 5 === 0 && (
              <span className="text-[9px] text-muted-foreground">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const topRow = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.revenue.total ?? 0),
      sub: 'All-time earnings',
      icon: TrendingUp,
      colorIcon: 'text-emerald-600',
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'This Month',
      value: formatCurrency(stats?.revenue.thisMonth ?? 0),
      sub: 'Current month revenue',
      icon: CalendarDays,
      colorIcon: 'text-blue-600',
      colorBg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats?.revenue.today ?? 0),
      sub: 'Revenue so far today',
      icon: DollarSign,
      colorIcon: 'text-violet-600',
      colorBg: 'bg-violet-50 dark:bg-violet-950/30',
      border: 'border-violet-200 dark:border-violet-800',
    },
    {
      label: 'Pending Orders',
      value: stats?.orders.pending ?? 0,
      sub: `of ${stats?.orders.total ?? 0} total orders`,
      icon: Clock,
      colorIcon: 'text-amber-600',
      colorBg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
    },
  ];

  const secondRow = [
    {
      label: 'Total Products',
      value: stats?.products.total ?? 0,
      sub: 'Active in store',
      icon: Package,
      colorIcon: 'text-sky-600',
      colorBg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-200 dark:border-sky-800',
    },
    {
      label: 'Low Stock Alert',
      value: stats?.products.lowStock ?? 0,
      sub: 'Products need restocking',
      icon: AlertTriangle,
      colorIcon: 'text-red-600',
      colorBg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
    },
    {
      label: 'Total Customers',
      value: stats?.customers.total ?? 0,
      sub: 'Registered accounts',
      icon: Users,
      colorIcon: 'text-indigo-600',
      colorBg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      label: 'New This Month',
      value: stats?.customers.newThisMonth ?? 0,
      sub: 'New customer signups',
      icon: ShoppingBag,
      colorIcon: 'text-teal-600',
      colorBg: 'bg-teal-50 dark:bg-teal-950/30',
      border: 'border-teal-200 dark:border-teal-800',
    },
  ];

  const chartData =
    chart?.map(point => ({
      label: point.date.slice(5),
      value: point.revenue,
    })) ?? [];

  const recentOrders = stats?.recentOrders?.slice(0, 10) ?? [];
  const topProducts = stats?.topProducts?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your store performance</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/orders?status=PENDING"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Process Orders <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Top row stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topRow.map(stat => (
          <div
            key={stat.label}
            className={`rounded-xl border ${stat.border} bg-card p-5 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${stat.colorBg} flex-shrink-0 ml-3`}>
                <stat.icon className={`h-5 w-5 ${stat.colorIcon}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second row stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {secondRow.map(stat => (
          <div
            key={stat.label}
            className={`rounded-xl border ${stat.border} bg-card p-5 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${stat.colorBg} flex-shrink-0 ml-3`}>
                <stat.icon className={`h-5 w-5 ${stat.colorIcon}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Revenue Trend</h2>
              <p className="text-xs text-muted-foreground">Last 30 days in BDT ৳</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Full report <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <CSSBarChart data={chartData} />
        </div>
      )}

      {/* Orders + Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {recentOrders.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No orders yet</p>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="font-semibold text-sm">{formatCurrency(Number(order.total))}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold">Top Products by Revenue</h2>
            <Link href="/admin/products" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {topProducts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium line-clamp-1">{p.productName}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2 text-muted-foreground text-xs">
                    <span>{p._sum.quantity ?? 0} sold</span>
                    <span className="font-semibold text-foreground text-sm">
                      {formatCurrency(Number(p._sum.totalPrice ?? 0))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Package className="h-4 w-4" /> Add Product
          </Link>
          <Link
            href="/admin/orders?status=PENDING"
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ShoppingBag className="h-4 w-4" /> Process Orders
          </Link>
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <AlertTriangle className="h-4 w-4" /> Manage Inventory
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <TrendingUp className="h-4 w-4" /> View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
