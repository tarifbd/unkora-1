'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Search, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
  order?: { orderNumber: string };
  user?: { firstName: string; lastName: string; email: string };
}

interface PaymentListResponse {
  data: Payment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
  REFUNDED:  'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const METHOD_LABELS: Record<string, string> = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  COD: 'COD',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank',
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery<PaymentListResponse>({
    queryKey: ['admin-payments', page, status, method, search],
    queryFn: () =>
      api.get('/payments/admin/list', {
        params: { page, limit: 20, ...(status && { status }), ...(method && { method }), ...(search && { search }) },
      }).then(r => r.data.data),
  });

  const payments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Payment Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total.toLocaleString()} total transactions` : 'Loading…'}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order # or transaction ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={method}
          onChange={e => { setMethod(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All Methods</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
          <option value="CARD">Card</option>
          <option value="COD">COD</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Order</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Method</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Transaction ID</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No transactions found
                </td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{p.order?.orderNumber ?? p.orderId.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    {p.user ? (
                      <div>
                        <p className="font-medium">{p.user.firstName} {p.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.user.email}</p>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">Guest</span>}
                  </td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100">
                      {METHOD_LABELS[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {p.transactionId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : payments.map(p => (
          <div key={p.id} className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold">{p.order?.orderNumber ?? p.orderId.slice(0, 8)}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {p.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Guest'}</span>
              <span className="font-bold">{formatCurrency(p.amount)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full font-semibold">{METHOD_LABELS[p.method] ?? p.method}</span>
              <span>·</span>
              <span>{new Date(p.createdAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
