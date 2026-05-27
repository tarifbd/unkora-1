'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sellerApi } from '@/lib/api/seller';
import { Store, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  shopName: string;
  shopSlug: string;
  description: string;
  phone: string;
  address: string;
  nidNumber: string;
  bankName: string;
  bankAccount: string;
}

const EMPTY: FormData = {
  shopName: '', shopSlug: '', description: '',
  phone: '', address: '', nidNumber: '',
  bankName: '', bankAccount: '',
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function SellerApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: keyof FormData, v: string) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-generate slug from shop name
      if (k === 'shopName') next.shopSlug = slugify(v);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName || !form.shopSlug || !form.phone) {
      setError('দোকানের নাম, স্লাগ এবং ফোন নম্বর আবশ্যক।');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sellerApi.apply({
        shopName: form.shopName,
        shopSlug: form.shopSlug,
        description: form.description || undefined,
        phone: form.phone,
        address: form.address || undefined,
        nidNumber: form.nidNumber || undefined,
        bankName: form.bankName || undefined,
        bankAccount: form.bankAccount || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'আবেদন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">আবেদন সফল!</h2>
        <p className="text-gray-600 mb-2">আপনার সেলার আবেদন সফলভাবে জমা হয়েছে।</p>
        <p className="text-sm text-gray-400 mb-8">আমাদের টিম ৩-৫ কার্যদিবসের মধ্যে রিভিউ করে আপনাকে ইমেইলে জানাবে।</p>
        <button
          onClick={() => router.push('/seller/dashboard')}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors"
        >
          ড্যাশবোর্ডে যান <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white';
  const labelCls = 'block text-sm font-bold text-gray-700 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">সেলার আবেদন</h1>
              <p className="text-gray-400 text-sm">Seller Registration</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm">
            UNKORA-তে বই বিক্রি শুরু করতে আপনার দোকানের তথ্য পূরণ করুন।
            অনুমোদনের পর আপনি আপনার বই লিস্ট করতে পারবেন।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Shop Info */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">দোকানের তথ্য</h3>

            <div>
              <label className={labelCls}>দোকানের নাম <span className="text-red-500">*</span></label>
              <input
                className={inputCls}
                placeholder="যেমন: রাহেলার বইঘর"
                value={form.shopName}
                onChange={e => set('shopName', e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls}>দোকানের URL (স্লাগ) <span className="text-red-500">*</span></label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                <span className="px-3 py-3 bg-gray-100 text-gray-500 text-sm border-r border-gray-200 flex-shrink-0">unkora.com/shop/</span>
                <input
                  className="flex-1 px-3 py-3 text-sm bg-white focus:outline-none"
                  placeholder="rahelas-bookstore"
                  value={form.shopSlug}
                  onChange={e => set('shopSlug', slugify(e.target.value))}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।</p>
            </div>

            <div>
              <label className={labelCls}>বিবরণ (ঐচ্ছিক)</label>
              <textarea
                className={`${inputCls} resize-none`} rows={3}
                placeholder="আপনার দোকান সম্পর্কে কিছু লিখুন..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">যোগাযোগের তথ্য</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  className={inputCls} type="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>NID নম্বর (ঐচ্ছিক)</label>
                <input
                  className={inputCls}
                  placeholder="জাতীয় পরিচয়পত্র নম্বর"
                  value={form.nidNumber}
                  onChange={e => set('nidNumber', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>ঠিকানা (ঐচ্ছিক)</label>
              <input
                className={inputCls}
                placeholder="আপনার সম্পূর্ণ ঠিকানা"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">পেমেন্ট তথ্য (ঐচ্ছিক)</h3>
            <p className="text-xs text-gray-400">আয় উত্তোলনের জন্য পরে যোগ করা যাবে।</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>ব্যাংকের নাম</label>
                <input
                  className={inputCls}
                  placeholder="যেমন: Dutch-Bangla Bank"
                  value={form.bankName}
                  onChange={e => set('bankName', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>অ্যাকাউন্ট নম্বর</label>
                <input
                  className={inputCls}
                  placeholder="ব্যাংক অ্যাকাউন্ট নম্বর"
                  value={form.bankAccount}
                  onChange={e => set('bankAccount', e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3">
            <Link href="/seller/dashboard"
              className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-center hover:border-gray-300 transition-colors text-sm"
            >
              বাতিল
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
