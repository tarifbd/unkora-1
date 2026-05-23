'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Truck, CreditCard, Zap, Globe, Info,
  Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import { settingsApi } from '@/lib/api/admin';
import api from '@/lib/api';

/* ─── settings API helper ─────────────────────────────────────── */
const storeSettingsApi = {
  get: (): Promise<Record<string, string>> =>
    api.get('/settings/store').then(r => r.data.data),
  update: (data: Record<string, string>) =>
    api.patch('/settings/store', data).then(r => r.data.data),
};

/* ─── shared components ───────────────────────────────────────── */
type TabId = 'store' | 'shipping' | 'payment' | 'flash' | 'analytics' | 'about';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'store',     label: 'Store Info',    icon: Store },
  { id: 'shipping',  label: 'Shipping',      icon: Truck },
  { id: 'payment',   label: 'Payments',      icon: CreditCard },
  { id: 'flash',     label: 'Flash Sale',    icon: Zap },
  { id: 'analytics', label: 'Analytics',     icon: Globe },
  { id: 'about',     label: 'About',         icon: Info },
];

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b last:border-0 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

const inp = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';
const tog = (on: boolean) => `relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`;
const togDot = (on: boolean) => `pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0'}`;

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={tog(value)}>
      <span className={togDot(value)} />
    </button>
  );
}

function SaveBar({ isDirty, onSave, isPending, success }: { isDirty: boolean; onSave: () => void; isPending: boolean; success: boolean }) {
  if (!isDirty && !success) return null;
  return (
    <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t">
      {success && (
        <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
          <CheckCircle2 className="h-4 w-4" /> Saved successfully
        </span>
      )}
      {isDirty && (
        <button onClick={onSave} disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      )}
    </div>
  );
}

