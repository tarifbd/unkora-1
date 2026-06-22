'use client';
import { useState, useEffect } from 'react';
import { Video, CheckCircle, Loader2, Info, Radio } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface LiveConfig { liveCommerceEnabled: string; liveStreamPlatform: string; liveStreamUrl: string; liveCommerceDiscountEnabled: string; liveCommerceDiscountRate: string }
const DEFAULT: LiveConfig = { liveCommerceEnabled: 'false', liveStreamPlatform: 'facebook', liveStreamUrl: '', liveCommerceDiscountEnabled: 'false', liveCommerceDiscountRate: '10' };

export default function LiveCommercePage() {
  const [form, setForm] = useState<LiveConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm({ liveCommerceEnabled: d.liveCommerceEnabled ?? 'false', liveStreamPlatform: d.liveStreamPlatform ?? 'facebook', liveStreamUrl: d.liveStreamUrl ?? '', liveCommerceDiscountEnabled: d.liveCommerceDiscountEnabled ?? 'false', liveCommerceDiscountRate: d.liveCommerceDiscountRate ?? '10' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('Live Commerce settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  const toggle = (key: keyof LiveConfig) => setForm(f => ({ ...f, [key]: f[key] === 'true' ? 'false' : 'true' }));

  const features = [
    { icon: '📱', title: 'Facebook Live', desc: 'Go live on Facebook and take orders in comments' },
    { icon: '🎬', title: 'YouTube Live', desc: 'Stream on YouTube with product links in description' },
    { icon: '💜', title: 'TikTok Live', desc: 'TikTok LIVE Shopping for younger audiences' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Video className="h-5 w-5 text-red-500" /> Live Commerce
        </h1>
        <p className="text-sm text-gray-500 mt-1">Go live and sell products in real-time via social platforms.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {features.map(f => (
          <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
        <Radio className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
        <div className="text-sm text-red-700">
          <p className="font-semibold">Live Commerce Tips for Bangladesh</p>
          <p className="mt-0.5">Facebook Live is most popular. Go live during evenings (7–10 PM). Offer exclusive live-only discounts to drive urgency.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {[
          { key: 'liveCommerceEnabled', label: 'Enable Live Commerce', sub: 'Activate live selling features' },
          { key: 'liveCommerceDiscountEnabled', label: 'Live-Only Discounts', sub: 'Offer exclusive discounts during live sessions' },
        ].map(item => (
          <div key={item.key} className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
            </div>
            <button onClick={() => toggle(item.key as keyof LiveConfig)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[item.key as keyof LiveConfig] === 'true' ? 'bg-red-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[item.key as keyof LiveConfig] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Live Platform</label>
            <select value={form.liveStreamPlatform} onChange={e => setForm(f => ({ ...f, liveStreamPlatform: e.target.value }))} className={inputCls}>
              {['facebook', 'youtube', 'tiktok', 'instagram'].map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Live Stream Page URL</label>
            <input value={form.liveStreamUrl} onChange={e => setForm(f => ({ ...f, liveStreamUrl: e.target.value }))}
              className={inputCls} placeholder="https://facebook.com/your-page/live" />
          </div>
          {form.liveCommerceDiscountEnabled === 'true' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Live Discount Rate (%)</label>
              <input type="number" min="0" max="90" value={form.liveCommerceDiscountRate}
                onChange={e => setForm(f => ({ ...f, liveCommerceDiscountRate: e.target.value }))}
                className={inputCls} placeholder="10" />
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-red-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Save Settings
      </button>
    </div>
  );
}
