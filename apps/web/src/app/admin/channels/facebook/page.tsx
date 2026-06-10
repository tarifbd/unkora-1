'use client';
import { useState, useEffect } from 'react';
import { Globe, CheckCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface FacebookConfig { facebookPixelId: string; facebookAccessToken: string; facebookCatalogId: string; facebookShopEnabled: string }

const DEFAULT: FacebookConfig = { facebookPixelId: '', facebookAccessToken: '', facebookCatalogId: '', facebookShopEnabled: 'false' };

export default function FacebookShopPage() {
  const [form, setForm] = useState<FacebookConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm({ facebookPixelId: d.facebookPixelId ?? '', facebookAccessToken: d.facebookAccessToken ?? '', facebookCatalogId: d.facebookCatalogId ?? '', facebookShopEnabled: d.facebookShopEnabled ?? 'false' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('Facebook settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" /> Facebook Shop
        </h1>
        <p className="text-sm text-gray-500 mt-1">Connect your store with Facebook Shop and Commerce Manager.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold">Setup Required</p>
          <p className="mt-0.5">Create a Facebook Commerce Manager account and connect your product catalog. <a href="#" className="underline font-semibold">View docs ↗</a></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable Facebook Shop</p>
            <p className="text-xs text-gray-500 mt-0.5">Sync products to Facebook Commerce Manager</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, facebookShopEnabled: f.facebookShopEnabled === 'true' ? 'false' : 'true' }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.facebookShopEnabled === 'true' ? 'bg-blue-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.facebookShopEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {[
            { key: 'facebookPixelId', label: 'Facebook Pixel ID', placeholder: '123456789012345' },
            { key: 'facebookCatalogId', label: 'Catalog ID', placeholder: 'Your product catalog ID' },
            { key: 'facebookAccessToken', label: 'System User Access Token', placeholder: 'EAA...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
              <input value={(form as unknown as Record<string, string>)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className={inputCls} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Save Settings
        </button>
        <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors text-sm">
          <ExternalLink className="h-4 w-4" /> Commerce Manager
        </a>
      </div>
    </div>
  );
}
