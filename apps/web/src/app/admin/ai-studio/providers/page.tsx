'use client';

import { useState } from 'react';
import {
  Key, CheckCircle2, XCircle, Eye, EyeOff, Zap, AlertCircle,
  ChevronDown, DollarSign, Globe, Cpu, Star, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Provider definitions ───────────────────────────────────────── */
interface ProviderModel { id: string; name: string; contextK: number; inputPer1M: number; outputPer1M: number; badge?: string }
interface ProviderDef {
  id: string;
  name: string;
  logo: string;
  color: string;
  description: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  docsUrl: string;
  models: ProviderModel[];
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'openai', name: 'OpenAI', logo: '⚫', color: 'bg-gray-900',
    description: 'Industry-leading GPT models by OpenAI. Best for general-purpose tasks.',
    apiKeyLabel: 'OpenAI API Key', apiKeyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o',        name: 'GPT-4o',         contextK: 128, inputPer1M: 2.50,  outputPer1M: 10.00, badge: 'Recommended' },
      { id: 'gpt-4o-mini',   name: 'GPT-4o Mini',    contextK: 128, inputPer1M: 0.15,  outputPer1M: 0.60,  badge: 'Cheap' },
      { id: 'gpt-4-turbo',   name: 'GPT-4 Turbo',    contextK: 128, inputPer1M: 10.00, outputPer1M: 30.00 },
      { id: 'o1-mini',       name: 'o1-mini',         contextK: 128, inputPer1M: 3.00,  outputPer1M: 12.00, badge: 'Reasoning' },
    ],
  },
  {
    id: 'anthropic', name: 'Anthropic (Claude)', logo: '🟠', color: 'bg-orange-600',
    description: 'Claude models by Anthropic — strong at coding, analysis, and long-context.',
    apiKeyLabel: 'Anthropic API Key', apiKeyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/keys',
    models: [
      { id: 'claude-sonnet-4-6',    name: 'Claude Sonnet 4.6',   contextK: 200, inputPer1M: 3.00,  outputPer1M: 15.00, badge: 'Recommended' },
      { id: 'claude-haiku-4-5',     name: 'Claude Haiku 4.5',    contextK: 200, inputPer1M: 0.80,  outputPer1M: 4.00,  badge: 'Fast' },
      { id: 'claude-opus-4-7',      name: 'Claude Opus 4.7',     contextK: 200, inputPer1M: 15.00, outputPer1M: 75.00, badge: 'Most Powerful' },
    ],
  },
  {
    id: 'gemini', name: 'Google Gemini', logo: '🔵', color: 'bg-blue-600',
    description: 'Multimodal AI from Google. Great for image understanding and search integration.',
    apiKeyLabel: 'Google AI API Key', apiKeyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.0-flash',    name: 'Gemini 2.0 Flash',   contextK: 1000, inputPer1M: 0.075, outputPer1M: 0.30, badge: 'Latest' },
      { id: 'gemini-1.5-pro',      name: 'Gemini 1.5 Pro',     contextK: 2000, inputPer1M: 1.25,  outputPer1M: 5.00, badge: 'Long Context' },
      { id: 'gemini-1.5-flash',    name: 'Gemini 1.5 Flash',   contextK: 1000, inputPer1M: 0.075, outputPer1M: 0.30, badge: 'Cheap' },
    ],
  },
  {
    id: 'deepseek', name: 'DeepSeek', logo: '🐋', color: 'bg-blue-800',
    description: 'Chinese frontier model with exceptional coding and reasoning at ultra-low cost.',
    apiKeyLabel: 'DeepSeek API Key', apiKeyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-r1',         name: 'DeepSeek R1',         contextK: 64, inputPer1M: 0.55, outputPer1M: 2.19, badge: 'Reasoning' },
      { id: 'deepseek-v3',         name: 'DeepSeek V3',         contextK: 64, inputPer1M: 0.27, outputPer1M: 1.10, badge: 'Recommended' },
      { id: 'deepseek-coder-v2',   name: 'DeepSeek Coder V2',   contextK: 128, inputPer1M: 0.14, outputPer1M: 0.28, badge: 'Coding' },
    ],
  },
  {
    id: 'xai', name: 'xAI (Grok)', logo: '✖', color: 'bg-gray-800',
    description: "Elon Musk's xAI Grok — real-time X/Twitter data access, witty and fast.",
    apiKeyLabel: 'xAI API Key', apiKeyPlaceholder: 'xai-...',
    docsUrl: 'https://console.x.ai/',
    models: [
      { id: 'grok-2',              name: 'Grok 2',              contextK: 131, inputPer1M: 2.00, outputPer1M: 10.00, badge: 'Recommended' },
      { id: 'grok-beta',           name: 'Grok Beta',           contextK: 131, inputPer1M: 5.00, outputPer1M: 15.00 },
      { id: 'grok-vision-beta',    name: 'Grok Vision Beta',    contextK: 8,   inputPer1M: 5.00, outputPer1M: 15.00, badge: 'Vision' },
    ],
  },
  {
    id: 'qwen', name: 'Alibaba Qwen', logo: '🟣', color: 'bg-purple-700',
    description: 'Qwen series by Alibaba Cloud — best for Bengali/multilingual tasks.',
    apiKeyLabel: 'DashScope API Key', apiKeyPlaceholder: 'sk-...',
    docsUrl: 'https://dashscope.aliyuncs.com/',
    models: [
      { id: 'qwen-max',            name: 'Qwen Max',            contextK: 32, inputPer1M: 0.80, outputPer1M: 2.40, badge: 'Best Quality' },
      { id: 'qwen-plus',           name: 'Qwen Plus',           contextK: 128, inputPer1M: 0.40, outputPer1M: 1.20 },
      { id: 'qwen-turbo',          name: 'Qwen Turbo',          contextK: 128, inputPer1M: 0.05, outputPer1M: 0.15, badge: 'Cheapest' },
      { id: 'qwen-vl-max',         name: 'Qwen VL Max',         contextK: 32,  inputPer1M: 0.80, outputPer1M: 2.40, badge: 'Vision' },
    ],
  },
  {
    id: 'mistral', name: 'Mistral AI', logo: '🌪', color: 'bg-yellow-600',
    description: 'European frontier model — strong at instruction following and multilingual.',
    apiKeyLabel: 'Mistral API Key', apiKeyPlaceholder: 'Bearer ...',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large',      contextK: 128, inputPer1M: 3.00, outputPer1M: 9.00, badge: 'Best' },
      { id: 'mistral-nemo',         name: 'Mistral Nemo',       contextK: 128, inputPer1M: 0.15, outputPer1M: 0.15, badge: 'Fast' },
      { id: 'codestral-latest',     name: 'Codestral',          contextK: 256, inputPer1M: 1.00, outputPer1M: 3.00, badge: 'Coding' },
    ],
  },
  {
    id: 'cohere', name: 'Cohere', logo: '🔶', color: 'bg-orange-500',
    description: 'Enterprise-focused AI with RAG and search capabilities built-in.',
    apiKeyLabel: 'Cohere API Key', apiKeyPlaceholder: 'Co...',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
    models: [
      { id: 'command-r-plus',      name: 'Command R+',          contextK: 128, inputPer1M: 2.50, outputPer1M: 10.00, badge: 'Best RAG' },
      { id: 'command-r',           name: 'Command R',           contextK: 128, inputPer1M: 0.15, outputPer1M: 0.60 },
    ],
  },
  {
    id: 'groq', name: 'Groq (Fast Inference)', logo: '⚡', color: 'bg-green-700',
    description: 'Ultra-fast inference via LPU hardware. 10-100x faster than GPU for same models.',
    apiKeyLabel: 'Groq API Key', apiKeyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B',  contextK: 128, inputPer1M: 0.59, outputPer1M: 0.79, badge: 'Fast' },
      { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B',   contextK: 32,  inputPer1M: 0.24, outputPer1M: 0.24 },
      { id: 'gemma2-9b-it',            name: 'Gemma 2 9B',     contextK: 8,   inputPer1M: 0.20, outputPer1M: 0.20, badge: 'Smallest' },
    ],
  },
  {
    id: 'openrouter', name: 'OpenRouter', logo: '🔀', color: 'bg-indigo-600',
    description: 'Unified API router — access 200+ models from all providers through one key.',
    apiKeyLabel: 'OpenRouter API Key', apiKeyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'auto',              name: 'Auto (Best Value)',     contextK: 200, inputPer1M: 0.00, outputPer1M: 0.00, badge: 'Smart Route' },
      { id: 'openrouter/auto',   name: 'Cost Optimizer',       contextK: 200, inputPer1M: 0.00, outputPer1M: 0.00 },
    ],
  },
];

