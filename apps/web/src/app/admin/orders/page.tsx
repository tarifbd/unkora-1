'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search, Loader2, ChevronRight, ShoppingBag, Clock, RefreshCw,
  Truck, CheckCircle2, XCircle, ChevronLeft, Package, TrendingUp,
  Calendar, Filter, X,
} from 'lucide-react';
import { ordersApi, type OrderStatus } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/utils';

const STATUSES: { value: OrderStatus | 'ALL'; label: string; color: string; dot: string }[] = [
  { value: 'ALL',              label: 'All Orders',    color: 'text-foreground',       dot: 'bg-gray-400' },
  { value: 'PENDING',          label: 'Pending',       color: 'text-yellow-700',       dot: 'bg-yellow-400' },
  { value: 'CONFIRMED',        label: 'Confirmed',     color: 'text-blue-700',         dot: 'bg-blue-500' },
  { value: 'PROCESSING',       label: 'Processing',    color: 'text-purple-700',       dot: 'bg-purple-500' },
  { value: 'SHIPPED',          label: 'Shipped',       color: 'text-indigo-700',       dot: 'bg-indigo-500' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'text-cyan-700',      dot: 'bg-cyan-500' },
  { value: 'DELIVERED',        label: 'Delivered',     color: 'text-green-700',        dot: 'bg-green-500' },
  { value: 'CANCELLED',        label: 'Cancelled',     color: 'text-red-700',          dot: 'bg-red-500' },
  { value: 'REFUNDED',         label: 'Refunded',      color: 'text-orange-700',       dot: 'bg-orange-400' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED:        'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING:       'bg-purple-50 text-purple-700 border-purple-200',
  SHIPPED:          'bg-indigo-50 text-indigo-700 border-indigo-200',
  OUT_FOR_DELIVERY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  DELIVERED:        'bg-green-50 text-green-700 border-green-200',
  CANCELLED:        'bg-red-50 text-red-700 border-red-200',
  REFUNDED:         'bg-orange-50 text-orange-700 border-orange-200',
};

const PAYMENT_BADGE: Record<string, string> = {
  PAID:    'bg-green-50 text-green-700',
  PENDING: 'bg-yellow-50 text-yellow-700',
  FAILED:  'bg-red-50 text-red-700',
};

function StatusUpdateModal({ orderId, current, onClose, onUpdate }: {
  orderId: string;
  current: OrderStatus;
  onClose: () => void;
  onUpdate: (status: string, note: string) => void;
}) {
  const [selected, setSelected] = useState<string>(current);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Update Order Status</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {STATUSES.filter(s => s.value !== 'ALL').map(s => (
            <button
              key={s.value}
              onClick={() => setSelected(s.value as string)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors text-left
                ${selected === s.value ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            >
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${s.dot}`} />
              <span className={`font-medium ${selected === s.value ? 'text-primary' : ''}`}>{s.label}</span>
              {current === s.value && (
                <span className="ml-auto text-xs text-muted-foreground font-medium">Current</span>
              )}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note (optional)..."
          rows={2}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onUpdate(selected, note)}
            disabled={selected === current}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusModal, setStatusModal] = useState<{ orderId: string; current: OrderStatus } | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400));
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, debouncedSearch, dateFrom, dateTo],
    queryFn: () => ordersApi.adminGetAll({
      page,
      limit: 20,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  // Stats queries
  const { data: statsPending } = useQuery({
    queryKey: ['admin-orders-stats', 'PENDING'],
    queryFn: () => ordersApi.adminGetAll({ page: 1, limit: 1, status: 'PENDING' }),
  });
  const { data: statsProcessing } = useQuery({
    queryKey: ['admin-orders-stats', 'PROCESSING'],
    queryFn: () => ordersApi.adminGetAll({ page: 1, limit: 1, status: 'PROCESSING' }),
  });
  const { data: statsDelivered } = useQuery({
    queryKey: ['admin-orders-stats', 'DELIVERED'],
    queryFn: () => ordersApi.adminGetAll({ page: 1, limit: 1, status: 'DELIVERED' }),
  });
  const { data: statsCancelled } = useQuery({
    queryKey: ['admin-orders-stats', 'CANCELLED'],
    queryFn: () => ordersApi.adminGetAll({ page: 1, limit: 1, status: 'CANCELLED' }),
  });
  const { data: statsAll } = useQuery({
    queryKey: ['admin-orders-stats', 'ALL'],
    queryFn: () => ordersApi.adminGetAll({ page: 1, limit: 1 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      ordersApi.adminUpdateStatus(id, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-orders-stats'] });
      setStatusModal(null);
    },
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const statCards = [
    {
      label: 'Total Orders', value: statsAll?.meta.total ?? '-',
      icon: ShoppingBag, bg: 'bg-blue-50', color: 'text-blue-600',
      onClick: () => setStatusFilter('ALL'),
    },
    {
      label: 'Pending', value: statsPending?.meta.total ?? '-',
      icon: Clock, bg: 'bg-yellow-50', color: 'text-yellow-600',
      onClick: () => setStatusFilter('PENDING'),
    },
    {
      label: 'Processing', value: statsProcessing?.meta.total ?? '-',
      icon: RefreshCw, bg: 'bg-purple-50', color: 'text-purple-600',
      onClick: () => setStatusFilter('PROCESSING'),
    },
    {
      label: 'Delivered', value: statsDelivered?.meta.total ?? '-',
      icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-600',
      onClick: () => setStatusFilter('DELIVERED'),
    },
    {
      label: 'Cancelled', value: statsCancelled?.meta.total ?? '-',
      icon: XCircle, bg: 'bg-red-50', color: 'text-red-600',
      onClick: () => setStatusFilter('CANCELLED'),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Orders</h1>
          {meta && <p className="text-sm text-muted-foreground">{meta.total} orders</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map(card => (
          <button
            key={card.label}
            onClick={card.onClick}
            className={`rounded-xl border bg-card p-4 flex items-center gap-3 text-left transition-all hover:shadow-md hover:-translate-y-px
              ${statusFilter === (card.label === 'Total Orders' ? 'ALL' : card.label.toUpperCase().replace(' ', '_'))
                ? 'border-primary ring-1 ring-primary/20' : ''}`}
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Advanced Filters</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-muted-foreground text-sm">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setDebouncedSearch(''); }}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Search + Status tabs */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search order #, customer..."
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5 border-b pb-3">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value as string); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all
                ${statusFilter === s.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border hover:bg-accent text-muted-foreground hover:text-foreground'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusFilter === s.value ? 'bg-white' : s.dot}`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order #</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Customer</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Payment</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">Date</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground">
                      <Package className="mx-auto h-8 w-8 mb-2 opacity-30" />
                      No orders found
                    </td>
                  </tr>
                ) : orders.map(order => {
                  const statusInfo = STATUSES.find(s => s.value === order.status);
                  return (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-primary">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground xl:hidden">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </td>

                      <td className="hidden px-4 py-3 sm:table-cell">
                        <p className="font-medium">
                          {order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : order.customer?.name ?? 'Guest'}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.user?.email ?? order.customer?.email}</p>
                      </td>

                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setStatusModal({ orderId: order.id, current: order.status })}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80 hover:shadow-sm cursor-pointer
                            ${STATUS_BADGE[order.status] ?? 'bg-muted text-foreground border-border'}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusInfo?.dot ?? 'bg-gray-400'}`} />
                          {order.status.replace(/_/g, ' ')}
                        </button>
                      </td>

                      <td className="hidden px-4 py-3 lg:table-cell">
                        <div>
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${PAYMENT_BADGE[order.paymentStatus] ?? 'bg-muted'}`}>
                            {order.paymentStatus}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">{order.paymentMethod}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                        {Number(order.discount) > 0 && (
                          <p className="text-xs text-green-600">-{formatCurrency(Number(order.discount))}</p>
                        )}
                      </td>

                      <td className="hidden px-4 py-3 xl:table-cell text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`}
                          className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
              const p = meta.totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= meta.totalPages - 3 ? meta.totalPages - 6 + i
                : page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground font-medium' : 'border hover:bg-accent'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Status update modal */}
      {statusModal && (
        <StatusUpdateModal
          orderId={statusModal.orderId}
          current={statusModal.current}
          onClose={() => setStatusModal(null)}
          onUpdate={(status, note) => updateStatus.mutate({ id: statusModal.orderId, status, note })}
        />
      )}

      {/* Loading overlay for status update */}
      {updateStatus.isPending && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="rounded-xl bg-card px-6 py-4 shadow-2xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Updating status...</span>
          </div>
        </div>
      )}
    </div>
  );
}