/* ─── Store Info Tab ──────────────────────────────────────────── */
function StoreInfoTab({ settings, onSave }: { settings: Record<string, string>; onSave: (data: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'site.name':     settings['site.name'] ?? 'UNKORA',
    'site.tagline':  settings['site.tagline'] ?? '',
    'site.phone':    settings['site.phone'] ?? '',
    'site.email':    settings['site.email'] ?? '',
    'site.address':  settings['site.address'] ?? '',
    'currency.code': settings['currency.code'] ?? 'BDT',
    'currency.symbol': settings['currency.symbol'] ?? '৳',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    await onSave(form);
    setDirty(false);
    setSuccess(true);
    setPending(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Store Information</h2>
        <p className="text-sm text-muted-foreground">Basic details about your UNKORA store</p>
      </div>
      <div className="rounded-xl border bg-card px-5">
        <FieldRow label="Store Name" hint="Displayed in browser title and emails">
          <input value={form['site.name']} onChange={set('site.name')} className={inp} />
        </FieldRow>
        <FieldRow label="Tagline" hint="Short description shown in marketing">
          <input value={form['site.tagline']} onChange={set('site.tagline')} className={inp} placeholder="e.g. Bangladesh's Best Bookstore" />
        </FieldRow>
        <FieldRow label="Phone Number" hint="Customer support number">
          <input value={form['site.phone']} onChange={set('site.phone')} className={inp} placeholder="+880 1700-000000" />
        </FieldRow>
        <FieldRow label="Support Email">
          <input type="email" value={form['site.email']} onChange={set('site.email')} className={inp} placeholder="support@unkora.com" />
        </FieldRow>
        <FieldRow label="Business Address">
          <textarea value={form['site.address']} onChange={set('site.address')} rows={2}
            className={inp + ' resize-none'} placeholder="Dhaka, Bangladesh" />
        </FieldRow>
        <FieldRow label="Currency">
          <div className="flex gap-2">
            <input value={form['currency.code']} onChange={set('currency.code')} className={inp + ' w-24'} placeholder="BDT" />
            <input value={form['currency.symbol']} onChange={set('currency.symbol')} className={inp + ' w-20'} placeholder="৳" />
            <span className="self-center text-xs text-muted-foreground">Code · Symbol</span>
          </div>
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Shipping Tab ────────────────────────────────────────────── */
function ShippingTab({ settings, onSave }: { settings: Record<string, string>; onSave: (data: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'shipping.dhaka_rate':        settings['shipping.dhaka_rate'] ?? '60',
    'shipping.outside_dhaka_rate': settings['shipping.outside_dhaka_rate'] ?? '100',
    'shipping.free_threshold':    settings['shipping.free_threshold'] ?? '500',
    'shipping.cod_charge':        settings['shipping.cod_charge'] ?? '0',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    await onSave(form);
    setDirty(false); setSuccess(true); setPending(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Shipping Rates</h2>
        <p className="text-sm text-muted-foreground">Delivery zones and pricing for Bangladesh</p>
      </div>

      <div className="space-y-3 mb-5">
        {[
          { key: 'shipping.dhaka_rate',         label: '🏙️ Dhaka City Delivery',  hint: '1–2 business days', icon: '৳' },
          { key: 'shipping.outside_dhaka_rate', label: '🗺️ Outside Dhaka',         hint: '3–5 business days', icon: '৳' },
          { key: 'shipping.cod_charge',         label: '💵 COD Charge',            hint: 'Extra fee for Cash on Delivery', icon: '৳' },
          { key: 'shipping.free_threshold',     label: '🎁 Free Shipping Threshold', hint: 'Orders above this get free delivery', icon: '৳' },
        ].map(({ key, label, hint, icon }) => (
          <div key={key} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{icon}</span>
              <input type="number" min="0" value={form[key as keyof typeof form]} onChange={set(key)}
                className={inp + ' pl-7 text-right font-bold'} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">💡 How it works</p>
        <ul className="space-y-1 text-xs text-blue-600 list-disc list-inside">
          <li>Orders below the free shipping threshold pay the zone rate</li>
          <li>COD charge is added on top of shipping when customer selects Cash on Delivery</li>
          <li>Pathao, Steadfast, RedX integrations use these base rates</li>
        </ul>
      </div>

      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Payment Tab ────────────────────────────────────────────── */
function PaymentTab({ settings, onSave }: { settings: Record<string, string>; onSave: (data: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'payment.bkash.enabled':   settings['payment.bkash.enabled']   ?? 'true',
    'payment.nagad.enabled':   settings['payment.nagad.enabled']   ?? 'true',
    'payment.cod.enabled':     settings['payment.cod.enabled']     ?? 'true',
    'payment.rocket.enabled':  settings['payment.rocket.enabled']  ?? 'false',
    'payment.bkash.number':    settings['payment.bkash.number']    ?? '',
    'payment.nagad.number':    settings['payment.nagad.number']    ?? '',
    'payment.rocket.number':   settings['payment.rocket.number']   ?? '',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const toggle = (k: string) => {
    setForm(f => ({ ...f, [k]: f[k as keyof typeof f] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };
  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    await onSave(form);
    setDirty(false); setSuccess(true); setPending(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const METHODS = [
    { key: 'bkash',  name: 'bKash',             type: 'Mobile Banking', color: 'border-pink-200 bg-pink-50',    numKey: 'payment.bkash.number',   placeholder: '01XXXXXXXXX (Merchant)' },
    { key: 'nagad',  name: 'Nagad',              type: 'Mobile Banking', color: 'border-orange-200 bg-orange-50', numKey: 'payment.nagad.number',   placeholder: '01XXXXXXXXX (Merchant)' },
    { key: 'rocket', name: 'Rocket (DBBL)',       type: 'Mobile Banking', color: 'border-purple-200 bg-purple-50', numKey: 'payment.rocket.number', placeholder: '01XXXXXXXXX' },
    { key: 'cod',    name: 'Cash on Delivery',   type: 'Cash Payment',   color: 'border-green-200 bg-green-50',  numKey: null,                     placeholder: '' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Payment Methods</h2>
        <p className="text-sm text-muted-foreground">Enable or disable payment options for your customers</p>
      </div>
      <div className="space-y-3">
        {METHODS.map(m => {
          const enabledKey = `payment.${m.key}.enabled` as keyof typeof form;
          const isEnabled = form[enabledKey] === 'true';
          return (
            <div key={m.key} className={`rounded-xl border p-4 ${m.color}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${isEnabled ? 'text-green-700' : 'text-muted-foreground'}`}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle value={isEnabled} onChange={() => toggle(enabledKey)} />
                </div>
              </div>
              {m.numKey && isEnabled && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-muted-foreground">Merchant Number</label>
                  <input type="tel" value={form[m.numKey as keyof typeof form]} onChange={setField(m.numKey)}
                    placeholder={m.placeholder}
                    className="mt-1 w-full rounded-md border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
        <p className="font-semibold mb-1">⚠️ Important</p>
        <p>These settings control which payment options customers see at checkout. Make sure merchant numbers are correct before enabling. For bKash/Nagad merchant API integration, contact your developer.</p>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Flash Sale Tab ─────────────────────────────────────────── */
function FlashSaleTab({ settings, onSave }: { settings: Record<string, string>; onSave: (data: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'flash_sale.enabled':             settings['flash_sale.enabled'] ?? 'false',
    'flash_sale.discount_percentage': settings['flash_sale.discount_percentage'] ?? '20',
    'new_arrival.days_window':        settings['new_arrival.days_window'] ?? '7',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const isEnabled = form['flash_sale.enabled'] === 'true';

  const handleSave = async () => {
    setPending(true);
    await onSave(form);
    setDirty(false); setSuccess(true); setPending(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Flash Sale & Promotions</h2>
        <p className="text-sm text-muted-foreground">Control sitewide sale settings and new arrival windows</p>
      </div>
      <div className="rounded-xl border bg-card px-5 mb-4">
        <FieldRow label="Flash Sale" hint="Show flash sale banner and apply sitewide discount">
          <div className="flex items-center gap-3">
            <Toggle value={isEnabled} onChange={v => { setForm(f => ({ ...f, 'flash_sale.enabled': v ? 'true' : 'false' })); setDirty(true); setSuccess(false); }} />
            <span className={`text-sm font-semibold ${isEnabled ? 'text-green-600' : 'text-muted-foreground'}`}>
              {isEnabled ? 'Active' : 'Off'}
            </span>
          </div>
        </FieldRow>
        {isEnabled && (
          <FieldRow label="Discount Percentage" hint="Applied to marked products during flash sale">
            <div className="relative w-32">
              <input type="number" min="1" max="90" value={form['flash_sale.discount_percentage']}
                onChange={e => { setForm(f => ({ ...f, 'flash_sale.discount_percentage': e.target.value })); setDirty(true); setSuccess(false); }}
                className={inp + ' pr-8'} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">%</span>
            </div>
          </FieldRow>
        )}
        <FieldRow label="New Arrival Window" hint="Products added within this many days appear as 'New'">
          <div className="relative w-32">
            <input type="number" min="1" max="60" value={form['new_arrival.days_window']}
              onChange={e => { setForm(f => ({ ...f, 'new_arrival.days_window': e.target.value })); setDirty(true); setSuccess(false); }}
              className={inp + ' pr-16'} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">days</span>
          </div>
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Analytics Tab ───────────────────────────────────────────── */
function AnalyticsTab({ settings, onSave }: { settings: Record<string, string>; onSave: (data: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'analytics.ga4.enabled':       settings['analytics.ga4.enabled'] ?? 'false',
    'analytics.ga4.measurementId': settings['analytics.ga4.measurementId'] ?? '',
    'analytics.gtm.enabled':       settings['analytics.gtm.enabled'] ?? 'false',
    'analytics.gtm.containerId':   settings['analytics.gtm.containerId'] ?? '',
    'analytics.pixel.enabled':     settings['analytics.pixel.enabled'] ?? 'false',
    'analytics.pixel.pixelId':     settings['analytics.pixel.pixelId'] ?? '',
    'analytics.gsc.verificationTag': settings['analytics.gsc.verificationTag'] ?? '',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };
  const toggleField = (k: string) => {
    setForm(f => ({ ...f, [k]: f[k as keyof typeof form] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    await onSave(form);
    setDirty(false); setSuccess(true); setPending(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const TOOLS = [
    { enableKey: 'analytics.ga4.enabled', idKey: 'analytics.ga4.measurementId', name: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX', color: 'border-orange-200 bg-orange-50' },
    { enableKey: 'analytics.gtm.enabled', idKey: 'analytics.gtm.containerId',   name: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX',  color: 'border-blue-200 bg-blue-50' },
    { enableKey: 'analytics.pixel.enabled', idKey: 'analytics.pixel.pixelId',   name: 'Meta (Facebook) Pixel', placeholder: '123456789012345', color: 'border-indigo-200 bg-indigo-50' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Analytics & Tracking</h2>
        <p className="text-sm text-muted-foreground">Connect your marketing and analytics tools</p>
      </div>
      <div className="space-y-3 mb-4">
        {TOOLS.map(t => {
          const enabled = form[t.enableKey as keyof typeof form] === 'true';
          return (
            <div key={t.enableKey} className={`rounded-xl border p-4 ${t.color}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="font-bold text-sm">{t.name}</p>
                <Toggle value={enabled} onChange={() => toggleField(t.enableKey)} />
              </div>
              {enabled && (
                <input value={form[t.idKey as keyof typeof form]} onChange={set(t.idKey)}
                  placeholder={t.placeholder}
                  className="w-full rounded-md border bg-white px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
              )}
            </div>
          );
        })}

        <div className="rounded-xl border bg-card p-4">
          <p className="font-bold text-sm mb-2">Google Search Console</p>
          <label className="text-xs font-semibold text-muted-foreground">Verification Meta Tag</label>
          <input value={form['analytics.gsc.verificationTag']} onChange={set('analytics.gsc.verificationTag')}
            placeholder="<meta name='google-site-verification' content='...' />"
            className={inp + ' mt-1 font-mono text-xs'} />
        </div>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── About Tab ──────────────────────────────────────────────── */
function AboutTab() {
  const rows = [
    { l: 'Application',  v: 'UNKORA Admin Panel' },
    { l: 'Version',      v: 'v1.0.0' },
    { l: 'Framework',    v: 'Next.js 15 App Router + TypeScript' },
    { l: 'API',          v: 'NestJS + Fastify (REST)' },
    { l: 'Database',     v: 'PostgreSQL 16 via Prisma ORM' },
    { l: 'Cache',        v: 'Redis 7 / In-Memory (dev)' },
    { l: 'Auth',         v: 'JWT (access 15m + refresh 7d) + Argon2' },
    { l: 'Payments',     v: 'bKash, Nagad, COD (Rocket optional)' },
    { l: 'Shipping',     v: 'Pathao, Steadfast, RedX integrations' },
    { l: 'Support',      v: 'dev@unkora.com' },
  ];
  const stack = ['Next.js 15','TypeScript','Tailwind CSS','TanStack Query','Zustand','NestJS','Fastify','Prisma','PostgreSQL','Redis','Argon2','Zod'];
  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">About UNKORA</h2>
        <p className="text-sm text-muted-foreground">System information and tech stack</p>
      </div>
      <div className="rounded-xl border bg-card px-5 mb-4">
        {rows.map(r => (
          <div key={r.l} className="py-3 border-b last:border-0 grid grid-cols-2 gap-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{r.l}</span>
            <span className="text-sm font-medium">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {stack.map(t => (
            <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('store');
  const qc = useQueryClient();

  const { data: settings = {}, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: storeSettingsApi.get,
  });

  const saveMutation = useMutation({
    mutationFn: storeSettingsApi.update,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  });

  const handleSave = async (data: Record<string, string>) => {
    await saveMutation.mutateAsync(data);
  };

  if (isLoading) return (
    <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  );

  if (error) return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      Failed to load settings. Make sure you are logged in as admin and the API is running.
    </div>
  );

  const tabContent: Record<TabId, React.ReactNode> = {
    store:     <StoreInfoTab    settings={settings} onSave={handleSave} />,
    shipping:  <ShippingTab     settings={settings} onSave={handleSave} />,
    payment:   <PaymentTab      settings={settings} onSave={handleSave} />,
    flash:     <FlashSaleTab    settings={settings} onSave={handleSave} />,
    analytics: <AnalyticsTab    settings={settings} onSave={handleSave} />,
    about:     <AboutTab />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your store — all changes save to the database instantly</p>
      </div>

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Sidebar */}
        <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible sm:w-48 flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap text-left ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}>
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}
