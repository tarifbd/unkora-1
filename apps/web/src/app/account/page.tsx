'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AccountDashboard() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders({ limit: 5 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{data?.meta?.total ?? 0}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.data?.reduce((sum: number, o: { total: string }) => sum + Number(o.total), 0) ?? 0)}
              </p>
            </div>
            <div className="rounded-full bg-brand-100 p-3">
              <ShoppingBag className="h-5 w-5 text-brand-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {!data?.data?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p>No orders yet</p>
            <Link href="/products" className="mt-2 inline-block text-sm text-brand-600 hover:underline">Start shopping</Link>
          </div>
        ) : (
          <div className="divide-y">
            {data.data.map((order: { id: string; orderNumber: string; status: string; total: string; createdAt: string; items?: unknown[] }) => (
              <Link key={order.id} href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-muted'}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-sm">{formatCurrency(Number(order.total))}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
