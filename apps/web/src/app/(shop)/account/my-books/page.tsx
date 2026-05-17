'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, Plus, Clock, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type SubmissionStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

interface Submission {
  id: string;
  title: string;
  authorName: string;
  genres: string[];
  suggestedPrice: number;
  royaltyPercent: number;
  status: SubmissionStatus;
  adminNote?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; labelBn: string; color: string; icon: typeof Clock }> = {
  PENDING:      { label: 'Pending',      labelBn: 'অপেক্ষায়',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', labelBn: 'রিভিউ হচ্ছে', color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: Eye },
  APPROVED:     { label: 'Approved',     labelBn: 'অনুমোদিত',    color: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle },
  REJECTED:     { label: 'Rejected',     labelBn: 'প্রত্যাখ্যাত', color: 'bg-red-100 text-red-700 border-red-200',       icon: XCircle },
  PUBLISHED:    { label: 'Published',    labelBn: 'প্রকাশিত',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
};

export default function MyBooksPage() {
  const { isAuthenticated } = useAuthStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get<{ data: Submission[] }>('/book-submissions/my')
      .then(res => setSubmissions(res.data.data ?? []))
      .catch(() => setError('তথ্য লোড করতে সমস্যা হয়েছে।'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-3">সাইন ইন করুন</h2>
          <Link href="/login" className="bg-primary text-white font-bold py-3 px-8 rounded-xl inline-block hover:bg-primary/90">সাইন ইন</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">আমার বইসমূহ</h1>
            <p className="text-gray-500 text-sm mt-1">My Book Submissions</p>
          </div>
          <Link
            href="/publish/submit"
            className="flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> নতুন বই জমা দিন
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">কোনো বই জমা নেই</h3>
            <p className="text-gray-500 mb-6 text-sm">আপনার কোনো বই জমা দেওয়া হয়নি।<br />এখনই আপনার বই জমা দিন!</p>
            <Link href="/publish/submit" className="bg-primary text-white font-bold py-3 px-8 rounded-xl inline-flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> বই জমা দিন
            </Link>
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map(sub => {
              const cfg = STATUS_CONFIG[sub.status];
              const StatusIcon = cfg.icon;
              const royalty = (sub.suggestedPrice * (sub.royaltyPercent / 100)).toFixed(0);
              return (
                <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-lg leading-tight">{sub.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">লেখক: {sub.authorName}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sub.genres.slice(0, 3).map(g => (
                              <span key={g} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{g}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold flex-shrink-0 ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {cfg.labelBn}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">মূল্য</p>
                        <p className="font-bold text-gray-900">৳{sub.suggestedPrice}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">রয়্যালটি ({sub.royaltyPercent}%)</p>
                        <p className="font-bold text-green-600">৳{royalty}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">জমার তারিখ</p>
                        <p className="font-medium text-gray-700">{new Date(sub.createdAt).toLocaleDateString('bn-BD')}</p>
                      </div>
                    </div>
                  </div>

                  {sub.adminNote && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
                      <span className="font-bold text-amber-700">টিম মন্তব্য: </span>
                      <span className="text-amber-700">{sub.adminNote}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
