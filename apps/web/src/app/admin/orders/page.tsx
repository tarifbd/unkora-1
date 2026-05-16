'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/utils';

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => ordersApi.adminGetAll({ page, limit: 20, status: statusFilter === 'ALL' ? undefined : statusFilter }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.adminUpdateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Orders</h1>
        {data && <p className="text-sm text-muted-foreground">{data.meta.total} total orders</p>}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">Total</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((order: { id: string; orderNumber: string; status: string; total: string; createdAt: string; customer?: { name?: string; email?: string } }) => (
              <tr key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={e => { if ((e.target as HTMLElement).closest('select')) return; window.location.href = `/admin/orders/${order.id}`; }}>
                <td className="px-4 py-3 font-medium">#{order.orderNumber}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <p>{order.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select value={order.status}
                    onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value })}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[order.status] ?? 'bg-muted'}`}>
                    {STATUSES.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="hidden px-4 py-3 text-right font-semibold md:table-cell">{formatCurrency(Number(order.total))}</td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
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
