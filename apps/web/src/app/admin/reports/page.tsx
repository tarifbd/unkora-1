'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';
import { Loader2, TrendingUp, BarChart3, Users, ShoppingBag, Tag } from 'lucide-react';

function RevenueBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div className="flex items-end gap-px h-48">
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center"
            style={{ minWidth: 0 }}
          >
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-lg pointer-events-none">
              <span className="font-semibold">{d.label}</span>
              <br />
              {formatCurrency(d.value)}
            </div>
            <div
              className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors cursor-default"
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex mt-1.5 overflow-hidden border-t pt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center" style={{ minWidth: 0 }}>
            {i % 5 === 0 && (
              <span className="text-[9px] text-muted-foreground">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 2;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 flex-shrink-0 truncate text-xs text-muted-foreground" title={label}>
        {label}
      </span>
      <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
        <div
          className="h-full rounded bg-primary/70 hover:bg-primary transition-colors"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-24 flex-shrink-0 text-right text-xs font-medium">
        {formatCurrency(value)}
      </span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  SHIPPED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  RETURNED: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const { data: chart, isLoading: chartLoading } = useQuery({
    queryKey: ['admin-revenue-chart', 30],
    queryFn: () => adminApi.getRevenueChart(30),
  });

  const { data: ordersByStatus, isLoading: ordersStatusLoading } = useQuery({
    queryKey: ['admin-orders-by-status'],
    queryFn: () => adminApi.getOrdersByStatus(),
  });

  const { data: categorySales, isLoading: catLoading } = useQuery({
    queryKey: ['admin-category-sales'],
    queryFn: () => adminApi.getCategorySales(),
  });

  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-top-customers'],
    queryFn: () => adminApi.getTopCustomers(),
  });

  const isLoading = statsLoading || chartLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const chartData =
    chart?.map(point => ({
      label: point.date.slice(5),
      value: point.revenue,
    })) ?? [];

  const last7Revenue =
    chart?.slice(-7).reduce((sum, p) => sum + p.revenue, 0) ?? 0;
  const last30Revenue =
    chart?.reduce((sum, p) => sum + p.revenue, 0) ?? 0;

  const maxCatRevenue = Math.max(
    ...(categorySales?.map(c => c.revenue) ?? [0]),
    1,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Detailed breakdown of your store performance</p>
      </div>

      {/* Revenue Overview */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Revenue Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Last 7 Days', value: last7Revenue, sub: '7-day rolling revenue' },
            { label: 'Last 30 Days', value: last30Revenue, sub: '30-day rolling revenue' },
            { label: 'All-Time Total', value: stats?.revenue.total ?? 0, sub: 'Cumulative revenue' },
          ].map(card => (
            <div key={card.label} className="rounded-xl border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(card.value)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Trend */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Revenue Trend (Last 30 Days)
        </h2>
        <div className="rounded-xl border bg-card p-5">
          {chartLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length > 0 ? (
            <RevenueBarChart data={chartData} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No chart data available</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Orders by Status
          </h2>
          <div className="rounded-xl border bg-card p-5">
            {ordersStatusLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !ordersByStatus || ordersByStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No order data available</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {ordersByStatus.map(item => (
                  <div
                    key={item.status}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${STATUS_COLORS[item.status] ?? 'bg-muted text-muted-foreground border-muted'}`}
                  >
                    <span className="text-2xl font-bold">{item.count}</span>
                    <span className="text-xs font-medium">{item.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Category Sales */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" /> Category Sales
          </h2>
          <div className="rounded-xl border bg-card p-5">
            {catLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !categorySales || categorySales.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No category data available</p>
            ) : (
              <div className="space-y-1">
                {categorySales.slice(0, 8).map(cat => (
                  <HorizontalBar
                    key={cat.category}
                    label={cat.category}
                    value={cat.revenue}
                    max={maxCatRevenue}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Top Customers */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Top Customers
        </h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          {customersLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !topCustomers || topCustomers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No customer data available</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topCustomers.slice(0, 5).map((c, i) => {
                  const name = c.user
                    ? `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim()
                    : 'Unknown';
                  const email = c.user?.email ?? '—';
                  return (
                    <tr key={c.user?.id ?? i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{email}</td>
                      <td className="px-4 py-3 text-right">{c.orderCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(c.totalSpent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
