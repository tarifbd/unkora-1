'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, Users, TrendingUp, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: chart } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(),
  });

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), sub: `This month: ${formatCurrency(stats?.monthRevenue ?? 0)}`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, sub: `Today: ${stats?.todayOrders ?? 0}`, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Products', value: stats?.totalProducts ?? 0, sub: 'Active listings', icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: 'Customers', value: stats?.totalCustomers ?? 0, sub: 'Registered users', icon: Users, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(stat => (
          <div key={stat.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
              <div className={`rounded-full p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4 font-semibold">Recent Orders</div>
          <div className="divide-y">
            {stats?.recentOrders?.slice(0, 5).map((order: { id: string; orderNumber: string; status: string; total: string; customer?: { name?: string } }) => (
              <div key={order.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.customer?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{order.status}</span>
                  <span className="font-medium">{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-4 font-semibold">Top Products</div>
          <div className="divide-y">
            {stats?.topProducts?.slice(0, 5).map((p: { id: string; name: string; totalSold?: number; revenue?: string }, i: number) => (
              <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                  <span className="font-medium line-clamp-1">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{p.totalSold} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart — simple bar visualization */}
      {chart && chart.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Revenue (Last 30 Days)</h2>
          <div className="flex items-end gap-1 h-40">
            {chart.map((point: { date: string; revenue: number }) => {
              const max = Math.max(...chart.map((p: { revenue: number }) => p.revenue), 1);
              const height = (point.revenue / max) * 100;
              return (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-1" title={`${point.date}: ${formatCurrency(point.revenue)}`}>
                  <div className="w-full rounded-t bg-brand-600/80 transition-all hover:bg-brand-600" style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
