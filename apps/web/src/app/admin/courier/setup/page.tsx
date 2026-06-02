'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CourierConfig {
  enabled: boolean;
  [key: string]: string | boolean;
}

type CourierField = { key: string; label: string; placeholder: string; secret?: boolean };

const COURIERS: {
  key: string;
  name: string;
  logo: string;
  desc: string;
  color: string;
  fields: CourierField[];
}[] = [
  {
    key: 'pathao',
    name: 'Pathao',
    logo: '🟢',
    desc: 'On-demand delivery — Dhaka & CTG',
    color: '#009444',
    fields: [
      { key: 'clientId',     label: 'Client ID',      placeholder: 'pathao_client_id',     secret: false },
      { key: 'clientSecret', label: 'Client Secret',  placeholder: 'pathao_secret_...',    secret: true  },
      { key: 'username',     label: 'Username',       placeholder: 'merchant@email.com',   secret: false },
      { key: 'password',     label: 'Password',       placeholder: '••••••••',             secret: true  },
    ],
  },
  {
    key: 'steadfast',
    name: 'SteadFast',
    logo: '📦',
    desc: 'E-commerce courier — nationwide',
    color: '#FF6B35',
    fields: [
      { key: 'apiKey',       label: 'API Key',        placeholder: 'sf_api_key_...',       secret: true  },
      { key: 'secretKey',    label: 'Secret Key',     placeholder: 'sf_secret_...',        secret: true  },
    ],
  },
  {
    key: 'redx',
    name: 'RedX',
    logo: '🔴',
    desc: 'Last-mile delivery — Bangladesh',
    color: '#E53935',
    fields: [
      { key: 'bearerToken',  label: 'Bearer Token',   placeholder: 'Bearer eyJ...',        secret: true  },
    ],
  },
  {
    key: 'paperFly',
    name: 'PaperFly',
    logo: '✈️',
    desc: 'E-commerce logistics — nationwide',
    color: '#1976D2',
    fields: [
      { key: 'username',     label: 'Username',       placeholder: 'pf_username',          secret: false },
      { key: 'password',     label: 'Password',       placeholder: '••••••••',             secret: true  },
    ],
  },
  {
    key: 'eCourier',
    name: 'eCourier',
    logo: '📬',
    desc: 'Regular courier network — BD',
    color: '#7B1FA2',
    fields: [
      { key: 'apiKey',       label: 'API Key',        placeholder: 'ec_api_...',           secret: true  },
      { key: 'apiPassword',  label: 'API Password',   placeholder: '••••••••',             secret: true  },
      { key: 'merchantId',   label: 'Merchant ID',    placeholder: 'EC_MERCHANT_ID',       secret: false },
    ],
  },
  {
    key: 'sundarban',
    name: 'Sundarban Courier',
    logo: '🌿',
    desc: 'Established courier service — BD',
    color: '#2E7D32',
    fields: [
      { key: 'apiKey',       label: 'API Key',        placeholder: 'scs_api_...',          secret: true  },
      { key: 'branchCode',   label: 'Branch Code',    placeholder: 'DKA',                  secret: false },
    ],
  },
];

const SETTINGS_KEY = 'courier_configs';

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

export default function CourierSetupPage() {
  const qc = useQueryClient();

  const { data: settingsRaw } = useQuery({
    queryKey: ['settings', SETTINGS_KEY],
    queryFn: () => api.get(`/settings/store?keys=${SETTINGS_KEY}`).then(r => {
      try { return JSON.parse(r.data?.data?.[SETTINGS_KEY] ?? '{}'); } catch { return {}; }
    }),
  });

  const [configs, setConfigs] = useState<Record<string, CourierConfig>>({});
  const [synced, setSynced] = useState(false);
  if (settingsRaw && !synced) {
    setSynced(true);
    setConfigs(settingsRaw as Record<string, CourierConfig>);
  }

  const saveMut = useMutation({
    mutationFn: (data: Record<string, CourierConfig>) =>
      api.patch('/settings/store', { [SETTINGS_KEY]: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', SETTINGS_KEY] });
      toast.success('Courier settings saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const setField = (key: string, field: string, value: string | boolean) => {
    setConfigs(c => ({
      ...c,
      [key]: { enabled: false, ...c[key], [field]: value } as CourierConfig,
    }));
  };

  const getVal = (key: string, field: string): string =>
    (configs[key] as unknown as Record<string, string>)?.[field] ?? '';

  const inp = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Courier Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure courier API integrations for order fulfilment</p>
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
        {COURIERS.map(c => {
          const cfg = configs[c.key];
          const enabled = cfg?.enabled ?? false;

          return (
            <div key={c.key} className={`rounded-2xl border p-5 transition-all ${enabled ? 'ring-2 ring-primary/30 border-primary/40' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: c.color + '20' }}>
                    {c.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setField(c.key, 'enabled', !enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="mb-4">
                {enabled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                    <XCircle className="h-3 w-3" /> Disabled
                  </span>
                )}
              </div>

              {enabled && (
                <div className="space-y-3">
                  {c.fields.map(f => (
                    <div key={f.key}>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{f.label}</label>
                      {f.secret ? (
                        <SecretInput
                          value={getVal(c.key, f.key)}
                          onChange={v => setField(c.key, f.key, v)}
                          placeholder={f.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={getVal(c.key, f.key)}
                          onChange={e => setField(c.key, f.key, e.target.value)}
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
          Save Courier Settings
        </button>
      </div>
    </div>
  );
}
