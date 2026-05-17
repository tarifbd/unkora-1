'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const GENRES = [
  { label: 'উপন্যাস', en: 'Novel' },
  { label: 'ছোটগল্প', en: 'Short Stories' },
  { label: 'কবিতা', en: 'Poetry' },
  { label: 'ইসলামিক', en: 'Islamic' },
  { label: 'একাডেমিক', en: 'Academic' },
  { label: 'আত্মউন্নয়ন', en: 'Self-Help' },
  { label: 'শিশু', en: "Children's" },
  { label: 'বিজ্ঞান ও প্রযুক্তি', en: 'Science & Tech' },
  { label: 'ইতিহাস', en: 'History' },
  { label: 'জীবনী', en: 'Biography' },
  { label: 'স্বাস্থ্য', en: 'Health' },
  { label: 'ব্যবসা', en: 'Business' },
];

interface FormData {
  title: string;
  authorName: string;
  publisherName: string;
  isbn: string;
  language: string;
  pageCount: string;
  edition: string;
  genres: string[];
  description: string;
  coverImageUrl: string;
  suggestedPrice: string;
}

const EMPTY: FormData = {
  title: '', authorName: '', publisherName: '', isbn: '',
  language: 'Bengali', pageCount: '', edition: '', genres: [],
  description: '', coverImageUrl: '', suggestedPrice: '',
};

