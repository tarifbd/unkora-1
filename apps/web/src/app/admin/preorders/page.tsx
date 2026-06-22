'use client';
import { useQuery } from '@tanstack/react-query';
import {
  Clock, Package, ShoppingBag, CheckCircle, TruckIcon,
  ArrowRightCircle, XCircle, DollarSign, Loader2, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { preordersApi, PreorderOrder } from '@/lib/api/preorders';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  WAITING_FOR_STOCK: 'bg-orange-100 text-orange-800',
  READY_TO_FULFILL: 'bg-green-100 text-green-800',
  CONVERTED_TO_ORDER: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-700',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
};

export default function PreordersDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['preorders-dashboard'],
    queryFn: preordersApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 text-red-600 max-w-md mx-auto mt-8">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Failed to load preorders dashboard</p>
          <p className="text-xs text-red-400 mt-0.5">Check that the API server is running and you are logged in as admin.</p>
        </div>
      </div>
    );
  }

  const { stats, recentOrders = [] } = data;
  if (!stats) return (
    <div className="p-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 text-red-600 max-w-md mx-auto mt-8">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-semibold">Failed to load dashboard statistics</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preorders</h1>
            <p className="text-sm text-gray-500">Overview of all preorder activity</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/preorders/configurations"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
          >
            Configurations
          </Link>
          <Link
            href="/admin/preorders/orders"
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            All Orders
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Configs" value={`${stats.activeConfigs}/${stats.totalConfigs}`} icon={Package} color="bg-blue-500" />
        <StatCard label="Total Preorders" value={stats.totalOrders} icon={ShoppingBag} color="bg-orange-500" />
        <StatCard label="Total Revenue" value={`৳${stats.totalRevenue.toLocaleString()}`} sub="excl. cancelled" icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Prepaid Collected" value={`৳${stats.prepaidRevenue.toLocaleString()}`} icon={CheckCircle} color="bg-purple-500" />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Pending Payment', val: stats.pendingPayment, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', icon: AlertCircle },
          { label: 'Confirmed', val: stats.confirmed, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: CheckCircle },
          { label: 'Ready to Fulfill', val: stats.readyToFulfill, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: TruckIcon },
          { label: 'Converted', val: stats.converted, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', icon: ArrowRightCircle },
          { label: 'Cancelled', val: stats.cancelled, color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <Icon className="h-5 w-5 mb-1 opacity-70" />
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/preorders/configurations"
          className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-orange-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-6 w-6 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600">Configurations</h2>
          </div>
          <p className="text-sm text-gray-500">Manage preorder settings for your products — enable, disable, set limits and prepayment rules.</p>
        </Link>
        <Link
          href="/admin/preorders/orders"
          className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:border-orange-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="h-6 w-6 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600">Orders</h2>
          </div>
          <p className="text-sm text-gray-500">View and manage all preorder orders, record payments, and convert to regular orders.</p>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Preorders</h2>
          <Link href="/admin/preorders/orders" className="text-sm text-orange-500 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentOrders.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">No preorders yet</p>
          )}
          {recentOrders.map((order: PreorderOrder) => (
            <div key={order.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {order.preorderNumber}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {order.config?.product?.name} — {order.customerName}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLOR[order.preorderStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                {order.preorderStatus.replace(/_/g, ' ')}
              </span>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">৳{Number(order.totalAmount).toLocaleString()}</p>
              <Link href={`/admin/preorders/orders/${order.id}`} className="text-xs text-orange-500 hover:underline shrink-0">View</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
