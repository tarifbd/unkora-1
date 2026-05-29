'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api/ai';

interface Review {
  rating: number;
  comment: string;
}

interface Props {
  reviews: Review[];
}

export function AiReviewSummary({ reviews }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (tried || reviews.length < 3) return;

    setTried(true);
    setLoading(true);

    aiApi
      .summarizeReviews(reviews.slice(0, 20))
      .then(({ summary: s }) => {
        if (s) setSummary(s);
      })
      .catch(() => {
        // silently ignore — non-blocking
      })
      .finally(() => setLoading(false));
  }, [reviews, tried]);

  if (!loading && !summary) return null;

  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-900/30 p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">AI রিভিউ সারসংক্ষেপ</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>সারসংক্ষেপ তৈরি হচ্ছে...</span>
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
      )}

      <p className="mt-2 text-[10px] text-orange-500/60 dark:text-orange-400/40">AI দ্বারা তৈরি সারসংক্ষেপ</p>
    </div>
  );
}
