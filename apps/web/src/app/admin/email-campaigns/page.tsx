'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Mail, Send, Trash2, Plus, X, Eye } from 'lucide-react';
import api from '@/lib/api';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  audience: string;
  status: 'DRAFT' | 'SENT';
  sentCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

interface CampaignStats {
  total: number;
  sent: number;
  draft: number;
  avgOpenRate: number;
}

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'All Users' },
  { value: 'BUYERS', label: 'Buyers Only' },
  { value: 'SELLERS', label: 'Sellers Only' },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  SENT: 'bg-green-100 text-green-700',
};

const inputCls =
  'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const defaultForm = {
  name: '',
  subject: '',
  htmlContent: '',
  audience: 'ALL',
  scheduledAt: '',
};

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({ total: 0, sent: 0, draft: 0, avgOpenRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<EmailCampaign | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignsRes, statsRes] = await Promise.all([
        api.get('/email-campaigns').then(r => r.data.data),
        api.get('/email-campaigns/stats').then(r => r.data.data),
      ]);
      setCampaigns(Array.isArray(campaignsRes?.data) ? campaignsRes.data : []);
      if (statsRes) setStats(statsRes);
    } catch {
      setError('Failed to load email campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const openNewForm = () => {
    setEditId(null);
    setForm(defaultForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (c: EmailCampaign) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      subject: c.subject,
      htmlContent: c.htmlContent,
      audience: c.audience,
      scheduledAt: c.scheduledAt ? c.scheduledAt.slice(0, 16) : '',
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.htmlContent.trim()) {
      setFormError('Name, subject, and HTML content are required');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        subject: form.subject,
        htmlContent: form.htmlContent,
        audience: form.audience,
      };
      if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();

      if (editId) {
        await api.put(`/email-campaigns/${editId}`, payload);
      } else {
        await api.post('/email-campaigns', payload);
      }
      closeForm();
      void loadData();
    } catch {
      setFormError(editId ? 'Failed to update campaign' : 'Failed to create campaign');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      await api.post(`/email-campaigns/${id}/send`);
      setCampaigns(prev =>
        prev.map(c =>
          c.id === id ? { ...c, status: 'SENT' as const, sentAt: new Date().toISOString() } : c,
        ),
      );
      void loadData();
    } catch {
      // silently handle
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/email-campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      void loadData();
    } catch {
      // silently handle
    } finally {
      setDeletingId(null);
    }
  };

  const statsCards = [
    { label: 'Total Campaigns', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Sent', value: stats.sent, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Drafts', value: stats.draft, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { label: 'Avg Open Rate', value: `${stats.avgOpenRate}%`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground">Create and manage marketing email campaigns</p>
        </div>
        <button
          onClick={showForm ? closeForm : openNewForm}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsCards.map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs font-medium mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Campaign Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-card p-5 space-y-4"
        >
          <h2 className="font-semibold text-sm">{editId ? 'Edit Campaign' : 'New Campaign'}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Campaign Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Summer Sale 2026"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Audience</label>
              <select
                value={form.audience}
                onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                className={inputCls}
              >
                {AUDIENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Subject line..."
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Schedule At (optional)</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">HTML Content *</label>
            <textarea
              value={form.htmlContent}
              onChange={e => setForm(f => ({ ...f, htmlContent: e.target.value }))}
              rows={8}
              placeholder="<p>Your email HTML content here...</p>"
              className={`${inputCls} resize-y font-mono text-xs`}
              required
            />
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editId ? 'Update' : 'Save Draft'}
            </button>
          </div>
        </form>
      )}

      {/* Campaigns Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            No email campaigns yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Campaign</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Audience</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-muted-foreground sm:table-cell">Sent</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-muted-foreground lg:table-cell">Opens</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map(c => {
                  const openRate = c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 100) : 0;
                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground max-w-[250px] md:table-cell">
                        <p className="truncate">{c.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {AUDIENCE_OPTIONS.find(o => o.value === c.audience)?.label ?? c.audience}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs sm:table-cell">
                        {c.sentCount > 0 ? c.sentCount.toLocaleString() : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs lg:table-cell">
                        {c.status === 'SENT' ? `${openRate}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreview(c)}
                            title="Preview"
                            className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {c.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => openEditForm(c)}
                                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleSend(c.id)}
                                disabled={sendingId === c.id}
                                className="flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                              >
                                {sendingId === c.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Send className="h-3.5 w-3.5" />
                                )}
                                Send
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            title="Delete"
                            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HTML Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[80vh] rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3 bg-card">
              <div>
                <h2 className="font-semibold text-sm">{preview.name}</h2>
                <p className="text-xs text-muted-foreground">Subject: {preview.subject}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <iframe
                srcDoc={preview.htmlContent}
                title="Email Preview"
                className="w-full h-full min-h-[500px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
