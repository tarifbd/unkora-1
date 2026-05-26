'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, X, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface ReturnRequest {
  id: string;
  orderId: string;
  amount: number | string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  order?: { id: string; orderNumber: string; status: string; total: number | string };
}

interface ReturnStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processed: number;
}

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PROCESSED: 'bg-blue-100 text-blue-700',
};

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: 'Defective Product',
  NOT_AS_DESCRIBED: 'Not as Described',
  WRONG_ITEM: 'Wrong Item',
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  OTHER: 'Other',
};

function formatTaka(amount: number | string) {
  const n = Number(amount);
  return `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const inputCls =
  'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [stats, setStats] = useState<ReturnStats>({ total: 0, pending: 0, approved: 0, rejected: 0, processed: 0 });
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [panelStatus, setPanelStatus] = useState('');
  const [panelNote, setPanelNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page };
      if (filter !== 'ALL') params.status = filter;

      const [returnsRes, statsRes] = await Promise.all([
        api.get('/returns', { params }).then(r => r.data.data),
        api.get('/returns/stats').then(r => r.data.data),
      ]);

      setReturns(Array.isArray(returnsRes?.data) ? returnsRes.data : []);
      if (statsRes) setStats(statsRes);
    } catch {
      setError('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { void loadData(); }, [loadData]);

  const openPanel = (r: ReturnRequest) => {
    setSelected(r);
    setPanelStatus(r.status);
    setPanelNote(r.adminNote ?? '');
    setSaveError(null);
  };

  const closePanel = () => { setSelected(null); setSaveError(null); };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch(`/returns/${selected.id}/status`, {
        status: panelStatus,
        adminNote: panelNote,
      });
      setReturns(prev =>
        prev.map(r =>
          r.id === selected.id
            ? { ...r, status: panelStatus as ReturnRequest['status'], adminNote: panelNote }
            : r,
        ),
      );
      closePanel();
      void loadData();
    } catch {
      setSaveError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const quickAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/returns/${id}/status`, { status });
      setReturns(prev =>
        prev.map(r => (r.id === id ? { ...r, status } : r)),
      );
      void loadData();
    } catch {
      // silently fail — user can use panel for retry
    }
  };

  const tabs: FilterTab[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'];

  const statsCards = [
    { label: 'Total Returns', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700 border-red-200' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Returns & Exchanges</h1>
        <p className="text-sm text-muted-foreground">Manage customer return and refund requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsCards.map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs font-medium mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); setPage(1); }}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === tab
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : returns.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <RotateCcw className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            No return requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returns.map(r => {
                  const customer = r.user;
                  const date = new Date(r.createdAt).toLocaleDateString('en-BD', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  });
                  return (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {r.order?.orderNumber ?? r.orderId.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        {customer ? (
                          <>
                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatTaka(r.amount)}</td>
                      <td className="px-4 py-3 text-xs">{REASON_LABELS[r.reason] ?? r.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground whitespace-nowrap lg:table-cell">{date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => quickAction(r.id, 'APPROVED')}
                                title="Approve"
                                className="rounded-md border border-green-200 p-1.5 text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => quickAction(r.id, 'REJECTED')}
                                title="Reject"
                                className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openPanel(r)}
                            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                          >
                            Review
                          </button>
                        </div>
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
        <span className="px-2 text-xs text-muted-foreground">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={loading || returns.length < 20}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>

      {/* Slide-over Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePanel} />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">Review Return Request</h2>
              <button
                onClick={closePanel}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-6">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order #</span>
                  <span className="font-mono font-medium">
                    {selected.order?.orderNumber ?? selected.orderId.slice(-8)}
                  </span>
                </div>
                {selected.user && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">
                      {selected.user.firstName} {selected.user.lastName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-base">{formatTaka(selected.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium">{REASON_LABELS[selected.reason] ?? selected.reason}</span>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{selected.description}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <select
                  value={panelStatus}
                  onChange={e => setPanelStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PROCESSED">Processed</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Admin Note</label>
                <textarea
                  value={panelNote}
                  onChange={e => setPanelNote(e.target.value)}
                  rows={4}
                  placeholder="Add a note for this decision..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closePanel}
                className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
