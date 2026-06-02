'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Eye, EyeOff, Save, Loader2, CheckCircle, XCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

type GatewayField = { key: string; label: string; placeholder: string; secret?: boolean };

interface GatewayState {
  enabled: boolean;
  mode: 'sandbox' | 'live';
  [key: string]: string | boolean;
}

const GATEWAYS: {
  key: string;
  name: string;
  logo: string;
  desc: string;
  color: string;
  fields: GatewayField[];
}[] = [
  {
    key: 'bkash',
    name: 'bKash',
    logo: '💳',
    desc: 'Mobile financial service — Bangladesh',
    color: '#E2136E',
    fields: [
      { key: 'appKey',       label: 'App Key',       placeholder: 'bkash_app_key_...',  secret: false },
      { key: 'appSecret',    label: 'App Secret',    placeholder: 'bkash_secret_...',   secret: true  },
      { key: 'username',     label: 'Username',      placeholder: 'merchant_username',  secret: false },
      { key: 'password',     label: 'Password',      placeholder: '••••••••',           secret: true  },
    ],
  },
  {
    key: 'nagad',
    name: 'Nagad',
    logo: '📱',
    desc: 'Postal cash-out service — Bangladesh',
    color: '#F47820',
    fields: [
      { key: 'merchantId',   label: 'Merchant ID',   placeholder: 'nagad_merchant_id',  secret: false },
      { key: 'merchantKey',  label: 'Merchant Key',  placeholder: 'nagad_key_...',      secret: true  },
    ],
  },
  {
    key: 'sslcommerz',
    name: 'SSLCommerz',
    logo: '🔒',
    desc: 'Visa / Mastercard / Amex — Bangladesh',
    color: '#0073BE',
    fields: [
      { key: 'storeId',      label: 'Store ID',      placeholder: 'store_id_...',       secret: false },
      { key: 'storePassword', label: 'Store Password', placeholder: '••••••••',         secret: true  },
    ],
  },
  {
    key: 'shurjopay',
    name: 'ShurjoPay',
    logo: '⚡',
    desc: 'Local payment aggregator — Bangladesh',
    color: '#F9A825',
    fields: [
      { key: 'username',     label: 'Username',      placeholder: 'sp_username',        secret: false },
      { key: 'password',     label: 'Password',      placeholder: '••••••••',           secret: true  },
    ],
  },
  {
    key: 'aamarPay',
    name: 'AamarPay',
    logo: '💰',
    desc: 'Multi-currency payment gateway — Bangladesh',
    color: '#1565C0',
    fields: [
      { key: 'storeId',      label: 'Store ID',      placeholder: 'aamar_store_...',    secret: false },
      { key: 'signatureKey', label: 'Signature Key', placeholder: 'sig_...',            secret: true  },
    ],
  },
  {
    key: 'portWallet',
    name: 'PortWallet',
    logo: '🌐',
    desc: 'Online payment gateway — Bangladesh',
    color: '#00695C',
    fields: [
      { key: 'appKey',       label: 'App Key',       placeholder: 'pw_app_key_...',     secret: false },
      { key: 'appSecret',    label: 'App Secret',    placeholder: 'pw_secret_...',      secret: true  },
    ],
  },
  {
    key: 'stripe',
    name: 'Stripe',
    logo: '💜',
    desc: 'International card payments',
    color: '#635BFF',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_...',   secret: false },
      { key: 'secretKey',      label: 'Secret Key',      placeholder: 'sk_live_...',   secret: true  },
      { key: 'webhookSecret',  label: 'Webhook Secret',  placeholder: 'whsec_...',     secret: true  },
    ],
  },
  {
    key: 'bankTransfer',
    name: 'Bank Transfer',
    logo: '🏦',
    desc: 'Manual bank account transfer',
    color: '#37474F',
    fields: [
      { key: 'bankName',     label: 'Bank Name',     placeholder: 'Dutch-Bangla Bank', secret: false },
      { key: 'accountName',  label: 'Account Name',  placeholder: 'UNKORA LTD',        secret: false },
      { key: 'accountNo',    label: 'Account No',    placeholder: '1234567890',        secret: false },
      { key: 'routingNo',    label: 'Routing No',    placeholder: '090269300',         secret: false },
    ],
  },
];

