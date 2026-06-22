'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, MessageSquare, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Trash2, ChevronDown, ChevronUp,
  Plus, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { questionsApi } from '@/lib/api/admin';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductAnswer {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

interface ProductQuestion {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  product: { name: string; slug: string } | null;
  user: { firstName: string; lastName: string; email: string } | null;
  guestName?: string | null;
  answers: ProductAnswer[];
}

interface QAResponse {
  data: ProductQuestion[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Colour helpers ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_TAB_ACTIVE: Record<string, string> = {
  ALL: 'bg-card shadow-sm text-foreground',
  PENDING: 'bg-card shadow-sm text-yellow-700',
  APPROVED: 'bg-card shadow-sm text-green-700',
  REJECTED: 'bg-card shadow-sm text-red-700',
};

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Add Answer Modal ──────────────────────────────────────────────────────────

function AddAnswerModal({ questionId, onClose }: { questionId: string; onClose: () => void }) {
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => questionsApi.addAnswer(questionId, body),
    onSuccess: () => {
      toast.success('Answer posted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-qa'] });
      onClose();
    },
    onError: () => toast.error('Failed to post answer'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) { toast.error('Answer body cannot be empty'); return; }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold">Add Admin Answer</h2>
        <p className="mb-4 text-sm text-muted-foreground">Your answer will be marked as an official admin response.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type your answer here..."
            rows={5}
            className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !body.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Answer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: ProductQuestion }) {
  const [expanded, setExpanded] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const queryClient = useQueryClient();

  const askerName = question.user
    ? `${question.user.firstName} ${question.user.lastName}`.trim()
    : (question.guestName ?? 'Anonymous');
  const askerEmail = question.user?.email;

  const approveMutation = useMutation({
    mutationFn: () => questionsApi.updateStatus(question.id, 'APPROVED'),
    onSuccess: () => {
      toast.success('Question approved');
      queryClient.invalidateQueries({ queryKey: ['admin-qa'] });
    },
    onError: () => toast.error('Failed to approve question'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => questionsApi.updateStatus(question.id, 'REJECTED'),
    onSuccess: () => {
      toast.success('Question rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-qa'] });
    },
    onError: () => toast.error('Failed to reject question'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => questionsApi.delete(question.id),
    onSuccess: () => {
      toast.success('Question deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-qa'] });
    },
    onError: () => toast.error('Failed to delete question'),
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Card header */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{question.body}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{askerName}</span>
                {askerEmail && <span>{askerEmail}</span>}
                <span>&bull;</span>
                {question.product && (
                  <>
                    <span className="font-medium text-blue-600 hover:underline cursor-default" title={question.product.slug}>
                      {question.product.name}
                    </span>
                    <span>&bull;</span>
                  </>
                )}
                <span>{fmtDate(question.createdAt)}</span>
              </div>
            </div>

            {/* Status + actions */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[question.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {question.status}
              </span>

              <div className="flex items-center gap-1">
                {/* Approve */}
                {question.status !== 'APPROVED' && (
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={isPending}
                    title="Approve"
                    className="rounded-md p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                  >
                    {approveMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4" />}
                  </button>
                )}

                {/* Reject */}
                {question.status !== 'REJECTED' && (
                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={isPending}
                    title="Reject"
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {rejectMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <XCircle className="h-4 w-4" />}
                  </button>
                )}

                {/* Add Answer */}
                <button
                  onClick={() => setShowAnswerModal(true)}
                  title="Add answer"
                  className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (confirm('Delete this question and all its answers?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  title="Delete"
                  className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                >
                  {deleteMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Answers toggle */}
          <button
            onClick={() => setExpanded(s => !s)}
            className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {question.answers.length === 0
              ? 'No answers yet'
              : `${question.answers.length} answer${question.answers.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Answers panel */}
        {expanded && (
          <div className="border-t bg-muted/20 px-4 sm:px-5 py-3 space-y-3">
            {question.answers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No answers yet. Be the first to answer.
              </p>
            ) : (
              question.answers.map(answer => {
                const authorName = answer.user
                  ? `${answer.user.firstName} ${answer.user.lastName}`.trim()
                  : 'Admin';
                return (
                  <div key={answer.id} className="rounded-lg bg-card border p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xs font-semibold">{authorName}</span>
                      {answer.isAdmin && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <ShieldCheck className="h-3 w-3" />Admin
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{fmtDate(answer.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{answer.body}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showAnswerModal && (
        <AddAnswerModal questionId={question.id} onClose={() => setShowAnswerModal(false)} />
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_TABS: FilterStatus[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function QAModerationPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterStatus>('ALL');

  const { data, isLoading } = useQuery<QAResponse>({
    queryKey: ['admin-qa', page, filter],
    queryFn: () =>
      questionsApi.adminGetAll({
        page,
        limit: 20,
        ...(filter !== 'ALL' && { status: filter }),
      }),
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;

  // Derive count badges from the current page data (best effort — server doesn't send counts per status)
  const pendingCount = questions.filter(q => q.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl font-bold">Q&amp;A Moderation</h1>
        <p className="text-sm text-muted-foreground">Review, approve, reject and answer product questions from customers</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit overflow-x-auto">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); setPage(1); }}
            className={`relative rounded-md px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filter === tab
                ? STATUS_TAB_ACTIVE[tab]
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {tab === 'PENDING' && pendingCount > 0 && filter !== 'PENDING' && (
              <span className="ml-1.5 rounded-full bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No questions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} &mdash; {meta.total} questions
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))}
              disabled={page >= meta.totalPages}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
