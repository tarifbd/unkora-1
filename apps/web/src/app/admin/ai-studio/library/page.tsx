'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen, Loader2, AlertCircle, Copy, Check, CheckCircle2,
  Archive, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import { aiApi, type AiFeatureType, type AiContentStatus } from '@/lib/api/ai-studio';

const STATUS_STYLES: Record<AiContentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  APPLIED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ARCHIVED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const FEATURE_TYPES: AiFeatureType[] = [
  'PRODUCT_CONTENT', 'PRODUCT_SEO', 'CATEGORY_SEO', 'LANDING_PAGE',
  'BLOG_ARTICLE', 'AD_COPY', 'EMAIL_COPY', 'FAQ', 'IMAGE_ALT_TEXT',
  'META_DESCRIPTION', 'SCHEMA_MARKUP', 'AGENT_TASK', 'CUSTOM_PROMPT',
];

const STATUSES: AiContentStatus[] = ['DRAFT', 'APPROVED', 'APPLIED', 'ARCHIVED'];

function ContentCard({ item, onAction }: {
  item: { id: string; featureType: AiFeatureType; title: string; contentText: string; status: AiContentStatus; createdAt: string };
  onAction: (id: string, action: 'approve' | 'apply' | 'archive') => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.contentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {item.featureType.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status]}`}>
              {item.status}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">{item.contentText}</p>

      <div className="flex flex-wrap gap-2">
        {item.status === 'DRAFT' && (
          <button
            onClick={() => onAction(item.id, 'approve')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </button>
        )}
        {(item.status === 'DRAFT' || item.status === 'APPROVED') && (
          <button
            onClick={() => onAction(item.id, 'apply')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Apply
          </button>
        )}
        {item.status !== 'ARCHIVED' && (
          <button
            onClick={() => onAction(item.id, 'archive')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
        )}
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default function AiLibraryPage() {
  const [page, setPage] = useState(1);
  const [featureFilter, setFeatureFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 12;
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-library', page, featureFilter, statusFilter],
    queryFn: () => aiApi.listContents({
      page,
      limit: LIMIT,
      featureType: featureFilter || undefined,
      status: statusFilter || undefined,
    }),
    retry: 1,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'apply' | 'archive' }) => {
      if (action === 'approve') return aiApi.approveContent(id);
      if (action === 'apply') return aiApi.applyContent(id);
      return aiApi.archiveContent(id);
    },
    onSuccess: (_, vars) => {
      toast.success(`Content ${vars.action}d successfully`);
      void qc.invalidateQueries({ queryKey: ['ai-library'] });
    },
    onError: () => toast.error('Action failed'),
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Content Library</h1>
          <p className="text-sm text-muted-foreground">All AI-generated content saved for review and use</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={featureFilter}
          onChange={e => { setFeatureFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Types</option>
          {FEATURE_TYPES.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {total > 0 && <span className="text-sm text-muted-foreground self-center">{total} items</span>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-500">Failed to load content library</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileText className="h-12 w-12 text-gray-200 dark:text-gray-700" />
          <p className="text-sm text-gray-500">No content saved yet</p>
          <p className="text-xs text-gray-400">Generated content with "Save as Draft" will appear here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onAction={(id, action) => actionMutation.mutate({ id, action })}
            />
          ))}
        </div>
      )}

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