const SETTINGS_KEY = 'payment_gateways';

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ModeToggle({ value, onChange }: { value: 'sandbox' | 'live'; onChange: (v: 'sandbox' | 'live') => void }) {
  return (
    <div className="flex rounded-lg border overflow-hidden text-xs font-semibold">
      <button
        onClick={() => onChange('sandbox')}
        className={`px-3 py-1.5 transition-colors ${value === 'sandbox' ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-accent'}`}>
        Sandbox
      </button>
      <button
        onClick={() => onChange('live')}
        className={`px-3 py-1.5 transition-colors ${value === 'live' ? 'bg-green-600 text-white' : 'text-muted-foreground hover:bg-accent'}`}>
        Live
      </button>
    </div>
  );
}

export default function PaymentGatewaysPage() {
  const qc = useQueryClient();

  const { data: settingsRaw } = useQuery({
    queryKey: ['settings', SETTINGS_KEY],
    queryFn: () => api.get(`/settings/store?keys=${SETTINGS_KEY}`).then(r => {
      try { return JSON.parse(r.data?.data?.[SETTINGS_KEY] ?? '{}'); } catch { return {}; }
    }),
  });

  const [configs, setConfigs] = useState<Record<string, GatewayState>>({});

  // Sync from server once loaded
  const [synced, setSynced] = useState(false);
  if (settingsRaw && !synced) {
    setSynced(true);
    setConfigs(settingsRaw as Record<string, GatewayState>);
  }

  const saveMut = useMutation({
    mutationFn: (data: Record<string, GatewayState>) =>
      api.patch('/settings/store', { [SETTINGS_KEY]: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', SETTINGS_KEY] });
      toast.success('Gateway settings saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const setField = (gwKey: string, field: string, value: string | boolean) => {
    setConfigs(c => ({
      ...c,
      [gwKey]: { enabled: false, mode: 'sandbox', ...c[gwKey], [field]: value } as GatewayState,
    }));
  };

  const getVal = (gwKey: string, field: string): string =>
    (configs[gwKey] as unknown as Record<string, string>)?.[field] ?? '';

  const inp = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Payment Gateways</h1>
          <p className="text-sm text-muted-foreground mt-1">Enable and configure payment methods for checkout</p>
        </div>
        <button
          onClick={() => saveMut.mutate(configs)}
          disabled={saveMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {GATEWAYS.map(gw => {
          const cfg = configs[gw.key];
          const enabled = cfg?.enabled ?? false;
          const mode = cfg?.mode ?? 'sandbox';

          return (
            <div key={gw.key} className={`rounded-2xl border p-5 transition-all ${enabled ? 'ring-2 ring-primary/30 border-primary/40' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: gw.color + '20' }}>
                    {gw.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{gw.name}</h3>
                    <p className="text-xs text-muted-foreground">{gw.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {enabled && <ModeToggle value={mode} onChange={v => setField(gw.key, 'mode', v)} />}
                  <button
                    onClick={() => setField(gw.key, 'enabled', !enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Status pill */}
              <div className="mb-4">
                {enabled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Active — {mode === 'live' ? 'Live' : 'Sandbox'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                    <XCircle className="h-3 w-3" /> Disabled
                  </span>
                )}
              </div>

              {/* Fields */}
              {enabled && (
                <div className="space-y-3">
                  {gw.fields.map(f => (
                    <div key={f.key}>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{f.label}</label>
                      {f.secret ? (
                        <SecretInput
                          value={getVal(gw.key, f.key)}
                          onChange={v => setField(gw.key, f.key, v)}
                          placeholder={f.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={getVal(gw.key, f.key)}
                          onChange={e => setField(gw.key, f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className={inp}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => saveMut.mutate(configs)}
          disabled={saveMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Gateway Settings
        </button>
      </div>
    </div>
  );
}
