'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface WAConfig { whatsappBusinessNumber: string; whatsappApiToken: string; whatsappEnabled: string; whatsappOrderNotifications: string }
const DEFAULT: WAConfig = { whatsappBusinessNumber: '', whatsappApiToken: '', whatsappEnabled: 'false', whatsappOrderNotifications: 'false' };

export default function WhatsAppPage() {
  const [form, setForm] = useState<WAConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm({ whatsappBusinessNumber: d.whatsappBusinessNumber ?? '', whatsappApiToken: d.whatsappApiToken ?? '', whatsappEnabled: d.whatsappEnabled ?? 'false', whatsappOrderNotifications: d.whatsappOrderNotifications ?? 'false' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('WhatsApp settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  const toggle = (key: keyof WAConfig) => setForm(f => ({ ...f, [key]: f[key] === 'true' ? 'false' : 'true' }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp Commerce
        </h1>
        <p className="text-sm text-gray-500 mt-1">Send order notifications and enable WhatsApp checkout via WhatsApp Business API.</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
        <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-green-800">
          <p className="font-semibold">WhatsApp Business API</p>
          <p className="mt-0.5">Use Meta&apos;s Cloud API (free tier) or a BSP like Wati, Gupshup, or AiSensy for Bangladesh customers.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {[
          { key: 'whatsappEnabled', label: 'Enable WhatsApp Integration', sub: 'Connect WhatsApp Business API' },
          { key: 'whatsappOrderNotifications', label: 'Order Notifications', sub: 'Send order updates via WhatsApp' },
        ].map(item => (
          <div key={item.key} className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
            </div>
            <button onClick={() => toggle(item.key as keyof WAConfig)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[item.key as keyof WAConfig] === 'true' ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[item.key as keyof WAConfig] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
        <div className="p-5 space-y-4">
          {[
            { key: 'whatsappBusinessNumber', label: 'Business Phone Number', placeholder: '+880 1XXXXXXXXX' },
            { key: 'whatsappApiToken', label: 'API Token / Access Token', placeholder: 'Your WhatsApp Business API token' },
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
          className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Save Settings
        </button>
        <a href="https://business.whatsapp.com/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors text-sm">
          <ExternalLink className="h-4 w-4" /> WhatsApp Business
        </a>
      </div>
    </div>
  );
}
