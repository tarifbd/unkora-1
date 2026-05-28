'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Cpu, Loader2, AlertCircle, Plus, Trash2, Edit2, Play, Zap,
  CheckCircle2, XCircle, X, ChevronDown, ChevronUp,
  MessageSquare, Search, Globe, Star, TrendingUp, BookOpen, ShoppingBag,
  Rocket, ChevronRight,
} from 'lucide-react';
import { aiApi, type AiAgentIntegration, type AiAgentType, type AiAgentTask } from '@/lib/api/ai-studio';

const AGENT_TYPES: AiAgentType[] = [
  'SEO_AGENT', 'CONTENT_AGENT', 'PRODUCT_AGENT', 'LANDING_PAGE_AGENT',
  'CUSTOMER_SUPPORT_AGENT', 'INVENTORY_AGENT', 'MARKETING_AGENT', 'CUSTOM_AGENT',
];

const TASK_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const inputCls = 'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

interface AgentForm {
  name: string;
  agentType: AiAgentType;
  provider: string;
  description: string;
  endpointUrl: string;
  apiKeyEnvName: string;
  configJson: string;
  isEnabled: boolean;
}

const defaultForm: AgentForm = {
  name: '', agentType: 'CUSTOM_AGENT', provider: 'custom', description: '',
  endpointUrl: '', apiKeyEnvName: '', configJson: '{}', isEnabled: true,
};

