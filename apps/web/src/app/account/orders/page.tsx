'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => ordersApi.getMyOrders({ page, limit: 10 }),
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold">My Orders</h1>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !data?.data?.length && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No orders yet</p>
          <Link href="/products" className="mt-2 inline-block text-sm text-brand-600 hover:underline">Browse products</Link>
        </div>
      )}

      {data?.data?.map((order: { id: string; orderNumber: string; status: string; total: string; createdAt: string; items?: Array<{ product?: { name?: string } }> }) => (
        <Link key={order.id} href={`/account/orders/${order.id}`}
          className="flex items-center justify-between rounded-xl border bg-card p-5 hover:bg-muted/30 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <p className="font-semibold">#{order.orderNumber}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-muted'}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })}</p>
            {order.items?.[0]?.product?.name && (
              <p className="text-sm text-muted-foreground line-clamp-1">{order.items[0].product.name}{(order.items.length > 1) ? ` +${order.items.length - 1} more` : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{formatCurrency(Number(order.total))}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      ))}

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
