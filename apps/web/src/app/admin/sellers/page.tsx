'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Users, TrendingUp, Clock, Loader2, CheckCircle2, XCircle,
  Search, BookOpen, Eye, Wallet, Zap, RefreshCw, X, BookMarked, Globe, User,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// ─── API ──────────────────────────────────────────────────────

const sellersApi = {
  list:              (p?: object) => api.get('/sellers', { params: p }).then(r => r.data.data),
  getStats:          ()           => api.get('/sellers/stats').then(r => r.data.data),
  updateStatus:      (id: string, status: string) => api.patch(`/sellers/${id}/status`, { status }).then(r => r.data.data),
  getWithdrawals:    (p?: object) => api.get('/sellers/withdrawals', { params: p }).then(r => r.data.data),
  processWithdrawal: (id: string, status: string) => api.patch(`/sellers/withdrawals/${id}`, { status }).then(r => r.data.data),
  setCommission:     (id: string, commissionRate: number) => api.patch(`/sellers/${id}`, { commissionRate }).then(r => r.data.data),
};

const submissionsApi = {
  list:   (p?: object) => api.get('/book-submissions', { params: p }).then(r => r.data.data),
  stats:  ()           => api.get('/book-submissions/stats').then(r => r.data.data),
  update: (id: string, data: object) => api.patch(`/book-submissions/${id}`, data).then(r => r.data.data),
};

// ─── Status maps ──────────────────────────────────────────────

const SELLER_STATUS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  ACTIVE:    'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  REJECTED:  'bg-gray-100 text-gray-600',
};

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:      { label: 'Pending',       cls: 'bg-yellow-100 text-yellow-700' },
  UNDER_REVIEW: { label: 'Under Review',  cls: 'bg-blue-100 text-blue-700' },
  APPROVED:     { label: 'Approved',      cls: 'bg-green-100 text-green-700' },
  REJECTED:     { label: 'Rejected',      cls: 'bg-red-100 text-red-700' },
  PUBLISHED:    { label: 'Published',     cls: 'bg-emerald-100 text-emerald-700' },
};

type Tab = 'sellers' | 'submissions' | 'withdrawals';

// ─── Submission Modal ─────────────────────────────────────────

