'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, Check, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { RECOMMERCE_CATEGORIES, GRADE_META, LOCATIONS } from '../../_constants/categories';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { step: 1, labelBn: 'বিভাগ',   labelEn: 'Category' },
  { step: 2, labelBn: 'বিবরণ',   labelEn: 'Details' },
  { step: 3, labelBn: 'ছবি',     labelEn: 'Photos' },
  { step: 4, labelBn: 'মূল্য ও স্থান', labelEn: 'Price & Location' },
];

export default function PostAdPage() {
  const { isAuthenticated } = useAuthStore();
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState({
    cat:        '',
    title:      '',
    desc:       '',
    grade:      '' as keyof typeof GRADE_META | '',
    condition:  '',
    price:      '',
    location:   '',
    phone:      '',
  });

  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;
  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border p-8 max-w-sm w-full text-center space-y-4">
          <span className="text-5xl">🔒</span>
          <h2 className="text-xl font-black text-gray-900">{L('লগইন প্রয়োজন', 'Login Required')}</h2>
          <p className="text-sm text-gray-500">{L('বিজ্ঞাপন দিতে প্রথমে লগইন করুন', 'You must be logged in to post an ad')}</p>
          <Link href="/recommerce/login?as=seller"
            className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl transition-colors">
            {L('লগইন করুন', 'Login')}
          </Link>
        </div>
      </div>
    );
  }

  const canNext = () => {
    if (step === 1) return !!form.cat;
    if (step === 2) return !!form.title && form.title.length >= 5 && !!form.grade;
    if (step === 3) return true;
    if (step === 4) return !!form.price && !!form.location && !!form.phone;
    return false;
  };

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, 4) as Step); };
  const prev = () => setStep(s => Math.max(s - 1, 1) as Step);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/recommerce" className="text-gray-400 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-gray-900">{L('নতুন বিজ্ঞাপন', 'Post New Ad')}</h1>
          <button onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
            className="ml-auto text-xs border rounded-full px-3 py-1 text-gray-400 hover:text-amber-600 transition-colors">
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                  step > s.step ? 'bg-amber-500 border-amber-500 text-white' :
                  step === s.step ? 'border-amber-500 text-amber-600 bg-amber-50' :
                  'border-gray-200 text-gray-400 bg-white'
                }`}>
                  {step > s.step ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">{lang === 'bn' ? s.labelBn : s.labelEn}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${step > s.step ? 'bg-amber-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-5">
          {/* Step 1: Category */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-black text-gray-900">{L('বিভাগ নির্বাচন করুন', 'Select a Category')}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {RECOMMERCE_CATEGORIES.map(cat => (
                  <button key={cat.slug} onClick={() => set('cat', cat.slug)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                      form.cat === cat.slug ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-200'
                    }`}>
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">
                      {lang === 'bn' ? cat.labelBn : cat.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-black text-gray-900">{L('পণ্যের বিবরণ', 'Item Details')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('শিরোনাম *', 'Title *')}</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder={L('যেমন: Samsung Galaxy S21, ৮GB RAM', 'e.g. Samsung Galaxy S21, 8GB RAM')}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
                  <p className="text-[11px] text-gray-400 mt-1">{form.title.length}/100</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('বিস্তারিত বিবরণ', 'Description')}</label>
                  <textarea value={form.desc} onChange={e => set('desc', e.target.value)} rows={4}
                    placeholder={L('পণ্যের অবস্থা, বৈশিষ্ট্য ইত্যাদি লিখুন', 'Describe the condition, features, etc.')}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">{L('গ্রেড / অবস্থা *', 'Grade / Condition *')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.entries(GRADE_META) as [string, typeof GRADE_META[keyof typeof GRADE_META]][]).map(([grade, meta]) => (
                      <button key={grade} onClick={() => set('grade', grade)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.grade === grade ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-200'
                        }`}>
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded-full border ${meta.color}`}>{grade}</span>
                        <p className="text-[11px] text-gray-600 mt-1.5 font-semibold">{lang === 'bn' ? meta.label : meta.labelEn}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-black text-gray-900">{L('ছবি আপলোড করুন', 'Upload Photos')}</h2>
              <p className="text-sm text-gray-500">{L('সর্বোচ্চ ৬টি ছবি দিতে পারবেন (ঐচ্ছিক)', 'You can add up to 6 photos (optional)')}</p>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    i === 0 ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-gray-200 hover:border-amber-200'
                  }`}>
                    {i === 0 ? (
                      <>
                        <Camera className="w-6 h-6 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-600">{L('প্রধান ছবি', 'Main Photo')}</span>
                      </>
                    ) : (
                      <Upload className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">{L('ছবি ছাড়াও বিজ্ঞাপন দেওয়া যাবে', 'You can post without photos too')}</p>
            </>
          )}

          {/* Step 4: Price & Location */}
          {step === 4 && (
            <>
              <h2 className="text-lg font-black text-gray-900">{L('মূল্য ও যোগাযোগ', 'Price & Contact')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('মূল্য (৳) *', 'Price (৳) *')}</label>
                  <input value={form.price} onChange={e => set('price', e.target.value)} type="number"
                    placeholder={L('যেমন: 15000', 'e.g. 15000')}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
                  <p className="text-[11px] text-gray-400 mt-1">{L('দর কষাকষিযোগ্য হলে বিবরণে উল্লেখ করুন', 'Note if negotiable in description')}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('অবস্থান *', 'Location *')}</label>
                  <select value={form.location} onChange={e => set('location', e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400">
                    <option value="">{L('জেলা নির্বাচন করুন', 'Select District')}</option>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('ফোন নম্বর *', 'Phone Number *')}</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel"
                    placeholder="01XXXXXXXXX"
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
                </div>

                {/* Preview summary */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-sm">
                  <p className="font-black text-gray-700 mb-3">{L('সারসংক্ষেপ', 'Summary')}</p>
                  {[
                    [L('বিভাগ', 'Category'), RECOMMERCE_CATEGORIES.find(c => c.slug === form.cat)?.[lang === 'bn' ? 'labelBn' : 'labelEn'] ?? ''],
                    [L('শিরোনাম', 'Title'), form.title],
                    [L('গ্রেড', 'Grade'), form.grade],
                  ].map(([k, v]) => v && (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-bold text-gray-900">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-5">
          {step > 1 && (
            <button onClick={prev}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {L('পেছনে', 'Back')}
            </button>
          )}
          <button onClick={step < 4 ? next : undefined}
            disabled={!canNext()}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-colors ${
              canNext() ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {step < 4 ? (
              <>{L('পরবর্তী', 'Next')} <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>{L('বিজ্ঞাপন প্রকাশ করুন', 'Publish Ad')} <Check className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