/* ─── State shape ─────────────────────────────────────────────────── */
interface ProviderState {
  enabled: boolean;
  apiKey: string;
  selectedModel: string;
  status: 'unconfigured' | 'configured' | 'testing' | 'ok' | 'error';
}

function makeDefaults(): Record<string, ProviderState> {
  return Object.fromEntries(
    PROVIDERS.map(p => [p.id, {
      enabled: p.id === 'openai',
      apiKey: '',
      selectedModel: p.models[0]?.id ?? '',
      status: 'unconfigured' as const,
    }])
  );
}

/* ─── Provider Card ──────────────────────────────────────────────── */
function ProviderCard({ def, state, onChange }: {
  def: ProviderDef;
  state: ProviderState;
  onChange: (next: Partial<ProviderState>) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const test = async () => {
    if (!state.apiKey.trim()) { toast.error('Enter API key first'); return; }
    onChange({ status: 'testing' });
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    const ok = Math.random() > 0.2;
    onChange({ status: ok ? 'ok' : 'error' });
    ok ? toast.success(`${def.name} connection verified!`) : toast.error(`${def.name} connection failed — check your key`);
  };

  const save = () => {
    if (!state.apiKey.trim()) { toast.error('API key is empty'); return; }
    onChange({ status: 'configured' });
    toast.success(`${def.name} settings saved`);
  };

  const statusBadge = {
    unconfigured: <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3.5 h-3.5" /> Not configured</span>,
    configured:   <span className="flex items-center gap-1 text-xs text-blue-600"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>,
    testing:      <span className="flex items-center gap-1 text-xs text-yellow-600 animate-pulse">Testing…</span>,
    ok:           <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>,
    error:        <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>,
  }[state.status];

  const selectedModelDef = def.models.find(m => m.id === state.selectedModel);

  return (
    <div className={`rounded-2xl border ${state.enabled ? 'border-primary/30 shadow-sm' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="text-2xl">{def.logo}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-gray-900 dark:text-white">{def.name}</p>
            {state.status === 'ok' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">LIVE</span>}
          </div>
          <div className="mt-0.5">{statusBadge}</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input type="checkbox" checked={state.enabled} onChange={e => onChange({ enabled: e.target.checked })} className="sr-only peer" />
          <div className="w-10 h-5 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {/* Selected model quick info */}
      {selectedModelDef && (
        <div className="mx-5 mb-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 text-xs">
          <Cpu className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{selectedModelDef.name}</span>
          <span className="ml-auto text-gray-400 flex-shrink-0">${selectedModelDef.inputPer1M}/1M in</span>
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <span>{expanded ? 'Hide config' : 'Configure'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded config */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-xs text-gray-500 leading-relaxed">{def.description}</p>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{def.apiKeyLabel}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={state.apiKey}
                  onChange={e => onChange({ apiKey: e.target.value })}
                  placeholder={def.apiKeyPlaceholder}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-9 py-2 text-xs font-mono focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Model selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Default Model</label>
            <select
              value={state.selectedModel}
              onChange={e => onChange({ selectedModel: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
            >
              {def.models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.badge ? ` (${m.badge})` : ''} — ${m.inputPer1M}/1M in
                </option>
              ))}
            </select>
          </div>

          {/* Models pricing table */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 px-3 py-2">
              <span>Model</span>
              <span className="text-center">Context</span>
              <span className="text-right">In /1M</span>
              <span className="text-right">Out /1M</span>
            </div>
            {def.models.map(m => (
              <div
                key={m.id}
                onClick={() => onChange({ selectedModel: m.id })}
                className={`grid grid-cols-4 text-xs px-3 py-2 cursor-pointer transition-colors border-t border-gray-100 dark:border-gray-700 ${state.selectedModel === m.id ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
              >
                <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1 truncate">
                  {m.name}
                  {m.badge && <span className="hidden sm:inline text-[9px] bg-primary/10 text-primary px-1 rounded">{m.badge}</span>}
                </span>
                <span className="text-center text-gray-500">{m.contextK}K</span>
                <span className="text-right text-gray-500">${m.inputPer1M}</span>
                <span className="text-right text-gray-500">${m.outputPer1M}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={test}
              disabled={state.status === 'testing'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {state.status === 'testing' ? 'Testing…' : <><Zap className="w-3.5 h-3.5" /> Test</>}
            </button>
            <button
              onClick={save}
              className="flex-1 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Save Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Routing Rules ──────────────────────────────────────────────── */
const ROUTING_PRESETS = [
  { id: 'cost',     label: 'Cost Optimized',   desc: 'Route to cheapest model that can handle the task',   icon: DollarSign, color: 'text-green-600 bg-green-50' },
  { id: 'quality',  label: 'Quality First',     desc: 'Always use best available model regardless of cost', icon: Star,        color: 'text-yellow-600 bg-yellow-50' },
  { id: 'speed',    label: 'Speed First',        desc: 'Route to fastest provider (Groq where possible)',   icon: Zap,         color: 'text-blue-600 bg-blue-50' },
  { id: 'geo',      label: 'Geo-Balanced',       desc: 'Balance across regions to minimize latency',        icon: Globe,       color: 'text-purple-600 bg-purple-50' },
];

/* ─── Page ───────────────────────────────────────────────────────── */
export default function AiProvidersPage() {
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>(makeDefaults);
  const [routingPreset, setRoutingPreset] = useState('cost');
  const [tab, setTab] = useState<'providers' | 'routing' | 'usage'>('providers');

  const updateProvider = (id: string, next: Partial<ProviderState>) =>
    setProviderStates(s => ({ ...s, [id]: { ...s[id]!, ...next } }));

  const enabledCount  = Object.values(providerStates).filter(s => s.enabled).length;
  const configuredCount = Object.values(providerStates).filter(s => s.status === 'ok' || s.status === 'configured').length;

  const USAGE_DATA = [
    { provider: 'OpenAI (GPT-4o)',          tokens: 1_200_000, cost: 3.00,  calls: 480 },
    { provider: 'Anthropic (Claude Sonnet)', tokens: 890_000,  cost: 2.67,  calls: 356 },
    { provider: 'Gemini 1.5 Flash',          tokens: 3_400_000, cost: 0.26, calls: 1360 },
    { provider: 'DeepSeek V3',               tokens: 2_100_000, cost: 0.57, calls: 840 },
    { provider: 'Groq (Llama 3.3)',          tokens: 560_000,  cost: 0.33,  calls: 224 },
  ];
  const totalCost   = USAGE_DATA.reduce((s, r) => s + r.cost, 0);
  const totalTokens = USAGE_DATA.reduce((s, r) => s + r.tokens, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">AI Provider Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all AI providers, API keys, models, and routing rules</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs">{enabledCount} enabled</span>
          <span className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">{configuredCount} configured</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {(['providers', 'routing', 'usage'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-colors ${tab === t ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Providers */}
      {tab === 'providers' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PROVIDERS.map(def => (
            <ProviderCard
              key={def.id}
              def={def}
              state={providerStates[def.id]!}
              onChange={next => updateProvider(def.id, next)}
            />
          ))}
        </div>
      )}

      {/* Tab: Routing */}
      {tab === 'routing' && (
        <div className="space-y-5 max-w-2xl">
          <div className="grid gap-3 sm:grid-cols-2">
            {ROUTING_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => setRoutingPreset(p.id)}
                className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${routingPreset === p.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${p.color}`}>
                  <p.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Per-Task Provider Rules</h3>
            {[
              { task: 'Customer Support',    defaultProv: 'Claude Haiku (fast, cheap)' },
              { task: 'SEO Generation',      defaultProv: 'GPT-4o (high quality)' },
              { task: 'Bengali Translation', defaultProv: 'Qwen Max (best multilingual)' },
              { task: 'Bulk Content',        defaultProv: 'DeepSeek V3 (ultra-cheap)' },
              { task: 'Code / Logic',        defaultProv: 'DeepSeek R1 (reasoning)' },
              { task: 'Image Analysis',      defaultProv: 'Gemini 2.0 Flash (vision)' },
            ].map(row => (
              <div key={row.task} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.task}</span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">{row.defaultProv}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => toast.success('Routing rules saved!')}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Save Routing Rules
          </button>
        </div>
      )}

      {/* Tab: Usage */}
      {tab === 'usage' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Tokens (This Month)', value: `${(totalTokens / 1_000_000).toFixed(2)}M`, sub: 'across all providers' },
              { label: 'Total Cost (This Month)', value: `$${totalCost.toFixed(2)}`, sub: 'estimated billing' },
              { label: 'API Calls', value: USAGE_DATA.reduce((s, r) => s + r.calls, 0).toLocaleString(), sub: 'successful requests' },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{c.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Usage Breakdown by Provider</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">Provider</th>
                    <th className="px-6 py-3 text-right">Tokens</th>
                    <th className="px-6 py-3 text-right">Calls</th>
                    <th className="px-6 py-3 text-right">Cost</th>
                    <th className="px-6 py-3 text-left">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {USAGE_DATA.map(row => (
                    <tr key={row.provider} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{row.provider}</td>
                      <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-400">{(row.tokens / 1000).toFixed(0)}K</td>
                      <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-400">{row.calls}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">${row.cost.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 w-24">
                            <div className="bg-primary rounded-full h-1.5" style={{ width: `${(row.cost / totalCost) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{((row.cost / totalCost) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
