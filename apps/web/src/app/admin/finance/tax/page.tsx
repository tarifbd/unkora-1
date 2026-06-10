'use client';
import { useState, useEffect } from 'react';
import { Receipt, CheckCircle, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface TaxConfig {
  vatEnabled: string;
  vatRate: string;
  vatIncludedInPrice: string;
  vatRegistrationNumber: string;
  taxDisplayLabel: string;
}

const DEFAULT: TaxConfig = {
  vatEnabled: 'false',
  vatRate: '0',
  vatIncludedInPrice: 'true',
  vatRegistrationNumber: '',
  taxDisplayLabel: 'VAT',
};

export default function TaxSettingsPage() {
  const [form, setForm] = useState<TaxConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      setForm(prev => ({
        vatEnabled:            d.vatEnabled            ?? prev.vatEnabled,
        vatRate:               d.vatRate               ?? prev.vatRate,
        vatIncludedInPrice:    d.vatIncludedInPrice    ?? prev.vatIncludedInPrice,
        vatRegistrationNumber: d.vatRegistrationNumber ?? prev.vatRegistrationNumber,
        taxDisplayLabel:       d.taxDisplayLabel       ?? prev.taxDisplayLabel,
      }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', form);
      toast.success('Tax settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors bg-white';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-orange-500" /> Tax / VAT Setup
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure VAT and tax settings for Bangladesh operations.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">Bangladesh NBR standard VAT rate is 15%. Most small eCommerce stores are VAT-exempt below BDT 30 lakh annual turnover.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Enable VAT</p>
            <p className="text-xs text-gray-500 mt-0.5">Charge VAT on applicable orders</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, vatEnabled: f.vatEnabled === 'true' ? 'false' : 'true' }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.vatEnabled === 'true' ? 'bg-orange-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.vatEnabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {form.vatEnabled === 'true' && (
          <>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">VAT Rate (%)</label>
                <input type="number" min="0" max="100" step="0.5"
                  value={form.vatRate}
                  onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))}
                  className={inputCls} placeholder="15" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Label</label>
                <input value={form.taxDisplayLabel}
                  onChange={e => setForm(f => ({ ...f, taxDisplayLabel: e.target.value }))}
                  className={inputCls} placeholder="VAT" />
              </div>
            </div>

            <div className="p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">VAT Registration Number (BIN)</label>
              <input value={form.vatRegistrationNumber}
                onChange={e => setForm(f => ({ ...f, vatRegistrationNumber: e.target.value }))}
                className={inputCls} placeholder="Your NBR BIN number" />
            </div>

            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Price Includes VAT</p>
                <p className="text-xs text-gray-500 mt-0.5">Product prices already include VAT amount</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, vatIncludedInPrice: f.vatIncludedInPrice === 'true' ? 'false' : 'true' }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.vatIncludedInPrice === 'true' ? 'bg-orange-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.vatIncludedInPrice === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </>
        )}
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Save Tax Settings
      </button>
    </div>
  );
}
