'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import Link from 'next/link';
import { BookOpen, Plus, ExternalLink, Loader2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:      { label: 'অপেক্ষমাণ',    cls: 'bg-yellow-100 text-yellow-700' },
  UNDER_REVIEW: { label: 'পর্যালোচনায়', cls: 'bg-blue-100 text-blue-700' },
  APPROVED:     { label: 'অনুমোদিত',     cls: 'bg-green-100 text-green-700' },
  REJECTED:     { label: 'প্রত্যাখ্যাত', cls: 'bg-red-100 text-red-700' },
  PUBLISHED:    { label: 'প্রকাশিত',     cls: 'bg-emerald-100 text-emerald-700' },
};

export default function SellerProductsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'submissions', page],
    queryFn: () => sellerApi.mySubmissions(page),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">আমার বই</h1>
          <p className="text-sm text-gray-500">My Submitted Books</p>
        </div>
        <Link href="/publish/submit"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> নতুন বই জমা দিন
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold mb-1">এখনো কোনো বই জমা দেওয়া হয়নি</p>
          <p className="text-sm text-gray-400 mb-6">আপনার প্রথম বই জমা দিয়ে বিক্রি শুরু করুন।</p>
          <Link href="/publish/submit"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> বই জমা দিন
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">বই</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">লেখক</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">মূল্য</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">রয়্যালটি</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">স্ট্যাটাস</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">তারিখ</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {sub.product?.images?.[0]?.url ? (
                              <img src={sub.product.images[0].url} alt={sub.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">{sub.title}</p>
                            {sub.product?.slug && (
                              <p className="text-xs text-gray-400">/{sub.product.slug}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{sub.authorName}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">৳{sub.suggestedPrice}</td>
                      <td className="px-4 py-4">
                        <span className="text-green-700 font-bold">
                          ৳{(parseFloat(sub.suggestedPrice) * sub.royaltyPercent / 100).toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">({sub.royaltyPercent}%)</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill status={sub.status} adminNote={sub.adminNote} />
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs">
                        {new Date(sub.createdAt).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-4 py-4">
                        {sub.product?.slug && (
                          <Link href={`/products/${sub.product.slug}`} target="_blank"
                            className="text-primary hover:text-primary/70 transition-colors"
                            title="পণ্য পেজ দেখুন"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                    p === page ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusPill({ status, adminNote }: { status: string; adminNote?: string | null }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
      {adminNote && status === 'REJECTED' && (
        <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate" title={adminNote}>{adminNote}</p>
      )}
    </div>
  );
}
