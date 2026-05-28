'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Package, Loader2, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { preordersApi, PreorderOrder } from '@/lib/api/preorders';

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  WAITING_FOR_STOCK: 'bg-orange-100 text-orange-700',
  READY_TO_FULFILL: 'bg-green-100 text-green-700',
  CONVERTED_TO_ORDER: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

export default function AccountPreordersPage() {
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-preorders', page],
    queryFn: () => preordersApi.myPreorders(page),
  });

  const cancelMut = useMutation({
    mutationFn: () => preordersApi.cancelMyPreorder(cancelId!, cancelReason || 'Cancelled by customer'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-preorders'] });
      setCancelId(null);
      setCancelReason('');
      toast.success('Preorder cancelled');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">My Preorders</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No preorders yet</p>
          <p className="text-sm text-gray-400 mt-1">When you preorder a product, it will appear here</p>
          <Link href="/shop" className="mt-4 inline-block px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: PreorderOrder) => {
            const canCancel =
              !['CONVERTED_TO_ORDER', 'CANCELLED', 'REFUNDED', 'COMPLETED'].includes(order.preorderStatus) &&
              order.config?.allowCancellation !== false;
            return (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 min-w-0">
                    {order.config?.product?.images?.[0] && (
                      <img
                        src={order.config.product.images[0].url}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {order.config?.product?.name ?? 'Product'}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{order.preorderNumber}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.preorderStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                          {order.preorderStatus.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          ৳{Number(order.totalAmount).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">Qty: {order.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canCancel && (
                      <button
                        onClick={() => setCancelId(order.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment info */}
                {order.paymentStatus !== 'PAID' && order.preorderStatus !== 'CANCELLED' && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      {order.paymentStatus === 'UNPAID'
                        ? `Prepayment due: ৳${Number(order.prepaymentAmount).toLocaleString()}`
                        : `Remaining balance: ৳${Number(order.remainingAmount).toLocaleString()}`}
                    </p>
                  </div>
                )}

                {/* Expected delivery */}
                {order.expectedDeliveryDate && (
                  <p className="mt-2 text-xs text-gray-400">
                    Expected delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                  </p>
                )}

                <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
                  <span>Ordered {new Date(order.createdAt).toLocaleDateString()}</span>
                  {order.orderId && (
                    <Link href={`/account/orders`} className="text-orange-500 hover:underline flex items-center gap-1">
                      View order <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Cancel Preorder</h3>
              <button onClick={() => setCancelId(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to cancel this preorder? This action cannot be undone.</p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Keep Preorder
              </button>
              <button
                onClick={() => cancelMut.mutate()}
                disabled={cancelMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {cancelMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Cancel Preorder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
