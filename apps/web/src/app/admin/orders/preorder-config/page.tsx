'use client';

import { useState } from 'react';
import { Sliders, Save, ToggleLeft, ToggleRight } from 'lucide-react';

const SETTINGS = [
  { key: 'enabled', label: 'Enable Preorders', desc: 'Allow customers to place preorders for out-of-stock products', value: true },
  { key: 'auto_charge', label: 'Auto-charge on Arrival', desc: 'Automatically charge the saved payment method when stock arrives', value: false },
  { key: 'notify_email', label: 'Email Notifications', desc: 'Send customers email updates when preorder status changes', value: true },
  { key: 'notify_sms', label: 'SMS Notifications', desc: 'Send SMS alerts for preorder dispatch and delivery', value: true },
  { key: 'limit_per_customer', label: 'Limit per Customer', desc: 'Restrict number of preorder items per customer account', value: false },
  { key: 'show_eta', label: 'Show ETA on Product Page', desc: 'Display estimated arrival date on product listings', value: true },
];

export default function PreorderConfigPage() {
  const [settings, setSettings] = useState(SETTINGS);
  const [maxItems, setMaxItems] = useState('5');
  const [depositPct, setDepositPct] = useState('20');

  const toggle = (key: string) =>
    setSettings(s => s.map(x => x.key === key ? { ...x, value: !x.value } : x));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Preorder Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Control how preorders work across your store</p>
      </div>

      <div className="rounded-xl border bg-card divide-y">
        {settings.map(s => (
          <div key={s.key} className="flex items-center justify-between px-5 py-4 gap-4">
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
            <button onClick={() => toggle(s.key)} className="flex-shrink-0">
              {s.value
                ? <ToggleRight className="h-7 w-7 text-primary" />
                : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
            </button>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">Max Items per Customer</p>
          <input
            type="number" min="1" max="50" value={maxItems}
            onChange={e => setMaxItems(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">Only applies when limit is enabled above</p>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">Deposit Percentage</p>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="100" value={depositPct}
              onChange={e => setDepositPct(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <span className="text-sm font-medium">%</span>
          </div>
          <p className="text-xs text-muted-foreground">Partial payment collected at preorder time (0 = full payment)</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
}
