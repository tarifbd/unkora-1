'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Users, TrendingUp, Clock, Loader2, CheckCircle2, XCircle, Search } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const sellersApi = {
  list: (params?: object) => api.get('/sellers', { params }).then(r => r.data.data),
  getStats: () => api.get('/sellers/stats').then(r => r.data.data),
  updateStatus: (id: string, status: string) => api.patch(`/sellers/${id}/status`, { status }).then(r => r.data.data),
  getWithdrawals: (params?: object) => api.get('/sellers/withdrawals', { params }).then(r => r.data.data),
  processWithdrawal: (id: string, status: string) => api.patch(`/sellers/withdrawals/${id}`, { status }).then(r => r.data.data),
};

type Tab = 'sellers' | 'withdrawals';
type StatusFilter = 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-gray-100 text-gray-600',
};

export default function SellersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('sellers');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({ queryKey: ['sellers-stats'], queryFn: sellersApi.getStats });
  const { data, isLoading } = useQuery({
    queryKey: ['sellers', statusFilter, search],
    queryFn: () => sellersApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter, search }),
  });
  const { data: withdrawalData, isLoading: wLoading } = useQuery({
    queryKey: ['seller-withdrawals'],
    queryFn: () => sellersApi.getWithdrawals(),
    enabled: tab === 'withdrawals',
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sellersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sellers'] }); qc.invalidateQueries({ queryKey: ['sellers-stats'] }); },
  });

  const processWithdrawal = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sellersApi.processWithdrawal(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-withdrawals'] }),
  });

  const sellers = data?.data ?? [];
  const withdrawals = withdrawalData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage marketplace sellers and their withdrawals</p>
        </div>
        <div className="flex gap-2">
          {(['sellers', 'withdrawals'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats?.total ?? 0, icon: Store, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: stats?.active ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Suspended', value: stats?.suspended ?? 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tab === 'sellers' ? (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search sellers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {(['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Shop</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Owner</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Sales</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Commission</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sellers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} className="h-8 w-8 rounded object-cover" alt="" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                            <Store className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{s.shopName}</p>
                          <p className="text-xs text-muted-foreground">@{s.shopSlug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{s.user?.firstName} {s.user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-sm">{formatCurrency(Number(s.totalSales))}</td>
                    <td className="px-4 py-3 text-center text-sm">{s.commissionRate}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[s.status] ?? ''}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {s.status === 'PENDING' && (
                          <button onClick={() => updateStatus.mutate({ id: s.id, status: 'ACTIVE' })}
                            className="rounded-lg bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700">
                            Approve
                          </button>
                        )}
                        {s.status === 'ACTIVE' && (
                          <button onClick={() => updateStatus.mutate({ id: s.id, status: 'SUSPENDED' })}
                            className="rounded-lg border px-2.5 py-1 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                            Suspend
                          </button>
                        )}
                        {s.status === 'SUSPENDED' && (
                          <button onClick={() => updateStatus.mutate({ id: s.id, status: 'ACTIVE' })}
                            className="rounded-lg bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700">
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No sellers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Seller</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Method</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {withdrawals.map((w: any) => (
                <tr key={w.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm">{w.seller?.shopName ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(w.amount))}</td>
                  <td className="px-4 py-3 text-sm capitalize">{w.method}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.status === 'APPROVED' ? 'bg-green-100 text-green-700' : w.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString('en-BD')}</td>
                  <td className="px-4 py-3 text-right">
                    {w.status === 'PENDING' && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => processWithdrawal.mutate({ id: w.id, status: 'APPROVED' })}
                          className="rounded bg-green-600 px-2.5 py-1 text-xs text-white">Approve</button>
                        <button onClick={() => processWithdrawal.mutate({ id: w.id, status: 'REJECTED' })}
                          className="rounded border px-2.5 py-1 text-xs hover:text-red-600">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No withdrawals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
