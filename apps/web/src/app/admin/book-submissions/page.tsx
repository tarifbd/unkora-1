'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  BookOpen, Search, CheckCircle2, XCircle, Clock, Eye, Loader2,
  FileText, BookMarked, Globe, User, X, RefreshCw, Zap,
} from 'lucide-react';

// ─── API helpers ─────────────────────────────────────────────

const submissionsApi = {
  list: (params?: object) =>
    api.get('/book-submissions', { params }).then(r => r.data.data),
  stats: () =>
    api.get('/book-submissions/stats').then(r => r.data.data),
  update: (id: string, data: object) =>
    api.patch(`/book-submissions/${id}`, data).then(r => r.data.data),
};

// ─── Types ───────────────────────────────────────────────────

type Status = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

const STATUS_INFO: Record<Status, { label: string; cls: string; bg: string }> = {
  PENDING:      { label: 'Pending',      cls: 'text-yellow-700 bg-yellow-100', bg: 'bg-yellow-50' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'text-blue-700 bg-blue-100',    bg: 'bg-blue-50' },
  APPROVED:     { label: 'Approved',     cls: 'text-green-700 bg-green-100',   bg: 'bg-green-50' },
  REJECTED:     { label: 'Rejected',     cls: 'text-red-700 bg-red-100',       bg: 'bg-red-50' },
  PUBLISHED:    { label: 'Published',    cls: 'text-emerald-700 bg-emerald-100', bg: 'bg-emerald-50' },
};

// ─── Detail Modal ─────────────────────────────────────────────

