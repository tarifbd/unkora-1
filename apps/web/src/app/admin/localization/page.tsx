'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, DollarSign, Plus, Pencil, Trash2, Star,
  Loader2, X, Check, AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const locApi = {
  getCurrencies: () => api.get('/localization/currencies').then(r => r.data.data),
  createCurrency: (data: any) => api.post('/localization/currencies', data).then(r => r.data.data),
  updateCurrency: (id: string, data: any) => api.patch(`/localization/currencies/${id}`, data).then(r => r.data.data),
  deleteCurrency: (id: string) => api.delete(`/localization/currencies/${id}`).then(r => r.data.data),
  setDefaultCurrency: (id: string) => api.patch(`/localization/currencies/${id}/set-default`).then(r => r.data.data),

  getLanguages: () => api.get('/localization/languages').then(r => r.data.data),
  createLanguage: (data: any) => api.post('/localization/languages', data).then(r => r.data.data),
  updateLanguage: (id: string, data: any) => api.patch(`/localization/languages/${id}`, data).then(r => r.data.data),
  deleteLanguage: (id: string) => api.delete(`/localization/languages/${id}`).then(r => r.data.data),
  setDefaultLanguage: (id: string) => api.patch(`/localization/languages/${id}/set-default`).then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface Currency {
  id: string; code: string; name: string; symbol: string;
  rate: number; isDefault: boolean; isActive: boolean;
}

interface Language {
  id: string; code: string; name: string; nativeName: string;
  isDefault: boolean; isActive: boolean; isRtl: boolean;
}

// ─── Shared UI ────────────────────────────────────────────────

const inp = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

// ─── Currency Form Modal ──────────────────────────────────────

function CurrencyModal({
  initial, onSave, onClose,
}: {
  initial?: Currency;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    symbol: initial?.symbol ?? '',
    rate: String(initial?.rate ?? 1),
    isActive: initial?.isActive ?? true,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-lg">{initial ? 'Edit Currency' : 'Add Currency'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Code (e.g. USD)</label>
              <input value={form.code} onChange={set('code')} className={inp} placeholder="USD" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Symbol</label>
              <input value={form.symbol} onChange={set('symbol')} className={inp} placeholder="$" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Name</label>
            <input value={form.name} onChange={set('name')} className={inp} placeholder="US Dollar" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Exchange Rate (relative to base)</label>
            <input type="number" step="0.0001" min="0" value={form.rate} onChange={set('rate')} className={inp} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border" />
            <span className="text-sm">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave({ ...form, rate: parseFloat(form.rate) })}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Language Form Modal ──────────────────────────────────────

function LanguageModal({
  initial, onSave, onClose,
}: {
  initial?: Language;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    nativeName: initial?.nativeName ?? '',
    isRtl: initial?.isRtl ?? false,
    isActive: initial?.isActive ?? true,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-lg">{initial ? 'Edit Language' : 'Add Language'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Code (e.g. en)</label>
              <input value={form.code} onChange={set('code')} className={inp} placeholder="en" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Name</label>
              <input value={form.name} onChange={set('name')} className={inp} placeholder="English" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Native Name</label>
            <input value={form.nativeName} onChange={set('nativeName')} className={inp} placeholder="English" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRtl}
                onChange={e => setForm(f => ({ ...f, isRtl: e.target.checked }))}
                className="h-4 w-4 rounded border" />
              <span className="text-sm">RTL Direction</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border" />
              <span className="text-sm">Active</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(form)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Currencies Tab ───────────────────────────────────────────

function CurrenciesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Currency | null>(null);

  const { data: currencies = [], isLoading } = useQuery<Currency[]>({
    queryKey: ['currencies'],
    queryFn: locApi.getCurrencies,
  });

  const createMut = useMutation({ mutationFn: locApi.createCurrency, onSuccess: () => { qc.invalidateQueries({ queryKey: ['currencies'] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => locApi.updateCurrency(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['currencies'] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: locApi.deleteCurrency, onSuccess: () => qc.invalidateQueries({ queryKey: ['currencies'] }) });
  const defaultMut = useMutation({ mutationFn: locApi.setDefaultCurrency, onSuccess: () => qc.invalidateQueries({ queryKey: ['currencies'] }) });

  const handleSave = (data: any) => {
    if (typeof modal === 'object' && modal !== null) {
      updateMut.mutate({ id: (modal as Currency).id, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{currencies.length} currencies configured</p>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Currency
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Currency</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Symbol</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Rate</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currencies.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{c.code}</span>
                    <span className="text-muted-foreground">{c.name}</span>
                    {c.isDefault && (
                      <Badge color="bg-yellow-100 text-yellow-700">
                        <Star className="h-3 w-3" /> Default
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-lg">{c.symbol}</td>
                <td className="px-4 py-3 text-right font-mono">{c.rate.toFixed(4)}</td>
                <td className="px-4 py-3 text-center">
                  <Badge color={c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {!c.isDefault && (
                      <button onClick={() => defaultMut.mutate(c.id)}
                        title="Set as default"
                        className="rounded-lg p-1.5 hover:bg-yellow-50 hover:text-yellow-700 transition-colors">
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setModal(c)}
                      className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {!c.isDefault && (
                      <button onClick={() => deleteMut.mutate(c.id)}
                        className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {currencies.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No currencies yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <CurrencyModal
          initial={typeof modal === 'object' ? modal as Currency : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Languages Tab ────────────────────────────────────────────

function LanguagesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Language | null>(null);

  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: locApi.getLanguages,
  });

  const createMut = useMutation({ mutationFn: locApi.createLanguage, onSuccess: () => { qc.invalidateQueries({ queryKey: ['languages'] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => locApi.updateLanguage(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['languages'] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: locApi.deleteLanguage, onSuccess: () => qc.invalidateQueries({ queryKey: ['languages'] }) });
  const defaultMut = useMutation({ mutationFn: locApi.setDefaultLanguage, onSuccess: () => qc.invalidateQueries({ queryKey: ['languages'] }) });

  const handleSave = (data: any) => {
    if (typeof modal === 'object' && modal !== null) {
      updateMut.mutate({ id: (modal as Language).id, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{languages.length} languages configured</p>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Language
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Language</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Native</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">RTL</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {languages.map(l => (
              <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono rounded bg-muted px-1.5 py-0.5 text-xs font-bold">{l.code}</span>
                    <span className="font-medium">{l.name}</span>
                    {l.isDefault && (
                      <Badge color="bg-yellow-100 text-yellow-700">
                        <Star className="h-3 w-3" /> Default
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.nativeName}</td>
                <td className="px-4 py-3 text-center">
                  {l.isRtl
                    ? <Badge color="bg-purple-100 text-purple-700">RTL</Badge>
                    : <span className="text-muted-foreground text-xs">LTR</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge color={l.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {l.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {!l.isDefault && (
                      <button onClick={() => defaultMut.mutate(l.id)}
                        title="Set as default"
                        className="rounded-lg p-1.5 hover:bg-yellow-50 hover:text-yellow-700 transition-colors">
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setModal(l)}
                      className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {!l.isDefault && (
                      <button onClick={() => deleteMut.mutate(l.id)}
                        className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {languages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No languages yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <LanguageModal
          initial={typeof modal === 'object' ? modal as Language : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LocalizationPage() {
  const [tab, setTab] = useState<'currencies' | 'languages'>('currencies');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Localization</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage currencies and languages for your store</p>
      </div>

      <div className="flex gap-1 border-b">
        {([
          { id: 'currencies', label: 'Currencies', icon: DollarSign },
          { id: 'languages',  label: 'Languages',  icon: Globe },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'currencies' ? <CurrenciesTab /> : <LanguagesTab />}
    </div>
  );
}
