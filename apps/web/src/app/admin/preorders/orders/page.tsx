'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { preordersApi, PreorderOrder, PreorderOrderStatus } from '@/lib/api/preorders';

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  WAITING_FOR_STOCK: 'bg-orange-100 text-orange-800',
  READY_TO_FULFILL: 'bg-green-100 text-green-800',
  CONVERTED_TO_ORDER: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
};

const PAYMENT_COLOR: Record<string, string> = {
  UNPAID: 'text-red-500',
  PARTIALLY_PAID: 'text-yellow-600',
  PAID: 'text-green-600',
  REFUNDED: 'text-gray-500',
};

export default function PreorderOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<PreorderOrderStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['preorder-orders', statusFilter, page],
    queryFn: () => preordersApi.listOrders({ status: statusFilter || undefined, page }),
  });

  const preorderPayload = (data as any)?.data ?? {};
  const orders = preorderPayload?.data ?? [];
  const total = preorderPayload?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const statuses: (PreorderOrderStatus | '')[] = [
    '', 'PENDING_PAYMENT', 'CONFIRMED', 'WAITING_FOR_STOCK',
    'READY_TO_FULFILL', 'CONVERTED_TO_ORDER', 'CANCELLED', 'REFUNDED', 'COMPLETED',
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preorder Orders</h1>
            <p className="text-sm text-gray-500">{total} order{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No preorder orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Order #', 'Product', 'Customer', 'Qty', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.map((order: PreorderOrder) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{order.preorderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[140px]">
                        {order.config?.product?.name ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 dark:text-white">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{order.quantity}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">৳{Number(order.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${PAYMENT_COLOR[order.paymentStatus] ?? 'text-gray-500'}`}>
                        {order.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.preorderStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                        {order.preorderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/preorders/orders/${order.id}`} className="text-xs text-orange-500 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${
                p === page ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