function SubmissionModal({ sub, onClose, onUpdate }: { sub: any; onClose: () => void; onUpdate: (id: string, data: object) => Promise<any> }) {
  const [note, setNote]     = useState(sub.adminNote ?? '');
  const [royalty, setRoyalty] = useState(String(sub.royaltyPercent ?? 10));
  const [price, setPrice]   = useState(String(sub.suggestedPrice ?? ''));
  const [acting, setActing] = useState(false);

  const act = async (status: string) => {
    setActing(true);
    try {
      await onUpdate(sub.id, { status, adminNote: note || undefined, royaltyPercent: parseInt(royalty), finalPrice: parseFloat(price) || undefined });
    } finally { setActing(false); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Review Submission</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Book info */}
          <div className="flex gap-4">
            <div className="w-20 h-28 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border">
              {sub.coverImageUrl
                ? <img src={sub.coverImageUrl} alt={sub.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-7 h-7 text-gray-300" /></div>}
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{sub.title}</h3>
              <p className="text-sm text-gray-600 mb-1">by {sub.authorName}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(sub.bookType === 'EBOOK' || sub.digitalFileUrl) && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> E-Book
                  </span>
                )}
                {sub.genres?.map((g: string) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">{g}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <User className="w-3 h-3" /> {sub.user?.email}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed line-clamp-4">{sub.description}</p>

          {sub.product && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Product created: {sub.product.name}</span>
            </div>
          )}

          {sub.status !== 'APPROVED' && sub.status !== 'PUBLISHED' && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Final Price (৳)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={sub.suggestedPrice} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Royalty %</label>
                <input type="number" min="1" max="90" value={royalty} onChange={e => setRoyalty(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <p className="text-xs text-gray-400 mt-1">
                  ৳{(((parseFloat(price) || parseFloat(sub.suggestedPrice)) * parseInt(royalty)) / 100).toFixed(0)}/sale
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Admin Note</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Feedback for the author..." />
          </div>
        </div>

        <div className="border-t px-6 py-4 flex gap-2 flex-wrap">
          {sub.status === 'PENDING' && (
            <button onClick={() => act('UNDER_REVIEW')} disabled={acting}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <RefreshCw className="w-3.5 h-3.5" /> Under Review
            </button>
          )}
          {['PENDING', 'UNDER_REVIEW'].includes(sub.status) && (
            <>
              <button onClick={() => act('APPROVED')} disabled={acting}
                className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-60">
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve + Create Product
              </button>
              <button onClick={() => act('REJECTED')} disabled={acting}
                className="flex items-center gap-1.5 border border-red-200 text-red-600 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-red-50 disabled:opacity-60">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          {sub.status === 'APPROVED' && sub.product && (
            <button onClick={() => act('PUBLISHED')} disabled={acting}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-60">
              <Zap className="w-3.5 h-3.5" /> Publish Live
            </button>
          )}
          <button onClick={onClose} className="ml-auto text-sm text-gray-500 font-medium py-2 px-4 rounded-lg hover:bg-gray-100">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────

export default function SellersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('submissions');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subFilter, setSubFilter]       = useState('ALL');
  const [search, setSearch]             = useState('');
  const [subSearch, setSubSearch]       = useState('');
  const [selectedSub, setSelectedSub]   = useState<any | null>(null);
  const [editCommission, setEditCommission] = useState<{ id: string; rate: string } | null>(null);

  // Sellers data
  const { data: sellerStats }   = useQuery({ queryKey: ['sellers-stats'],   queryFn: sellersApi.getStats });
  const { data: sellersData, isLoading: sellersLoading } = useQuery({
    queryKey: ['sellers', statusFilter, search],
    queryFn: () => sellersApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter, search: search || undefined }),
    enabled: tab === 'sellers',
  });
  const { data: wData, isLoading: wLoading } = useQuery({
    queryKey: ['seller-withdrawals'],
    queryFn: () => sellersApi.getWithdrawals(),
    enabled: tab === 'withdrawals',
  });

  // Submissions data
  const { data: subStats }    = useQuery({ queryKey: ['bs-stats'],    queryFn: submissionsApi.stats });
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['book-submissions', subFilter, subSearch],
    queryFn: () => submissionsApi.list({ status: subFilter === 'ALL' ? undefined : subFilter, search: subSearch || undefined }),
    enabled: tab === 'submissions',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sellersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sellers'] }); qc.invalidateQueries({ queryKey: ['sellers-stats'] }); },
  });
  const withdrawalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => sellersApi.processWithdrawal(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-withdrawals'] }),
  });
  const commissionMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) => sellersApi.setCommission(id, rate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sellers'] }); setEditCommission(null); },
  });
  const subMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => submissionsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['book-submissions'] }); qc.invalidateQueries({ queryKey: ['bs-stats'] }); },
  });

  const sellers     = sellersData?.data ?? [];
  const withdrawals = wData?.data ?? [];
  const submissions = subsData?.data ?? [];

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'submissions', label: 'Book Submissions', badge: subStats?.pending },
    { id: 'sellers',     label: 'Sellers',          badge: sellerStats?.pending },
    { id: 'withdrawals', label: 'Withdrawals' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review book submissions, manage sellers & process withdrawals</p>
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors relative ${tab === t.id ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {t.label}
              {t.badge ? (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{t.badge > 9 ? '9+' : t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOOK SUBMISSIONS TAB ── */}
      {tab === 'submissions' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { label: 'Total',     value: subStats?.total ?? 0,       cls: 'text-blue-600 bg-blue-50',    icon: BookOpen },
              { label: 'Pending',   value: subStats?.pending ?? 0,     cls: 'text-yellow-600 bg-yellow-50',icon: Clock },
              { label: 'Reviewing', value: subStats?.underReview ?? 0, cls: 'text-indigo-600 bg-indigo-50',icon: Eye },
              { label: 'Approved',  value: subStats?.approved ?? 0,    cls: 'text-green-600 bg-green-50',  icon: CheckCircle2 },
              { label: 'Published', value: subStats?.published ?? 0,   cls: 'text-emerald-600 bg-emerald-50',icon: Zap },
              { label: 'Rejected',  value: subStats?.rejected ?? 0,    cls: 'text-red-600 bg-red-50',      icon: XCircle },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.cls} flex-shrink-0`}>
                    <s.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search title, author, email..." value={subSearch} onChange={e => setSubSearch(e.target.value)} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'].map(s => (
                <button key={s} onClick={() => setSubFilter(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${subFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {subsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Book</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Submitter</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map((sub: any) => {
                    const si = SUB_STATUS[sub.status] ?? { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' };
                    const isEbook = sub.bookType === 'EBOOK' || sub.digitalFileUrl;
                    return (
                      <tr key={sub.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
                              {sub.coverImageUrl
                                ? <img src={sub.coverImageUrl} alt={sub.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-gray-300" /></div>}
                            </div>
                            <div>
                              <p className="font-semibold line-clamp-1 max-w-[160px]">{sub.title}</p>
                              <p className="text-xs text-muted-foreground">{sub.authorName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{sub.user?.firstName} {sub.user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium flex items-center justify-center gap-1 ${isEbook ? 'text-purple-600' : 'text-gray-500'}`}>
                            {isEbook ? <Zap className="w-3 h-3" /> : <BookMarked className="w-3 h-3" />}
                            {isEbook ? 'E-Book' : 'Physical'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(sub.suggestedPrice))}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${si.cls}`}>{si.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setSelectedSub(sub)}
                              className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Review
                            </button>
                            {sub.status === 'PENDING' && (
                              <button onClick={() => subMutation.mutate({ id: sub.id, data: { status: 'APPROVED', royaltyPercent: 10 } })}
                                className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700">
                                ✓ Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      No submissions found.
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── SELLERS TAB ── */}
      {tab === 'sellers' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: 'Total',     value: sellerStats?.total ?? 0,        icon: Store,       color: 'text-blue-600 bg-blue-50' },
              { label: 'Active',    value: sellerStats?.active ?? 0,       icon: CheckCircle2,color: 'text-green-600 bg-green-50' },
              { label: 'Pending',   value: sellerStats?.pending ?? 0,      icon: Clock,       color: 'text-yellow-600 bg-yellow-50' },
              { label: 'Suspended', value: sellerStats?.suspended ?? 0,    icon: XCircle,     color: 'text-red-600 bg-red-50' },
              { label: 'Revenue',   value: formatCurrency(sellerStats?.totalRevenue ?? 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
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

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search sellers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
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
                        {s.logoUrl
                          ? <img src={s.logoUrl} className="h-8 w-8 rounded object-cover" alt="" />
                          : <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10"><Store className="h-4 w-4 text-primary" /></div>}
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
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(s.totalSales))}</td>
                    <td className="px-4 py-3 text-center">
                      {editCommission !== null && editCommission?.id === s.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input type="number" value={editCommission!.rate} min="1" max="90"
                            onChange={e => setEditCommission({ id: s.id, rate: e.target.value })}
                            className="w-14 border rounded px-1.5 py-1 text-xs text-center" />
                          <button onClick={() => commissionMutation.mutate({ id: s.id, rate: parseFloat(editCommission!.rate) })}
                            className="text-green-600 text-xs font-bold">✓</button>
                          <button onClick={() => setEditCommission(null)} className="text-red-500 text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditCommission({ id: s.id, rate: String(s.commissionRate) })}
                          className="text-sm font-semibold hover:text-primary transition-colors">
                          {s.commissionRate}%
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SELLER_STATUS[s.status] ?? ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {s.status === 'PENDING' && (
                          <button onClick={() => statusMutation.mutate({ id: s.id, status: 'ACTIVE' })}
                            className="rounded-lg bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700">Approve</button>
                        )}
                        {s.status === 'ACTIVE' && (
                          <button onClick={() => statusMutation.mutate({ id: s.id, status: 'SUSPENDED' })}
                            className="rounded-lg border px-2.5 py-1 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200">Suspend</button>
                        )}
                        {s.status === 'SUSPENDED' && (
                          <button onClick={() => statusMutation.mutate({ id: s.id, status: 'ACTIVE' })}
                            className="rounded-lg bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700">Restore</button>
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
      )}

      {/* ── WITHDRAWALS TAB ── */}
      {tab === 'withdrawals' && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Seller</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Note</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {withdrawals.map((w: any) => (
                <tr key={w.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-sm">{w.seller?.shopName ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(w.amount))}</td>
                  <td className="px-4 py-3 text-sm capitalize">{w.method}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{w.note ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.status === 'APPROVED' ? 'bg-green-100 text-green-700' : w.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString('en-BD')}</td>
                  <td className="px-4 py-3 text-right">
                    {w.status === 'PENDING' && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => withdrawalMutation.mutate({ id: w.id, status: 'APPROVED' })}
                          className="rounded bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700">Approve</button>
                        <button onClick={() => withdrawalMutation.mutate({ id: w.id, status: 'REJECTED' })}
                          className="rounded border px-2.5 py-1 text-xs hover:text-red-600">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No withdrawals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedSub && (
        <SubmissionModal
          sub={selectedSub}
          onClose={() => setSelectedSub(null)}
          onUpdate={(id, data) => subMutation.mutateAsync({ id, data })}
        />
      )}
    </div>
  );
}
