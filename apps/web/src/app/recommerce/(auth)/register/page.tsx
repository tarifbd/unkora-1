'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RefreshCw, User, Store, Eye, EyeOff } from 'lucide-react';

type Panel = 'buyer' | 'seller';

export default function RecommerceRegisterPage() {
  const [panel, setPanel]       = useState<Panel>('buyer');
  const [lang, setLang]         = useState<'bn' | 'en'>('bn');
  const [showPw, setShowPw]     = useState(false);
  const [form, setForm]         = useState({ name: '', phone: '', email: '', password: '' });

  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;
  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-10">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 p-6 text-white text-center">
          <Link href="/recommerce" className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg">{L('সালভেজ ইয়ার্ড', 'Salvage Yard')}</span>
          </Link>
          <p className="text-amber-100 text-sm">{L('নতুন অ্যাকাউন্ট তৈরি করুন', 'Create a new account')}</p>
        </div>

        {/* Panel toggle */}
        <div className="flex border-b">
          {([
            { key: 'buyer',  icon: User,  labelBn: 'ক্রেতা',   labelEn: 'Buyer' },
            { key: 'seller', icon: Store, labelBn: 'বিক্রেতা', labelEn: 'Seller' },
          ] as const).map(p => (
            <button key={p.key} onClick={() => setPanel(p.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                panel === p.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              <p.icon className="w-4 h-4" />
              {L(p.labelBn, p.labelEn)}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('নাম *', 'Full Name *')}</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder={L('আপনার পূর্ণ নাম', 'Your full name')}
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('ফোন নম্বর *', 'Phone Number *')}</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} type="tel"
              placeholder="01XXXXXXXXX"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('ইমেইল (ঐচ্ছিক)', 'Email (optional)')}</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} type="email"
              placeholder="email@example.com"
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">{L('পাসওয়ার্ড *', 'Password *')}</label>
            <div className="relative">
              <input value={form.password} onChange={e => set('password', e.target.value)}
                type={showPw ? 'text' : 'password'}
                placeholder={L('কমপক্ষে ৬ অক্ষর', 'At least 6 characters')}
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 pr-11" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? L('পাসওয়ার্ড লুকান', 'Hide password') : L('পাসওয়ার্ড দেখান', 'Show password')}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {panel === 'seller' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
              {L('বিক্রেতা হিসেবে নিবন্ধন করলে আপনি বিনামূল্যে পণ্য বিজ্ঞাপন দিতে পারবেন।', 'As a seller you can post product listings for free.')}
            </div>
          )}

          <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl transition-colors text-sm">
            {L('অ্যাকাউন্ট তৈরি করুন', 'Create Account')}
          </button>

          <p className="text-xs text-gray-500 text-center">
            {L('ইতিমধ্যে অ্যাকাউন্ট আছে?', 'Already have an account?')}{' '}
            <Link href={`/recommerce/login?as=${panel}`} className="text-amber-600 font-bold hover:underline">
              {L('লগইন করুন', 'Login')}
            </Link>
          </p>
        </div>

        {/* Lang toggle */}
        <div className="border-t py-3 text-center">
          <button onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
            className="text-xs text-gray-400 hover:text-amber-600 transition-colors">
            {lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
