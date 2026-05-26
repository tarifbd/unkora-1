'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Loader2, Gavel, Clock, CheckCircle2, XCircle, Flame,
  Calendar, TrendingUp, Users, DollarSign, Pencil, Trash2, StopCircle,
} from 'lucide-react';
import { auctionsApi, type Auction, type AuctionStatus } from '@/lib/api/auctions';
import { formatCurrency } from '@/lib/utils';

const STATUS_CONFIG: Record<AuctionStatus, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',   icon: XCircle },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700',   icon: Calendar },
  ACTIVE:    { label: 'Live',      color: 'bg-green-100 text-green-700', icon: Flame },
  ENDED:     { label: 'Ended',     color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700',     icon: XCircle },
  SOLD:      { label: 'Sold',      color: 'bg-purple-100 text-purple-700', icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: AuctionStatus }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return <span className="text-xs text-red-500">Ended</span>;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  if (d > 0) return <span className="text-xs font-mono text-orange-600">{d}d {h}h left</span>;
  if (h > 0) return <span className="text-xs font-mono text-orange-600">{h}h {m}m left</span>;
  return <span className="text-xs font-mono text-red-600 font-bold">{m}m left</span>;
}

function AuctionModal({ auction, onClose, onSave }: {
  auction?: Auction | null;
  onClose: () => void;
  onSave: (data: object) => void;
}) {
  const [form, setForm] = useState({
    productId: auction?.productId ?? '',
    title: auction?.title ?? '',
    description: auction?.description ?? '',
    startingPrice: auction ? Number(auction.startingPrice) : 0,
    reservePrice: auction?.reservePrice ? Number(auction.reservePrice) : '',
    bidIncrement: auction ? Number(auction.bidIncrement) : 10,
    startsAt: auction ? auction.startsAt.slice(0, 16) : '',
    endsAt: auction ? auction.endsAt.slice(0, 16) : '',
    status: auction?.status ?? 'DRAFT',
    featuredImage: auction?.featuredImage ?? '',
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-5 sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">{auction ? 'Edit Auction' : 'Create Auction'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Product ID *</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.productId} onChange={e => set('productId', e.target.value)} placeholder="Product ID" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Auction Title *</label>
            <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Rare Book Auction" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Starting Price (৳) *</label>
              <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.startingPrice} onChange={e => set('startingPrice', Number(e.target.value))} min={0} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reserve Price (৳)</label>
              <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.reservePrice} onChange={e => set('reservePrice', e.target.value ? Number(e.target.value) : '')} min={0} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Bid Increment (৳)</label>
              <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.bidIncrement} onChange={e => set('bidIncrement', Number(e.target.value))} min={1} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Starts At *</label>
              <input type="datetime-local" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ends At *</label>
              <input type="datetime-local" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.endsAt} onChange={e => set('endsAt', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.keys(STATUS_CONFIG).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s as AuctionStatus].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Featured Image URL</label>
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.featuredImage} onChange={e => set('featuredImage', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t p-5 sticky bottom-0 bg-card">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {auction ? 'Save Changes' : 'Create Auction'}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_TABS: Array<{ key: AuctionStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Live' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'ENDED', label: 'Ended' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'DRAFT', label: 'Draft' },
];

export default function AuctionsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<AuctionStatus | 'ALL'>('ALL');
  const [modal, setModal] = useState<{ open: boolean; auction?: Auction | null }>({ open: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['auctions', tab],
    queryFn: () => auctionsApi.list({ status: tab === 'ALL' ? undefined : tab }),
  });

  const auctions: Auction[] = data?.data ?? [];

  const create = useMutation({
    mutationFn: auctionsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auctions'] }); setModal({ open: false }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => auctionsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auctions'] }); setModal({ open: false }); },
  });

  const endAuction = useMutation({
    mutationFn: (id: string) => auctionsApi.endAuction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auctions'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => auctionsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auctions'] }); setDeleteId(null); },
  });

  const handleSave = (formData: object) => {
    if (modal.auction) update.mutate({ id: modal.auction.id, data: formData });
    else create.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auction Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage timed bidding auctions</p>
        </div>
        <button
          onClick={() => setModal({ open: true, auction: null })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Create Auction
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Auctions', value: data?.meta?.total ?? 0, icon: Gavel, color: 'text-blue-600 bg-blue-50' },
          { label: 'Live Now', value: auctions.filter(a => a.status === 'ACTIVE').length, icon: Flame, color: 'text-green-600 bg-green-50' },
          { label: 'Total Bids', value: auctions.reduce((s, a) => s + a.totalBids, 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { label: 'Sold', value: auctions.filter(a => a.status === 'SOLD').length, icon: CheckCircle2, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Auction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Current Price</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Bids</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Timeline</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auctions.map(auction => (
                <tr key={auction.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {auction.featuredImage ? (
                        <img src={auction.featuredImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : auction.product?.images?.[0] ? (
                        <img src={auction.product.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Gavel className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{auction.title}</p>
                        <p className="text-xs text-muted-foreground">{auction.product?.name ?? auction.productId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold text-sm text-primary">{formatCurrency(Number(auction.currentPrice))}</p>
                      <p className="text-xs text-muted-foreground">Start: {formatCurrency(Number(auction.startingPrice))}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{auction.totalBids}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(auction.startsAt).toLocaleDateString('en-BD')} →
                        {new Date(auction.endsAt).toLocaleDateString('en-BD')}
                      </p>
                      {auction.status === 'ACTIVE' && <CountdownTimer endsAt={auction.endsAt} />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={auction.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {auction.status === 'ACTIVE' && (
                        <button
                          onClick={() => endAuction.mutate(auction.id)}
                          disabled={endAuction.isPending}
                          className="rounded-lg p-1.5 hover:bg-orange-50 text-muted-foreground hover:text-orange-600"
                          title="End Auction">
                          <StopCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setModal({ open: true, auction })}
                        className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(auction.id)}
                        className="rounded-lg p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {auctions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Gavel className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No auctions found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <AuctionModal auction={modal.auction} onClose={() => setModal({ open: false })} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-xl bg-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Auction?</h3>
            <p className="text-sm text-muted-foreground mb-4">All bids will also be deleted. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
              <button onClick={() => remove.mutate(deleteId)} disabled={remove.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                {remove.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
