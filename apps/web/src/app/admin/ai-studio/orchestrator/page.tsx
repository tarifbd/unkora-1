'use client';

import { useState } from 'react';
import {
  Cpu, Play, CheckCircle2, Clock, Zap, ArrowRight, Plus,
  MessageSquare, Search, BookOpen, Star, TrendingUp, Globe,
  ShoppingBag, RefreshCw, AlertCircle, Copy, ExternalLink,
  Settings, ChevronDown, ChevronRight, Boxes, X, Save,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ──────────────────────────────────────────────────────── */
type PipelineStatus = 'idle' | 'deploying' | 'live' | 'paused' | 'error';

interface PipelineStep {
  id: string;
  label: string;
  provider: string;
  model: string;
  icon: React.ElementType;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  namebn: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  steps: PipelineStep[];
  triggers: string[];
  outputs: string[];
  complexity: 'Simple' | 'Moderate' | 'Advanced';
  avgLatencyMs: number;
  costPer1000: number;
  status: PipelineStatus;
  webhookUrl?: string;
  callsToday: number;
}

/* ─── Pre-built pipelines ────────────────────────────────────────── */
const PIPELINES: Pipeline[] = [
  {
    id: 'bookbot',
    name: 'BookBot — Customer Support',
    namebn: 'বুকবট — কাস্টমার সাপোর্ট',
    description: 'Full-stack support agent: understands queries in Bengali & English, fetches order status, answers FAQs, escalates if needed.',
    category: 'Support',
    icon: MessageSquare,
    color: 'from-blue-500 to-blue-700',
    steps: [
      { id: 'router',    label: 'Router Agent',    provider: 'Claude Haiku',   model: 'claude-haiku-4-5', icon: Cpu,         color: 'bg-orange-100 text-orange-700' },
      { id: 'retrieval', label: 'Knowledge Fetch', provider: 'Embeddings',     model: 'text-embed-3',     icon: Search,      color: 'bg-blue-100 text-blue-700' },
      { id: 'responder', label: 'Response Gen',    provider: 'Claude Sonnet',  model: 'claude-sonnet-4-6', icon: MessageSquare, color: 'bg-purple-100 text-purple-700' },
      { id: 'translate', label: 'Bengali Check',   provider: 'Qwen Max',       model: 'qwen-max',         icon: Globe,       color: 'bg-green-100 text-green-700' },
    ],
    triggers: ['Live chat message', 'Support ticket', 'Email', 'WhatsApp webhook'],
    outputs: ['Auto-reply', 'Ticket update', 'Escalation alert'],
    complexity: 'Advanced',
    avgLatencyMs: 1800,
    costPer1000: 0.45,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'seoengine',
    name: 'SEOEngine — Auto Optimizer',
    namebn: 'এসইও ইঞ্জিন — অটো অপ্টিমাইজার',
    description: 'Crawls product listings, generates SEO-optimized titles, meta descriptions, schema markup, and image alt-texts automatically.',
    category: 'SEO',
    icon: Search,
    color: 'from-green-500 to-emerald-700',
    steps: [
      { id: 'analyzer', label: 'Content Analyzer', provider: 'GPT-4o-mini',   model: 'gpt-4o-mini',      icon: Search,      color: 'bg-blue-100 text-blue-700' },
      { id: 'keygen',   label: 'Keyword Engine',   provider: 'DeepSeek V3',   model: 'deepseek-v3',      icon: TrendingUp,  color: 'bg-cyan-100 text-cyan-700' },
      { id: 'writer',   label: 'SEO Writer',        provider: 'GPT-4o',        model: 'gpt-4o',           icon: BookOpen,    color: 'bg-green-100 text-green-700' },
      { id: 'schema',   label: 'Schema Generator',  provider: 'GPT-4o-mini',   model: 'gpt-4o-mini',      icon: Boxes,       color: 'bg-yellow-100 text-yellow-700' },
    ],
    triggers: ['New product added', 'Scheduled (daily)', 'Manual run'],
    outputs: ['Updated product meta', 'JSON-LD schema', 'Sitemap update'],
    complexity: 'Moderate',
    avgLatencyMs: 3200,
    costPer1000: 1.20,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'banglawriter',
    name: 'BanglaWriter — Bengali Content',
    namebn: 'বাংলা রাইটার — বাংলা কন্টেন্ট',
    description: 'Generates high-quality Bengali product descriptions, blog posts, and ad copy. Uses Qwen + Claude for cultural accuracy.',
    category: 'Content',
    icon: Globe,
    color: 'from-red-500 to-pink-700',
    steps: [
      { id: 'context',   label: 'Context Extractor', provider: 'Claude Haiku', model: 'claude-haiku-4-5', icon: BookOpen,  color: 'bg-orange-100 text-orange-700' },
      { id: 'translate', label: 'Bengali Writer',     provider: 'Qwen Max',    model: 'qwen-max',         icon: Globe,    color: 'bg-red-100 text-red-700' },
      { id: 'review',    label: 'Quality Check',      provider: 'GPT-4o-mini', model: 'gpt-4o-mini',      icon: Star,     color: 'bg-yellow-100 text-yellow-700' },
    ],
    triggers: ['New product', 'Bulk import', 'Manual request'],
    outputs: ['Bengali descriptions', 'Bengali blog', 'Bangla ad copy'],
    complexity: 'Simple',
    avgLatencyMs: 2400,
    costPer1000: 0.80,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'reviewanalyzer',
    name: 'ReviewAnalyzer — Insight Engine',
    namebn: 'রিভিউ এনালাইজার',
    description: 'Analyzes customer reviews in batch: extracts sentiments, key topics, product issues, and generates weekly summary reports.',
    category: 'Analytics',
    icon: Star,
    color: 'from-yellow-500 to-orange-600',
    steps: [
      { id: 'collector', label: 'Review Collector', provider: 'Internal API',  model: 'api',              icon: RefreshCw,     color: 'bg-gray-100 text-gray-700' },
      { id: 'sentiment', label: 'Sentiment Engine', provider: 'DeepSeek V3',  model: 'deepseek-v3',      icon: TrendingUp,    color: 'bg-blue-100 text-blue-700' },
      { id: 'cluster',   label: 'Topic Clustering', provider: 'GPT-4o-mini',  model: 'gpt-4o-mini',      icon: Boxes,         color: 'bg-purple-100 text-purple-700' },
      { id: 'report',    label: 'Report Writer',    provider: 'Claude Sonnet', model: 'claude-sonnet-4-6', icon: BookOpen,    color: 'bg-green-100 text-green-700' },
    ],
    triggers: ['Weekly schedule (Mondays)', 'Manual run', 'Min 50 new reviews'],
    outputs: ['Sentiment dashboard', 'Issue alerts', 'Weekly PDF report'],
    complexity: 'Advanced',
    avgLatencyMs: 8000,
    costPer1000: 2.50,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'recoengine',
    name: 'RecoEngine — Book Recommendations',
    namebn: 'রেকো ইঞ্জিন — বুক রেকমেন্ডেশন',
    description: 'Personalizes book recommendations using browsing history, purchase behavior, and collaborative filtering with LLM re-ranking.',
    category: 'Personalization',
    icon: BookOpen,
    color: 'from-purple-500 to-violet-700',
    steps: [
      { id: 'profile',   label: 'User Profiler',    provider: 'Internal',     model: 'heuristic',        icon: Cpu,        color: 'bg-gray-100 text-gray-700' },
      { id: 'retrieval', label: 'Book Retrieval',   provider: 'Embeddings',   model: 'text-embed-3',     icon: Search,     color: 'bg-blue-100 text-blue-700' },
      { id: 'rerank',    label: 'LLM Re-ranker',    provider: 'Gemini Flash', model: 'gemini-2.0-flash', icon: Star,       color: 'bg-purple-100 text-purple-700' },
      { id: 'explain',   label: 'Why Explainer',    provider: 'Claude Haiku', model: 'claude-haiku-4-5', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
    ],
    triggers: ['Product page view', 'Cart open', 'Post-purchase', 'Email campaign'],
    outputs: ['Personalized list', 'Why-explanation text', 'Email reco block'],
    complexity: 'Advanced',
    avgLatencyMs: 950,
    costPer1000: 0.20,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'pricewatch',
    name: 'PriceWatch — Intelligence',
    namebn: 'প্রাইস ওয়াচ — ইন্টেলিজেন্স',
    description: 'Monitors competitor prices via web scraping, analyzes market position, and suggests optimal pricing with LLM reasoning.',
    category: 'Intelligence',
    icon: TrendingUp,
    color: 'from-teal-500 to-cyan-700',
    steps: [
      { id: 'scraper', label: 'Price Scraper',   provider: 'Web Tool',     model: 'scraper',          icon: Search,     color: 'bg-gray-100 text-gray-700' },
      { id: 'analyst', label: 'Market Analyst',  provider: 'Grok 2',       model: 'grok-2',           icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
      { id: 'suggest', label: 'Price Advisor',   provider: 'DeepSeek R1',  model: 'deepseek-r1',      icon: Cpu,        color: 'bg-cyan-100 text-cyan-700' },
    ],
    triggers: ['Daily 6AM', 'Competitor price change', 'Manual run'],
    outputs: ['Price change alerts', 'Market position report', 'Pricing suggestions'],
    complexity: 'Moderate',
    avgLatencyMs: 12000,
    costPer1000: 3.50,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'contentfactory',
    name: 'ContentFactory — Bulk Generator',
    namebn: 'কন্টেন্ট ফ্যাক্টরি — বাল্ক জেনারেটর',
    description: 'Mass-generates product descriptions, category pages, and blog articles at ultra-low cost using DeepSeek + Groq.',
    category: 'Content',
    icon: Boxes,
    color: 'from-gray-600 to-gray-800',
    steps: [
      { id: 'queue',    label: 'Job Queue',       provider: 'Internal',     model: 'queue',            icon: ShoppingBag, color: 'bg-gray-100 text-gray-700' },
      { id: 'writer',   label: 'Bulk Writer',     provider: 'DeepSeek V3',  model: 'deepseek-v3',      icon: BookOpen,    color: 'bg-blue-100 text-blue-700' },
      { id: 'qa',       label: 'QA Filter',       provider: 'Groq Llama',   model: 'llama-3.3-70b',    icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
    ],
    triggers: ['Bulk CSV import', 'Scheduled batch', 'API webhook'],
    outputs: ['Product descriptions', 'Category content', 'Blog drafts'],
    complexity: 'Simple',
    avgLatencyMs: 1200,
    costPer1000: 0.28,
    status: 'idle',
    callsToday: 0,
  },
  {
    id: 'orderassist',
    name: 'OrderAssist — Smart Handler',
    namebn: 'অর্ডার অ্যাসিস্ট',
    description: 'Automatically handles order queries, generates shipping updates, processes return requests, and sends proactive notifications.',
    category: 'Operations',
    icon: ShoppingBag,
    color: 'from-indigo-500 to-blue-700',
    steps: [
      { id: 'classifier', label: 'Query Classifier', provider: 'Claude Haiku', model: 'claude-haiku-4-5', icon: Cpu,         color: 'bg-orange-100 text-orange-700' },
      { id: 'fetcher',    label: 'Order Fetcher',    provider: 'Internal API', model: 'api',              icon: Search,      color: 'bg-gray-100 text-gray-700' },
      { id: 'responder',  label: 'Smart Responder',  provider: 'GPT-4o-mini',  model: 'gpt-4o-mini',     icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
    ],
    triggers: ['Customer message', 'Email', 'Status change webhook'],
    outputs: ['Auto-reply', 'Return label', 'Notification SMS/email'],
    complexity: 'Moderate',
    avgLatencyMs: 1400,
    costPer1000: 0.35,
    status: 'idle',
    callsToday: 0,
  },
];

/* ─── Provider / model catalogue (for settings modal) ───────────── */
const PROVIDER_MODELS: Record<string, { label: string; models: string[] }> = {
  openai:    { label: 'OpenAI',              models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini'] },
  anthropic: { label: 'Anthropic (Claude)',  models: ['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-7'] },
  gemini:    { label: 'Google Gemini',       models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
  deepseek:  { label: 'DeepSeek',           models: ['deepseek-v3', 'deepseek-r1', 'deepseek-coder-v2'] },
  xai:       { label: 'xAI (Grok)',         models: ['grok-2', 'grok-beta', 'grok-vision-beta'] },
  qwen:      { label: 'Alibaba Qwen',       models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-vl-max'] },
  mistral:   { label: 'Mistral',            models: ['mistral-large-latest', 'mistral-nemo', 'codestral-latest'] },
  cohere:    { label: 'Cohere',             models: ['command-r-plus', 'command-r'] },
  groq:      { label: 'Groq',              models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'] },
  openrouter:{ label: 'OpenRouter',         models: ['auto', 'openrouter/auto'] },
  internal:  { label: 'Internal / Built-in',models: ['api', 'queue', 'heuristic', 'scraper'] },
};

/* ─── Settings Modal ─────────────────────────────────────────────── */
function PipelineSettingsModal({ pipeline, onClose, onSave }: {
  pipeline: Pipeline;
  onClose: () => void;
  onSave: (updated: Partial<Pipeline>) => void;
}) {
  const [name, setName] = useState(pipeline.name);
  const [steps, setSteps] = useState<PipelineStep[]>(pipeline.steps.map(s => ({ ...s })));
  const [triggers, setTriggers] = useState<string[]>(pipeline.triggers as string[]);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [timeout, setTimeout_] = useState(30);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [tab, setTab] = useState<'steps' | 'triggers' | 'advanced'>('steps');

  const updateStep = (idx: number, field: keyof PipelineStep, val: string) =>
    setSteps(ss => ss.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  const handleSave = () => {
    onSave({ name, steps, triggers });
    toast.success('Pipeline settings saved');
    onClose();
  };

  const inp = 'w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${pipeline.color} flex items-center justify-center`}>
              <pipeline.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">Pipeline Settings</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pipeline name */}
        <div className="px-6 pt-4 flex-shrink-0">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pipeline Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inp} />
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {(['steps', 'triggers', 'advanced'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'steps' ? `Steps (${steps.length})` : t === 'triggers' ? `Triggers (${triggers.length})` : 'Advanced'}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Steps tab */}
          {tab === 'steps' && steps.map((step, i) => (
            <div key={step.id} className="rounded-xl border border-gray-200 dark:border-gray-600 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{step.label}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Provider</label>
                  <select
                    value={Object.entries(PROVIDER_MODELS).find(([, v]) => v.models.includes(step.model))?.[0] ?? 'internal'}
                    onChange={e => {
                      const firstModel = PROVIDER_MODELS[e.target.value]?.models[0] ?? '';
                      updateStep(i, 'provider', PROVIDER_MODELS[e.target.value]?.label ?? e.target.value);
                      updateStep(i, 'model', firstModel);
                    }}
                    className={inp}
                  >
                    {Object.entries(PROVIDER_MODELS).map(([id, { label }]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Model</label>
                  <select
                    value={step.model}
                    onChange={e => updateStep(i, 'model', e.target.value)}
                    className={inp}
                  >
                    {(PROVIDER_MODELS[
                      Object.entries(PROVIDER_MODELS).find(([, v]) => v.models.includes(step.model))?.[0] ?? 'internal'
                    ]?.models ?? []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Step Label</label>
                <input
                  value={step.label}
                  onChange={e => updateStep(i, 'label', e.target.value)}
                  className={inp}
                  placeholder="e.g. Router Agent"
                />
              </div>
            </div>
          ))}

          {/* Triggers tab */}
          {tab === 'triggers' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Select what events trigger this pipeline:</p>
              {[
                'New product added', 'Product updated', 'New order placed', 'Order status changed',
                'New customer review', 'Customer support message', 'Scheduled (daily 6AM)',
                'Scheduled (weekly Monday)', 'Manual run', 'API webhook', 'Bulk CSV import',
                'Email received', 'WhatsApp message',
              ].map(t => (
                <label key={t} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={triggers.includes(t)}
                    onChange={e => setTriggers(ts => e.target.checked ? [...ts, t] : ts.filter(x => x !== t))}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{t}</span>
                </label>
              ))}
            </div>
          )}

          {/* Advanced tab */}
          {tab === 'advanced' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Temperature</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={temperature}
                      onChange={e => setTemperature(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs font-bold text-gray-600 w-6">{temperature}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max Tokens</label>
                  <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Timeout (seconds)</label>
                <input type="number" value={timeout} onChange={e => setTimeout_(Number(e.target.value))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Webhook Secret (optional)</label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={e => setWebhookSecret(e.target.value)}
                  placeholder="Used to verify incoming requests"
                  className={inp}
                />
              </div>
              <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Note:</strong> If the pipeline is currently live, saving settings will automatically redeploy it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Pipeline Card ──────────────────────────────────────────────── */
function PipelineCard({ pipeline, onDeploy, onPause, onUpdate }: {
  pipeline: Pipeline;
  onDeploy: (id: string) => void;
  onPause: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Pipeline>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const statusEl = {
    idle:      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Not deployed</span>,
    deploying: <span className="text-xs text-blue-600 flex items-center gap-1 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Deploying…</span>,
    live:      <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Live</span>,
    paused:    <span className="text-xs text-yellow-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Paused</span>,
    error:     <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</span>,
  }[pipeline.status];

  const complexityColor = {
    Simple:   'bg-green-100 text-green-700',
    Moderate: 'bg-yellow-100 text-yellow-700',
    Advanced: 'bg-red-100 text-red-700',
  }[pipeline.complexity];

  return (
    <div className={`rounded-2xl overflow-hidden border ${pipeline.status === 'live' ? 'border-green-300 shadow-green-100 shadow-sm' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}>
      {/* Gradient top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${pipeline.color}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pipeline.color} flex items-center justify-center flex-shrink-0`}>
            <pipeline.icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-gray-900 dark:text-white">{pipeline.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${complexityColor}`}>{pipeline.complexity}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{pipeline.namebn}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            {statusEl}
            {pipeline.status === 'live' && (
              <p className="text-[10px] text-gray-400 mt-1">{pipeline.callsToday} calls today</p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-4">{pipeline.description}</p>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Latency', value: pipeline.avgLatencyMs < 1000 ? `${pipeline.avgLatencyMs}ms` : `${(pipeline.avgLatencyMs / 1000).toFixed(1)}s` },
            { label: 'Cost/1K', value: `$${pipeline.costPer1000.toFixed(2)}` },
            { label: 'Steps', value: pipeline.steps.length.toString() },
          ].map(m => (
            <div key={m.label} className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl py-2">
              <p className="text-xs font-black text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-[10px] text-gray-400">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Expand: pipeline steps */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-primary transition-colors py-1"
        >
          <span>View pipeline steps</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {pipeline.steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-[9px] font-black text-gray-500">{i + 1}</div>
                <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2 ${step.color}`}>
                  <step.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-semibold flex-1 truncate">{step.label}</span>
                  <span className="text-[10px] opacity-70">{step.provider}</span>
                </div>
                {i < pipeline.steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                )}
              </div>
            ))}

            {/* Triggers & Outputs */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1.5">Triggers</p>
                {pipeline.triggers.map(t => <p key={t} className="text-[10px] text-blue-700 dark:text-blue-300">• {t}</p>)}
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <p className="text-[10px] font-bold text-green-600 uppercase mb-1.5">Outputs</p>
                {pipeline.outputs.map(o => <p key={o} className="text-[10px] text-green-700 dark:text-green-300">• {o}</p>)}
              </div>
            </div>

            {/* Webhook URL if live */}
            {pipeline.status === 'live' && pipeline.webhookUrl && (
              <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <code className="text-[10px] text-gray-600 dark:text-gray-400 flex-1 truncate">{pipeline.webhookUrl}</code>
                <button
                  onClick={() => { void navigator.clipboard.writeText(pipeline.webhookUrl!); toast.success('Copied!'); }}
                  className="flex-shrink-0 text-gray-400 hover:text-primary"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {pipeline.status === 'live' ? (
            <>
              <button
                onClick={() => onPause(pipeline.id)}
                className="flex-1 py-2 text-xs font-bold border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Pause
              </button>
              <button
                onClick={() => { if (pipeline.webhookUrl) { void navigator.clipboard.writeText(pipeline.webhookUrl); toast.success('Webhook copied!'); } }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Webhook
              </button>
            </>
          ) : pipeline.status === 'deploying' ? (
            <button disabled className="flex-1 py-2 text-xs font-bold bg-primary/50 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deploying…
            </button>
          ) : pipeline.status === 'paused' ? (
            <button
              onClick={() => onDeploy(pipeline.id)}
              className="flex-1 py-2 text-xs font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Resume
            </button>
          ) : (
            <button
              onClick={() => onDeploy(pipeline.id)}
              className="flex-1 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> 1-Click Deploy
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary/40 transition-colors"
            title="Configure pipeline"
          >
            <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-primary" />
          </button>
        </div>
      </div>

      {settingsOpen && (
        <PipelineSettingsModal
          pipeline={pipeline}
          onClose={() => setSettingsOpen(false)}
          onSave={changes => onUpdate(pipeline.id, changes)}
        />
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function OrchestratorPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(PIPELINES);
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(PIPELINES.map(p => p.category)))];
  const filtered = category === 'All' ? pipelines : pipelines.filter(p => p.category === category);
  const liveCount = pipelines.filter(p => p.status === 'live').length;

  const deploy = (id: string) => {
    setPipelines(ps => ps.map(p => p.id === id ? { ...p, status: 'deploying' } : p));
    toast.info('Deploying pipeline…');
    setTimeout(() => {
      const webhook = `https://api.unkora.com/ai/hooks/${id}/${Math.random().toString(36).slice(2, 8)}`;
      setPipelines(ps => ps.map(p => p.id === id ? { ...p, status: 'live', webhookUrl: webhook, callsToday: 0 } : p));
      toast.success('Pipeline deployed! Webhook endpoint is ready.');
    }, 2000 + Math.random() * 1500);
  };

  const pause = (id: string) => {
    setPipelines(ps => ps.map(p => p.id === id ? { ...p, status: 'paused' } : p));
    toast('Pipeline paused');
  };

  const update = (id: string, changes: Partial<Pipeline>) => {
    setPipelines(ps => ps.map(p => p.id === id ? { ...p, ...changes } : p));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Hermez Orchestrator</h1>
          </div>
          <p className="text-sm text-gray-500">Multi-agent pipelines — connect multiple AI models for complex workflows. 1-click deploy.</p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {liveCount} pipeline{liveCount > 1 ? 's' : ''} live
            </div>
          )}
          <button
            onClick={() => toast.info('Custom pipeline builder coming soon!')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Custom Pipeline
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 p-4">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-purple-900 dark:text-purple-200">Hermez — Multi-Model Agent Orchestration</p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 leading-relaxed">
              Each pipeline chains multiple specialized AI models — a router picks the best tool, specialist agents process, then outputs are verified.
              Deploy any pipeline in one click to get a live webhook endpoint.
            </p>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${category === c ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Pipeline grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(pipeline => (
          <PipelineCard key={pipeline.id} pipeline={pipeline} onDeploy={deploy} onPause={pause} onUpdate={update} />
        ))}
      </div>

      {/* Live pipelines summary */}
      {liveCount > 0 && (
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Live Pipeline Webhooks</h3>
            <span className="text-xs text-gray-500">Copy endpoints to integrate</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pipelines.filter(p => p.status === 'live' && p.webhookUrl).map(p => (
              <div key={p.id} className="flex items-center gap-3 px-6 py-3">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center flex-shrink-0`}>
                  <p.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{p.name}</p>
                  <code className="text-[10px] text-gray-400 truncate block">{p.webhookUrl}</code>
                </div>
                <button
                  onClick={() => { void navigator.clipboard.writeText(p.webhookUrl!); toast.success('Copied!'); }}
                  className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
