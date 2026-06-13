'use client';

import { useState } from 'react';
import {
  Key, Webhook, Globe, Code2, Plus, Copy, Eye, EyeOff,
  Trash2, CheckCircle, XCircle, Clock, RefreshCw, Shield,
  Zap, BarChart3, Download, ExternalLink, AlertTriangle,
  ChevronDown, ChevronUp, Settings, BookOpen, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────── */
type ApiKeyStatus   = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
type WebhookStatus  = 'ACTIVE' | 'PAUSED' | 'FAILING';
type DeliveryStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
type TabId          = 'keys' | 'webhooks' | 'logs' | 'docs';

type ApiScope = 'orders:read' | 'orders:write' | 'products:read' | 'products:write' | 'customers:read' | 'analytics:read';

/* ─── Mock data ──────────────────────────────────────────────── */
const API_KEYS: {
  id: string; name: string; key: string; prefix: string;
  status: ApiKeyStatus; scopes: ApiScope[];
  requests: number; lastUsed: string; createdAt: string; expiresAt?: string;
}[] = [
  {
    id: 'AK001', name: 'মোবাইল অ্যাপ', prefix: 'uk_live_a1b2',
    key: 'uk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', status: 'ACTIVE',
    scopes: ['orders:read', 'orders:write', 'products:read'],
    requests: 1247, lastUsed: '২ মিনিট আগে', createdAt: '০১ জুন ২০২৬',
  },
  {
    id: 'AK002', name: 'ERP সংযোগ', prefix: 'uk_live_x9y8',
    key: 'uk_live_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4', status: 'ACTIVE',
    scopes: ['orders:read', 'products:read', 'customers:read', 'analytics:read'],
    requests: 8934, lastUsed: '১৫ মিনিট আগে', createdAt: '১৫ মে ২০২৬',
  },
  {
    id: 'AK003', name: 'পুরানো ইন্টিগ্রেশন', prefix: 'uk_live_m3n4',
    key: 'uk_live_m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8', status: 'REVOKED',
    scopes: ['orders:read'],
    requests: 234, lastUsed: '৩০ মে ২০২৬', createdAt: '১০ এপ্রিল ২০২৬',
  },
];

const WEBHOOKS: {
  id: string; name: string; url: string; events: string[];
  status: WebhookStatus; deliveries: number; failures: number;
  lastDelivery: string; secret: string;
}[] = [
  {
    id: 'WH001', name: 'অর্ডার নোটিফিকেশন', url: 'https://erp.example.com/webhooks/orders',
    events: ['order.created', 'order.confirmed', 'order.shipped', 'order.delivered'],
    status: 'ACTIVE', deliveries: 1456, failures: 3, lastDelivery: '৫ মিনিট আগে',
    secret: 'whsec_a1b2c3d4e5f6g7h8i9j0',
  },
  {
    id: 'WH002', name: 'পেমেন্ট আপডেট', url: 'https://payment.example.io/hook',
    events: ['payment.success', 'payment.failed', 'refund.created'],
    status: 'FAILING', deliveries: 342, failures: 18, lastDelivery: '২০ মিনিট আগে',
    secret: 'whsec_z9y8x7w6v5u4t3s2r1q0',
  },
  {
    id: 'WH003', name: 'ইনভেন্টরি সিংক', url: 'https://warehouse.example.net/sync',
    events: ['product.stock_updated', 'product.out_of_stock'],
    status: 'PAUSED', deliveries: 89, failures: 0, lastDelivery: '২ দিন আগে',
    secret: 'whsec_p9q8r7s6t5u4v3w2x1y0',
  },
];

const DELIVERY_LOG: {
  id: string; webhookName: string; event: string; url: string;
  status: DeliveryStatus; statusCode?: number; duration: number; time: string;
}[] = [
  { id: 'DL001', webhookName: 'অর্ডার নোটিফিকেশন', event: 'order.created',    url: 'https://erp.example.com/webhooks/orders', status: 'SUCCESS', statusCode: 200, duration: 124, time: '৫ মিনিট আগে' },
  { id: 'DL002', webhookName: 'পেমেন্ট আপডেট',     event: 'payment.success',  url: 'https://payment.example.io/hook',         status: 'FAILED',  statusCode: 503, duration: 5000, time: '১০ মিনিট আগে' },
  { id: 'DL003', webhookName: 'অর্ডার নোটিফিকেশন', event: 'order.confirmed',  url: 'https://erp.example.com/webhooks/orders', status: 'SUCCESS', statusCode: 200, duration: 87,  time: '১৫ মিনিট আগে' },
  { id: 'DL004', webhookName: 'পেমেন্ট আপডেট',     event: 'payment.failed',   url: 'https://payment.example.io/hook',         status: 'FAILED',  statusCode: 500, duration: 5000, time: '২০ মিনিট আগে' },
  { id: 'DL005', webhookName: 'অর্ডার নোটিফিকেশন', event: 'order.shipped',    url: 'https://erp.example.com/webhooks/orders', status: 'SUCCESS', statusCode: 201, duration: 143, time: '২৫ মিনিট আগে' },
];

const SCOPES: { id: ApiScope; label: string; desc: string }[] = [
  { id: 'orders:read',     label: 'orders:read',     desc: 'অর্ডার দেখুন' },
  { id: 'orders:write',    label: 'orders:write',    desc: 'অর্ডার আপডেট করুন' },
  { id: 'products:read',   label: 'products:read',   desc: 'প্রোডাক্ট দেখুন' },
  { id: 'products:write',  label: 'products:write',  desc: 'প্রোডাক্ট আপডেট করুন' },
  { id: 'customers:read',  label: 'customers:read',  desc: 'কাস্টমার তথ্য দেখুন' },
  { id: 'analytics:read',  label: 'analytics:read',  desc: 'অ্যানালিটিক্স দেখুন' },
];

const WEBHOOK_EVENTS = [
  'order.created', 'order.confirmed', 'order.shipped', 'order.delivered', 'order.cancelled',
  'payment.success', 'payment.failed', 'refund.created',
  'product.stock_updated', 'product.out_of_stock',
  'customer.registered', 'customer.blocked',
];

/* ─── Helpers ────────────────────────────────────────────────── */
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', color)}>
      {children}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      title="কপি করুন">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

/* ─── Create API Key Modal ───────────────────────────────────── */
function CreateKeyModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([]);
  const [expiry, setExpiry] = useState('');
  const [created, setCreated] = useState(false);
  const newKey = 'uk_live_' + Math.random().toString(36).slice(2, 18);

  function toggleScope(s: ApiScope) {
    setSelectedScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> নতুন API Key
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        {!created ? (
          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold">Key-এর নাম</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="যেমন: মোবাইল অ্যাপ, ERP সংযোগ"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold">Scopes (অনুমতি)</label>
              <div className="grid grid-cols-2 gap-2">
                {SCOPES.map(s => (
                  <label key={s.id}
                    className={cn('flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all',
                      selectedScopes.includes(s.id) ? 'border-primary bg-primary/5' : 'hover:border-primary/40')}>
                    <input type="checkbox" checked={selectedScopes.includes(s.id)} onChange={() => toggleScope(s.id)} className="rounded" />
                    <div>
                      <p className="text-xs font-bold font-mono">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold">মেয়াদ (ঐচ্ছিক)</label>
              <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors">বাতিল</button>
              <button onClick={() => setCreated(true)} disabled={!name || selectedScopes.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                তৈরি করুন
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                এই key-টি শুধুমাত্র এখনই দেখা যাবে। পেজ বন্ধ করলে আর দেখা যাবে না। এখনই কপি করুন!
              </p>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold">API Key</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-xl border">
                <code className="flex-1 text-xs font-mono break-all">{newKey}</code>
                <CopyButton value={newKey} />
              </div>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              বুঝলাম, কপি করেছি
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Create Webhook Modal ───────────────────────────────────── */
function CreateWebhookModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [url, setUrl]   = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  function toggleEvent(e: string) {
    setSelectedEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" /> নতুন Webhook
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold">Webhook নাম</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="যেমন: অর্ডার নোটিফিকেশন"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold">Endpoint URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold">Events</label>
            <div className="grid grid-cols-2 gap-1.5">
              {WEBHOOK_EVENTS.map(e => (
                <label key={e}
                  className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-all',
                    selectedEvents.includes(e) ? 'border-primary bg-primary/5 font-bold' : 'hover:border-primary/40')}>
                  <input type="checkbox" checked={selectedEvents.includes(e)} onChange={() => toggleEvent(e)} className="rounded" />
                  <span className="font-mono">{e}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-muted transition-colors">বাতিল</button>
            <button disabled={!name || !url || selectedEvents.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              তৈরি করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('keys');
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<string[]>([]);
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);

  function toggleReveal(id: string) {
    setRevealedKeys(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'keys',     label: 'API Keys',   icon: Key },
    { id: 'webhooks', label: 'Webhooks',   icon: Webhook },
    { id: 'logs',     label: 'ডেলিভারি লগ', icon: Activity },
    { id: 'docs',     label: 'ডকুমেন্টেশন', icon: BookOpen },
  ];

  return (
    <div className="space-y-5 pb-6">
      {showCreateKey     && <CreateKeyModal     onClose={() => setShowCreateKey(false)} />}
      {showCreateWebhook && <CreateWebhookModal onClose={() => setShowCreateWebhook(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-black flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Integrations & API
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">API Key, Webhook, ডেলিভারি লগ ও SDK ডকুমেন্টেশন</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'keys'     && <button onClick={() => setShowCreateKey(true)}     className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" /> নতুন Key</button>}
          {activeTab === 'webhooks' && <button onClick={() => setShowCreateWebhook(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" /> নতুন Webhook</button>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'সক্রিয় Keys',    value: API_KEYS.filter(k => k.status === 'ACTIVE').length,   icon: Key,     color: 'text-primary',   bg: 'bg-primary/10' },
          { label: 'সক্রিয় Webhooks', value: WEBHOOKS.filter(w => w.status === 'ACTIVE').length,  icon: Webhook, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'আজকের API কল',   value: '10,181',                                              icon: Zap,     color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ডেলিভারি সাফল্য', value: '98.2%',                                             icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-black">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const TIcon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all',
                activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <TIcon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── API Keys Tab ── */}
      {activeTab === 'keys' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              API key-গুলো গোপন রাখুন। কারো সাথে শেয়ার করবেন না। প্রতিটি key-এ শুধুমাত্র প্রয়োজনীয় scope দিন (least privilege)।
            </p>
          </div>

          <div className="space-y-3">
            {API_KEYS.map(k => {
              const isRevealed = revealedKeys.includes(k.id);
              return (
                <div key={k.id} className={cn('bg-card rounded-xl border p-4', k.status === 'REVOKED' && 'opacity-60')}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-sm font-black">{k.name}</p>
                        <Badge color={k.status === 'ACTIVE' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-500'}>
                          {k.status === 'ACTIVE' ? 'সক্রিয়' : 'বাতিল'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 bg-muted rounded-xl mb-2">
                        <code className="text-xs font-mono flex-1 truncate">
                          {isRevealed ? k.key : `${k.prefix}${'•'.repeat(28)}`}
                        </code>
                        <button onClick={() => toggleReveal(k.id)} className="p-1 rounded hover:bg-muted-foreground/10">
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                        <CopyButton value={k.key} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {k.scopes.map(s => (
                          <code key={s} className="px-2 py-0.5 rounded-lg bg-primary/8 text-primary text-[10px] font-bold">{s}</code>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground flex-wrap">
                        <span>{k.requests.toLocaleString()} রিকোয়েস্ট</span>
                        <span>শেষ ব্যবহার: {k.lastUsed}</span>
                        <span>তৈরি: {k.createdAt}</span>
                      </div>
                    </div>
                    {k.status === 'ACTIVE' && (
                      <button className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Webhooks Tab ── */}
      {activeTab === 'webhooks' && (
        <div className="space-y-3">
          {WEBHOOKS.map(w => (
            <div key={w.id} className="bg-card rounded-xl border overflow-hidden">
              <div
                className="flex items-start justify-between gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedWebhook(expandedWebhook === w.id ? null : w.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-black">{w.name}</p>
                    <Badge color={
                      w.status === 'ACTIVE'  ? 'bg-green-50 border-green-200 text-green-600' :
                      w.status === 'FAILING' ? 'bg-red-50 border-red-200 text-red-600' :
                      'bg-gray-50 border-gray-200 text-gray-500'
                    }>
                      {w.status === 'ACTIVE' ? <>● সক্রিয়</> : w.status === 'FAILING' ? <>⚠ ব্যর্থ</> : <>⏸ বিরতি</>}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate">{w.url}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                    <span>{w.deliveries} ডেলিভারি</span>
                    {w.failures > 0 && <span className="text-red-500 font-bold">{w.failures} ব্যর্থ</span>}
                    <span>শেষ: {w.lastDelivery}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {expandedWebhook === w.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedWebhook === w.id && (
                <div className="border-t p-4 space-y-3 bg-muted/20">
                  <div>
                    <p className="text-xs font-semibold mb-1.5">Events</p>
                    <div className="flex flex-wrap gap-1.5">
                      {w.events.map(e => (
                        <code key={e} className="px-2 py-0.5 rounded-lg bg-primary/8 text-primary text-[10px] font-bold">{e}</code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1">Signing Secret (HMAC)</p>
                    <div className="flex items-center gap-2 p-2.5 bg-card rounded-xl border">
                      <code className="text-xs font-mono flex-1">{'•'.repeat(32)}</code>
                      <CopyButton value={w.secret} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
                      <Zap className="w-3.5 h-3.5" /> টেস্ট পাঠান
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors">
                      <Settings className="w-3.5 h-3.5" /> সম্পাদনা
                    </button>
                    <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> মুছুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Logs Tab ── */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Webhook ডেলিভারি লগ</h3>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border transition-colors">
              <Download className="w-3.5 h-3.5" /> এক্সপোর্ট
            </button>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {['সময়', 'Webhook', 'Event', 'স্ট্যাটাস', 'সময়', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {DELIVERY_LOG.map(d => (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{d.time}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{d.webhookName}</td>
                      <td className="px-4 py-3"><code className="text-[11px] text-primary font-bold">{d.event}</code></td>
                      <td className="px-4 py-3">
                        <Badge color={d.status === 'SUCCESS' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}>
                          {d.status === 'SUCCESS' ? <><CheckCircle className="w-3 h-3" /> {d.statusCode}</> : <><XCircle className="w-3 h-3" /> {d.statusCode}</>}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.duration}ms</td>
                      <td className="px-4 py-3">
                        {d.status === 'FAILED' && (
                          <button className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                            <RefreshCw className="w-3 h-3" /> রিট্রাই
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Docs Tab ── */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">UNKORA Public API</p>
              <p className="text-xs text-muted-foreground mt-0.5">Base URL: <code className="font-mono text-primary">https://api.unkora.com/v1</code></p>
            </div>
          </div>

          {/* Authentication */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
              <Key className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Authentication</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-muted-foreground">সব রিকোয়েস্টে Authorization header পাঠান:</p>
              <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">
                <code>{`Authorization: Bearer uk_live_your_api_key_here
Content-Type: application/json`}</code>
              </pre>
            </div>
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
              <Code2 className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Endpoints</h3>
            </div>
            <div className="divide-y">
              {[
                { method: 'GET',  path: '/orders',          scope: 'orders:read',    desc: 'অর্ডার লিস্ট' },
                { method: 'GET',  path: '/orders/:id',      scope: 'orders:read',    desc: 'একটি অর্ডারের বিস্তারিত' },
                { method: 'PUT',  path: '/orders/:id',      scope: 'orders:write',   desc: 'অর্ডার আপডেট' },
                { method: 'GET',  path: '/products',        scope: 'products:read',  desc: 'প্রোডাক্ট লিস্ট' },
                { method: 'GET',  path: '/products/:id',    scope: 'products:read',  desc: 'প্রোডাক্ট বিস্তারিত' },
                { method: 'GET',  path: '/customers',       scope: 'customers:read', desc: 'কাস্টমার লিস্ট' },
                { method: 'GET',  path: '/analytics/sales', scope: 'analytics:read', desc: 'বিক্রয় অ্যানালিটিক্স' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 flex-wrap">
                  <span className={cn('text-[11px] font-black px-2 py-0.5 rounded font-mono',
                    e.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>
                    {e.method}
                  </span>
                  <code className="text-xs font-mono text-foreground flex-1">/v1{e.path}</code>
                  <code className="text-[10px] font-bold text-primary/80">{e.scope}</code>
                  <span className="text-xs text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook payload example */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
              <Webhook className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Webhook Payload উদাহরণ</h3>
            </div>
            <div className="p-5">
              <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-[11px] overflow-x-auto">
                <code>{`{
  "event": "order.created",
  "timestamp": "2026-06-13T10:30:00Z",
  "signature": "sha256=a1b2c3d4...",
  "data": {
    "id": "ORD-5512",
    "status": "PENDING",
    "total": 3200,
    "currency": "BDT",
    "customer": {
      "phone": "017XXXXXXXX",
      "name": "রাফিউল ইসলাম"
    }
  }
}`}</code>
              </pre>
              <p className="text-[11px] text-muted-foreground mt-2">
                HMAC-SHA256 দিয়ে signature যাচাই করুন: <code className="text-primary">X-Unkora-Signature</code> হেডার
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
