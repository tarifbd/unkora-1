'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Brain, Zap, Settings, Sparkles, Copy, Check, AlertCircle, Loader2,
  CheckCircle2, XCircle, Activity, BookOpen, Cpu, ChevronDown, ChevronUp,
  FileText, Image as ImageIcon, Mail, HelpCircle, Megaphone, LayoutTemplate, Search,
  BarChart3, TrendingUp, Clock, AlertTriangle,
} from 'lucide-react';
import { aiApi, type AiSettings, type AiProviderStatus } from '@/lib/api/ai-studio';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function OutputCard({ label, value }: { label: string; value: string }) {
  const [open, setOpen] = useState(true);
  if (!value) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={value} />
          <button onClick={() => setOpen(o => !o)} className="p-1 text-gray-400 hover:text-gray-600">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{value}</p>
        </div>
      )}
    </div>
  );
}

function JsonOutputCard({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  if (!value) return null;
  const str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={str} />
          <button onClick={() => setOpen(o => !o)} className="p-1 text-gray-400 hover:text-gray-600">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <pre className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">{str}</pre>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500';
const selectCls = inputCls;
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

function GenerateButton({ loading, disabled }: { loading: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
      {loading ? 'Generating...' : 'Generate with AI'}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mt-4">
      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
    </div>
  );
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────────
function DashboardTab() {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['ai-provider-status'],
    queryFn: aiApi.getProviderStatus,
    retry: 1,
  });
  const { data: logs } = useQuery({
    queryKey: ['ai-logs-recent'],
    queryFn: () => aiApi.getLogs({ page: 1, limit: 5 }),
    retry: 1,
  });
  const testMutation = useMutation({
    mutationFn: aiApi.testProvider,
    onSuccess: (d) => {
      if (d?.success) toast.success(`Connection OK — ${d.latencyMs}ms`);
      else toast.error(`Test failed: ${d?.error ?? 'Unknown error'}`);
    },
    onError: () => toast.error('Connection test failed'),
  });

  const providerColors: Record<string, string> = {
    openai: '#10a37f', gemini: '#4285f4', claude: '#d97706', openrouter: '#7c3aed',
  };

  const QUICK_ACTIONS = [
    { href: '#product-content', label: 'Product Content', icon: Sparkles, tab: 'product-content' },
    { href: '#product-seo', label: 'Product SEO', icon: Search, tab: 'product-seo' },
    { href: '#landing-page', label: 'Landing Page', icon: LayoutTemplate, tab: 'landing-page' },
    { href: '#blog', label: 'Blog Article', icon: FileText, tab: 'blog' },
    { href: '#ad-copy', label: 'Ad Copy', icon: Megaphone, tab: 'ad-copy' },
    { href: '#email', label: 'Email Copy', icon: Mail, tab: 'email' },
    { href: '#faq', label: 'FAQ Generator', icon: HelpCircle, tab: 'faq' },
    { href: '#image-alt', label: 'Image Alt Text', icon: ImageIcon, tab: 'image-alt' },
  ];

  return (
    <div className="space-y-6">
      {/* Provider status */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" /> AI Provider Status
          </h2>
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {testMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Test Connection
          </button>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        ) : status ? (
          <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className={`h-3 w-3 rounded-full ${status.isEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                  {status.activeProvider} {status.activeModel ? `— ${status.activeModel}` : ''}
                </p>
                <p className="text-xs text-gray-500">{status.isEnabled ? 'Active & Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(status.providers ?? {}).map(([key, p]) => (
                <div key={key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold capitalize" style={{ color: providerColors[key] ?? '#888' }}>{p.name}</span>
                    {p.active ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>
                    ) : p.configured ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">READY</span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">NOT SET</span>
                    )}
                  </div>
                  {p.configured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              To change providers or add API keys, update environment variables (AI_PROVIDER, OPENAI_API_KEY, etc.) on the server.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Provider status unavailable. Configure AI settings to get started.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.tab}
              onClick={() => { /* handled by parent tab setter */ }}
              className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left"
            >
              <a.icon className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-page links */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/admin/ai-studio/logs" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-all flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Logs</p>
            <p className="text-xs text-gray-500">Generation history</p>
          </div>
        </Link>
        <Link href="/admin/ai-studio/library" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-all flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Content Library</p>
            <p className="text-xs text-gray-500">Saved generations</p>
          </div>
        </Link>
        <Link href="/admin/ai-studio/agents" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-all flex items-center gap-3">
          <Cpu className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Agents</p>
            <p className="text-xs text-gray-500">Agent integrations</p>
          </div>
        </Link>
      </div>

      {/* Recent Logs */}
      {logs && logs.data && logs.data.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" /> Recent Generations
            </h2>
            <Link href="/admin/ai-studio/logs" className="text-xs text-purple-600 hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Feature</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Provider</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.data.slice(0, 5).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-xs font-medium">{log.featureType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 capitalize">{log.provider}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Product Content ─────────────────────────────────────────────────────
function ProductContentTab() {
  const [form, setForm] = useState({ productName: '', category: '', brand: '', features: '', targetAudience: '', tone: 'Professional', language: 'English' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateProductContent(data),
    onSuccess: (d) => { setResult(d); toast.success('Content generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) { toast.error('Product name is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, string | string[]> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" /> Product Content Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Product Name *</label>
            <input className={inputCls} value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="e.g. Wireless Bluetooth Earbuds" />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className={labelCls}>Brand</label>
            <input className={inputCls} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Sony" />
          </div>
          <div>
            <label className={labelCls}>Target Audience</label>
            <input className={inputCls} value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="e.g. Tech enthusiasts" />
          </div>
          <div>
            <label className={labelCls}>Tone</label>
            <select className={selectCls} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {['Professional', 'Casual', 'Enthusiastic', 'Technical'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={selectCls} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {['English', 'Bengali'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Key Features</label>
          <textarea className={inputCls} rows={3} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="List key features, one per line..." />
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>

      {r && (
        <div className="space-y-3">
          {!!r.title && <OutputCard label="Title Suggestions" value={Array.isArray(r.title) ? (r.title as string[]).join('\n') : String(r.title)} />}
          {!!r.shortDescription && <OutputCard label="Short Description" value={String(r.shortDescription)} />}
          {!!r.shortDesc && <OutputCard label="Short Description" value={String(r.shortDesc)} />}
          {!!r.description && <OutputCard label="Long Description" value={String(r.description)} />}
          {!!r.longDescription && <OutputCard label="Long Description" value={String(r.longDescription)} />}
          {!!r.bulletPoints && <OutputCard label="Bullet Points" value={Array.isArray(r.bulletPoints) ? (r.bulletPoints as string[]).join('\n') : String(r.bulletPoints)} />}
          {!!r.faq && <OutputCard label="FAQ" value={typeof r.faq === 'string' ? r.faq : JSON.stringify(r.faq, null, 2)} />}
          {!!(r.seoTitle || r.metaTitle) && <OutputCard label="SEO Title" value={String(r.seoTitle ?? r.metaTitle)} />}
          {!!(r.seoDescription || r.metaDescription || r.metaDesc) && <OutputCard label="SEO Description" value={String(r.seoDescription ?? r.metaDescription ?? r.metaDesc)} />}
          {!!r.tags && <OutputCard label="Tags" value={Array.isArray(r.tags) ? (r.tags as string[]).join(', ') : String(r.tags)} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Product SEO ─────────────────────────────────────────────────────────
function ProductSeoTab() {
  const [form, setForm] = useState({ productName: '', category: '', targetKeywords: '', secondaryKeywords: '', searchIntent: 'Transactional', language: 'English', productId: '' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateProductSeo(data),
    onSuccess: (d) => { setResult(d); toast.success('SEO content generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) { toast.error('Product name is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, any> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-500" /> Product SEO Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Product Name *</label>
            <input className={inputCls} value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="e.g. Wireless Earbuds Pro" />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className={labelCls}>Target Keywords</label>
            <input className={inputCls} value={form.targetKeywords} onChange={e => setForm(f => ({ ...f, targetKeywords: e.target.value }))} placeholder="e.g. wireless earbuds, bluetooth headphones" />
          </div>
          <div>
            <label className={labelCls}>Secondary Keywords</label>
            <input className={inputCls} value={form.secondaryKeywords} onChange={e => setForm(f => ({ ...f, secondaryKeywords: e.target.value }))} placeholder="e.g. noise canceling, long battery" />
          </div>
          <div>
            <label className={labelCls}>Search Intent</label>
            <select className={selectCls} value={form.searchIntent} onChange={e => setForm(f => ({ ...f, searchIntent: e.target.value }))}>
              {['Informational', 'Transactional', 'Navigational', 'Commercial'].map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={selectCls} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {['English', 'Bengali'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Product ID (optional — to apply directly)</label>
            <input className={inputCls} value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} placeholder="Leave blank to skip auto-apply" />
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>

      {r && (
        <div className="space-y-3">
          {!!r.seoTitle && <OutputCard label="SEO Title" value={String(r.seoTitle)} />}
          {!!r.metaDescription && <OutputCard label="Meta Description" value={String(r.metaDescription)} />}
          {!!r.slugSuggestions && <OutputCard label="Slug Suggestions" value={Array.isArray(r.slugSuggestions) ? (r.slugSuggestions as string[]).join('\n') : String(r.slugSuggestions)} />}
          {!!r.h1 && <OutputCard label="H1 Tag" value={String(r.h1)} />}
          {!!r.h2Sections && <OutputCard label="H2 Sections" value={Array.isArray(r.h2Sections) ? (r.h2Sections as string[]).join('\n') : String(r.h2Sections)} />}
          {!!r.keywords && <OutputCard label="Keywords" value={Array.isArray(r.keywords) ? (r.keywords as string[]).join(', ') : String(r.keywords)} />}
          {!!r.faqSchema && <JsonOutputCard label="FAQ Schema (JSON-LD)" value={r.faqSchema} />}
          {!!r.productSchema && <JsonOutputCard label="Product Schema (JSON-LD)" value={r.productSchema} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Landing Page ────────────────────────────────────────────────────────
function LandingPageTab() {
  const [form, setForm] = useState({ productOrOffer: '', targetAudience: '', mainGoal: '', tone: 'Professional', language: 'English', sectionsRequired: [] as string[] });
  const [result, setResult] = useState<any>(null);

  const SECTIONS = ['Hero', 'Benefits', 'Features', 'Social Proof', 'FAQ', 'Final CTA', 'Pricing'];

  const toggleSection = (s: string) => {
    setForm(f => ({
      ...f,
      sectionsRequired: f.sectionsRequired.includes(s) ? f.sectionsRequired.filter(x => x !== s) : [...f.sectionsRequired, s],
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateLandingPage(data),
    onSuccess: (d) => { setResult(d); toast.success('Landing page content generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productOrOffer.trim()) { toast.error('Product/Offer is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, any> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-green-500" /> Landing Page Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Product / Offer *</label>
            <input className={inputCls} value={form.productOrOffer} onChange={e => setForm(f => ({ ...f, productOrOffer: e.target.value }))} placeholder="e.g. Premium Skincare Bundle" />
          </div>
          <div>
            <label className={labelCls}>Target Audience</label>
            <input className={inputCls} value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="e.g. Women 25-45" />
          </div>
          <div>
            <label className={labelCls}>Main Goal</label>
            <input className={inputCls} value={form.mainGoal} onChange={e => setForm(f => ({ ...f, mainGoal: e.target.value }))} placeholder="e.g. Drive purchases" />
          </div>
          <div>
            <label className={labelCls}>Tone</label>
            <select className={selectCls} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {['Professional', 'Casual', 'Enthusiastic', 'Technical'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={selectCls} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {['English', 'Bengali'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Sections Required</label>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSection(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.sectionsRequired.includes(s) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {r && (
        <div className="space-y-3">
          {!!r.heroHeadline && <OutputCard label="Hero Headline" value={String(r.heroHeadline)} />}
          {!!r.heroSubheadline && <OutputCard label="Hero Subheadline" value={String(r.heroSubheadline)} />}
          {!!r.cta && <OutputCard label="Call to Action" value={String(r.cta)} />}
          {!!r.benefits && <OutputCard label="Benefits" value={Array.isArray(r.benefits) ? (r.benefits as string[]).join('\n') : String(r.benefits)} />}
          {!!r.features && <OutputCard label="Features" value={Array.isArray(r.features) ? (r.features as string[]).join('\n') : String(r.features)} />}
          {!!r.socialProof && <OutputCard label="Social Proof" value={String(r.socialProof)} />}
          {!!r.faq && <OutputCard label="FAQ" value={typeof r.faq === 'string' ? r.faq : JSON.stringify(r.faq, null, 2)} />}
          {!!r.finalCta && <OutputCard label="Final CTA" value={String(r.finalCta)} />}
          {!!r.seoMetadata && <JsonOutputCard label="SEO Metadata" value={r.seoMetadata} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Blog ────────────────────────────────────────────────────────────────
function BlogTab() {
  const [form, setForm] = useState({ title: '', topic: '', keywords: '', tone: 'Professional', wordCount: '800', language: 'English' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateBlog(data),
    onSuccess: (d) => { setResult(d); toast.success('Blog content generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, any> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" /> Blog Article Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Blog Title *</label>
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Top 10 Wireless Earbuds in 2024" />
          </div>
          <div>
            <label className={labelCls}>Topic</label>
            <input className={inputCls} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Audio Technology" />
          </div>
          <div>
            <label className={labelCls}>Keywords</label>
            <input className={inputCls} value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g. wireless, bluetooth, earbuds" />
          </div>
          <div>
            <label className={labelCls}>Tone</label>
            <select className={selectCls} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {['Professional', 'Casual', 'Enthusiastic', 'Technical'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Word Count</label>
            <select className={selectCls} value={form.wordCount} onChange={e => setForm(f => ({ ...f, wordCount: e.target.value }))}>
              {['500', '800', '1200', '2000'].map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={selectCls} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {['English', 'Bengali'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {r && (
        <div className="space-y-3">
          {!!r.outline && <OutputCard label="Blog Outline" value={typeof r.outline === 'string' ? r.outline : JSON.stringify(r.outline, null, 2)} />}
          {!!r.intro && <OutputCard label="Introduction" value={String(r.intro)} />}
          {!!r.introduction && <OutputCard label="Introduction" value={String(r.introduction)} />}
          {!!r.sections && <OutputCard label="Sections" value={Array.isArray(r.sections) ? (r.sections as string[]).join('\n\n') : String(r.sections)} />}
          {!!r.conclusion && <OutputCard label="Conclusion" value={String(r.conclusion)} />}
          {!!(r.metaTitle || r.seoTitle) && <OutputCard label="SEO Title" value={String(r.metaTitle ?? r.seoTitle)} />}
          {!!(r.metaDescription || r.seoDescription) && <OutputCard label="Meta Description" value={String(r.metaDescription ?? r.seoDescription)} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Ad Copy ─────────────────────────────────────────────────────────────
function AdCopyTab() {
  const [form, setForm] = useState({ product: '', platform: 'Facebook', audience: '', tone: 'Enthusiastic', usp: '' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateAdCopy(data),
    onSuccess: (d) => { setResult(d); toast.success('Ad copy generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product.trim()) { toast.error('Product is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, any> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-orange-500" /> Ad Copy Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Product *</label>
            <input className={inputCls} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} placeholder="e.g. Smart Watch X1" />
          </div>
          <div>
            <label className={labelCls}>Platform</label>
            <select className={selectCls} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
              {['Facebook', 'Instagram', 'Google', 'Twitter', 'TikTok'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Audience</label>
            <input className={inputCls} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="e.g. Tech-savvy millennials" />
          </div>
          <div>
            <label className={labelCls}>Tone</label>
            <select className={selectCls} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {['Professional', 'Casual', 'Enthusiastic', 'Technical'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Unique Selling Point</label>
            <input className={inputCls} value={form.usp} onChange={e => setForm(f => ({ ...f, usp: e.target.value }))} placeholder="e.g. 48-hour battery life" />
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {r && (
        <div className="space-y-3">
          {!!r.headlines && <OutputCard label="Headlines" value={Array.isArray(r.headlines) ? (r.headlines as string[]).join('\n') : String(r.headlines)} />}
          {!!r.bodyCopy && <OutputCard label="Body Copy" value={String(r.bodyCopy)} />}
          {!!r.body && <OutputCard label="Body Copy" value={String(r.body)} />}
          {!!r.ctaVariants && <OutputCard label="CTA Variants" value={Array.isArray(r.ctaVariants) ? (r.ctaVariants as string[]).join('\n') : String(r.ctaVariants)} />}
          {!!r.cta && <OutputCard label="CTA" value={String(r.cta)} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Email ───────────────────────────────────────────────────────────────
function EmailTab() {
  const [form, setForm] = useState({ emailType: 'Promotional', subject: '', product: '', audience: '', tone: 'Professional' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateEmail(data),
    onSuccess: (d) => { setResult(d); toast.success('Email copy generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, any> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo-500" /> Email Copy Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Email Type</label>
            <select className={selectCls} value={form.emailType} onChange={e => setForm(f => ({ ...f, emailType: e.target.value }))}>
              {['Welcome', 'Promotional', 'Abandoned Cart', 'Order Confirmation', 'Newsletter'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <input className={inputCls} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Exclusive offer just for you!" />
          </div>
          <div>
            <label className={labelCls}>Product / Context</label>
            <input className={inputCls} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} placeholder="e.g. Summer Sale" />
          </div>
          <div>
            <label className={labelCls}>Audience</label>
            <input className={inputCls} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="e.g. Loyal customers" />
          </div>
          <div>
            <label className={labelCls}>Tone</label>
            <select className={selectCls} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
              {['Professional', 'Casual', 'Enthusiastic', 'Technical'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {r && (
        <div className="space-y-3">
          {!!(r.subjectLine || r.subject) && <OutputCard label="Subject Line" value={String(r.subjectLine ?? r.subject)} />}
          {!!r.preheader && <OutputCard label="Preheader" value={String(r.preheader)} />}
          {!!(r.body || r.bodyText || r.emailBody) && <OutputCard label="Email Body" value={String(r.body ?? r.bodyText ?? r.emailBody)} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: FAQ ─────────────────────────────────────────────────────────────────
function FaqTab() {
  const [form, setForm] = useState({ topic: '', count: 5, audience: '', language: 'English' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateFaq(data),
    onSuccess: (d) => { setResult(d); toast.success('FAQ generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim()) { toast.error('Topic is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const faqs = result ? (Array.isArray(result) ? result : (result as Record<string, unknown[]>).faqs ?? []) : [];

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-teal-500" /> FAQ Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Topic *</label>
            <input className={inputCls} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Wireless Earbuds" />
          </div>
          <div>
            <label className={labelCls}>Number of FAQs: {form.count}</label>
            <input type="range" min={3} max={10} value={form.count} onChange={e => setForm(f => ({ ...f, count: Number(e.target.value) }))} className="w-full" />
          </div>
          <div>
            <label className={labelCls}>Audience</label>
            <input className={inputCls} value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="e.g. New customers" />
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select className={selectCls} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
              {['English', 'Bengali'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {faqs.length > 0 && (
        <div className="space-y-3">
          {(faqs as Array<{ question: string; answer: string }>).map((faq, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-sm text-gray-800 dark:text-white">Q{i + 1}: {faq.question}</p>
                <CopyButton text={`Q: ${faq.question}\nA: ${faq.answer}`} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Image Alt ───────────────────────────────────────────────────────────
function ImageAltTab() {
  const [form, setForm] = useState({ imageUrl: '', context: '', product: '', category: '' });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => aiApi.generateImageAlt(data),
    onSuccess: (d) => { setResult(d); toast.success('Alt text generated!'); },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) { toast.error('Image URL is required'); return; }
    mutation.mutate(form as Record<string, unknown>);
  };

  const r = result as Record<string, any> | null;

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-pink-500" aria-hidden="true" /> Image Alt Text Generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Image URL *</label>
            <input className={inputCls} value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/product.jpg" />
          </div>
          <div>
            <label className={labelCls}>Product</label>
            <input className={inputCls} value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} placeholder="e.g. Wireless Earbuds" />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electronics" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Context</label>
            <input className={inputCls} value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="e.g. Product shown in lifestyle setting" />
          </div>
        </div>
        <GenerateButton loading={mutation.isPending} />
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {r && (
        <div className="space-y-3">
          {!!(r.altText || r.alt) && <OutputCard label="Alt Text" value={String(r.altText ?? r.alt)} />}
          {!!(r.titleText || r.title) && <OutputCard label="Title Text" value={String(r.titleText ?? r.title)} />}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Custom Prompt ───────────────────────────────────────────────────────
function CustomPromptTab() {
  const [prompt, setPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState('Text');
  const [result, setResult] = useState<string>('');

  const mutation = useMutation({
    mutationFn: (data: { prompt: string; outputFormat?: string }) => aiApi.generateCustom(data),
    onSuccess: (d) => {
      const text = typeof d === 'string' ? d : (d as Record<string, string>).output ?? JSON.stringify(d, null, 2);
      setResult(text);
      toast.success('Generated!');
    },
    onError: (e: Error) => toast.error(e.message || 'Generation failed'),
  });

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) { toast.error('Prompt is required'); return; }
    mutation.mutate({ prompt, outputFormat });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handle} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" /> Custom Prompt
        </h2>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Your Prompt</label>
            <span className={`text-xs ${prompt.length > 3800 ? 'text-red-500' : 'text-gray-400'}`}>{prompt.length}/4000</span>
          </div>
          <textarea
            className={inputCls}
            rows={8}
            maxLength={4000}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Write your custom prompt here... Be as specific as possible for best results."
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <label className={labelCls}>Output Format</label>
            <select className={selectCls} value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
              {['Text', 'JSON', 'Markdown', 'List'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex-1" />
          <div className="pt-5">
            <GenerateButton loading={mutation.isPending} disabled={!prompt.trim()} />
          </div>
        </div>
        {mutation.isError && <ErrorBox message={(mutation.error as Error).message || 'Generation failed'} />}
      </form>
      {result && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Output</span>
            <CopyButton text={result} />
          </div>
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">{result}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────
function SettingsTab() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: aiApi.getSettings,
    retry: 1,
  });
  const [form, setForm] = useState<Partial<AiSettings>>({});
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<AiSettings>) => aiApi.updateSettings(data),
    onSuccess: () => { setSaved(true); toast.success('Settings saved!'); setTimeout(() => setSaved(false), 2000); },
    onError: () => toast.error('Failed to save settings'),
  });

  const current = { ...settings, ...form };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            To change AI provider or API keys, update environment variables on the server (<code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AI_PROVIDER</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">OPENAI_API_KEY</code>, etc.). Never expose API keys in the frontend.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" /> AI Settings
        </h2>

        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Enable AI Features</p>
            <p className="text-xs text-gray-500">Allow AI generation across the platform</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, isEnabled: !current.isEnabled }))}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${current.isEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${current.isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Temperature: {(current.temperature ?? 0.7).toFixed(1)}</label>
            <span className="text-xs text-gray-400">0 = Focused, 1 = Creative</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.1}
            value={current.temperature ?? 0.7}
            onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Max Tokens */}
        <div>
          <label className={labelCls}>Max Tokens</label>
          <input
            type="number" className={inputCls}
            value={current.maxTokens ?? 2048}
            onChange={e => setForm(f => ({ ...f, maxTokens: Number(e.target.value) }))}
            min={256} max={8192} step={256}
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className={labelCls}>System Prompt (optional)</label>
          <textarea
            className={inputCls} rows={4}
            value={current.systemPrompt ?? ''}
            onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
            placeholder="Override the default system prompt for all AI generations..."
          />
        </div>

        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending || Object.keys(form).length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'product-content', label: 'Product Content', icon: Sparkles },
  { id: 'product-seo', label: 'Product SEO', icon: Search },
  { id: 'landing-page', label: 'Landing Page', icon: LayoutTemplate },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'ad-copy', label: 'Ad Copy', icon: Megaphone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'image-alt', label: 'Image Alt', icon: ImageIcon },
  { id: 'custom', label: 'Custom', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AiStudioPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold">AI Studio</h1>
          <p className="text-sm text-muted-foreground">AI-powered content generation center</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-0.5 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'product-content' && <ProductContentTab />}
        {activeTab === 'product-seo' && <ProductSeoTab />}
        {activeTab === 'landing-page' && <LandingPageTab />}
        {activeTab === 'blog' && <BlogTab />}
        {activeTab === 'ad-copy' && <AdCopyTab />}
        {activeTab === 'email' && <EmailTab />}
        {activeTab === 'faq' && <FaqTab />}
        {activeTab === 'image-alt' && <ImageAltTab />}
        {activeTab === 'custom' && <CustomPromptTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
