'use client';
import { useState, useEffect } from 'react';
import { Search, CheckCircle, Loader2, Info, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface SearchConfig { searchEnabled: string; searchMinChars: string; searchMaxResults: string; searchFuzzyEnabled: string; searchIndexCategories: string; searchIndexAuthors: string; searchIndexTags: string; searchWeightTitle: string; searchWeightDescription: string; searchBoostInStock: string; searchBoostOnSale: string }

const DEFAULT: SearchConfig = {
  searchEnabled: 'true',
  searchMinChars: '2',
  searchMaxResults: '20',
  searchFuzzyEnabled: 'true',
  searchIndexCategories: 'true',
  searchIndexAuthors: 'true',
  searchIndexTags: 'true',
  searchWeightTitle: '10',
  searchWeightDescription: '3',
  searchBoostInStock: 'true',
  searchBoostOnSale: 'true',
};

export default function SearchConfigPage() {
  const [form, setForm] = useState<SearchConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm(prev => {
        const next = { ...prev };
        for (const k of Object.keys(prev) as (keyof SearchConfig)[]) {
          if (d[k] !== undefined) next[k] = String(d[k]);
        }
        return next;
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('Search settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white';

  const toggle = (key: keyof SearchConfig) => setForm(f => ({ ...f, [key]: f[key] === 'true' ? 'false' : 'true' }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="h-5 w-5 text-orange-500" /> Advanced Search Config
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure search behavior, indexing and ranking for the book store.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">Search is powered by PostgreSQL full-text search with weighted ranking. Adjustments take effect on the next search query.</p>
      </div>

      {/* General */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-5 py-3 bg-gray-50/50 rounded-t-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">General</p>
        </div>
        {[
          { key: 'searchEnabled', label: 'Enable Search', sub: 'Allow customers to search the product catalog' },
          { key: 'searchFuzzyEnabled', label: 'Fuzzy Matching', sub: 'Match similar words (e.g. "Hasan" → "Hassan")' },
          { key: 'searchBoostInStock', label: 'Boost In-Stock Items', sub: 'Rank available products higher' },
          { key: 'searchBoostOnSale', label: 'Boost Sale Items', sub: 'Rank discounted products higher' },
        ].map(item => (
          <div key={item.key} className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
            </div>
            <button onClick={() => toggle(item.key as keyof SearchConfig)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[item.key as keyof SearchConfig] === 'true' ? 'bg-orange-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[item.key as keyof SearchConfig] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Indexing */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-5 py-3 bg-gray-50/50 rounded-t-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Index Sources</p>
        </div>
        {[
          { key: 'searchIndexCategories', label: 'Index Categories', sub: 'Include category names in search' },
          { key: 'searchIndexAuthors', label: 'Index Authors', sub: 'Include author names in search' },
          { key: 'searchIndexTags', label: 'Index Tags', sub: 'Include product tags in search' },
        ].map(item => (
          <div key={item.key} className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
            </div>
            <button onClick={() => toggle(item.key as keyof SearchConfig)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[item.key as keyof SearchConfig] === 'true' ? 'bg-orange-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[item.key as keyof SearchConfig] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Numeric settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="h-4 w-4 text-gray-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tuning</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'searchMinChars', label: 'Min. Search Characters', placeholder: '2' },
            { key: 'searchMaxResults', label: 'Max Results per Page', placeholder: '20' },
            { key: 'searchWeightTitle', label: 'Title Weight', placeholder: '10' },
            { key: 'searchWeightDescription', label: 'Description Weight', placeholder: '3' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
              <input type="number" min="1" value={(form as unknown as Record<string, string>)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className={inputCls} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Save Search Settings
      </button>
    </div>
  );
}