export default function SubmitBookPage() {
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-3">সাইন ইন করুন</h2>
          <p className="text-gray-500 mb-6">বই জমা দিতে আপনাকে সাইন ইন করতে হবে।</p>
          <Link href="/login" className="bg-primary text-white font-bold py-3 px-8 rounded-xl inline-block hover:bg-primary/90 transition-colors">
            সাইন ইন করুন
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">বই সফলভাবে জমা হয়েছে!</h2>
          <p className="text-gray-600 mb-2">আমরা ৩-৫ কার্যদিবসের মধ্যে রিভিউ করব।</p>
          <p className="text-sm text-gray-500 mb-8">Your book has been submitted successfully. We will review within 3-5 business days.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/account/my-books" className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors">
              আমার বইসমূহ
            </Link>
            <Link href="/publish/submit" onClick={() => { setForm(EMPTY); setStep(1); setSuccess(false); }} className="border-2 border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:border-gray-300 transition-colors">
              আরো জমা দিন
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const set = (key: keyof FormData, val: string | string[]) =>
    setForm(f => ({ ...f, [key]: val }));

  const toggleGenre = (g: string) =>
    set('genres', form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g]);

  const royalty = form.suggestedPrice ? (parseFloat(form.suggestedPrice) * 0.1).toFixed(2) : '0';

  const handleSubmit = async () => {
    if (!agreed) { setError('শর্তাবলীতে সম্মত হন।'); return; }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/book-submissions', {
        title: form.title,
        authorName: form.authorName,
        publisherName: form.publisherName || undefined,
        isbn: form.isbn || undefined,
        language: form.language,
        pageCount: form.pageCount ? parseInt(form.pageCount) : undefined,
        edition: form.edition || undefined,
        genres: form.genres,
        description: form.description,
        coverImageUrl: form.coverImageUrl || undefined,
        suggestedPrice: parseFloat(form.suggestedPrice),
      });
      setSuccess(true);
    } catch {
      setError('জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors bg-white';
  const labelCls = 'block text-sm font-bold text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/publish" className="text-sm text-primary hover:underline font-medium">← আপনার বই বিক্রি করুন</Link>
          <h1 className="text-3xl font-black text-gray-900 mt-3 mb-1">বই জমা দিন</h1>
          <p className="text-gray-500 text-sm">Submit Your Book</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s}</div>
              {s < 3 && <div className={`w-16 h-1 rounded-full transition-colors ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-16 text-xs text-gray-500 mb-8 -mt-4">
          <span className={step === 1 ? 'text-primary font-bold' : ''}>বইয়ের তথ্য</span>
          <span className={step === 2 ? 'text-primary font-bold' : ''}>বিবরণ ও মূল্য</span>
          <span className={step === 3 ? 'text-primary font-bold' : ''}>রিভিউ ও জমা</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-gray-900 mb-6">বইয়ের তথ্য</h2>
              <div>
                <label className={labelCls}>বইয়ের নাম <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="Book Title" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>লেখকের নাম <span className="text-red-500">*</span></label>
                <input className={inputCls} placeholder="Author Name" value={form.authorName} onChange={e => set('authorName', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>প্রকাশক (ঐচ্ছিক)</label>
                  <input className={inputCls} placeholder="Publisher" value={form.publisherName} onChange={e => set('publisherName', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>ISBN (ঐচ্ছিক)</label>
                  <input className={inputCls} placeholder="ISBN" value={form.isbn} onChange={e => set('isbn', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>ভাষা</label>
                  <select className={inputCls} value={form.language} onChange={e => set('language', e.target.value)}>
                    <option value="Bengali">বাংলা</option>
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Other">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>পৃষ্ঠা সংখ্যা (ঐচ্ছিক)</label>
                  <input className={inputCls} placeholder="Page Count" type="number" value={form.pageCount} onChange={e => set('pageCount', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>সংস্করণ (ঐচ্ছিক)</label>
                <input className={inputCls} placeholder="Edition e.g. 1st, 2nd" value={form.edition} onChange={e => set('edition', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>বিভাগ (একাধিক বেছে নিন) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {GENRES.map(g => (
                    <button
                      key={g.en}
                      type="button"
                      onClick={() => toggleGenre(g.en)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors ${
                        form.genres.includes(g.en)
                          ? 'bg-primary border-primary text-white'
                          : 'border-gray-200 text-gray-600 hover:border-primary/50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!form.title || !form.authorName || form.genres.length === 0) {
                    setError('বইয়ের নাম, লেখকের নাম এবং কমপক্ষে একটি বিভাগ দিন।');
                    return;
                  }
                  setError(''); setStep(2);
                }}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-4"
              >
                পরবর্তী <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-gray-900 mb-6">বিবরণ ও মূল্য</h2>
              <div>
                <label className={labelCls}>বইয়ের বিবরণ <span className="text-red-500">*</span></label>
                <textarea
                  className={`${inputCls} resize-none`} rows={5}
                  placeholder="বইটি সম্পর্কে বিস্তারিত লিখুন (কমপক্ষে ১০০ অক্ষর)..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">{form.description.length} / ১০০+ অক্ষর</p>
              </div>
              <div>
                <label className={labelCls}>কভার ছবির URL (ঐচ্ছিক)</label>
                <input className={inputCls} placeholder="https://..." value={form.coverImageUrl} onChange={e => set('coverImageUrl', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">পরে আমরা আপনার সাথে যোগাযোগ করব।</p>
              </div>
              <div>
                <label className={labelCls}>প্রস্তাবিত বিক্রয় মূল্য (BDT) <span className="text-red-500">*</span></label>
                <input
                  className={inputCls} type="number" placeholder="e.g. 350"
                  value={form.suggestedPrice}
                  onChange={e => set('suggestedPrice', e.target.value)}
                />
                {form.suggestedPrice && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm text-gray-600">প্রতি বিক্রয়ে আপনার আয় (১০%)</span>
                    <span className="text-lg font-black text-green-600">৳{royalty}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setError(''); setStep(1); }} className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:border-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
                </button>
                <button
                  onClick={() => {
                    if (!form.description || form.description.length < 100 || !form.suggestedPrice) {
                      setError('বিবরণ (১০০+ অক্ষর) এবং মূল্য দেওয়া আবশ্যক।');
                      return;
                    }
                    setError(''); setStep(3);
                  }}
                  className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  পরবর্তী <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-gray-900 mb-6">রিভিউ ও জমা দিন</h2>
              <div className="bg-gray-50 rounded-xl p-5 space-y-3 border border-gray-100">
                {[
                  { label: 'বইয়ের নাম', val: form.title },
                  { label: 'লেখক', val: form.authorName },
                  { label: 'প্রকাশক', val: form.publisherName || '—' },
                  { label: 'ভাষা', val: form.language },
                  { label: 'পৃষ্ঠা', val: form.pageCount || '—' },
                  { label: 'বিভাগ', val: form.genres.join(', ') },
                  { label: 'মূল্য', val: `৳${form.suggestedPrice}` },
                  { label: 'রয়্যালটি (প্রতি বিক্রয়)', val: `৳${royalty}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">{row.label}</span>
                    <span className="text-gray-900 font-bold text-right max-w-xs truncate">{row.val}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1">বিবরণ</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{form.description}</p>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-primary" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span className="text-sm text-gray-600">
                  আমি UNKORA-এর{' '}
                  <a href="#" className="text-primary underline">শর্তাবলী</a>{' '}
                  এবং লেখক নীতিমালায় সম্মত আছি।
                  <span className="block text-xs text-gray-400 mt-0.5">I agree to UNKORA&apos;s terms and author policy.</span>
                </span>
              </label>
              {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setError(''); setStep(2); }} className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:border-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {loading ? 'জমা হচ্ছে...' : 'জমা দিন'}
                </button>
              </div>
            </div>
          )}

          {error && step < 3 && (
            <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
