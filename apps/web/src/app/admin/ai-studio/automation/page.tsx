'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bot, Mail, Package, TrendingDown, Star, Zap, Save, Loader2, Check,
  ChevronDown, ChevronUp, AlertTriangle, Clock, Sparkles, ShoppingCart,
  Bell, Settings,
} from 'lucide-react';
import api from '@/lib/api';

// ─── API helper (same pattern as settings page) ───────────────────────────────
const storeSettingsApi = {
  get: (): Promise<Record<string, string>> =>
    api.get('/settings/store').then(r => r.data.data),
  update: (data: Record<string, string>) =>
    api.patch('/settings/store', data).then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AutomationSettings {
  // Abandoned Cart
  'ai.abandoned_cart.enabled': string;
  'ai.abandoned_cart.hours': string;
  'ai.abandoned_cart.subject': string;
  // Low Stock
  'ai.low_stock.enabled': string;
  'ai.low_stock.threshold': string;
  'ai.low_stock.email': string;
  // Dynamic Pricing
  'ai.dynamic_pricing.enabled': string;
  'ai.dynamic_pricing.max_discount': string;
  'ai.dynamic_pricing.scope': string;
  // Review Moderation
  'ai.review_mod.enabled': string;
  'ai.review_mod.auto_approve': string;
  'ai.review_mod.flag_keywords': string;
  // Flash Deals
  'ai.flash_deals.enabled': string;
  'ai.flash_deals.frequency': string;
  'ai.flash_deals.min_rating': string;
  // Smart Reorder
  'ai.reorder.enabled': string;
  'ai.reorder.days_ahead': string;
}

type SettingsKey = keyof AutomationSettings;

const DEFAULTS: AutomationSettings = {
  'ai.abandoned_cart.enabled': 'false',
  'ai.abandoned_cart.hours': '24',
  'ai.abandoned_cart.subject': 'You left something behind — complete your order today!',
  'ai.low_stock.enabled': 'false',
  'ai.low_stock.threshold': '5',
  'ai.low_stock.email': '',
  'ai.dynamic_pricing.enabled': 'false',
  'ai.dynamic_pricing.max_discount': '20',
  'ai.dynamic_pricing.scope': 'Flash Deals Only',
  'ai.review_mod.enabled': 'false',
  'ai.review_mod.auto_approve': 'Positive only',
  'ai.review_mod.flag_keywords': '',
  'ai.flash_deals.enabled': 'false',
  'ai.flash_deals.frequency': 'Weekly',
  'ai.flash_deals.min_rating': '4.0',
  'ai.reorder.enabled': 'false',
  'ai.reorder.days_ahead': '14',
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inp =
  'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow';

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-checked={enabled}
      role="switch"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
        enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-4 sm:items-center py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────
interface RuleCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function RuleCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  enabled,
  onToggle,
  children,
}: RuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        enabled
          ? 'border-purple-200 dark:border-purple-800/60 bg-white dark:bg-gray-900 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            {enabled && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Toggle enabled={enabled} onToggle={onToggle} />
          {enabled && children && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={expanded ? 'Collapse settings' : 'Expand settings'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable settings */}
      {enabled && children && expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700/60 px-5 pt-1 pb-4 space-y-0 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-xl">
          {children}
        </div>
      )}

      {/* Prompt to expand when enabled but collapsed */}
      {enabled && children && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors border-t border-gray-100 dark:border-gray-700/60 rounded-b-xl hover:bg-gray-50 dark:hover:bg-gray-800/30"
        >
          <Settings className="h-3.5 w-3.5" />
          Configure settings
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AiAutomationPage() {
  const queryClient = useQueryClient();

  const { data: raw, isLoading } = useQuery({
    queryKey: ['ai-automation-settings'],
    queryFn: storeSettingsApi.get,
    select: (data): AutomationSettings => {
      const merged: AutomationSettings = { ...DEFAULTS };
      (Object.keys(DEFAULTS) as SettingsKey[]).forEach(k => {
        if (data[k] !== undefined) merged[k] = data[k];
      });
      return merged;
    },
  });

  const [form, setForm] = useState<AutomationSettings | null>(null);
  const [saved, setSaved] = useState(false);

  // Initialise form from query data (once)
  const settings: AutomationSettings = form ?? raw ?? DEFAULTS;

  const set = (key: SettingsKey, value: string) => {
    setSaved(false);
    setForm(prev => ({ ...(prev ?? settings), [key]: value }));
  };

  const toggle = (key: SettingsKey) => {
    const next = settings[key] === 'true' ? 'false' : 'true';
    set(key, next);
  };

  const enabled = (key: SettingsKey) => settings[key] === 'true';

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => storeSettingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-automation-settings'] });
      setSaved(true);
      setForm(null);
      toast.success('Automation rules saved successfully');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => toast.error('Failed to save automation rules'),
  });

  const handleSave = () => {
    if (!form) return;
    mutation.mutate(form as unknown as Record<string, string>);
  };

  const activeCount = [
    'ai.abandoned_cart.enabled',
    'ai.low_stock.enabled',
    'ai.dynamic_pricing.enabled',
    'ai.review_mod.enabled',
    'ai.flash_deals.enabled',
    'ai.reorder.enabled',
  ].filter(k => settings[k as SettingsKey] === 'true').length;

  const isDirty = form !== null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                AI Automation Rules
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeCount > 0
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                <Bot className="h-3 w-3" />
                {activeCount} {activeCount === 1 ? 'rule' : 'rules'} active
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configure automated AI-driven actions. Each rule runs in the background.
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || mutation.isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            isDirty
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : saved
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mutation.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          Automation rules require your backend workers to be running. Enable rules individually and
          monitor the{' '}
          <a href="/admin/ai-studio/logs" className="underline underline-offset-2 hover:opacity-80">
            AI logs
          </a>{' '}
          to confirm they are executing correctly.
        </p>
      </div>

      {/* ── Rules ── */}
      <div className="space-y-4">

        {/* 1. Abandoned Cart Recovery */}
        <RuleCard
          icon={ShoppingCart}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBg="bg-orange-100 dark:bg-orange-900/40"
          title="Abandoned Cart Recovery"
          description="AI sends personalized recovery emails to users who left items in cart"
          enabled={enabled('ai.abandoned_cart.enabled')}
          onToggle={() => toggle('ai.abandoned_cart.enabled')}
        >
          <SettingRow
            label="Trigger after"
            hint="Hours after abandonment before the email is sent"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={72}
                className={`${inp} w-24`}
                value={settings['ai.abandoned_cart.hours']}
                onChange={e => set('ai.abandoned_cart.hours', e.target.value)}
              />
              <span className="text-sm text-gray-500">hours</span>
              <span className="text-xs text-gray-400 ml-1">(1–72)</span>
            </div>
          </SettingRow>
          <SettingRow
            label="Email subject template"
            hint="Use {name} for customer name, {product} for first cart item"
          >
            <input
              type="text"
              className={inp}
              value={settings['ai.abandoned_cart.subject']}
              onChange={e => set('ai.abandoned_cart.subject', e.target.value)}
              placeholder="You left something behind — complete your order today!"
            />
          </SettingRow>
        </RuleCard>

        {/* 2. Low Stock Auto-Alert */}
        <RuleCard
          icon={Bell}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-100 dark:bg-red-900/40"
          title="Low Stock Auto-Alert"
          description="AI monitors inventory and sends alerts when products run low"
          enabled={enabled('ai.low_stock.enabled')}
          onToggle={() => toggle('ai.low_stock.enabled')}
        >
          <SettingRow
            label="Alert threshold"
            hint="Send alert when stock quantity falls below this number"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={9999}
                className={`${inp} w-24`}
                value={settings['ai.low_stock.threshold']}
                onChange={e => set('ai.low_stock.threshold', e.target.value)}
              />
              <span className="text-sm text-gray-500">units</span>
            </div>
          </SettingRow>
          <SettingRow
            label="Notify email"
            hint="Recipient address for low stock notifications"
          >
            <input
              type="email"
              className={inp}
              value={settings['ai.low_stock.email']}
              onChange={e => set('ai.low_stock.email', e.target.value)}
              placeholder="inventory@yourstore.com"
            />
          </SettingRow>
        </RuleCard>

        {/* 3. Dynamic Pricing */}
        <RuleCard
          icon={TrendingDown}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          title="Dynamic Pricing (AI Suggestions)"
          description="AI analyzes demand and suggests price adjustments to maximize revenue"
          enabled={enabled('ai.dynamic_pricing.enabled')}
          onToggle={() => toggle('ai.dynamic_pricing.enabled')}
        >
          <SettingRow
            label="Max discount"
            hint="Maximum percentage the AI is allowed to suggest discounting"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={80}
                className={`${inp} w-24`}
                value={settings['ai.dynamic_pricing.max_discount']}
                onChange={e => set('ai.dynamic_pricing.max_discount', e.target.value)}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </SettingRow>
          <SettingRow
            label="Apply to"
            hint="Which products the AI pricing engine considers"
          >
            <select
              className={inp}
              value={settings['ai.dynamic_pricing.scope']}
              onChange={e => set('ai.dynamic_pricing.scope', e.target.value)}
            >
              <option>Flash Deals Only</option>
              <option>All Products</option>
              <option>Slow-Moving Items</option>
            </select>
          </SettingRow>
        </RuleCard>

        {/* 4. Review Auto-Moderation */}
        <RuleCard
          icon={Star}
          iconColor="text-yellow-600 dark:text-yellow-400"
          iconBg="bg-yellow-100 dark:bg-yellow-900/40"
          title="Review Auto-Moderation"
          description="AI reads new reviews and auto-approves clean ones, flags suspicious content"
          enabled={enabled('ai.review_mod.enabled')}
          onToggle={() => toggle('ai.review_mod.enabled')}
        >
          <SettingRow
            label="Auto-approve if sentiment"
            hint="Reviews matching this sentiment threshold are approved automatically"
          >
            <select
              className={inp}
              value={settings['ai.review_mod.auto_approve']}
              onChange={e => set('ai.review_mod.auto_approve', e.target.value)}
            >
              <option>Positive only</option>
              <option>Positive &amp; Neutral</option>
              <option>All</option>
            </select>
          </SettingRow>
          <SettingRow
            label="Flag keywords"
            hint="Comma-separated list of words that always trigger manual review"
          >
            <input
              type="text"
              className={inp}
              value={settings['ai.review_mod.flag_keywords']}
              onChange={e => set('ai.review_mod.flag_keywords', e.target.value)}
              placeholder="spam, fake, fraud, scam"
            />
          </SettingRow>
        </RuleCard>

        {/* 5. Flash Deal AI Suggestions */}
        <RuleCard
          icon={Zap}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-100 dark:bg-purple-900/40"
          title="Flash Deal AI Suggestions"
          description="AI analyzes sales data to suggest optimal products for flash deals"
          enabled={enabled('ai.flash_deals.enabled')}
          onToggle={() => toggle('ai.flash_deals.enabled')}
        >
          <SettingRow
            label="Generate suggestions every"
            hint="How frequently the AI refreshes its flash deal recommendations"
          >
            <select
              className={inp}
              value={settings['ai.flash_deals.frequency']}
              onChange={e => set('ai.flash_deals.frequency', e.target.value)}
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </SettingRow>
          <SettingRow
            label="Min rating threshold"
            hint="Only suggest products with an average rating at or above this value"
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                className="flex-1 accent-purple-600"
                value={settings['ai.flash_deals.min_rating']}
                onChange={e => set('ai.flash_deals.min_rating', e.target.value)}
              />
              <span className="w-10 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right tabular-nums">
                {parseFloat(settings['ai.flash_deals.min_rating']).toFixed(1)}
              </span>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            </div>
          </SettingRow>
        </RuleCard>

        {/* 6. Smart Reorder Suggestions */}
        <RuleCard
          icon={Package}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-100 dark:bg-green-900/40"
          title="Smart Reorder Suggestions"
          description="AI predicts when you'll run out of stock and suggests reorder quantities"
          enabled={enabled('ai.reorder.enabled')}
          onToggle={() => toggle('ai.reorder.enabled')}
        >
          <SettingRow
            label="Days of stock remaining"
            hint="Alert and suggest reorder when this many days of stock are left"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                className={`${inp} w-24`}
                value={settings['ai.reorder.days_ahead']}
                onChange={e => set('ai.reorder.days_ahead', e.target.value)}
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </SettingRow>
        </RuleCard>
      </div>

      {/* ── Bottom save bar ── */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-300">
            <Clock className="h-4 w-4 flex-shrink-0" />
            You have unsaved changes. Save now to apply your automation rules.
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mutation.isPending ? 'Saving…' : 'Save All Rules'}
          </button>
        </div>
      )}

      {/* ── Success state ── */}
      {saved && !isDirty && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-900/20 text-sm font-medium text-green-800 dark:text-green-300">
          <Check className="h-4 w-4 flex-shrink-0" />
          All automation rules saved successfully.
        </div>
      )}

      {/* ── Helper footer ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {[
          { icon: Mail, label: 'Email Delivery', desc: 'Rules that send emails rely on your SMTP / transactional email config.', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/60' },
          { icon: Clock, label: 'Background Workers', desc: 'Automation rules are processed by scheduled background jobs every 15 minutes.', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/60' },
          { icon: Bot, label: 'AI Logs', desc: 'Every automation action is logged. Check the AI logs page for a full history.', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800/60' },
        ].map(item => (
          <div key={item.label} className={`flex items-start gap-3 p-4 rounded-xl border ${item.border} ${item.bg}`}>
            <item.icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${item.color}`} />
            <div>
              <p className={`text-xs font-semibold ${item.color}`}>{item.label}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
