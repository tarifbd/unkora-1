'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw, Loader2, Globe, Package, Tag, Settings, Download } from 'lucide-react';
import { seoApi } from '@/lib/api/seo-advanced';

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

const FREQ_OPTIONS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export default function SeoSitemapPage() {
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ priority: 0.5, changeFrequency: 'weekly', includeInSitemap: true });

  const { data, isLoading } = useQuery({
    queryKey: ['seo-sitemap'],
    queryFn: () => seoApi.getSitemap(),
  });

  const regenerateMut = useMutation({
    mutationFn: () => seoApi.regenerateSitemap(),
    onSuccess: (result: any) => {
      toast.success(`Sitemap regenerated: ${result?.totalEntries ?? 0} entries`);
      qc.invalidateQueries({ queryKey: ['seo-sitemap'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEntryMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => seoApi.updateSitemapEntry(id, data),
    onSuccess: () => {
      toast.success('Entry updated');
      qc.invalidateQueries({ queryKey: ['seo-sitemap'] });
      setEditId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats   = (data as any)?.stats ?? {};
  const entries = (data as any)?.entries ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">XML Sitemap</h1>
            <p className="text-sm text-gray-500">Manage your site's search engine sitemap</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/v1/seo/sitemap/xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" /> View XML
          </a>
          <button
            onClick={() => regenerateMut.mutate()}
            disabled={regenerateMut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {regenerateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Regenerate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Globe}   label="Total Entries"    value={stats.totalEntries ?? 0}    color="bg-blue-500" />
        <StatCard icon={Settings} label="Included"         value={stats.includedEntries ?? 0} color="bg-green-500" />
        <StatCard icon={Package} label="Products"          value={stats.products ?? 0}        color="bg-orange-500" />
        <StatCard icon={Tag}     label="Categories"        value={stats.categories ?? 0}      color="bg-purple-500" />
      </div>

      {/* Entries table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sitemap Entries ({entries.length})</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <Globe className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No sitemap entries yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Regenerate" to populate from your products and categories.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                <tr>
                  {['URL', 'Type', 'Priority', 'Frequency', 'Include', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {entries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 max-w-64 truncate">{entry.url}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {entry.entityType ?? 'CUSTOM'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {editId === entry.id ? (
                        <input
                          type="number" step="0.1" min="0" max="1"
                          value={editForm.priority}
                          onChange={e => setEditForm(p => ({ ...p, priority: parseFloat(e.target.value) }))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      ) : entry.priority.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {editId === entry.id ? (
                        <select
                          value={editForm.changeFrequency}
                          onChange={e => setEditForm(p => ({ ...p, changeFrequency: e.target.value }))}
                          className="px-2 py-1 border border-gray-200 rounded text-xs"
                        >
                          {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      ) : entry.changeFrequency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entry.includeInSitemap ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {entry.includeInSitemap ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editId === entry.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateEntryMut.mutate({ id: entry.id, data: editForm })}
                            className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                          >Save</button>
                          <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditId(entry.id); setEditForm({ priority: entry.priority, changeFrequency: entry.changeFrequency, includeInSitemap: entry.includeInSitemap }); }}
                          className="text-xs text-blue-500 hover:underline"
                        >Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
