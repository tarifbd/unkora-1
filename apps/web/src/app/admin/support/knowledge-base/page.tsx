'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen, AlertTriangle, Loader2, Search } from 'lucide-react';
import api from '@/lib/api';

interface RagDocument {
  id: string;
  title: string;
  category: string;
  status: 'PENDING' | 'INDEXED' | 'FAILED';
  isActive: boolean;
  createdAt: string;
  _count: { chunks: number };
}

interface Stats {
  total: number;
  byStatus: { pending: number; indexed: number; failed: number };
  byCategory: Record<string, number>;
}

const CATEGORIES = ['FAQ', 'POLICY', 'PRODUCT', 'SHIPPING', 'RETURNS', 'GENERAL'];

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  INDEXED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function KnowledgeBasePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'GENERAL', source: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats } = useQuery<Stats | undefined>({
    queryKey: ['rag-stats'],
    queryFn: () => api.get('/rag/admin/documents/stats').then(r => r.data.data as Stats),
  });

  const { data: docsData, isLoading } = useQuery({
    queryKey: ['rag-documents', categoryFilter, statusFilter],
    queryFn: () =>
      api.get('/rag/admin/documents', {
        params: {
          ...(categoryFilter && { category: categoryFilter }),
          ...(statusFilter && { status: statusFilter }),
          limit: 100,
        },
      }).then(r => r.data.data),
  });
  const documents: RagDocument[] = Array.isArray(docsData) ? docsData : docsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (dto: typeof form) => api.post('/rag/admin/documents', dto),
    onSuccess: () => {
      toast.success('Document created and indexed');
      qc.invalidateQueries({ queryKey: ['rag-documents'] });
      qc.invalidateQueries({ queryKey: ['rag-stats'] });
      setForm({ title: '', content: '', category: 'GENERAL', source: '' });
      setShowForm(false);
    },
    onError: () => toast.error('Failed to create document'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rag/admin/documents/${id}`),
    onSuccess: () => {
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['rag-documents'] });
      qc.invalidateQueries({ queryKey: ['rag-stats'] });
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    createMutation.mutate(form);
  };

  const inputCls = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-100 p-2.5">
          <BookOpen className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">AI Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Manage documents for RAG-powered customer support</p>
        </div>
      </div>

      {/* Disabled Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">AI-Powered Responses Disabled — Coming Soon</p>
          <p className="text-amber-800 mt-0.5">
            The AI assistant is not yet active in customer support. However, you can pre-load your
            knowledge base now so it is ready when the feature launches.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, cls: 'text-foreground' },
            { label: 'Indexed', value: stats.byStatus.indexed, cls: 'text-green-600' },
            { label: 'Pending', value: stats.byStatus.pending, cls: 'text-yellow-600' },
            { label: 'Failed', value: stats.byStatus.failed, cls: 'text-red-600' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-2xl border bg-card p-4 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {['PENDING', 'INDEXED', 'FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </button>
      </div>

      {/* Inline Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">New Knowledge Base Document</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Return Policy"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Source (optional)</label>
            <input
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="e.g. https://example.com/returns"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Content</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={6}
              placeholder="Paste or type the full content of this document..."
              className={inputCls + ' resize-y'}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {createMutation.isPending ? 'Creating...' : 'Create & Index'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border px-5 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Documents Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add your first knowledge base document above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chunks</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[doc.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc._count.chunks}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Delete this document? This cannot be undone.')) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
