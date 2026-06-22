'use client';

import { useState } from 'react';
import { Star, Edit2, Trash2, Plus, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const REVIEWS = [
  { id: 1, product: 'Python Programming — 2nd Edition', rating: 5, date: '৫ জুন, ২০২৬', text: 'অসাধারণ বই! প্রোগ্রামিং শেখার জন্য একদম পারফেক্ট। লেখক সহজ ভাষায় সব কিছু বুঝিয়েছেন।', helpful: 12, image: null },
  { id: 2, product: 'English Grammar in Use',           rating: 4, date: '২০ মে, ২০২৬', text: 'ভালো বই, তবে কিছু উদাহরণ আরো বিস্তারিত হলে ভালো হতো।', helpful: 7, image: null },
  { id: 3, product: 'বাংলাদেশের ইতিহাস (হার্ডকভার)',  rating: 5, date: '১০ মে, ২০২৬', text: 'তথ্যবহুল এবং সুলিখিত। বাংলাদেশের ইতিহাস জানার জন্য অবশ্যপাঠ্য।', helpful: 24, image: null },
];

function StarRow({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(n)}
          className={cn('transition-colors', onChange ? 'cursor-pointer' : 'cursor-default')}>
          <Star className={cn('w-4 h-4', (hover || value) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [showNew, setShowNew] = useState(false);
  const [newRating, setNewRating] = useState(0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">আমার রিভিউ</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার দেওয়া রেটিং ও রিভিউ</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5" /> রিভিউ লিখুন
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-black text-amber-500">4.7</p>
            <StarRow value={5} />
            <p className="text-xs text-gray-400 mt-1">গড় রেটিং</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = star === 5 ? 2 : star === 4 ? 1 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / 3) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-3">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {REVIEWS.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{r.product}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRow value={r.rating} />
                  <span className="text-[11px] text-gray-400">{r.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
            <div className="flex items-center gap-1.5 mt-3">
              <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400">{r.helpful} জন সহায়ক মনে করেছেন</p>
            </div>
          </div>
        ))}
      </div>

      {/* New review form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">নতুন রিভিউ লিখুন</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">পণ্য নির্বাচন করুন</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>অর্ডার #ORD-4488 থেকে নির্বাচন করুন</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">রেটিং দিন</label>
              <StarRow value={newRating} onChange={setNewRating} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">রিভিউ লিখুন</label>
              <textarea rows={4} placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..." className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              রিভিউ জমা দিন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
