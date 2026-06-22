'use client';

import { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const REVIEWS = [
  { id: 1, buyer: 'রাফিউল ইসলাম',  product: 'Python Programming',    rating: 5, date: '১০ জুন', text: 'অসাধারণ বই! অনেক কিছু শিখলাম।', replied: false },
  { id: 2, buyer: 'নাসরিন আক্তার', product: 'English Grammar in Use', rating: 4, date: '৫ জুন',  text: 'ভালো বই, দ্রুত ডেলিভারির জন্য ধন্যবাদ।', replied: true },
  { id: 3, buyer: 'করিম হোসেন',    product: 'বাংলাদেশের ইতিহাস',    rating: 3, date: '১ জুন',  text: 'বইটি ঠিকাছে কিন্তু পেজ কিছুটা ক্ষতিগ্রস্ত ছিল।', replied: false },
  { id: 4, buyer: 'সাব্বির আহমেদ', product: 'Data Structures',        rating: 5, date: '২৮ মে', text: 'পার্ফেক্ট কন্ডিশনে পেয়েছি। সেরা সেলার।', replied: true },
  { id: 5, buyer: 'ফাতিমা খানম',   product: 'রবীন্দ্র রচনাবলী',      rating: 2, date: '২০ মে', text: 'প্যাকেজিং খুব খারাপ ছিল।', replied: false },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn('w-3.5 h-3.5', n <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;
  const filtered = REVIEWS.filter(r => filterRating === 'all' || r.rating === filterRating);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">কাস্টমার রিভিউ</h1>
        <p className="text-sm text-gray-500 mt-0.5">গ্রাহকদের মতামত পর্যালোচনা ও উত্তর দিন</p>
      </div>

      {/* Rating overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-black text-amber-500">{avg.toFixed(1)}</p>
            <Stars value={Math.round(avg)} />
            <p className="text-xs text-gray-400 mt-1">{REVIEWS.length}টি রিভিউ</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = REVIEWS.filter(r => r.rating === star).length;
              return (
                <button key={star} onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
                  className={cn('w-full flex items-center gap-2 group', filterRating === star && 'opacity-80')}>
                  <span className="text-xs text-gray-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all group-hover:bg-amber-500"
                      style={{ width: `${(count / REVIEWS.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          <button onClick={() => setFilterRating('all')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              filterRating === 'all' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600')}>
            সব
          </button>
          <button onClick={() => setFilterRating(replyingTo === -1 ? 'all' : undefined as never)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:border-primary/30 transition-all">
            উত্তর বাকি ({REVIEWS.filter(r => !r.replied).length})
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.buyer[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.buyer}</p>
                  <p className="text-[11px] text-gray-400">{r.product} · {r.date}</p>
                </div>
              </div>
              <Stars value={r.rating} />
            </div>
            <p className="text-sm text-gray-600 ml-12 mb-3">{r.text}</p>

            {r.replied ? (
              <div className="ml-12 bg-primary/5 rounded-xl p-3 border border-primary/10">
                <p className="text-[11px] font-bold text-primary mb-1">আপনার উত্তর</p>
                <p className="text-xs text-gray-600">ধন্যবাদ আপনার রিভিউর জন্য! 🙏</p>
              </div>
            ) : (
              <div className="ml-12">
                {replyingTo === r.id ? (
                  <div className="space-y-2">
                    <textarea rows={2} placeholder="উত্তর লিখুন..." autoFocus
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
                        পাঠান
                      </button>
                      <button onClick={() => setReplyingTo(null)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyingTo(r.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                    <MessageSquare className="w-3.5 h-3.5" /> উত্তর দিন
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
