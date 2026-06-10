'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiApi, type AiFeatureType } from '@/lib/api/ai-studio';

const FEATURE_COLORS: Record<string, string> = {
  PRODUCT_CONTENT: 'bg-purple-100 text-purple-700',
  PRODUCT_SEO: 'bg-blue-100 text-blue-700',
  CATEGORY_SEO: 'bg-cyan-100 text-cyan-700',
  LANDING_PAGE: 'bg-green-100 text-green-700',
  BLOG_ARTICLE: 'bg-yellow-100 text-yellow-700',
  AD_COPY: 'bg-orange-100 text-orange-700',
  EMAIL_COPY: 'bg-indigo-100 text-indigo-700',
  FAQ: 'bg-teal-100 text-teal-700',
  IMAGE_ALT_TEXT: 'bg-pink-100 text-pink-700',
  META_DESCRIPTION: 'bg-rose-100 text-rose-700',
  SCHEMA_MARKUP: 'bg-gray-100 text-gray-700',
  AGENT_TASK: 'bg-red-100 text-red-700',
  CUSTOM_PROMPT: 'bg-violet-100 text-violet-700',
};

const FEATURE_TYPES: AiFeatureType[] = [
  'PRODUCT_CONTENT', 'PRODUCT_SEO', 'CATEGORY_SEO', 'LANDING_PAGE',
  'BLOG_ARTICLE', 'AD_COPY', 'EMAIL_COPY', 'FAQ', 'IMAGE_ALT_TEXT',
  'META_DESCRIPTION', 'SCHEMA_MARKUP', 'AGENT_TASK', 'CUSTOM_PROMPT',
];

export default function AiLogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [featureFilter, setFeatureFilter] = useState('');
  const LIMIT = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-logs', page, statusFilter, featureFilter],
    queryFn: () => aiApi.getLogs({
      page,
      limit: LIMIT,
      status: statusFilter || undefined,
      featureType: featureFilter || undefined,
    }),
    retry: 1,
  });

  const logs = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Activity className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">AI Generation Logs</h1>
          <p className="text-sm text-muted-foreground">Full history of AI generation requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <select
          value={featureFilter}
          onChange={e => { setFeatureFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Feature Types</option>
          {FEATURE_TYPES.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
        </select>
        {total > 0 && (
          <span className="text-sm text-muted-foreground self-center">{total} total entries</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">Failed to load logs</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="h-12 w-12 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-500">No generation logs found</p>
            <p className="text-xs text-gray-400">Logs will appear here after AI generations are triggered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Feature Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens In</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens Out</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${FEATURE_COLORS[log.featureType] ?? 'bg-gray-100 text-gray-700'}`}>
                        {log.featureType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium capitalize text-gray-700 dark:text-gray-300">{log.provider}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.model ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">{log.tokenInput?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">{log.tokenOutput?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {log.estimatedCost != null ? `$${log.estimatedCost.toFixed(4)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
