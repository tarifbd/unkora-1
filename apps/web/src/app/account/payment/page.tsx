'use client';

import Link from 'next/link';
import { CreditCard, Smartphone, ShieldCheck, ChevronRight, ExternalLink } from 'lucide-react';

const METHODS = [
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ',
    desc: 'মোবাইল ব্যাংকিং',
    color: 'bg-pink-50 border-pink-200',
    iconBg: 'bg-pink-100',
    textColor: 'text-pink-700',
    emoji: '📱',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    nameBn: 'নগদ',
    desc: 'মোবাইল ব্যাংকিং',
    color: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    textColor: 'text-orange-700',
    emoji: '📲',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    nameBn: 'রকেট',
    desc: 'মোবাইল ব্যাংকিং',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    textColor: 'text-purple-700',
    emoji: '🚀',
  },
  {
    id: 'card',
    name: 'Debit / Credit Card',
    nameBn: 'ডেবিট / ক্রেডিট কার্ড',
    desc: 'Visa, Mastercard, AMEX',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    textColor: 'text-blue-700',
    emoji: '💳',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    nameBn: 'ক্যাশ অন ডেলিভারি',
    desc: 'ডেলিভারির সময় নগদ পেমেন্ট',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    textColor: 'text-green-700',
    emoji: '💵',
  },
];

export default function PaymentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">পেমেন্ট</h1>
        <p className="text-sm text-gray-500 mt-1">পেমেন্ট পদ্ধতি এবং পেমেন্ট ইতিহাস</p>
      </div>

      {/* Accepted Methods */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> গ্রহণযোগ্য পেমেন্ট পদ্ধতি
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {METHODS.map(m => (
            <div key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border ${m.color}`}>
              <div className={`w-10 h-10 ${m.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                {m.emoji}
              </div>
              <div>
                <p className={`font-bold text-sm ${m.textColor}`}>{m.nameBn}</p>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">নিরাপদ পেমেন্ট গেটওয়ে</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            আপনার সমস্ত পেমেন্ট SSL এনক্রিপ্টেড এবং নিরাপদ। আমরা কখনো আপনার কার্ড বা মোবাইল ব্যাংকিং তথ্য সংরক্ষণ করি না।
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div className="px-5 py-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">দ্রুত লিংক</p>
        </div>
        {[
          { label: 'আমার অর্ডার দেখুন', sublabel: 'অর্ডার ও পেমেন্ট ইতিহাস', href: '/account/orders', icon: Smartphone },
          { label: 'কুপন ও ডিসকাউন্ট', sublabel: 'উপলব্ধ ছাড় দেখুন', href: '/account/coupons', icon: CreditCard },
          { label: 'রিটার্ন ও রিফান্ড নীতি', sublabel: 'রিফান্ড সম্পর্কে জানুন', href: '/refund-policy', icon: ExternalLink },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group">
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sublabel}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
