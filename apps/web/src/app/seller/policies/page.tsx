'use client';

import { useState } from 'react';
import { FileText, RotateCcw, Truck, Shield, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const POLICIES = [
  {
    id: 'return',
    icon: RotateCcw,
    title: 'রিটার্ন পলিসি',
    desc: 'পণ্য ফেরত ও রিফান্ড সংক্রান্ত নিয়মাবলী',
    defaultText: 'ডেলিভারির ৭ দিনের মধ্যে ক্ষতিগ্রস্ত বা ভুল পণ্য ফেরত দেওয়া যাবে। পণ্যটি অবশ্যই অব্যবহৃত ও মূল প্যাকেজিংসহ থাকতে হবে। রিফান্ড ৩-৫ কার্যদিবসের মধ্যে প্রক্রিয়া করা হবে।',
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'শিপিং পলিসি',
    desc: 'ডেলিভারি সময়, পদ্ধতি ও চার্জ সম্পর্কিত তথ্য',
    defaultText: 'অর্ডার নিশ্চিতের ১-২ কার্যদিবসের মধ্যে পণ্য শিপ করা হয়। ঢাকায় ১-২ দিন, সারাদেশে ২-৫ কার্যদিবস লাগে। ৳1,500-এর উপরে অর্ডারে ঢাকায় ফ্রি ডেলিভারি।',
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'প্রাইভেসি পলিসি',
    desc: 'গ্রাহকের তথ্য সংগ্রহ ও ব্যবহার নীতি',
    defaultText: 'আমরা আপনার ব্যক্তিগত তথ্য কেবল অর্ডার প্রক্রিয়াকরণের জন্য ব্যবহার করি। তৃতীয় পক্ষের সাথে তথ্য শেয়ার করা হয় না। আপনার ডেটা সুরক্ষিত সার্ভারে সংরক্ষিত।',
  },
];

export default function PoliciesPage() {
  const [texts, setTexts] = useState<Record<string, string>>(
    Object.fromEntries(POLICIES.map(p => [p.id, p.defaultText]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('return');

  const save = (id: string) => {
    setSaved(s => ({ ...s, [id]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000);
  };

  const active = POLICIES.find(p => p.id === activeTab)!;
  const Icon = active.icon;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900">শপ পলিসি</h1>
        <p className="text-sm text-gray-500 mt-0.5">গ্রাহকদের জন্য আপনার শপের নিয়মাবলী সেট করুন</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {POLICIES.map(p => {
          const PIcon = p.icon;
          return (
            <button key={p.id} onClick={() => setActiveTab(p.id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
                activeTab === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              <PIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{p.title.split(' ')[0]}</span>
              <span className="sm:hidden">{p.id === 'return' ? 'রিটার্ন' : p.id === 'shipping' ? 'শিপিং' : 'প্রাইভেসি'}</span>
            </button>
          );
        })}
      </div>

      {/* Active policy editor */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{active.title}</h2>
            <p className="text-xs text-gray-400">{active.desc}</p>
          </div>
        </div>

        <textarea
          rows={8}
          value={texts[active.id] ?? ''}
          onChange={e => setTexts(t => ({ ...t, [active.id]: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder={`${active.title} লিখুন...`}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{texts[active.id]?.length ?? 0} অক্ষর</p>
          <button onClick={() => save(active.id)}
            className={cn('flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              saved[active.id] ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90')}>
            <Save className="w-4 h-4" />
            {saved[active.id] ? 'সেভ হয়েছে' : 'সেভ করুন'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">প্রিভিউ</p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{texts[active.id]}</p>
      </div>
    </div>
  );
}
