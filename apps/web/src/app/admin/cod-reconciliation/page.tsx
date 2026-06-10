'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Package, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
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
  codReconciled: boolean;
  codReceivedAt?: string | null;
  codReceivedBy?: string | null;
  codNotes?: string | null;
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
  const [reconcileFilter, setReconcileFilter] = useState<'all' | 'pending' | 'reconciled'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reconcileModal, setReconcileModal] = useState<{ id: string; notes: string } | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page };
      if (provider) params.provider = provider;
      if (reconcileFilter !== 'all') params.reconciled = reconcileFilter === 'reconciled';

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
  }, [page, provider, reconcileFilter]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleReconcile = async () => {
    if (!reconcileModal) return;
    setReconciling(true);
    try {
      await api.patch(`/cod-reconciliation/${reconcileModal.id}/reconcile`, { notes: reconcileModal.notes });
      toast.success('Marked as reconciled');
      setReconcileModal(null);
      void loadData();
    } catch {
      toast.error('Failed to reconcile');
    } finally {
      setReconciling(false);
    }
  };

  const handleUnreconcile = async (id: string) => {
    try {
      await api.patch(`/cod-reconciliation/${id}/unreconcile`);
      toast.success('Unreconciled');
      void loadData();
    } catch {
      toast.error('Failed');
    }
  };

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

      {/* Filters */}
      <div className="space-y-3">
        {/* Reconciliation status filter tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'reconciled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setReconcileFilter(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                reconcileFilter === tab
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : 'Reconciled'}
            </button>
          ))}
        </div>

        {/* Provider filter */}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Actions</th>
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
                      <td className="px-4 py-3">
                        {s.codReconciled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            <Check className="h-3 w-3" />
                            Reconciled
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.codReconciled ? (
                          <button
                            onClick={() => handleUnreconcile(s.id)}
                            title="Undo reconciliation"
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Undo
                          </button>
                        ) : (
                          <button
                            onClick={() => setReconcileModal({ id: s.id, notes: '' })}
                            title="Mark as reconciled"
                            className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Mark Reconciled
                          </button>
                        )}
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

      {/* Reconcile Modal */}
      {reconcileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-lg mb-3">Mark as Reconciled</h3>
            <textarea
              value={reconcileModal.notes}
              onChange={e => setReconcileModal(m => m ? { ...m, notes: e.target.value } : null)}
              placeholder="Notes (optional) — e.g. Received ৳5,000 on 15 Jan"
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReconcileModal(null)}
                className="flex-1 border rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReconcile}
                disabled={reconciling}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reconciling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
