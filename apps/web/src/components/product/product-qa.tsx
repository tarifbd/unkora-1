'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Loader2, ShieldCheck } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

interface Answer {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}

interface Question {
  id: string;
  body: string;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
  guestName: string | null;
  answers: Answer[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function QASkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-lg border p-4">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-32 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
    </div>
  );
}

export function ProductQA({ productId }: { productId: string; lang?: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/questions/product/${productId}?page=1&limit=10`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (cancelled) return;
        if (json) { setQuestions(json.data ?? []); setMeta(json.meta ?? null); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const toggleAnswers = (id: string) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 10) { setError('Question must be at least 10 characters.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload: Record<string, string> = { body: body.trim() };
      if (guestName.trim()) payload.guestName = guestName.trim();
      const res = await fetch(`${API}/questions/product/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setBody('');
        setGuestName('');
        setShowForm(false);
        setToast('Your question was submitted! It will appear after review.');
        setTimeout(() => setToast(''), 5000);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 border-t pt-8">
      {toast && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-serif text-xl font-bold flex items-center gap-2">
          <HelpCircle className="h-5 w-5" /> Customer Questions &amp; Answers
          {meta && <span className="text-sm font-normal text-muted-foreground">({meta.total})</span>}
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? 'Cancel' : 'Ask a Question'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Ask a Question</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Your Question</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              minLength={10}
              placeholder="What would you like to know about this product?"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Your Name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit Question
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          <QASkeleton />
          <QASkeleton />
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map(q => {
            const asker = q.user ? `${q.user.firstName} ${q.user.lastName}` : (q.guestName ?? 'Anonymous');
            const expanded = expandedAnswers.has(q.id);
            return (
              <div key={q.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    Q
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">{q.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{asker} &middot; {formatDate(q.createdAt)}</p>
                  </div>
                </div>
                {q.answers.length > 0 && (
                  <div className="mt-3 ml-11">
                    <button
                      onClick={() => toggleAnswers(q.id)}
                      className="mb-2 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                    >
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {q.answers.length} answer{q.answers.length !== 1 ? 's' : ''}
                    </button>
                    {expanded && (
                      <div className="space-y-2">
                        {q.answers.map(a => {
                          const responder = a.user ? `${a.user.firstName} ${a.user.lastName}` : 'Store';
                          return (
                            <div key={a.id} className="rounded-lg border bg-muted/30 px-4 py-3">
                              <div className="flex items-center gap-2 mb-1">
                                {a.isAdmin && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                    <ShieldCheck className="h-3 w-3" /> Store
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">{responder} &middot; {formatDate(a.createdAt)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <HelpCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Be the first to ask a question about this product!</p>
        </div>
      )}
    </div>
  );
}
