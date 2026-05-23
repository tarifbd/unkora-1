'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Pencil, X, Zap } from 'lucide-react';
import { flashDealsApi } from '@/lib/api/admin';

interface FlashDeal {
  id: string;
  productId: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
  isFeatured: boolean;
  isActive: boolean;
  product?: { name: string; images?: { url: string }[] };
}

interface FormState {
  productId: string;
  discountPercent: string;
  startTime: string;
  endTime: string;
  isFeatured: boolean;
}

const defaultForm: FormState = {
  productId: '',
  discountPercent: '',
  startTime: '',
  endTime: '',
  isFeatured: false,
};

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function Countdown({ endTime }: { endTime: string }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setLabel('Expired'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(`Ends in ${h}h ${m}m`);
    };
    calc();
    const id = setInterval(calc, 30_000);
    return () => clearInterval(id);
  }, [endTime]);

  return <span className="text-xs text-blue-600 font-medium">{label}</span>;
}

function isExpired(endTime: string) {
  return new Date(endTime).getTime() < Date.now();
}

export default function AdminFlashDealsPage() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await flashDealsApi.list();
      setDeals(Array.isArray(data?.deals) ? data.deals : Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load flash deals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (deal: FlashDeal) => {
    setEditId(deal.id);
    setForm({
      productId: deal.productId,
      discountPercent: String(deal.discountPercent),
      startTime: deal.startTime ? deal.startTime.slice(0, 16) : '',
      endTime: deal.endTime ? deal.endTime.slice(0, 16) : '',
      isFeatured: deal.isFeatured,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setFormError(null); };

  const handleSave = async () => {
    if (!form.productId.trim()) { setFormError('Product ID is required'); return; }
    const pct = Number(form.discountPercent);
    if (!pct || pct < 1 || pct > 99) { setFormError('Discount % must be 1–99'); return; }
    if (!form.startTime || !form.endTime) { setFormError('Start and End times are required'); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { setFormError('End time must be after start time'); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        productId: form.productId.trim(),
        discountPercent: pct,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        isFeatured: form.isFeatured,
      };
      if (editId) {
        await flashDealsApi.update(editId, payload);
      } else {
        await flashDealsApi.create(payload);
      }
      closeModal();
      void load();
    } catch {
      setFormError('Failed to save flash deal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this flash deal?')) return;
    setDeletingId(id);
    try {
      await flashDealsApi.remove(id);
      setDeals(prev => prev.filter(d => d.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (deal: FlashDeal, field: 'isActive' | 'isFeatured') => {
    try {
      await flashDealsApi.update(deal.id, { [field]: !deal[field] });
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, [field]: !d[field] } : d));
    } catch { /* ignore */ }
  };

  const active  = deals.filter(d => d.isActive && !isExpired(d.endTime)).length;
  const expired = deals.filter(d => isExpired(d.endTime)).length;
  const featured = deals.filter(d => d.isFeatured).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Flash Deals</h1>
          <p className="text-sm text-muted-foreground">Time-limited discount promotions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Flash Deal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-green-50 border-green-200 p-4">
          <p className="text-2xl font-bold text-green-700">{active}</p>
          <p className="text-xs font-medium text-green-700 mt-0.5">Active Deals</p>
        </div>
        <div className="rounded-xl border bg-gray-50 border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-600">{expired}</p>
          <p className="text-xs font-medium text-gray-600 mt-0.5">Expired</p>
        </div>
        <div className="rounded-xl border bg-yellow-50 border-yellow-200 p-4">
          <p className="text-2xl font-bold text-yellow-700">{featured}</p>
          <p className="text-xs font-medium text-yellow-700 mt-0.5">Featured</p>
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
        ) : deals.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            No flash deals yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Discount</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Start Time</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">End Time</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Featured</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deals.map(deal => {
                  const expired_ = isExpired(deal.endTime);
                  const img = deal.product?.images?.[0]?.url;
                  const name = deal.product?.name ?? deal.productId;
                  return (
                    <tr
                      key={deal.id}
                      className={`hover:bg-muted/20 transition-colors ${expired_ ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={name} className="h-8 w-8 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />
                          )}
                          <span className={`font-medium line-clamp-1 max-w-[140px] ${expired_ ? 'line-through text-muted-foreground' : ''}`}>
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-brand-600">{deal.discountPercent}%</span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell whitespace-nowrap">
                        {new Date(deal.startTime).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(deal.endTime).toLocaleString('en-BD', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          {!expired_ && deal.isActive && <Countdown endTime={deal.endTime} />}
                          {expired_ && <span className="text-xs text-muted-foreground">Expired</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(deal, 'isFeatured')}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${deal.isFeatured ? 'bg-yellow-400' : 'bg-muted'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${deal.isFeatured ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(deal, 'isActive')}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${deal.isActive ? 'bg-green-500' : 'bg-muted'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${deal.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(deal)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            disabled={deletingId === deal.id}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === deal.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-card shadow-2xl border">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">{editId ? 'Edit Flash Deal' : 'New Flash Deal'}</h2>
              <button onClick={closeModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Product ID <span className="text-destructive">*</span></label>
                <input
                  value={form.productId}
                  onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  placeholder="Paste the product UUID"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Discount % <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.discountPercent}
                  onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                  placeholder="e.g. 30"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Start Date <span className="text-destructive">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">End Date <span className="text-destructive">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm font-medium">Feature this deal</span>
              </label>
              {formError && <p className="text-xs text-destructive">{formError}</p>}
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Save Changes' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