function AgentModal({ agent, onClose, onSave }: {
  agent?: AiAgentIntegration | null;
  onClose: () => void;
  onSave: (data: Partial<AiAgentIntegration>) => void;
}) {
  const [form, setForm] = useState<AgentForm>(() => agent ? {
    name: agent.name,
    agentType: agent.agentType,
    provider: agent.provider,
    description: agent.description ?? '',
    endpointUrl: agent.endpointUrl ?? '',
    apiKeyEnvName: agent.apiKeyEnvName ?? '',
    configJson: agent.configJson ? JSON.stringify(agent.configJson, null, 2) : '{}',
    isEnabled: agent.isEnabled,
  } : { ...defaultForm });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    let configJson: Record<string, unknown> | null = null;
    try { configJson = JSON.parse(form.configJson); } catch { toast.error('Invalid JSON config'); return; }
    onSave({ ...form, configJson });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{agent ? 'Edit Agent' : 'Create Agent'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Product SEO Agent" />
            </div>
            <div>
              <label className={labelCls}>Agent Type</label>
              <select className={inputCls} value={form.agentType} onChange={e => setForm(f => ({ ...f, agentType: e.target.value as AiAgentType }))}>
                {AGENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Provider</label>
              <input className={inputCls} value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="e.g. openai, custom" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Endpoint URL</label>
              <input className={inputCls} value={form.endpointUrl} onChange={e => setForm(f => ({ ...f, endpointUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>API Key Env Variable</label>
              <input className={inputCls} value={form.apiKeyEnvName} onChange={e => setForm(f => ({ ...f, apiKeyEnvName: e.target.value }))} placeholder="e.g. MY_AGENT_API_KEY" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Config JSON</label>
              <textarea className={`${inputCls} font-mono text-xs`} rows={4} value={form.configJson} onChange={e => setForm(f => ({ ...f, configJson: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <button type="button" onClick={() => setForm(f => ({ ...f, isEnabled: !f.isEnabled }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.isEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700">
                {agent ? 'Save Changes' : 'Create Agent'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentCard({ agent, onEdit, onDelete, onTest, onRun }: {
  agent: AiAgentIntegration;
  onEdit: (a: AiAgentIntegration) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onRun: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              {agent.agentType.replace(/_/g, ' ')}
            </span>
            {agent.isEnabled ? (
              <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                <XCircle className="h-3.5 w-3.5" /> Disabled
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
          {agent.description && <p className="text-xs text-gray-500 mt-0.5">{agent.description}</p>}
          <p className="text-xs text-gray-400 mt-1">Provider: <span className="font-medium capitalize">{agent.provider}</span></p>
          {agent.endpointUrl && (
            <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{agent.endpointUrl}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button onClick={() => onTest(agent.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors">
          <Zap className="h-3.5 w-3.5" /> Test
        </button>
        <button onClick={() => onRun(agent.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors">
          <Play className="h-3.5 w-3.5" /> Run Task
        </button>
        <button onClick={() => onEdit(agent)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={() => onDelete(agent.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function TasksSection({ tasks }: { tasks: AiAgentTask[] }) {
  const [open, setOpen] = useState(true);
  if (!tasks.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"
      >
        <span className="font-semibold text-gray-900 dark:text-white">Agent Task History ({tasks.length})</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Task Type</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Started</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Completed</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2.5 text-xs font-medium">{t.taskType}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${TASK_STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{t.startedAt ? new Date(t.startedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{t.completedAt ? new Date(t.completedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-red-500 max-w-xs truncate">{t.errorMessage ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Quick-deploy templates ──────────────────────────────────────── */
const AGENT_TEMPLATES = [
  { name: 'BookBot Support',     type: 'CUSTOMER_SUPPORT_AGENT', provider: 'anthropic', icon: MessageSquare, color: 'bg-blue-100 text-blue-700',   endpoint: '/ai/hooks/bookbot',    desc: 'Handles Bengali + English support queries' },
  { name: 'SEO Auto-Writer',     type: 'SEO_AGENT',              provider: 'openai',    icon: Search,        color: 'bg-green-100 text-green-700', endpoint: '/ai/hooks/seo-writer', desc: 'Generates optimized meta, titles, schema' },
  { name: 'BanglaWriter',        type: 'CONTENT_AGENT',          provider: 'qwen',      icon: Globe,         color: 'bg-red-100 text-red-700',     endpoint: '/ai/hooks/bangla',     desc: 'Bengali product descriptions + blog' },
  { name: 'Review Analyzer',     type: 'CUSTOM_AGENT',           provider: 'deepseek',  icon: Star,          color: 'bg-yellow-100 text-yellow-700',endpoint: '/ai/hooks/reviews',    desc: 'Sentiment + topic extraction from reviews' },
  { name: 'Price Intelligence',  type: 'CUSTOM_AGENT',           provider: 'xai',       icon: TrendingUp,    color: 'bg-cyan-100 text-cyan-700',   endpoint: '/ai/hooks/prices',     desc: 'Competitor pricing + market analysis' },
  { name: 'Reco Engine',         type: 'PRODUCT_AGENT',          provider: 'gemini',    icon: BookOpen,      color: 'bg-purple-100 text-purple-700',endpoint: '/ai/hooks/reco',       desc: 'Personalized book recommendations' },
  { name: 'Order Assistant',     type: 'CUSTOMER_SUPPORT_AGENT', provider: 'openai',    icon: ShoppingBag,   color: 'bg-indigo-100 text-indigo-700',endpoint: '/ai/hooks/orders',     desc: 'Auto-handles order queries & returns' },
  { name: 'Content Factory',     type: 'CONTENT_AGENT',          provider: 'deepseek',  icon: Cpu,           color: 'bg-gray-100 text-gray-700',   endpoint: '/ai/hooks/bulk',       desc: 'Bulk content generation at ultra-low cost' },
] as const;

function TemplatesSection({ onInstall }: { onInstall: (t: typeof AGENT_TEMPLATES[number]) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4"
      >
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-purple-600" />
          <span className="font-bold text-sm text-purple-900 dark:text-purple-200">Pre-built Agent Templates</span>
          <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">{AGENT_TEMPLATES.length}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-purple-400" /> : <ChevronRight className="h-4 w-4 text-purple-400" />}
      </button>
      {open && (
        <div className="px-6 pb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENT_TEMPLATES.map(t => (
            <div key={t.name} className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${t.color}`}>
                <t.icon className="w-4 h-4" />
              </div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">{t.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{t.desc}</p>
              <p className="text-[10px] text-gray-400 mt-1">Provider: <span className="font-medium capitalize">{t.provider}</span></p>
              <button
                onClick={() => onInstall(t)}
                className="mt-3 w-full py-1.5 text-[10px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
              >
                <Zap className="w-2.5 h-2.5" /> 1-Click Install
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AiAgentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AiAgentIntegration | null>(null);
  const qc = useQueryClient();

  const { data: agents = [], isLoading, isError } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: aiApi.listAgents,
    retry: 1,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['ai-agent-tasks'],
    queryFn: () => aiApi.listAgentTasks(),
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AiAgentIntegration>) => aiApi.createAgent(data),
    onSuccess: () => { toast.success('Agent created!'); void qc.invalidateQueries({ queryKey: ['ai-agents'] }); setModalOpen(false); },
    onError: () => toast.error('Failed to create agent'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AiAgentIntegration> }) => aiApi.updateAgent(id, data),
    onSuccess: () => { toast.success('Agent updated!'); void qc.invalidateQueries({ queryKey: ['ai-agents'] }); setEditAgent(null); },
    onError: () => toast.error('Failed to update agent'),
  });

  const deleteMutation = useMutation({
    mutationFn: aiApi.deleteAgent,
    onSuccess: () => { toast.success('Agent deleted'); void qc.invalidateQueries({ queryKey: ['ai-agents'] }); },
    onError: () => toast.error('Failed to delete agent'),
  });

  const testMutation = useMutation({
    mutationFn: aiApi.testAgent,
    onSuccess: (d: { success: boolean; error?: string }) => {
      if (d?.success) toast.success('Agent test successful!');
      else toast.error(`Test failed: ${d?.error ?? 'Unknown'}`);
    },
    onError: () => toast.error('Agent test failed'),
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => aiApi.runAgentTask(id, { taskType: 'MANUAL_RUN' }),
    onSuccess: () => { toast.success('Task queued!'); void qc.invalidateQueries({ queryKey: ['ai-agent-tasks'] }); },
    onError: () => toast.error('Failed to run task'),
  });

  const handleSave = (data: Partial<AiAgentIntegration>) => {
    if (editAgent) { updateMutation.mutate({ id: editAgent.id, data }); }
    else { createMutation.mutate(data); }
  };

  const handleInstallTemplate = (t: typeof AGENT_TEMPLATES[number]) => {
    createMutation.mutate({
      name: t.name,
      agentType: t.type as AiAgentType,
      provider: t.provider,
      description: t.desc,
      endpointUrl: `https://api.unkora.com${t.endpoint}`,
      isEnabled: true,
      configJson: {},
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold">AI Agents</h1>
            <p className="text-sm text-muted-foreground">Manage and deploy AI agent integrations</p>
          </div>
        </div>
        <button
          onClick={() => { setEditAgent(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Agent
        </button>
      </div>

      {/* Templates */}
      <TemplatesSection onInstall={handleInstallTemplate} />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-500">Failed to load agents</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
          <Cpu className="h-12 w-12 text-gray-200 dark:text-gray-700" />
          <p className="text-sm text-gray-500">No agents configured yet</p>
          <p className="text-xs text-gray-400 text-center max-w-sm">
            Create your first AI agent integration. Connect to OpenAI Assistants, custom webhooks, or any AI framework.
          </p>
          <button
            onClick={() => { setEditAgent(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create First Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={(a) => { setEditAgent(a); setModalOpen(true); }}
              onDelete={(id) => { if (confirm('Delete this agent?')) deleteMutation.mutate(id); }}
              onTest={(id) => testMutation.mutate(id)}
              onRun={(id) => runMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <TasksSection tasks={tasks} />

      {/* Modal */}
      {(modalOpen || editAgent) && (
        <AgentModal
          agent={editAgent}
          onClose={() => { setModalOpen(false); setEditAgent(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
