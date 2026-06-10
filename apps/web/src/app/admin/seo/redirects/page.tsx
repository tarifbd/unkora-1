'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, ToggleLeft, ToggleRight, Search, ArrowRight } from 'lucide-react';
import { seoApi, type SeoRedirect, type SeoRedirectCode } from '@/lib/api/seo-advanced';

const CODE_LABELS: Record<SeoRedirectCode, string> = {
  R301: '301 Permanent',
  R302: '302 Temporary',
  R307: '307 Temporary',
  R308: '308 Permanent',
};

export default function SeoRedirectsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [form, setForm] = useState({ sourcePath: '', targetPath: '', statusCode: 'R301' as SeoRedirectCode, isActive: true });
  const [showForm, setShowForm] = useState(false);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['seo-redirects', page, isActive, search],
    queryFn: () => seoApi.listRedirects({ page, limit: LIMIT, isActive }),
  });

  const createMut = useMutation({
    mutationFn: () => seoApi.createRedirect(form),
    onSuccess: () => {
      toast.success('Redirect created');
      qc.invalidateQueries({ queryKey: ['seo-redirects'] });
      setForm({ sourcePath: '', targetPath: '', statusCode: 'R301', isActive: true });
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SeoRedirect> }) => seoApi.updateRedirect(id, data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['seo-redirects'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => seoApi.deleteRedirect(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['seo-redirects'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const seoPayload = (data as any)?.data ?? {};
  const redirects = seoPayload?.data ?? [];
  const total     = seoPayload?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">URL Redirects</h1>
          <p className="text-sm text-gray-500">{total} redirect{total !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> Add Redirect
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">New Redirect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From (Source Path)</label>
              <input
                type="text"
                value={form.sourcePath}
                onChange={e => setForm(p => ({ ...p, sourcePath: e.target.value }))}
                placeholder="/old-url"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To (Target Path)</label>
              <input
                type="text"
                value={form.targetPath}
                onChange={e => setForm(p => ({ ...p, targetPath: e.target.value }))}
                placeholder="/new-url"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={form.statusCode}
                onChange={e => setForm(p => ({ ...p, statusCode: e.target.value as SeoRedirectCode }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                {(Object.keys(CODE_LABELS) as SeoRedirectCode[]).map(c => (
                  <option key={c} value={c}>{CODE_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="redirectActive"
                checked={form.isActive}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded text-orange-500"
              />
              <label htmlFor="redirectActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !form.sourcePath || !form.targetPath}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search source paths..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={isActive === undefined ? '' : String(isActive)}
          onChange={e => { setIsActive(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(1); }}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 dark:text-white"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
        ) : redirects.length === 0 ? (
          <div className="py-16 text-center">
            <ArrowRight className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No redirects found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Source', 'Target', 'Type', 'Hits', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {redirects.map((r: SeoRedirect) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 max-w-48 truncate">{r.sourcePath}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 max-w-48 truncate">{r.targetPath}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {CODE_LABELS[r.statusCode]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.hitCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateMut.mutate({ id: r.id, data: { isActive: !r.isActive } })}>
                      {r.isActive
                        ? <ToggleRight className="h-5 w-5 text-green-500" />
                        : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => confirm('Delete this redirect?') && deleteMut.mutate(r.id)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${p === page ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
