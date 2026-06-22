'use client';

import { Eye, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';

const PRODUCTS = [
  { id: 1, title: 'Python Programming — 2nd Edition',        author: 'Mark Lutz',            price: 1250, mrp: 1500, cat: 'Technology', time: '২ ঘণ্টা আগে',   img: null },
  { id: 2, title: 'বাংলাদেশের মুক্তিযুদ্ধের ইতিহাস',        author: 'মুনতাসির মামুন',       price: 890,  mrp: 990,  cat: 'History',    time: '৫ ঘণ্টা আগে',   img: null },
  { id: 3, title: 'English Grammar in Use — 5th Ed.',        author: 'Raymond Murphy',       price: 650,  mrp: 800,  cat: 'Education',  time: 'গতকাল',          img: null },
  { id: 4, title: 'আমার ছেলেবেলা',                           author: 'মুহম্মদ জাফর ইকবাল', price: 350,  mrp: 400,  cat: 'Literature', time: 'গতকাল',          img: null },
  { id: 5, title: 'Data Structures & Algorithms',            author: 'Thomas H. Cormen',     price: 2100, mrp: 2500, cat: 'Technology', time: '২ দিন আগে',      img: null },
  { id: 6, title: 'রবীন্দ্র রচনাবলী (সংকলন)',               author: 'রবীন্দ্রনাথ ঠাকুর',  price: 1800, mrp: 2000, cat: 'Literature', time: '৩ দিন আগে',      img: null },
];

const CAT_COLORS: Record<string, string> = {
  Technology: 'bg-blue-50 text-blue-600',
  History:    'bg-amber-50 text-amber-600',
  Education:  'bg-green-50 text-green-600',
  Literature: 'bg-purple-50 text-purple-600',
};

export default function RecentlyViewedPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">সাম্প্রতিক দেখা</h1>
          <p className="text-sm text-gray-500 mt-0.5">{PRODUCTS.length}টি পণ্য দেখেছেন</p>
        </div>
        <button className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1.5 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> সব মুছুন
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRODUCTS.map(p => {
          const discount = Math.round((1 - p.price / p.mrp) * 100);
          const catColor = CAT_COLORS[p.cat] ?? 'bg-gray-50 text-gray-600';
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group">
              {/* Cover placeholder */}
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center">
                <Eye className="w-10 h-10 text-gray-300" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-primary hover:text-white transition-colors">
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {discount > 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                    -{discount}%
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColor}`}>{p.cat}</span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {p.title}
                </p>
                <p className="text-xs text-gray-400 mb-2">{p.author}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-primary">৳{p.price.toLocaleString()}</span>
                    {p.mrp > p.price && <span className="text-xs text-gray-400 line-through ml-1">৳{p.mrp}</span>}
                  </div>
                  <p className="text-[10px] text-gray-400">{p.time}</p>
                </div>
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 bg-primary/10 text-primary py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all">
                  <ShoppingBag className="w-3.5 h-3.5" /> কার্টে যোগ করুন
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          আরও কেনাকাটা করুন
        </Link>
      </div>
    </div>
  );
}
