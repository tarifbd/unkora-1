'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Package, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight,
  Edit2, Zap, BarChart3, RefreshCw,
} from 'lucide-react';
import { seoApi } from '@/lib/api/seo-advanced';

interface ProductSeoRow {
  id: string; name: string; slug: string; focusKeyword: string | null;
  seoScore: number | null; robotsIndex: boolean;
  imageUrl?: string;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>;
  const cls = score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{score}</span>;
}

export default function ProductSeoListPage() {
  const [page, setPage] = useState(1);
  const [missingMeta, setMissingMeta] = useState(false);
  const [search, setSearch] = useState('');
  const LIMIT = 20;
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['seo-products', page, missingMeta],
    queryFn: () => seoApi.getProductsSeo({ page, limit: LIMIT, missingMeta }),
    retry: 1,
  });

  const auditAllMutation = useMutation({
    mutationFn: async () => {
      const items: ProductSeoRow[] = data?.data ?? [];
      for (const item of items.slice(0, 5)) {
        await seoApi.auditProduct(item.id).catch(() => null);
      }
    },
    onSuccess: () => { toast.success('Audits queued for visible products'); void qc.invalidateQueries({ queryKey: ['seo-products'] }); },
    onError: () => toast.error('Audit failed'),
  });

  const auditSingleMutation = useMutation({
    mutationFn: (id: string) => seoApi.auditProduct(id),
    onSuccess: () => { toast.success('Audit complete'); void qc.invalidateQueries({ queryKey: ['seo-products'] }); },
    onError: () => toast.error('Audit failed'),
  });

  const aiGenerateMutation = useMutation({
    mutationFn: (id: string) => seoApi.generateAiProductSeo(id),
    onSuccess: () => { toast.success('AI SEO generated!'); void qc.invalidateQueries({ queryKey: ['seo-products'] }); },
    onError: () => toast.error('AI generation failed'),
  });

  const raw = data as { data?: ProductSeoRow[]; meta?: { totalPages?: number; total?: number } } | undefined;
  const products: ProductSeoRow[] = raw?.data ?? [];
  const totalPages = raw?.meta?.totalPages ?? 1;
  const total = raw?.meta?.total ?? 0;

  const filtered = search
    ? products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.slug?.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold">Product SEO</h1>
            <p className="text-sm text-muted-foreground">{total} products total</p>
          </div>
        </div>
        <button
          onClick={() => auditAllMutation.mutate()}
          disabled={auditAllMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {auditAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Run All Audits
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={missingMeta} onChange={e => { setMissingMeta(e.target.checked); setPage(1); }} className="h-4 w-4 rounded border" />
          Missing meta only
        </label>
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
            <p className="text-sm text-red-500">Failed to load product SEO data</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="h-12 w-12 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider md:table-cell">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Focus Keyword</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SEO Score</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Indexable</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm max-w-[200px] truncate">{p.name}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs font-mono text-gray-500 max-w-[160px] truncate block">{p.slug ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{p.focusKeyword ?? <span className="text-gray-300">not set</span>}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ScoreBadge score={p.seoScore} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${p.robotsIndex ? 'text-green-600' : 'text-red-500'}`}>
                        {p.robotsIndex ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/admin/seo/products/${p.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Edit SEO
                        </Link>
                        <button
                          onClick={() => auditSingleMutation.mutate(p.id)}
                          disabled={auditSingleMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          <BarChart3 className="h-3 w-3" /> Audit
                        </button>
                        <button
                          onClick={() => aiGenerateMutation.mutate(p.id)}
                          disabled={aiGenerateMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 disabled:opacity-50 transition-colors"
                        >
                          <Zap className="h-3 w-3" /> AI
                        </button>
                      </div>
                    </td>
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
