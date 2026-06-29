'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, CheckCircle2, Clock, DollarSign, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const courierApi = {
  list: (params?: object) => api.get('/courier', { params }).then(r => r.data.data),
  getStats: () => api.get('/courier/stats').then(r => r.data.data),
  getCodPending: () => api.get('/courier/cod-pending').then(r => r.data.data),
};

const PROVIDERS = ['ALL', 'PATHAO', 'STEADFAST', 'REDX', 'PAPERFLY', 'SUNDARBAN', 'SA_PORIBAHAN', 'CARRYBEE'];
const STATUSES = ['ALL', 'PENDING', 'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CREATED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  RETURNED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PROVIDER_COLORS: Record<string, string> = {
  PATHAO: 'bg-red-100 text-red-700',
  STEADFAST: 'bg-blue-100 text-blue-700',
  REDX: 'bg-orange-100 text-orange-700',
  PAPERFLY: 'bg-green-100 text-green-700',
  SUNDARBAN: 'bg-purple-100 text-purple-700',
  SA_PORIBAHAN: 'bg-teal-100 text-teal-700',
  CARRYBEE: 'bg-amber-100 text-amber-700',
};

export default function CourierPage() {
  const [provider, setProvider] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const { data: stats } = useQuery({ queryKey: ['courier-stats'], queryFn: courierApi.getStats });
  const { data, isLoading } = useQuery({
    queryKey: ['courier-shipments', provider, status],
    queryFn: () => courierApi.list({
      provider: provider === 'ALL' ? undefined : provider,
      status: status === 'ALL' ? undefined : status,
    }),
  });
  const { data: codPending } = useQuery({ queryKey: ['cod-pending'], queryFn: courierApi.getCodPending });

  const shipments = data?.data ?? [];
  const byProvider: Array<{ provider: string; count: number }> = stats?.byProvider ?? [];
  const codTotal = (codPending ?? []).reduce((s: number, c: any) => s + Number(c.codAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Courier Integration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage shipments across Pathao, Steadfast, RedX, and other couriers</p>
      </div>

      {/* Provider Stats */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {byProvider.map(p => (
          <div key={p.provider} className="rounded-xl border bg-card p-3 text-center">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold mb-1 ${PROVIDER_COLORS[p.provider] ?? 'bg-gray-100 text-gray-600'}`}>
              {p.provider}
            </span>
            <p className="text-2xl font-bold">{p.count}</p>
            <p className="text-xs text-muted-foreground">shipments</p>
          </div>
        ))}
        <div className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100 p-3 text-center">
          <DollarSign className="h-4 w-4 text-orange-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-orange-700">{formatCurrency(codTotal)}</p>
          <p className="text-xs text-orange-600">COD Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {PROVIDERS.map(p => (
            <button key={p} onClick={() => setProvider(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${provider === p ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${status === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Tracking</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">COD</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium font-mono">{s.order?.orderNumber ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(Number(s.order?.total ?? 0))}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{s.order?.user?.firstName} {s.order?.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{s.order?.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PROVIDER_COLORS[s.provider] ?? 'bg-gray-100'}`}>
                      {s.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.trackingCode ? (
                      <code className="text-xs bg-muted rounded px-1.5 py-0.5">{s.trackingCode}</code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {s.codAmount ? formatCurrency(Number(s.codAmount)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString('en-BD')}
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Truck className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">No shipments found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