function SubmissionModal({
  sub, onClose, onUpdate,
}: {
  sub: any;
  onClose: () => void;
  onUpdate: (id: string, data: object) => void;
}) {
  const [note, setNote] = useState(sub.adminNote ?? '');
  const [royalty, setRoyalty] = useState(String(sub.royaltyPercent ?? 10));
  const [price, setPrice] = useState(String(sub.suggestedPrice ?? ''));
  const [acting, setActing] = useState(false);

  const act = async (status: string) => {
    setActing(true);
    await onUpdate(sub.id, {
      status,
      adminNote: note || undefined,
      royaltyPercent: parseInt(royalty),
      finalPrice: parseFloat(price) || undefined,
    });
    setActing(false);
    onClose();
  };

  const si = STATUS_INFO[sub.status as Status] ?? STATUS_INFO.PENDING;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-gray-900">Book Submission Review</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Book cover + info */}
          <div className="flex gap-5">
            <div className="w-24 h-32 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border">
              {sub.coverImageUrl ? (
                <img src={sub.coverImageUrl} alt={sub.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-gray-900 mb-1">{sub.title}</h3>
              <p className="text-gray-600 font-medium mb-1">by {sub.authorName}</p>
              {sub.publisherName && <p className="text-sm text-gray-400">{sub.publisherName}</p>}

              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${si.cls}`}>{si.label}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {sub.language}
                </span>
                {sub.pageCount && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {sub.pageCount}p
                  </span>
                )}
                {sub.genres?.map((g: string) => (
                  <span key={g} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{g}</span>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <User className="w-3.5 h-3.5" />
                  {sub.user?.firstName} {sub.user?.lastName}
                  <span className="text-gray-400">({sub.user?.email})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{sub.description}</p>
          </div>

          {/* Already has product? */}
          {sub.product && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Product Created: {sub.product.name}</p>
                <a href={`/products/${sub.product.slug}`} target="_blank"
                  className="text-xs text-green-600 underline">/{sub.product.slug}</a>
              </div>
            </div>
          )}

          {/* Approval settings */}
          {sub.status !== 'APPROVED' && sub.status !== 'PUBLISHED' && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Approval Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Final Price (৳)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={`Suggested: ${sub.suggestedPrice}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Royalty %</label>
                  <input
                    type="number" min="1" max="90"
                    value={royalty}
                    onChange={e => setRoyalty(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Author earns ৳{((parseFloat(price) || parseFloat(sub.suggestedPrice)) * parseInt(royalty) / 100).toFixed(0)} per sale
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin note */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Admin Note (visible to author)</label>
            <textarea
              rows={3} value={note} onChange={e => setNote(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Feedback, rejection reason, or publishing notes..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t px-6 py-4 flex gap-3 flex-wrap">
          {sub.status === 'PENDING' && (
            <button onClick={() => act('UNDER_REVIEW')} disabled={acting}
              className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
              <RefreshCw className="w-4 h-4" /> Mark Under Review
            </button>
          )}
          {(sub.status === 'PENDING' || sub.status === 'UNDER_REVIEW') && (
            <>
              <button onClick={() => act('APPROVED')} disabled={acting}
                className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-green-700 disabled:opacity-60 transition-colors">
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve & Create Product
              </button>
              <button onClick={() => act('REJECTED')} disabled={acting}
                className="flex items-center gap-2 border border-red-200 text-red-600 font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-red-50 disabled:opacity-60 transition-colors">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {sub.status === 'APPROVED' && sub.product && (
            <button onClick={() => act('PUBLISHED')} disabled={acting}
              className="flex items-center gap-2 bg-emerald-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                <Zap className="w-4 h-4" /> Publish (Make Live)
            </button>
          )}
          <button onClick={onClose} className="ml-auto text-gray-500 font-medium py-2.5 px-5 rounded-xl text-sm hover:bg-gray-100 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

type StatusFilter = 'ALL' | Status;

export default function BookSubmissionsAdminPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['bs-stats'],
    queryFn: submissionsApi.stats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['book-submissions', statusFilter, search, page],
    queryFn: () => submissionsApi.list({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search || undefined,
      page,
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => submissionsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-submissions'] });
      qc.invalidateQueries({ queryKey: ['bs-stats'] });
    },
  });

  const submissions = data?.data ?? [];
  const meta = data?.meta;

  const statCards = [
    { label: 'Total',       value: stats?.total ?? 0,       icon: BookOpen,    color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending',     value: stats?.pending ?? 0,     icon: Clock,       color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Under Review',value: stats?.underReview ?? 0, icon: Eye,         color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Approved',    value: stats?.approved ?? 0,    icon: CheckCircle2,color: 'text-green-600 bg-green-50' },
    { label: 'Published',   value: stats?.published ?? 0,   icon: Zap,         color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Rejected',    value: stats?.rejected ?? 0,    icon: XCircle,     color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Book Submissions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review and approve author/seller book submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {statCards.map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.color} flex-shrink-0`}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Search title, author, email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
              }`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Author / Submitter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {submissions.map((sub: any) => {
                  const si = STATUS_INFO[sub.status as Status] ?? STATUS_INFO.PENDING;
                  const isEbook = sub.bookType === 'EBOOK' || sub.digitalFileUrl;
                  return (
                    <tr key={sub.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(sub)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border">
                            {sub.coverImageUrl ? (
                              <img src={sub.coverImageUrl} alt={sub.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1 max-w-[200px]">{sub.title}</p>
                            <div className="flex gap-1 mt-0.5">
                              {isEbook && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">E-BOOK</span>
                              )}
                              {sub.genres?.slice(0, 2).map((g: string) => (
                                <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{g}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{sub.authorName}</p>
                        <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium flex items-center gap-1 ${isEbook ? 'text-purple-600' : 'text-gray-600'}`}>
                          {isEbook ? <Zap className="w-3 h-3" /> : <BookMarked className="w-3 h-3" />}
                          {isEbook ? 'Digital' : 'Physical'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(sub.suggestedPrice))}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${si.cls}`}>{si.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString('en-BD')}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setSelected(sub)}
                            className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-accent flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Review
                          </button>
                          {sub.status === 'PENDING' && (
                            <button
                              onClick={() => updateMutation.mutate({ id: sub.id, data: { status: 'APPROVED', royaltyPercent: 10 } })}
                              className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Quick Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>No submissions found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <SubmissionModal
          sub={selected}
          onClose={() => setSelected(null)}
          onUpdate={(id, data) => updateMutation.mutateAsync({ id, data })}
        />
      )}
    </div>
  );
}
