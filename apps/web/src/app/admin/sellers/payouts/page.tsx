'use client';

import { useState } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, Download, Filter } from 'lucide-react';

type PayoutStatus = 'paid' | 'processing' | 'pending' | 'failed';

const PAYOUTS: { id: string; seller: string; method: string; amount: number; period: string; status: PayoutStatus; date: string | null }[] = [
  { id: 'PO-4891', seller: 'TechZone BD', method: 'bKash', amount: 18_450, period: 'Jun 1–15, 2026', status: 'paid', date: '2026-06-16' },
  { id: 'PO-4892', seller: 'Fashion World', method: 'Nagad', amount: 12_200, period: 'Jun 1–15, 2026', status: 'paid', date: '2026-06-16' },
  { id: 'PO-4893', seller: 'Grocery Hub', method: 'Bank Transfer', amount: 8_750, period: 'Jun 1–15, 2026', status: 'processing', date: '2026-06-17' },
  { id: 'PO-4894', seller: 'Book Paradise', method: 'bKash', amount: 4_320, period: 'Jun 1–15, 2026', status: 'pending', date: null },
  { id: 'PO-4895', seller: 'Beauty Corner', method: 'Nagad', amount: 6_800, period: 'Jun 1–15, 2026', status: 'pending', date: null },
  { id: 'PO-4896', seller: 'Gadget Store', method: 'Bank Transfer', amount: 22_100, period: 'Jun 1–15, 2026', status: 'failed', date: '2026-06-16' },
  { id: 'PO-4897', seller: 'Home Decor Co.', method: 'bKash', amount: 9_640, period: 'Jun 1–15, 2026', status: 'paid', date: '2026-06-16' },
  { id: 'PO-4898', seller: 'Sports Arena', method: 'Nagad', amount: 5_280, period: 'Jun 1–15, 2026', status: 'processing', date: '2026-06-17' },
];

const STATUS_META: Record<PayoutStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  paid:       { label: 'Paid',       color: 'text-green-700', bg: 'bg-green-100',  icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-blue-700',  bg: 'bg-blue-100',   icon: Clock },
  pending:    { label: 'Pending',    color: 'text-yellow-700',bg: 'bg-yellow-100', icon: Clock },
  failed:     { label: 'Failed',     color: 'text-red-700',   bg: 'bg-red-100',    icon: XCircle },
};

export default function SellerPayoutsPage() {
  const [filter, setFilter] = useState('All');

  const totalPaid = PAYOUTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = PAYOUTS.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalProcessing = PAYOUTS.filter(p => p.status === 'processing').reduce((s, p) => s + p.amount, 0);

  const filtered = filter === 'All' ? PAYOUTS : PAYOUTS.filter(p => STATUS_META[p.status].label === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Vendor Payouts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and process seller earnings disbursements</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Run Payout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Paid (Jun 1–15)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Processing</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">৳{totalProcessing.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">৳{totalPending.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Sellers</p>
          <p className="text-2xl font-bold mt-1">{PAYOUTS.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {['All', 'Paid', 'Processing', 'Pending', 'Failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${filter === f ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Seller</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Period</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Method</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">Amount</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(p => {
              const sm = STATUS_META[p.status];
              const Icon = sm.icon;
              return (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{p.seller}</p>
                    <p className="text-xs text-muted-foreground">{p.id}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-muted-foreground text-xs">{p.period}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{p.method}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums">৳{p.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sm.bg} ${sm.color}`}>
                      <Icon className="h-3 w-3" />
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.status === 'pending' && (
                      <button className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                        Process
                      </button>
                    )}
                    {p.status === 'failed' && (
                      <button className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors">
                        Retry
                      </button>
                    )}
                    {(p.status === 'paid' || p.status === 'processing') && (
                      <span className="text-xs text-muted-foreground">{p.date}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
