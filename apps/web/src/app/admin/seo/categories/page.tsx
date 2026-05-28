'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Tag, Loader2, AlertCircle, Edit2, Save, X, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, BarChart3,
} from 'lucide-react';
import { seoApi } from '@/lib/api/seo-advanced';

interface CategorySeoRow {
  id: string; name: string; slug: string;
  seoTitle: string | null; metaDescription: string | null;
  focusKeyword: string | null; seoScore: number | null;
}

const inputCls = 'w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring';

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>;
  const cls = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{score}</span>;
}

export default function CategorySeoPage() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState({ seoTitle: '', metaDescription: '', focusKeyword: '' });
  const [saving, setSaving] = useState(false);
  const LIMIT = 20;
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['seo-categories', page],
    queryFn: () => seoApi.getCategoriesSeo({ page, limit: LIMIT }),
    retry: 1,
  });

  const auditMutation = useMutation({
    mutationFn: (id: string) => seoApi.auditCategory(id),
    onSuccess: () => { toast.success('Audit complete!'); void qc.invalidateQueries({ queryKey: ['seo-categories'] }); },
    onError: () => toast.error('Audit failed'),
  });

  const raw = data as { data?: CategorySeoRow[]; meta?: { totalPages?: number } } | undefined;
  const categories: CategorySeoRow[] = raw?.data ?? (Array.isArray(data) ? data as CategorySeoRow[] : []);
  const totalPages = raw?.meta?.totalPages ?? 1;

  const startEdit = (c: CategorySeoRow) => {
    setEditingId(c.id);
    setEditRow({ seoTitle: c.seoTitle ?? '', metaDescription: c.metaDescription ?? '', focusKeyword: c.focusKeyword ?? '' });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await seoApi.updateCategorySeo(id, editRow);
      toast.success('Category SEO saved!');
      void qc.invalidateQueries({ queryKey: ['seo-categories'] });
      setEditingId(null);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
          <Tag className="h-5 w-5 text-cyan-600" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Category SEO</h1>
          <p className="text-sm text-muted-foreground">Manage SEO metadata for category pages</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">Failed to load category SEO data</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Tag className="h-12 w-12 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-500">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider md:table-cell">Slug</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO Title</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Meta Desc</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    {editingId === c.id ? (
                      <td colSpan={6} className="px-4 py-3">
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{c.name}</p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">SEO Title</label>
                              <input type="text" value={editRow.seoTitle} onChange={e => setEditRow(r => ({ ...r, seoTitle: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">Meta Description</label>
                              <input type="text" value={editRow.metaDescription} onChange={e => setEditRow(r => ({ ...r, metaDescription: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">Focus Keyword</label>
                              <input type="text" value={editRow.focusKeyword} onChange={e => setEditRow(r => ({ ...r, focusKeyword: e.target.value }))} className={inputCls} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(c.id)} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                              <X className="h-3 w-3" /> Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{c.name}</p>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <span className="text-xs font-mono text-gray-500">{c.slug ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.seoTitle ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-400" />}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.metaDescription ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-400" />}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ScoreBadge score={c.seoScore} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={() => startEdit(c)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <Edit2 className="h-3 w-3" /> Edit SEO
                            </button>
                            <button onClick={() => auditMutation.mutate(c.id)} disabled={auditMutation.isPending} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                              <BarChart3 className="h-3 w-3" /> Audit
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
