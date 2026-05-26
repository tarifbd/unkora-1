'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Bell, Send, Trash2, Plus, X } from 'lucide-react';
import api from '@/lib/api';

interface PushNotification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  targetUrl?: string | null;
  audience: string;
  sentCount: number;
  status: 'DRAFT' | 'SENT';
  sentAt?: string | null;
  createdAt: string;
}

interface NotificationStats {
  total: number;
  sent: number;
  draft: number;
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

const defaultForm = { title: '', body: '', imageUrl: '', targetUrl: '', audience: 'ALL' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, sent: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, statsRes] = await Promise.all([
        api.get('/notifications').then(r => r.data.data),
        api.get('/notifications/stats').then(r => r.data.data),
      ]);
      setNotifications(Array.isArray(notifRes?.data) ? notifRes.data : []);
      if (statsRes) setStats(statsRes);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setFormError('Title and body are required');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const payload: Record<string, string> = {
        title: form.title,
        body: form.body,
        audience: form.audience,
      };
      if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();
      if (form.targetUrl.trim()) payload.targetUrl = form.targetUrl.trim();

      await api.post('/notifications', payload);
      setForm(defaultForm);
      setShowForm(false);
      void loadData();
    } catch {
      setFormError('Failed to create notification');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      await api.post(`/notifications/${id}/send`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'SENT' as const, sentAt: new Date().toISOString() } : n)),
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
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      void loadData();
    } catch {
      // silently handle
    } finally {
      setDeletingId(null);
    }
  };

  const statsCards = [
    { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Sent', value: stats.sent, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'Drafts', value: stats.draft, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Push Notifications</h1>
          <p className="text-sm text-muted-foreground">Create and send push notifications to your users</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Notification'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {statsCards.map(card => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs font-medium mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* New Notification Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border bg-card p-5 space-y-4"
        >
          <h2 className="font-semibold text-sm">New Push Notification</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title"
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

          <div>
            <label className="mb-1.5 block text-sm font-medium">Body *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              placeholder="Notification message..."
              className={`${inputCls} resize-none`}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Image URL (optional)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Target URL (optional)</label>
              <input
                type="url"
                value={form.targetUrl}
                onChange={e => setForm(f => ({ ...f, targetUrl: e.target.value }))}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(defaultForm); setFormError(null); }}
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
              Save Draft
            </button>
          </div>
        </form>
      )}

      {/* Notifications Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            No notifications yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Title</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Body</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Audience</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold text-muted-foreground sm:table-cell">Sent To</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notifications.map(n => {
                  const date = new Date(n.createdAt).toLocaleDateString('en-BD', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  });
                  return (
                    <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[200px]">
                        <p className="truncate">{n.title}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground max-w-[250px] md:table-cell">
                        <p className="line-clamp-2">{n.body}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {AUDIENCE_OPTIONS.find(o => o.value === n.audience)?.label ?? n.audience}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[n.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {n.status.charAt(0) + n.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs font-medium sm:table-cell">
                        {n.sentCount > 0 ? n.sentCount.toLocaleString() : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground whitespace-nowrap lg:table-cell">{date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {n.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSend(n.id)}
                              disabled={sendingId === n.id}
                              title="Send now"
                              className="flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                              {sendingId === n.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              Send
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            disabled={deletingId === n.id}
                            title="Delete"
                            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === n.id ? (
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
    </div>
  );
}
