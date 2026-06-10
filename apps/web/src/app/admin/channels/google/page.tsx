'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface GoogleConfig { googleMerchantId: string; googleShoppingEnabled: string; googleAdsId: string }
const DEFAULT: GoogleConfig = { googleMerchantId: '', googleShoppingEnabled: 'false', googleAdsId: '' };

export default function GoogleShoppingPage() {
  const [form, setForm] = useState<GoogleConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm({ googleMerchantId: d.googleMerchantId ?? '', googleShoppingEnabled: d.googleShoppingEnabled ?? 'false', googleAdsId: d.googleAdsId ?? '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('Google Shopping settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-yellow-500" /> Google Shopping
        </h1>
        <p className="text-sm text-gray-500 mt-1">Sync product listings to Google Merchant Center for Shopping ads.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
        <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold">Google Merchant Center Required</p>
          <p className="mt-0.5">Create a Google Merchant Center account, verify your website, and link it to Google Ads for Shopping campaigns.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable Google Shopping</p>
            <p className="text-xs text-gray-500 mt-0.5">Sync products to Google Merchant Center</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, googleShoppingEnabled: f.googleShoppingEnabled === 'true' ? 'false' : 'true' }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.googleShoppingEnabled === 'true' ? 'bg-yellow-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.googleShoppingEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { key: 'googleMerchantId', label: 'Merchant Center ID', placeholder: '12345678' },
            { key: 'googleAdsId', label: 'Google Ads ID (optional)', placeholder: 'AW-XXXXXXXXXX' },
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 text-sm mb-3">Product Feed URL</h2>
        <p className="text-sm text-gray-500 mb-2">Submit this URL in Google Merchant Center → Products → Feeds:</p>
        <div className="bg-gray-50 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 select-all border border-gray-200">
          {typeof window !== 'undefined' ? window.location.origin : 'https://yourstore.com'}/api/feeds/google-shopping.xml
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-yellow-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-yellow-600 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Save Settings
        </button>
        <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors text-sm">
          <ExternalLink className="h-4 w-4" /> Merchant Center
        </a>
      </div>
    </div>
  );
}
