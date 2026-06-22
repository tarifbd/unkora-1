'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, MousePointerClick, ShoppingBag, DollarSign,
  Check, X, Loader2, Plus, ChevronDown,
} from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const affApi = {
  getAffiliates: (page = 1) => api.get('/affiliates', { params: { page, limit: 20 } }).then(r => r.data.data),
  getStats: () => api.get('/affiliates/stats').then(r => r.data.data),
  createAffiliate: (data: any) => api.post('/affiliates', data).then(r => r.data.data),
  updateAffiliate: (id: string, data: any) => api.patch(`/affiliates/${id}`, data).then(r => r.data.data),
  getPayouts: (page = 1) => api.get('/affiliates/payouts', { params: { page, limit: 20 } }).then(r => r.data.data),
  updatePayout: (id: string, status: string) => api.patch(`/affiliates/payouts/${id}`, { status }).then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface AffiliateStats {
  totalAffiliates: number;
  totalClicks: number;
  totalOrders: number;
  totalEarnings: number;
}

interface Affiliate {
  id: string;
  code: string;
  commissionRate: number;
  totalEarned: number;
  totalClicks: number;
  totalOrders: number;
  status: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
  affiliate: {
    id: string;
    code: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

// ─── Shared UI ────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

const statusColor: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  PENDING:  'bg-yellow-100 text-yellow-700',
  PROCESSED:'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
};

// ─── Create Affiliate Modal ───────────────────────────────────

function CreateAffiliateModal({ onSave, onClose }: { onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ userId: '', code: '', commissionRate: '5' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-lg">Add Affiliate</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">User ID</label>
            <input value={form.userId} onChange={set('userId')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="User ID from database" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Referral Code</label>
            <input value={form.code} onChange={set('code')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. JOHN20" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.commissionRate} onChange={set('commissionRate')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave({ ...form, commissionRate: parseFloat(form.commissionRate) })}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Check className="h-4 w-4" /> Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Affiliates Tab ───────────────────────────────────────────

function AffiliatesTab() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliates-list'],
    queryFn: () => affApi.getAffiliates(1),
  });

  const createMut = useMutation({
    mutationFn: affApi.createAffiliate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['affiliates-list'] }); setShowModal(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => affApi.updateAffiliate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['affiliates-list'] }),
  });

  const affiliates: Affiliate[] = data?.data ?? [];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} affiliates</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Affiliate
        </button>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Affiliate</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Commission</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Clicks</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Orders</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Earned</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {affiliates.map(a => (
              <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{a.user?.firstName} {a.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{a.user?.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold">{a.code}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{a.commissionRate}%</td>
                <td className="px-4 py-3 text-right">{a.totalClicks.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{a.totalOrders.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold">৳{a.totalEarned.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Badge color={statusColor[a.status] ?? 'bg-gray-100 text-gray-600'}>{a.status}</Badge>
                    <button
                      onClick={() => updateMut.mutate({
                        id: a.id,
                        data: { status: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
                      })}
                      className="ml-1 rounded-lg p-1 hover:bg-accent"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {affiliates.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No affiliates yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateAffiliateModal
          onSave={d => createMut.mutate(d)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────

function PayoutsTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-payouts'],
    queryFn: () => affApi.getPayouts(1),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: any) => affApi.updatePayout(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['affiliate-payouts'] }),
  });

  const payouts: Payout[] = data?.data ?? [];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} payouts total</p>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Affiliate</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Method</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payouts.map(p => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{p.affiliate?.user?.firstName} {p.affiliate?.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.affiliate.code}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold">৳{p.amount.toLocaleString()}</td>
                <td className="px-4 py-3">{p.method}</td>
                <td className="px-4 py-3 text-center">
                  <Badge color={statusColor[p.status] ?? 'bg-gray-100 text-gray-600'}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {p.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => updateMut.mutate({ id: p.id, status: 'PROCESSED' })}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => updateMut.mutate({ id: p.id, status: 'REJECTED' })}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700">
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No payouts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function AffiliatesPage() {
  const [tab, setTab] = useState<'affiliates' | 'payouts'>('affiliates');

  const { data: stats } = useQuery<AffiliateStats>({
    queryKey: ['affiliate-stats'],
    queryFn: affApi.getStats,
  });

  const s = stats ?? { totalAffiliates: 0, totalClicks: 0, totalOrders: 0, totalEarnings: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Affiliate Marketing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your affiliate program and payouts</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Affiliates" value={s.totalAffiliates} icon={Users} color="text-blue-600 bg-blue-50" />
        <StatCard label="Total Clicks" value={s.totalClicks.toLocaleString()} icon={MousePointerClick} color="text-purple-600 bg-purple-50" />
        <StatCard label="Total Orders" value={s.totalOrders.toLocaleString()} icon={ShoppingBag} color="text-orange-600 bg-orange-50" />
        <StatCard label="Total Earnings" value={`৳${s.totalEarnings.toLocaleString()}`} icon={DollarSign} color="text-green-600 bg-green-50" />
      </div>

      <div className="flex gap-1 border-b">
        {([
          { id: 'affiliates', label: 'Affiliates' },
          { id: 'payouts',    label: 'Payouts' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'affiliates' ? <AffiliatesTab /> : <PayoutsTab />}
    </div>
  );
}
