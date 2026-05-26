'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, FileText, CheckCircle2, XCircle, Clock, Loader2, Plus, X } from 'lucide-react';
import api from '@/lib/api';

const smsApi = {
  getLogs: (params?: object) => api.get('/sms/logs', { params }).then(r => r.data.data),
  getStats: () => api.get('/sms/stats').then(r => r.data.data),
  getTemplates: () => api.get('/sms/templates').then(r => r.data.data),
  createTemplate: (body: object) => api.post('/sms/templates', body).then(r => r.data.data),
  deleteTemplate: (id: string) => api.delete(`/sms/templates/${id}`).then(r => r.data.data),
  sendSingle: (body: object) => api.post('/sms/send', body).then(r => r.data.data),
  sendBulk: (body: object) => api.post('/sms/send-bulk', body).then(r => r.data.data),
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

type Tab = 'logs' | 'templates' | 'send';

export default function SmsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('logs');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Send single
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Bulk send
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [sendMode, setSendMode] = useState<'single' | 'bulk'>('single');

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplContent, setTplContent] = useState('');

  const { data: stats } = useQuery({ queryKey: ['sms-stats'], queryFn: smsApi.getStats });
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['sms-logs', statusFilter],
    queryFn: () => smsApi.getLogs({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
    enabled: tab === 'logs',
  });
  const { data: templatesData } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: smsApi.getTemplates,
    enabled: tab === 'templates' || tab === 'send',
  });

  const logs = logsData?.data ?? logsData ?? [];
  const templates = templatesData?.data ?? templatesData ?? [];

  const sendSingle = useMutation({
    mutationFn: () => smsApi.sendSingle({ phone, message }),
    onSuccess: () => {
      setPhone(''); setMessage('');
      qc.invalidateQueries({ queryKey: ['sms-logs'] });
      qc.invalidateQueries({ queryKey: ['sms-stats'] });
    },
  });

  const sendBulk = useMutation({
    mutationFn: () => smsApi.sendBulk({
      phones: bulkPhones.split('\n').map(p => p.trim()).filter(Boolean),
      message: bulkMessage,
    }),
    onSuccess: () => {
      setBulkPhones(''); setBulkMessage('');
      qc.invalidateQueries({ queryKey: ['sms-logs'] });
      qc.invalidateQueries({ queryKey: ['sms-stats'] });
    },
  });

  const createTemplate = useMutation({
    mutationFn: () => smsApi.createTemplate({ name: tplName, content: tplContent }),
    onSuccess: () => {
      setTplName(''); setTplContent(''); setShowTemplateForm(false);
      qc.invalidateQueries({ queryKey: ['sms-templates'] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => smsApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sms-templates'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SMS Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send messages and manage SMS templates</p>
        </div>
        <div className="flex gap-2">
          {(['logs', 'templates', 'send'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Sent', value: stats?.total ?? 0, icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
          { label: 'Delivered', value: stats?.delivered ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Failed', value: stats?.failed ?? 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Logs Tab */}
      {tab === 'logs' && (
        <>
          <div className="flex gap-1">
            {['ALL', 'PENDING', 'SENT', 'DELIVERED', 'FAILED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
                {s}
              </button>
            ))}
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Provider</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(Array.isArray(logs) ? logs : []).map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm font-mono">{log.phone}</td>
                      <td className="px-4 py-3 text-sm max-w-xs">
                        <p className="truncate">{log.message}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{log.provider ?? '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString('en-BD') : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(logs) || logs.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground">No SMS logs found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowTemplateForm(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>

          {showTemplateForm && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New Template</h3>
                <button onClick={() => setShowTemplateForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <input value={tplName} onChange={e => setTplName(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g. Order Confirmation" />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <p className="text-xs text-muted-foreground mb-1">Use {'{name}'}, {'{order}'}, etc. as variables</p>
                  <textarea value={tplContent} onChange={e => setTplContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Your order {order} has been confirmed. Thank you {name}!" />
                  <p className="text-xs text-muted-foreground mt-1">{tplContent.length} chars</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowTemplateForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                  <button onClick={() => createTemplate.mutate()} disabled={!tplName || !tplContent || createTemplate.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                    {createTemplate.isPending ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Array.isArray(templates) ? templates : []).map((tpl: any) => (
              <div key={tpl.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{tpl.name}</span>
                  </div>
                  <button onClick={() => deleteTemplate.mutate(tpl.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-2.5 leading-relaxed">{tpl.content}</p>
                <p className="text-xs text-muted-foreground">{tpl.content?.length ?? 0} chars</p>
              </div>
            ))}
            {(!Array.isArray(templates) || templates.length === 0) && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p>No templates yet. Create one to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Tab */}
      {tab === 'send' && (
        <div className="max-w-2xl space-y-6">
          <div className="flex gap-2">
            {(['single', 'bulk'] as const).map(m => (
              <button key={m} onClick={() => setSendMode(m)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${sendMode === m ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
                {m === 'single' ? 'Single SMS' : 'Bulk SMS'}
              </button>
            ))}
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            {sendMode === 'single' ? (
              <>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="+8801XXXXXXXXX" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Message</label>
                    {templates.length > 0 && (
                      <select onChange={e => { if (e.target.value) setMessage(e.target.value); e.target.value = ''; }}
                        className="text-xs border rounded px-2 py-1 bg-background">
                        <option value="">Use template...</option>
                        {(Array.isArray(templates) ? templates : []).map((t: any) => (
                          <option key={t.id} value={t.content}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    rows={4} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Type your message..." />
                  <p className="text-xs text-muted-foreground mt-1">{message.length} / 160 chars</p>
                </div>
                <button onClick={() => sendSingle.mutate()} disabled={!phone || !message || sendSingle.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {sendSingle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sendSingle.isPending ? 'Sending...' : 'Send SMS'}
                </button>
                {sendSingle.isSuccess && <p className="text-sm text-green-600 font-medium">SMS sent successfully!</p>}
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">Phone Numbers</label>
                  <p className="text-xs text-muted-foreground mb-1">One phone number per line</p>
                  <textarea value={bulkPhones} onChange={e => setBulkPhones(e.target.value)}
                    rows={6} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="+8801711111111&#10;+8801722222222&#10;+8801733333333" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bulkPhones.split('\n').filter(p => p.trim()).length} recipients
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Message</label>
                    {templates.length > 0 && (
                      <select onChange={e => { if (e.target.value) setBulkMessage(e.target.value); e.target.value = ''; }}
                        className="text-xs border rounded px-2 py-1 bg-background">
                        <option value="">Use template...</option>
                        {(Array.isArray(templates) ? templates : []).map((t: any) => (
                          <option key={t.id} value={t.content}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)}
                    rows={4} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Type your broadcast message..." />
                  <p className="text-xs text-muted-foreground mt-1">{bulkMessage.length} / 160 chars</p>
                </div>
                <button onClick={() => sendBulk.mutate()} disabled={!bulkPhones.trim() || !bulkMessage || sendBulk.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {sendBulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sendBulk.isPending ? 'Sending...' : `Send to ${bulkPhones.split('\n').filter(p => p.trim()).length} Recipients`}
                </button>
                {sendBulk.isSuccess && <p className="text-sm text-green-600 font-medium">Bulk SMS sent successfully!</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
