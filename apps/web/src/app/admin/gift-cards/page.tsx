'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Loader2, Plus, Trash2, X } from 'lucide-react';
import { giftCardsApi, type GiftCard, type GiftCardStats } from '@/lib/api/gift-cards';

const STATUS_TABS = ['ALL', 'ACTIVE', 'USED', 'EXPIRED', 'DISABLED'] as const;
type StatusFilter = typeof STATUS_TABS[number];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  USED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  DISABLED: 'bg-red-100 text-red-600',
};

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function generateCode() {
  return `GC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [stats, setStats] = useState<GiftCardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({ code: generateCode(), amount: '', expiresAt: '', note: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsData, statsData] = await Promise.all([
        giftCardsApi.adminList(statusFilter !== 'ALL' ? statusFilter : undefined),
        giftCardsApi.adminStats(),
      ]);
      setCards(cardsData);
      setStats(statsData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Amount must be greater than 0'); return; }
    if (!form.code.trim()) { setFormError('Code is required'); return; }
    setSaving(true);
    setFormError(null);
    try {
      await giftCardsApi.adminCreate({
        code: form.code.trim(),
        amount: Number(form.amount),
        expiresAt: form.expiresAt || undefined,
        note: form.note || undefined,
      });
      setShowModal(false);
      setForm({ code: generateCode(), amount: '', expiresAt: '', note: '' });
      void load();
    } catch {
      setFormError('Failed to create gift card');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await giftCardsApi.adminUpdate(id, { status });
      void load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gift card?')) return;
    setDeletingId(id);
    try {
      await giftCardsApi.adminDelete(id);
      setCards(prev => prev.filter(c => c.id !== id));
      void load();
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Gift Cards</h1>
          <p className="text-sm text-muted-foreground">Manage gift card inventory and balances</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(null); }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Gift Card
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Cards</p>
          </div>
          <div className="rounded-xl border bg-green-50 border-green-200 p-4">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-green-700 mt-0.5">Active</p>
          </div>
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-4">
            <p className="text-2xl font-bold text-blue-700">৳{Number(stats.totalValue).toLocaleString()}</p>
            <p className="text-xs text-blue-700 mt-0.5">Total Value</p>
          </div>
          <div className="rounded-xl border bg-orange-50 border-orange-200 p-4">
            <p className="text-2xl font-bold text-orange-700">৳{Number(stats.usedValue).toLocaleString()}</p>
            <p className="text-xs text-orange-700 mt-0.5">Used Value</p>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No gift cards found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Balance</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Expires</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Note</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cards.map(card => (
                  <tr key={card.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-brand-600">{card.code}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">৳{Number(card.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${Number(card.balance) === 0 ? 'text-muted-foreground' : 'text-green-700'}`}>
                        ৳{Number(card.balance).toLocaleString()}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <select
                        value={card.status}
                        onChange={e => handleStatusChange(card.id, e.target.value)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[card.status] ?? 'bg-muted'}`}
                      >
                        {['ACTIVE', 'USED', 'EXPIRED', 'DISABLED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                      {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell max-w-[120px] truncate">
                      {card.note ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDelete(card.id)}
                          disabled={deletingId === card.id}
                          className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-card shadow-2xl border">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">Create Gift Card</h2>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Code <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className={inputCls}
                  />
                  <button
                    onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                    className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors whitespace-nowrap"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Amount (৳) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 500"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Expiry Date <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Note <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Birthday gift for John"
                  className={inputCls}
                />
              </div>
              {formError && <p className="text-xs text-destructive">{formError}</p>}
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
