'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { TrendingUp, TrendingDown, DollarSign, Package, Loader2, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function PnLPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: chart } = useQuery({
    queryKey: ['revenue-chart', 30],
    queryFn: () => adminApi.getRevenueChart(30),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  const totalRevenue   = stats?.revenue?.total ?? 0;
  const monthRevenue   = stats?.revenue?.thisMonth ?? 0;
  const todayRevenue   = stats?.revenue?.today ?? 0;
  const totalOrders    = stats?.orders?.total ?? 0;
  const avgOrder       = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const cards = [
    { label: 'Total Revenue',      value: formatCurrency(totalRevenue),  icon: DollarSign,    color: 'text-green-600',  bg: 'bg-green-50',  sub: 'All time paid orders' },
    { label: 'This Month Revenue', value: formatCurrency(monthRevenue),  icon: TrendingUp,    color: 'text-blue-600',   bg: 'bg-blue-50',   sub: 'Current month' },
    { label: "Today's Revenue",    value: formatCurrency(todayRevenue),  icon: BarChart3,     color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Today only' },
    { label: 'Avg Order Value',    value: formatCurrency(avgOrder),      icon: Package,       color: 'text-orange-600', bg: 'bg-orange-50', sub: `From ${totalOrders} orders` },
  ];

  const chartMax = Math.max(...(chart?.map(p => p.revenue) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" /> Profit & Loss Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">Revenue summary from paid orders. For detailed analysis, see <Link href="/admin/advanced-reports" className="text-orange-500 hover:underline">Advanced Reports</Link>.</p>
        </div>
        <Link href="/admin/advanced-reports"
          className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-orange-600 transition-colors">
          <BarChart3 className="h-4 w-4" /> Full Reports
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue by order status */}
      {stats?.orders?.byStatus && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Orders by Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-day revenue chart */}
      {chart && chart.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Last 30 Days Revenue</h2>
          <div className="flex items-end gap-1 h-32">
            {chart.map((point, i) => {
              const h = Math.max(4, (point.revenue / chartMax) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    title={`${point.date}: ${formatCurrency(point.revenue)}`}
                    className="w-full bg-orange-400 rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{chart[0]?.date}</span>
            <span>{chart[chart.length - 1]?.date}</span>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm text-amber-800 font-medium">💡 Purchase cost tracking</p>
        <p className="text-sm text-amber-700 mt-1">To calculate actual profit (Revenue - Cost), add purchase cost to each product in the <Link href="/admin/products" className="text-orange-600 font-semibold underline">Products</Link> page using the "Purchase Cost" field. Full P&L with margins is available in <Link href="/admin/advanced-reports" className="text-orange-600 font-semibold underline">Advanced Reports</Link>.</p>
      </div>
    </div>
  );
}
