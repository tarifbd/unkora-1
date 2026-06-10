'use client';
import { useState, useEffect } from 'react';
import { Camera, CheckCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface InstaConfig { instagramBusinessAccountId: string; instagramShopEnabled: string }
const DEFAULT: InstaConfig = { instagramBusinessAccountId: '', instagramShopEnabled: 'false' };

export default function InstagramShoppingPage() {
  const [form, setForm] = useState<InstaConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm({ instagramBusinessAccountId: d.instagramBusinessAccountId ?? '', instagramShopEnabled: d.instagramShopEnabled ?? 'false' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('Instagram settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  const steps = [
    'Connect a Facebook Business Page to your Instagram account',
    'Set up a product catalog in Facebook Commerce Manager',
    'Submit your account for Instagram Shopping review',
    'Once approved, tag products in posts and stories',
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="h-5 w-5 text-pink-500" /> Instagram Shopping
        </h1>
        <p className="text-sm text-gray-500 mt-1">Sell products via Instagram posts, stories and reels.</p>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-pink-800 mb-2">Setup Steps</p>
        <ol className="space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-pink-700">
              <span className="font-bold text-pink-500 flex-shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable Instagram Shopping</p>
            <p className="text-xs text-gray-500 mt-0.5">Requires Instagram Business account approval</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, instagramShopEnabled: f.instagramShopEnabled === 'true' ? 'false' : 'true' }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.instagramShopEnabled === 'true' ? 'bg-pink-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.instagramShopEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instagram Business Account ID</label>
          <input value={form.instagramBusinessAccountId}
            onChange={e => setForm(f => ({ ...f, instagramBusinessAccountId: e.target.value }))}
            className={inputCls} placeholder="Your Instagram Business Account ID" />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Info className="h-3 w-3" /> Found in Instagram Professional Dashboard → Settings → Account
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-pink-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-pink-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Save Settings
        </button>
        <a href="https://www.instagram.com/accounts/shopping_approval/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors text-sm">
          <ExternalLink className="h-4 w-4" /> Instagram Shopping
        </a>
      </div>
    </div>
  );
}
