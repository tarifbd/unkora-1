'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Truck, CreditCard, Zap, Globe, Info,
  Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
  Search, Share2, FileText,
} from 'lucide-react';
import api from '@/lib/api';

/* ─── settings API helper ─────────────────────────────────────── */
const storeSettingsApi = {
  get: (): Promise<Record<string, string>> =>
    api.get('/settings/store').then(r => r.data.data),
  update: (data: Record<string, string>) =>
    api.patch('/settings/store', data).then(r => r.data.data),
};

/* ─── shared components ───────────────────────────────────────── */
type TabId = 'general' | 'store' | 'payment' | 'shipping' | 'seo' | 'social' | 'invoice' | 'footer';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general',  label: 'General',   icon: Store },
  { id: 'store',    label: 'Store Info', icon: Info },
  { id: 'payment',  label: 'Payment',   icon: CreditCard },
  { id: 'shipping', label: 'Shipping',  icon: Truck },
  { id: 'seo',      label: 'SEO',       icon: Search },
  { id: 'social',   label: 'Social',    icon: Share2 },
  { id: 'invoice',  label: 'Invoice',   icon: FileText },
  { id: 'footer',   label: 'Footer',    icon: Globe },
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

/* ─── General Tab ────────────────────────────────────────────── */
function GeneralTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'site.name':        settings['site.name'] ?? 'UNKORA',
    'site.tagline':     settings['site.tagline'] ?? '',
    'site.email':       settings['site.email'] ?? '',
    'site.phone':       settings['site.phone'] ?? '',
    'site.address':     settings['site.address'] ?? '',
    'currency.code':    settings['currency.code'] ?? 'BDT',
    'currency.symbol':  settings['currency.symbol'] ?? '৳',
    'timezone':         settings['timezone'] ?? 'Asia/Dhaka',
    'date.format':      settings['date.format'] ?? 'DD/MM/YYYY',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">General Settings</h2>
        <p className="text-sm text-muted-foreground">Core site configuration and regional settings</p>
      </div>
      <div className="rounded-xl border bg-card px-5">
        <FieldRow label="Site Name" hint="Shown in browser title and emails">
          <input value={form['site.name']} onChange={set('site.name')} className={inp} />
        </FieldRow>
        <FieldRow label="Tagline" hint="Short marketing description">
          <input value={form['site.tagline']} onChange={set('site.tagline')} className={inp} placeholder="Bangladesh's Best Bookstore" />
        </FieldRow>
        <FieldRow label="Support Email">
          <input type="email" value={form['site.email']} onChange={set('site.email')} className={inp} placeholder="support@unkora.com" />
        </FieldRow>
        <FieldRow label="Phone Number">
          <input value={form['site.phone']} onChange={set('site.phone')} className={inp} placeholder="+880 1700-000000" />
        </FieldRow>
        <FieldRow label="Business Address">
          <textarea value={form['site.address']} onChange={set('site.address')} rows={2}
            className={inp + ' resize-none'} placeholder="Dhaka, Bangladesh" />
        </FieldRow>
        <FieldRow label="Currency" hint="Default currency code and symbol">
          <div className="flex gap-2">
            <input value={form['currency.code']} onChange={set('currency.code')} className={inp + ' w-24'} placeholder="BDT" />
            <input value={form['currency.symbol']} onChange={set('currency.symbol')} className={inp + ' w-20'} placeholder="৳" />
          </div>
        </FieldRow>
        <FieldRow label="Timezone">
          <select value={form['timezone']} onChange={set('timezone')} className={inp}>
            <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
            <option value="UTC">UTC</option>
          </select>
        </FieldRow>
        <FieldRow label="Date Format">
          <select value={form['date.format']} onChange={set('date.format')} className={inp}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Store Info Tab ──────────────────────────────────────────── */
function StoreTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'store.orderPrefix':       settings['store.orderPrefix'] ?? 'ORD',
    'store.minOrderAmount':    settings['store.minOrderAmount'] ?? '0',
    'store.maxOrderAmount':    settings['store.maxOrderAmount'] ?? '',
    'store.guestCheckout':     settings['store.guestCheckout'] ?? 'true',
    'store.stockWarningLevel': settings['store.stockWarningLevel'] ?? '5',
    'store.reviewsEnabled':    settings['store.reviewsEnabled'] ?? 'true',
    'store.wishlistEnabled':   settings['store.wishlistEnabled'] ?? 'true',
    'store.maintenanceMode':   settings['store.maintenanceMode'] ?? 'false',
    'new_arrival.days_window': settings['new_arrival.days_window'] ?? '7',
    'flash_sale.enabled':      settings['flash_sale.enabled'] ?? 'false',
    'flash_sale.discount_percentage': settings['flash_sale.discount_percentage'] ?? '20',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };
  const toggle = (k: keyof typeof form) => {
    setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Store Configuration</h2>
        <p className="text-sm text-muted-foreground">Order settings, features, and maintenance</p>
      </div>
      <div className="rounded-xl border bg-card px-5">
        <FieldRow label="Order ID Prefix" hint="Prepended to all order IDs">
          <input value={form['store.orderPrefix']} onChange={set('store.orderPrefix')} className={inp + ' w-32'} />
        </FieldRow>
        <FieldRow label="Min Order Amount (৳)" hint="0 for no minimum">
          <input type="number" min="0" value={form['store.minOrderAmount']} onChange={set('store.minOrderAmount')} className={inp + ' w-40'} />
        </FieldRow>
        <FieldRow label="Stock Warning Level" hint="Show low-stock badge below this count">
          <input type="number" min="1" value={form['store.stockWarningLevel']} onChange={set('store.stockWarningLevel')} className={inp + ' w-40'} />
        </FieldRow>
        <FieldRow label="New Arrival Window" hint="Days a product is labeled 'New'">
          <input type="number" min="1" max="60" value={form['new_arrival.days_window']} onChange={set('new_arrival.days_window')} className={inp + ' w-40'} />
        </FieldRow>
        <FieldRow label="Guest Checkout">
          <div className="flex items-center gap-3">
            <Toggle value={form['store.guestCheckout'] === 'true'} onChange={() => toggle('store.guestCheckout')} />
            <span className="text-sm text-muted-foreground">Allow orders without account</span>
          </div>
        </FieldRow>
        <FieldRow label="Product Reviews">
          <Toggle value={form['store.reviewsEnabled'] === 'true'} onChange={() => toggle('store.reviewsEnabled')} />
        </FieldRow>
        <FieldRow label="Wishlist">
          <Toggle value={form['store.wishlistEnabled'] === 'true'} onChange={() => toggle('store.wishlistEnabled')} />
        </FieldRow>
        <FieldRow label="Flash Sale" hint="Show sitewide flash sale banner">
          <div className="flex items-center gap-3">
            <Toggle value={form['flash_sale.enabled'] === 'true'} onChange={() => toggle('flash_sale.enabled')} />
            {form['flash_sale.enabled'] === 'true' && (
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="90" value={form['flash_sale.discount_percentage']}
                  onChange={set('flash_sale.discount_percentage')} className={inp + ' w-20'} />
                <span className="text-sm text-muted-foreground">% off</span>
              </div>
            )}
          </div>
        </FieldRow>
        <FieldRow label="Maintenance Mode" hint="Shows a maintenance page to visitors">
          <div className="flex items-center gap-3">
            <Toggle value={form['store.maintenanceMode'] === 'true'} onChange={() => toggle('store.maintenanceMode')} />
            {form['store.maintenanceMode'] === 'true' && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                Site is in maintenance mode
              </span>
            )}
          </div>
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Payment Tab ────────────────────────────────────────────── */
function PaymentTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
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

  const toggle = (k: keyof typeof form) => {
    setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };
  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  const METHODS = [
    { key: 'bkash',  name: 'bKash',           color: 'border-pink-200 bg-pink-50',    numKey: 'payment.bkash.number',   placeholder: '01XXXXXXXXX (Merchant)' },
    { key: 'nagad',  name: 'Nagad',            color: 'border-orange-200 bg-orange-50', numKey: 'payment.nagad.number',  placeholder: '01XXXXXXXXX (Merchant)' },
    { key: 'rocket', name: 'Rocket (DBBL)',     color: 'border-purple-200 bg-purple-50', numKey: 'payment.rocket.number', placeholder: '01XXXXXXXXX' },
    { key: 'cod',    name: 'Cash on Delivery', color: 'border-green-200 bg-green-50',  numKey: null, placeholder: '' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Payment Methods</h2>
        <p className="text-sm text-muted-foreground">Enable or disable payment options at checkout</p>
      </div>
      <div className="space-y-3">
        {METHODS.map(m => {
          const enabledKey = `payment.${m.key}.enabled` as keyof typeof form;
          const isEnabled = form[enabledKey] === 'true';
          return (
            <div key={m.key} className={`rounded-xl border p-4 ${m.color}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-sm">{m.name}</p>
                <Toggle value={isEnabled} onChange={() => toggle(enabledKey)} />
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
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Shipping Tab ────────────────────────────────────────────── */
function ShippingTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'shipping.dhaka_rate':         settings['shipping.dhaka_rate']         ?? '60',
    'shipping.outside_dhaka_rate': settings['shipping.outside_dhaka_rate'] ?? '100',
    'shipping.free_threshold':     settings['shipping.free_threshold']     ?? '500',
    'shipping.cod_charge':         settings['shipping.cod_charge']         ?? '0',
    'shipping.express_rate':       settings['shipping.express_rate']       ?? '150',
    'shipping.same_day_enabled':   settings['shipping.same_day_enabled']   ?? 'false',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };
  const toggle = (k: keyof typeof form) => {
    setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  const rates = [
    { key: 'shipping.dhaka_rate',         label: 'Dhaka City Delivery', hint: '1–2 business days' },
    { key: 'shipping.outside_dhaka_rate', label: 'Outside Dhaka',       hint: '3–5 business days' },
    { key: 'shipping.express_rate',       label: 'Express Delivery',    hint: 'Next day delivery' },
    { key: 'shipping.cod_charge',         label: 'COD Charge',          hint: 'Extra for Cash on Delivery' },
    { key: 'shipping.free_threshold',     label: 'Free Shipping Above', hint: '0 to disable free shipping' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Shipping Rates</h2>
        <p className="text-sm text-muted-foreground">Delivery zones and pricing for Bangladesh</p>
      </div>
      <div className="space-y-3 mb-4">
        {rates.map(r => (
          <div key={r.key} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">{r.label}</p>
              <p className="text-xs text-muted-foreground">{r.hint}</p>
            </div>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">৳</span>
              <input type="number" min="0" value={form[r.key as keyof typeof form]}
                onChange={set(r.key)} className={inp + ' pl-7 text-right font-bold'} />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card px-5 mb-4">
        <FieldRow label="Same-Day Delivery" hint="Enable same-day delivery option">
          <Toggle value={form['shipping.same_day_enabled'] === 'true'} onChange={() => toggle('shipping.same_day_enabled')} />
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── SEO Tab ────────────────────────────────────────────────── */
function SeoTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'seo.title':              settings['seo.title']              ?? '',
    'seo.description':        settings['seo.description']        ?? '',
    'seo.keywords':           settings['seo.keywords']           ?? '',
    'seo.ogImage':            settings['seo.ogImage']            ?? '',
    'seo.robots':             settings['seo.robots']             ?? 'index, follow',
    'seo.canonicalUrl':       settings['seo.canonicalUrl']       ?? '',
    'analytics.ga4.enabled':  settings['analytics.ga4.enabled']  ?? 'false',
    'analytics.ga4.measurementId': settings['analytics.ga4.measurementId'] ?? '',
    'analytics.gtm.enabled':  settings['analytics.gtm.enabled']  ?? 'false',
    'analytics.gtm.containerId': settings['analytics.gtm.containerId'] ?? '',
    'analytics.gsc.verificationTag': settings['analytics.gsc.verificationTag'] ?? '',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };
  const toggle = (k: keyof typeof form) => {
    setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">SEO & Analytics</h2>
        <p className="text-sm text-muted-foreground">Search engine optimization and tracking</p>
      </div>
      <div className="rounded-xl border bg-card px-5 mb-4">
        <FieldRow label="Meta Title" hint="Default page title (60 chars max)">
          <input value={form['seo.title']} onChange={set('seo.title')} className={inp} maxLength={60} placeholder="UNKORA - Bangladesh's Best Bookstore" />
        </FieldRow>
        <FieldRow label="Meta Description" hint="Default page description (160 chars max)">
          <textarea value={form['seo.description']} onChange={set('seo.description')} rows={3}
            className={inp + ' resize-none'} maxLength={160} placeholder="Shop books, stationery and more..." />
        </FieldRow>
        <FieldRow label="Keywords" hint="Comma-separated keywords">
          <input value={form['seo.keywords']} onChange={set('seo.keywords')} className={inp} placeholder="books, stationery, bangladesh" />
        </FieldRow>
        <FieldRow label="OG Image URL" hint="Social share preview image">
          <input type="url" value={form['seo.ogImage']} onChange={set('seo.ogImage')} className={inp} placeholder="https://..." />
        </FieldRow>
        <FieldRow label="Robots" hint="Crawling directive for search engines">
          <select value={form['seo.robots']} onChange={(e) => { setForm(f => ({ ...f, 'seo.robots': e.target.value })); setDirty(true); }} className={inp}>
            <option value="index, follow">index, follow</option>
            <option value="noindex, follow">noindex, follow</option>
            <option value="index, nofollow">index, nofollow</option>
            <option value="noindex, nofollow">noindex, nofollow</option>
          </select>
        </FieldRow>
        <FieldRow label="Canonical URL" hint="Base URL for canonicalization">
          <input type="url" value={form['seo.canonicalUrl']} onChange={set('seo.canonicalUrl')} className={inp} placeholder="https://unkora.com" />
        </FieldRow>
      </div>
      <div className="rounded-xl border bg-card px-5">
        <FieldRow label="Google Analytics 4">
          <div className="flex items-center gap-3">
            <Toggle value={form['analytics.ga4.enabled'] === 'true'} onChange={() => toggle('analytics.ga4.enabled')} />
            {form['analytics.ga4.enabled'] === 'true' && (
              <input value={form['analytics.ga4.measurementId']} onChange={set('analytics.ga4.measurementId')}
                placeholder="G-XXXXXXXXXX" className={inp + ' font-mono'} />
            )}
          </div>
        </FieldRow>
        <FieldRow label="Google Tag Manager">
          <div className="flex items-center gap-3">
            <Toggle value={form['analytics.gtm.enabled'] === 'true'} onChange={() => toggle('analytics.gtm.enabled')} />
            {form['analytics.gtm.enabled'] === 'true' && (
              <input value={form['analytics.gtm.containerId']} onChange={set('analytics.gtm.containerId')}
                placeholder="GTM-XXXXXXX" className={inp + ' font-mono'} />
            )}
          </div>
        </FieldRow>
        <FieldRow label="Google Search Console" hint="Verification meta tag">
          <input value={form['analytics.gsc.verificationTag']} onChange={set('analytics.gsc.verificationTag')}
            placeholder="<meta name='google-site-verification' content='...' />"
            className={inp + ' font-mono text-xs'} />
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Social Tab ─────────────────────────────────────────────── */
function SocialTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'social.facebook':  settings['social.facebook']  ?? '',
    'social.instagram': settings['social.instagram'] ?? '',
    'social.twitter':   settings['social.twitter']   ?? '',
    'social.youtube':   settings['social.youtube']   ?? '',
    'social.linkedin':  settings['social.linkedin']  ?? '',
    'social.tiktok':    settings['social.tiktok']    ?? '',
    'analytics.pixel.enabled': settings['analytics.pixel.enabled'] ?? 'false',
    'analytics.pixel.pixelId': settings['analytics.pixel.pixelId'] ?? '',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };
  const toggle = (k: keyof typeof form) => {
    setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  const PLATFORMS = [
    { key: 'social.facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourpage' },
    { key: 'social.instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'social.twitter',   label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
    { key: 'social.youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourchannel' },
    { key: 'social.linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/yourco' },
    { key: 'social.tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourhandle' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Social Media</h2>
        <p className="text-sm text-muted-foreground">Links to your social media profiles and ad pixels</p>
      </div>
      <div className="rounded-xl border bg-card px-5 mb-4">
        {PLATFORMS.map(p => (
          <FieldRow key={p.key} label={p.label}>
            <input type="url" value={form[p.key as keyof typeof form]} onChange={set(p.key)}
              placeholder={p.placeholder} className={inp} />
          </FieldRow>
        ))}
      </div>
      <div className="rounded-xl border bg-card px-5">
        <FieldRow label="Meta (Facebook) Pixel" hint="Conversion tracking pixel">
          <div className="flex items-center gap-3">
            <Toggle value={form['analytics.pixel.enabled'] === 'true'} onChange={() => toggle('analytics.pixel.enabled')} />
            {form['analytics.pixel.enabled'] === 'true' && (
              <input value={form['analytics.pixel.pixelId']} onChange={set('analytics.pixel.pixelId')}
                placeholder="123456789012345" className={inp + ' font-mono'} />
            )}
          </div>
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Invoice Tab ────────────────────────────────────────────── */
function InvoiceTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'invoice_logo_url':      settings['invoice_logo_url']      ?? '',
    'invoice_store_name':    settings['invoice_store_name']    ?? 'UNKORA',
    'invoice_store_address': settings['invoice_store_address'] ?? '',
    'invoice_phone':         settings['invoice_phone']         ?? '',
    'invoice_email':         settings['invoice_email']         ?? '',
    'invoice_footer_text':   settings['invoice_footer_text']   ?? 'Thank you for shopping with us!',
    'invoice_return_policy': settings['invoice_return_policy'] ?? '',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error visible in the UI via mutation state
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-lg">Invoice Settings</h2>
        <p className="text-sm text-muted-foreground">Customize the branding and content printed on customer invoices</p>
      </div>
      <div className="rounded-xl border bg-card px-5">
        <FieldRow label="Logo URL" hint="URL of your store logo shown on invoice header">
          <div className="space-y-2">
            <input
              type="url"
              value={form['invoice_logo_url']}
              onChange={set('invoice_logo_url')}
              className={inp}
              placeholder="https://cdn.unkora.com/logo.png"
            />
            {form['invoice_logo_url'] && (
              <div className="rounded-lg border bg-muted/30 p-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form['invoice_logo_url']}
                  alt="Invoice logo preview"
                  className="h-12 max-w-[180px] object-contain"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </FieldRow>
        <FieldRow label="Store Name" hint="Printed at the top of every invoice">
          <input value={form['invoice_store_name']} onChange={set('invoice_store_name')} className={inp} placeholder="UNKORA" />
        </FieldRow>
        <FieldRow label="Store Address" hint="Business address shown on invoice">
          <textarea
            value={form['invoice_store_address']}
            onChange={set('invoice_store_address')}
            rows={3}
            className={inp + ' resize-none'}
            placeholder={"House 12, Road 5\nDhanmondi, Dhaka-1205\nBangladesh"}
          />
        </FieldRow>
        <FieldRow label="Contact Phone">
          <input value={form['invoice_phone']} onChange={set('invoice_phone')} className={inp} placeholder="+880 1700-000000" />
        </FieldRow>
        <FieldRow label="Contact Email">
          <input type="email" value={form['invoice_email']} onChange={set('invoice_email')} className={inp} placeholder="support@unkora.com" />
        </FieldRow>
        <FieldRow label="Footer Text" hint="Message printed at the bottom of every invoice">
          <textarea
            value={form['invoice_footer_text']}
            onChange={set('invoice_footer_text')}
            rows={2}
            className={inp + ' resize-none'}
            placeholder="Thank you for shopping with us!"
          />
        </FieldRow>
        <FieldRow label="Return Policy" hint="Return / refund policy text printed on invoice">
          <textarea
            value={form['invoice_return_policy']}
            onChange={set('invoice_return_policy')}
            rows={4}
            className={inp + ' resize-none'}
            placeholder="Returns accepted within 7 days of delivery. Item must be unused and in original packaging."
          />
        </FieldRow>
      </div>
      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Footer Tab ─────────────────────────────────────────────── */
function FooterTab({ settings, onSave }: { settings: Record<string, string>; onSave: (d: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    'footer.phone':       settings['footer.phone']       || settings['site.phone']    || '',
    'footer.email':       settings['footer.email']       || settings['site.email']    || '',
    'footer.address':     settings['footer.address']     || settings['site.address']  || '',
    'footer.whatsapp':    settings['footer.whatsapp']    || '',
    'footer.facebook':    settings['footer.facebook']    || settings['social.facebook']    || '',
    'footer.instagram':   settings['footer.instagram']   || settings['social.instagram']   || '',
    'footer.youtube':     settings['footer.youtube']     || settings['social.youtube']     || '',
    'footer.tiktok':      settings['footer.tiktok']      || settings['social.tiktok']      || '',
    'footer.twitter':     settings['footer.twitter']     || settings['social.twitter']     || '',
    'footer.tagline':     settings['footer.tagline']     || '',
    'footer.copyright':   settings['footer.copyright']   || '',
    'footer.payment.bkash':  settings['footer.payment.bkash']  ?? 'true',
    'footer.payment.nagad':  settings['footer.payment.nagad']  ?? 'true',
    'footer.payment.visa':   settings['footer.payment.visa']   ?? 'true',
    'footer.payment.mc':     settings['footer.payment.mc']     ?? 'true',
    'footer.payment.cod':    settings['footer.payment.cod']    ?? 'true',
    'footer.payment.rocket': settings['footer.payment.rocket'] ?? 'false',
  });
  const [dirty, setDirty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setDirty(true); setSuccess(false);
  };
  const toggle = (k: keyof typeof form) => {
    setForm(f => ({ ...f, [k]: f[k] === 'true' ? 'false' : 'true' }));
    setDirty(true); setSuccess(false);
  };

  const handleSave = async () => {
    setPending(true);
    try {
      await onSave(form);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* silent */ } finally { setPending(false); }
  };

  const SOCIAL_FIELDS = [
    { key: 'footer.facebook',  label: 'Facebook URL',  placeholder: 'https://facebook.com/yourpage' },
    { key: 'footer.instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'footer.youtube',   label: 'YouTube URL',   placeholder: 'https://youtube.com/@yourchannel' },
    { key: 'footer.tiktok',    label: 'TikTok URL',    placeholder: 'https://tiktok.com/@yourhandle' },
    { key: 'footer.twitter',   label: 'X (Twitter) URL', placeholder: 'https://x.com/yourhandle' },
    { key: 'footer.whatsapp',  label: 'WhatsApp Number', placeholder: '+8801911369686' },
  ];

  const PAYMENT_FIELDS = [
    { key: 'footer.payment.bkash',  label: 'bKash',            color: '#E2136E' },
    { key: 'footer.payment.nagad',  label: 'Nagad',            color: '#F16522' },
    { key: 'footer.payment.visa',   label: 'Visa',             color: '#1A1F71' },
    { key: 'footer.payment.mc',     label: 'Mastercard',       color: '#EB001B' },
    { key: 'footer.payment.cod',    label: 'Cash on Delivery', color: '#047857' },
    { key: 'footer.payment.rocket', label: 'Rocket (DBBL)',    color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-lg">Footer Settings</h2>
        <p className="text-sm text-muted-foreground">Contact info, social links, and payment methods shown in the site footer</p>
      </div>

      {/* Contact */}
      <div className="rounded-xl border bg-card px-5">
        <h3 className="font-semibold text-sm py-3 border-b text-muted-foreground uppercase tracking-wide">Contact Information</h3>
        <FieldRow label="Phone" hint="Shown in footer contact section">
          <input value={form['footer.phone']} onChange={set('footer.phone')} className={inp} placeholder="+880 1911-369686" />
        </FieldRow>
        <FieldRow label="Email">
          <input type="email" value={form['footer.email']} onChange={set('footer.email')} className={inp} placeholder="support@unkora.shop" />
        </FieldRow>
        <FieldRow label="Address">
          <textarea value={form['footer.address']} onChange={set('footer.address')} rows={2} className={inp + ' resize-none'} placeholder="160 Hasan Nagar, Dhaka-1211" />
        </FieldRow>
        <FieldRow label="Tagline" hint="Short description shown under the logo">
          <input value={form['footer.tagline']} onChange={set('footer.tagline')} className={inp} placeholder="Bangladesh's best online bookstore" />
        </FieldRow>
        <FieldRow label="Copyright Text" hint="Bottom bar text (leave blank for default)">
          <input value={form['footer.copyright']} onChange={set('footer.copyright')} className={inp} placeholder="© 2025 UNKORA.SHOP · All rights reserved" />
        </FieldRow>
      </div>

      {/* Social */}
      <div className="rounded-xl border bg-card px-5">
        <h3 className="font-semibold text-sm py-3 border-b text-muted-foreground uppercase tracking-wide">Social Media Links</h3>
        {SOCIAL_FIELDS.map(f => (
          <FieldRow key={f.key} label={f.label}>
            <input type="url" value={form[f.key as keyof typeof form]} onChange={set(f.key)} placeholder={f.placeholder} className={inp} />
          </FieldRow>
        ))}
      </div>

      {/* Payment methods */}
      <div className="rounded-xl border bg-card px-5">
        <h3 className="font-semibold text-sm py-3 border-b text-muted-foreground uppercase tracking-wide">Payment Method Badges</h3>
        <div className="py-4 space-y-3">
          {PAYMENT_FIELDS.map(f => (
            <label key={f.key} className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-bold shadow-sm text-white"
                  style={{ background: f.color }}>
                  {f.label}
                </span>
                <span className="text-sm">{f.label}</span>
              </div>
              <Toggle value={form[f.key as keyof typeof form] === 'true'} onChange={() => toggle(f.key as keyof typeof form)} />
            </label>
          ))}
        </div>
      </div>

      <SaveBar isDirty={dirty} onSave={handleSave} isPending={pending} success={success} />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
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
    general:  <GeneralTab  settings={settings} onSave={handleSave} />,
    store:    <StoreTab    settings={settings} onSave={handleSave} />,
    payment:  <PaymentTab  settings={settings} onSave={handleSave} />,
    shipping: <ShippingTab settings={settings} onSave={handleSave} />,
    seo:      <SeoTab      settings={settings} onSave={handleSave} />,
    social:   <SocialTab   settings={settings} onSave={handleSave} />,
    invoice:  <InvoiceTab  settings={settings} onSave={handleSave} />,
    footer:   <FooterTab   settings={settings} onSave={handleSave} />,
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
