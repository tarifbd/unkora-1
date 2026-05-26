'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Package } from 'lucide-react';
import api from '@/lib/api';

interface CourierShipment {
  id: string;
  orderId: string;
  provider: string;
  consignmentId?: string;
  trackingCode?: string;
  status: string;
  codAmount: number | string | null;
  charge?: number | string | null;
  deliveredAt?: string | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    total: number | string;
    user?: { firstName: string; lastName: string; email: string };
  };
}

interface CodStats {
  totalCodCollected: number;
  totalShipments: number;
  pending: number;
  reconciled: number;
}

interface ProviderSummary {
  provider: string;
  count: number;
  totalCod: number;
}

const PROVIDERS = ['PATHAO', 'STEADFAST', 'REDX', 'PAPERFLY', 'SUNDARBAN', 'SA_PORIBAHAN'];

const PROVIDER_COLORS: Record<string, string> = {
  PATHAO: 'bg-red-100 text-red-700',
  STEADFAST: 'bg-blue-100 text-blue-700',
  REDX: 'bg-orange-100 text-orange-700',
  PAPERFLY: 'bg-purple-100 text-purple-700',
  SUNDARBAN: 'bg-green-100 text-green-700',
  SA_PORIBAHAN: 'bg-yellow-100 text-yellow-700',
};

function formatTaka(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0);
  return `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CodReconciliationPage() {
  const [shipments, setShipments] = useState<CourierShipment[]>([]);
  const [stats, setStats] = useState<CodStats | null>(null);
  const [summary, setSummary] = useState<ProviderSummary[]>([]);
  const [provider, setProvider] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page };
      if (provider) params.provider = provider;

      const [shipmentsRes, statsRes, summaryRes] = await Promise.all([
        api.get('/cod-reconciliation', { params }).then(r => r.data.data),
        api.get('/cod-reconciliation/stats').then(r => r.data.data),
        api.get('/cod-reconciliation/summary').then(r => r.data.data),
      ]);

      setShipments(Array.isArray(shipmentsRes?.data) ? shipmentsRes.data : []);
      setTotalPages(shipmentsRes?.meta?.totalPages ?? 1);
      setStats(statsRes);
      setSummary(Array.isArray(summaryRes) ? summaryRes : []);
    } catch {
      setError('Failed to load COD reconciliation data');
    } finally {
      setLoading(false);
    }
  }, [page, provider]);

  useEffect(() => { void loadData(); }, [loadData]);

  const statsCards = stats
    ? [
        { label: 'Total COD', value: formatTaka(stats.totalCodCollected), color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Total Shipments', value: stats.totalShipments, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Collected', value: formatTaka(stats.totalCodCollected), color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Reconciled', value: formatTaka(stats.reconciled), color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">COD Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Track and reconcile cash on delivery payments from couriers
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statsCards.map(card => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
              <p className="text-xl font-bold">{card.value}</p>
              <p className="text-xs font-medium mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Provider Summary */}
      {summary.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            By Provider
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {summary.map(s => (
              <div key={s.provider} className="rounded-xl border bg-card p-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-2 ${PROVIDER_COLORS[s.provider] ?? 'bg-muted text-muted-foreground'}`}>
                  {s.provider}
                </span>
                <p className="font-bold text-sm">{formatTaka(s.totalCod)}</p>
                <p className="text-xs text-muted-foreground">{s.count} shipments</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="mr-2 text-sm font-medium">Filter by Provider</label>
          <select
            value={provider}
            onChange={e => { setProvider(e.target.value); setPage(1); }}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Providers</option>
            {PROVIDERS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : shipments.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            No COD shipments found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tracking</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">COD Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Charge</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Delivered At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shipments.map(s => {
                  const deliveredAt = s.deliveredAt
                    ? new Date(s.deliveredAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  return (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {s.order?.orderNumber ?? s.orderId.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        {s.order?.user ? (
                          <>
                            <p className="font-medium">{s.order.user.firstName} {s.order.user.lastName}</p>
                            <p className="text-xs text-muted-foreground">{s.order.user.email}</p>
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLORS[s.provider] ?? 'bg-muted text-muted-foreground'}`}>
                          {s.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {s.trackingCode ?? s.consignmentId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        {formatTaka(s.codAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {s.charge ? formatTaka(s.charge) : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                        {deliveredAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1 || loading}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <span className="px-2 text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages || loading}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
