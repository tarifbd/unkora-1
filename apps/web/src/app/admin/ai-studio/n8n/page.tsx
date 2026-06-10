'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Workflow, Save, Loader2, CheckCircle2, XCircle, AlertCircle,
  Play, RefreshCw, Copy, ExternalLink, Settings2, Zap,
  ShoppingCart, Package, Star, Users, TrendingDown, Bell,
  Mail, CreditCard, RotateCcw, Tag, ArrowRight, Eye, EyeOff,
  ChevronDown, ChevronUp, Globe,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Settings API ─────────────────────────────────────────────────────────────

const settingsApi = {
  get: (): Promise<Record<string, string>> =>
    api.get('/settings/store').then(r => r.data.data ?? r.data ?? {}),
  update: (data: Record<string, string>) =>
    api.patch('/settings/store', data).then(r => r.data.data ?? r.data),
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface N8nSettings {
  'n8n.instance_url': string;
  'n8n.api_key': string;
  'n8n.enabled': string;
}

interface WebhookTrigger {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  event: string;
  samplePayload: Record<string, unknown>;
}

interface TriggerLog {
  id: string;
  triggerId: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  responseCode?: number;
}

// ─── Webhook Triggers Definition ─────────────────────────────────────────────

const TRIGGERS: WebhookTrigger[] = [
  {
    id: 'new_order',
    label: 'New Order',
    description: 'Fires when a customer places a new order',
    icon: ShoppingCart,
    color: 'bg-blue-100 text-blue-700',
    event: 'order.created',
    samplePayload: { event: 'order.created', orderId: 'ord_123', orderNumber: 'ORD-001', total: 1500, customer: { name: 'Rahim', email: 'rahim@example.com', phone: '01711234567' }, items: [{ name: 'Clean Code', qty: 1, price: 1500 }] },
  },
  {
    id: 'order_paid',
    label: 'Order Paid',
    description: 'Fires when payment is confirmed for an order',
    icon: CreditCard,
    color: 'bg-green-100 text-green-700',
    event: 'order.paid',
    samplePayload: { event: 'order.paid', orderId: 'ord_123', paymentMethod: 'bKash', amount: 1500, transactionId: 'TXN_456' },
  },
  {
    id: 'order_delivered',
    label: 'Order Delivered',
    description: 'Fires when order status changes to Delivered',
    icon: Package,
    color: 'bg-emerald-100 text-emerald-700',
    event: 'order.delivered',
    samplePayload: { event: 'order.delivered', orderId: 'ord_123', deliveredAt: new Date().toISOString() },
  },
  {
    id: 'order_cancelled',
    label: 'Order Cancelled',
    description: 'Fires when an order is cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-700',
    event: 'order.cancelled',
    samplePayload: { event: 'order.cancelled', orderId: 'ord_123', reason: 'Customer request', refundAmount: 1500 },
  },
  {
    id: 'abandoned_cart',
    label: 'Abandoned Cart',
    description: 'Fires when a cart is abandoned for 2+ hours',
    icon: ShoppingCart,
    color: 'bg-orange-100 text-orange-700',
    event: 'cart.abandoned',
    samplePayload: { event: 'cart.abandoned', customerId: 'usr_123', email: 'karim@example.com', cartValue: 2400, items: [{ name: 'The Alchemist', qty: 1, price: 2400 }], abandonedAt: new Date().toISOString() },
  },
  {
    id: 'new_user',
    label: 'New User Registration',
    description: 'Fires when a new customer registers',
    icon: Users,
    color: 'bg-purple-100 text-purple-700',
    event: 'user.registered',
    samplePayload: { event: 'user.registered', userId: 'usr_456', name: 'Fatema', email: 'fatema@example.com', registeredAt: new Date().toISOString() },
  },
  {
    id: 'low_stock',
    label: 'Low Stock Alert',
    description: 'Fires when a product stock drops below threshold',
    icon: TrendingDown,
    color: 'bg-yellow-100 text-yellow-700',
    event: 'inventory.low_stock',
    samplePayload: { event: 'inventory.low_stock', productId: 'prd_789', productName: 'Atomic Habits', sku: 'AH-BN', currentStock: 3, threshold: 5 },
  },
  {
    id: 'out_of_stock',
    label: 'Out of Stock',
    description: 'Fires when a product goes completely out of stock',
    icon: Package,
    color: 'bg-red-100 text-red-700',
    event: 'inventory.out_of_stock',
    samplePayload: { event: 'inventory.out_of_stock', productId: 'prd_789', productName: 'Atomic Habits', sku: 'AH-BN' },
  },
  {
    id: 'new_review',
    label: 'New Review',
    description: 'Fires when a customer submits a product review',
    icon: Star,
    color: 'bg-amber-100 text-amber-700',
    event: 'review.created',
    samplePayload: { event: 'review.created', reviewId: 'rev_001', productName: 'Atomic Habits', rating: 5, comment: 'Excellent book!', customer: 'Nadia' },
  },
  {
    id: 'refund_requested',
    label: 'Refund Requested',
    description: 'Fires when a customer requests a refund',
    icon: RotateCcw,
    color: 'bg-rose-100 text-rose-700',
    event: 'refund.requested',
    samplePayload: { event: 'refund.requested', orderId: 'ord_123', amount: 1500, reason: 'Wrong item received' },
  },
  {
    id: 'new_preorder',
    label: 'New Preorder',
    description: 'Fires when a customer places a preorder',
    icon: Bell,
    color: 'bg-indigo-100 text-indigo-700',
    event: 'preorder.created',
    samplePayload: { event: 'preorder.created', preorderId: 'pre_001', productName: 'Upcoming Book', customer: 'Reza', prepaidAmount: 500 },
  },
  {
    id: 'coupon_used',
    label: 'Coupon Used',
    description: 'Fires when a discount coupon is redeemed',
    icon: Tag,
    color: 'bg-teal-100 text-teal-700',
    event: 'coupon.used',
    samplePayload: { event: 'coupon.used', couponCode: 'SAVE20', discount: 300, orderId: 'ord_123', usedBy: 'customer@example.com' },
  },
];

// ─── Component: TriggerCard ───────────────────────────────────────────────────

function TriggerCard({
  trigger, webhookUrl, onUrlChange, onTest, testing, lastLog,
}: {
  trigger: WebhookTrigger;
  webhookUrl: string;
  onUrlChange: (url: string) => void;
  onTest: () => void;
  testing: boolean;
  lastLog?: TriggerLog;
}) {
  const [showPayload, setShowPayload] = useState(false);
  const Icon = trigger.icon;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${trigger.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{trigger.label}</p>
          <p className="text-xs text-gray-500 truncate">{trigger.description}</p>
        </div>
        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
          {trigger.event}
        </span>
      </div>

      <div className="px-5 py-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={webhookUrl}
            onChange={e => onUrlChange(e.target.value)}
            placeholder="https://your-n8n.com/webhook/xxxxx"
            className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/40 bg-gray-50"
          />
          <button
            onClick={onTest}
            disabled={!webhookUrl.trim() || testing}
            title="Send test payload to webhook"
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Test
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPayload(v => !v)}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"
          >
            {showPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Sample payload
          </button>
          {lastLog && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${
              lastLog.status === 'success' ? 'text-green-600' : lastLog.status === 'error' ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {lastLog.status === 'success'
                ? <CheckCircle2 className="w-3 h-3" />
                : lastLog.status === 'error'
                  ? <XCircle className="w-3 h-3" />
                  : <Loader2 className="w-3 h-3 animate-spin" />}
              {lastLog.status === 'success' ? `HTTP ${lastLog.responseCode}` : lastLog.status}
              {' · '}
              {new Date(lastLog.timestamp).toLocaleTimeString('en-BD')}
            </span>
          )}
        </div>

        {showPayload && (
          <pre className="text-[10px] bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto text-gray-600 max-h-32">
            {JSON.stringify(trigger.samplePayload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function N8nIntegrationPage() {
  const qc = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [logs, setLogs] = useState<TriggerLog[]>([]);
  const [n8nUrl, setN8nUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['store-settings-n8n'],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (!settings) return;
    setN8nUrl((settings as any)['n8n.instance_url'] ?? '');
    setApiKey((settings as any)['n8n.api_key'] ?? '');
    const urls: Record<string, string> = {};
    TRIGGERS.forEach(t => {
      urls[t.id] = (settings as any)[`n8n.webhook.${t.id}`] ?? '';
    });
    setWebhookUrls(urls);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = {
        'n8n.instance_url': n8nUrl,
        'n8n.api_key': apiKey,
        'n8n.enabled': 'true',
      };
      TRIGGERS.forEach(t => {
        payload[`n8n.webhook.${t.id}`] = webhookUrls[t.id] ?? '';
      });
      return settingsApi.update(payload);
    },
    onSuccess: () => {
      toast.success('n8n settings saved!');
      void qc.invalidateQueries({ queryKey: ['store-settings-n8n'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleTest = async (trigger: WebhookTrigger) => {
    const url = webhookUrls[trigger.id];
    if (!url?.trim()) return;

    setTestingId(trigger.id);
    const logEntry: TriggerLog = {
      id: `${trigger.id}-${Date.now()}`,
      triggerId: trigger.id,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trigger.samplePayload),
      });
      setLogs(prev => prev.map(l =>
        l.id === logEntry.id
          ? { ...l, status: res.ok ? 'success' : 'error', responseCode: res.status }
          : l
      ));
      if (res.ok) {
        toast.success(`Webhook triggered! HTTP ${res.status}`);
      } else {
        toast.error(`Webhook error: HTTP ${res.status}`);
      }
    } catch {
      setLogs(prev => prev.map(l => l.id === logEntry.id ? { ...l, status: 'error' } : l));
      toast.error('Failed to reach webhook URL');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Workflow className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">n8n Automation</h1>
            <p className="text-sm text-gray-500">Connect Unkora events to n8n workflows via webhooks</p>
          </div>
        </div>
        <div className="flex gap-2">
          {n8nUrl && (
            <a
              href={n8nUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              <Globe className="w-4 h-4" /> Open n8n
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50"
          >
            {saveMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : saved
                ? <CheckCircle2 className="w-4 h-4" />
                : <Save className="w-4 h-4" />}
            Save All
          </button>
        </div>
      </div>

      {/* Why n8n callout */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800">
          <p className="font-semibold mb-0.5">Why n8n over Zapier?</p>
          <p className="text-xs text-orange-700 leading-relaxed">
            n8n is open-source and can be self-hosted — no per-task pricing, unlimited automations, full data privacy.
            Connect Unkora to 400+ apps: WhatsApp, Google Sheets, Slack, Facebook Ads, bKash, email providers and more.
            Each webhook below fires a POST request to your n8n workflow when that event occurs.
          </p>
        </div>
      </div>

      {/* n8n Instance Config */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900 text-sm">n8n Instance Settings</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">n8n Instance URL</label>
            <input
              value={n8nUrl}
              onChange={e => setN8nUrl(e.target.value)}
              placeholder="https://your-n8n.example.com"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
            />
            <p className="text-[10px] text-gray-400 mt-1">Your self-hosted or cloud n8n URL</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">API Key (optional)</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="n8n_api_xxxxxxxx"
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
              />
              <button onClick={() => setShowApiKey(v => !v)} className="px-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600">
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">For triggering workflows via API (not needed for webhooks)</p>
          </div>
        </div>

        {/* Quick setup guide */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-orange-500" /> Quick Setup
          </p>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>In n8n, create a new workflow</li>
            <li>Add a <span className="font-mono bg-gray-200 px-1 rounded">Webhook</span> node as the trigger</li>
            <li>Copy the webhook URL and paste it below for the relevant event</li>
            <li>Click <strong>Test</strong> to send a sample payload and verify it works</li>
            <li>Add your automation logic (send WhatsApp, update Google Sheets, etc.)</li>
          </ol>
        </div>
      </div>

      {/* Webhook Triggers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Webhook Triggers</h2>
          <span className="text-xs text-gray-400">{TRIGGERS.filter(t => webhookUrls[t.id]).length}/{TRIGGERS.length} configured</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRIGGERS.map(trigger => (
            <TriggerCard
              key={trigger.id}
              trigger={trigger}
              webhookUrl={webhookUrls[trigger.id] ?? ''}
              onUrlChange={url => setWebhookUrls(prev => ({ ...prev, [trigger.id]: url }))}
              onTest={() => handleTest(trigger)}
              testing={testingId === trigger.id}
              lastLog={logs.find(l => l.triggerId === trigger.id)}
            />
          ))}
        </div>
      </div>

      {/* Test Logs */}
      {logs.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" /> Test Log
            </h2>
            <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
            {logs.map(log => {
              const trigger = TRIGGERS.find(t => t.id === log.triggerId);
              return (
                <div key={log.id} className="flex items-center gap-3 px-5 py-2.5">
                  {log.status === 'success'
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : log.status === 'error'
                      ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      : <Loader2 className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />}
                  <span className="text-sm text-gray-700 flex-1">{trigger?.label ?? log.triggerId}</span>
                  {log.responseCode && (
                    <span className={`text-xs font-mono font-bold ${log.responseCode < 300 ? 'text-green-600' : 'text-red-500'}`}>
                      HTTP {log.responseCode}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString('en-BD')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular n8n Templates */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
        <h2 className="font-bold text-sm text-purple-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" /> Popular n8n Workflows for E-commerce
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Order → WhatsApp', desc: 'Send WhatsApp message when order is placed', trigger: 'new_order', icon: '📱' },
            { title: 'Low Stock → Slack', desc: 'Alert your team on Slack when stock is low', trigger: 'low_stock', icon: '📦' },
            { title: 'Review → Google Sheet', desc: 'Log all reviews to a spreadsheet for analysis', trigger: 'new_review', icon: '📊' },
            { title: 'Abandoned Cart → Email', desc: 'Send recovery email to customers who abandoned cart', trigger: 'abandoned_cart', icon: '📧' },
            { title: 'New Order → Google Sheet', desc: 'Auto-populate orders into a tracking spreadsheet', trigger: 'new_order', icon: '🗃️' },
            { title: 'Refund → Telegram', desc: 'Notify team via Telegram when refund is requested', trigger: 'refund_requested', icon: '🔔' },
          ].map(template => (
            <div key={template.title} className="rounded-xl bg-white border border-gray-100 p-3 flex items-start gap-3">
              <span className="text-xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-gray-900">{template.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{template.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
