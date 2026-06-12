'use client';

import { useState } from 'react';
import { LifeBuoy, Plus, ChevronRight, MessageCircle, Phone, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

const TICKETS: { id: string; subject: string; category: string; date: string; status: TicketStatus; lastReply: string }[] = [
  { id: 'TKT-3312', subject: 'অর্ডার ডেলিভারিতে দেরি হচ্ছে',  category: 'ডেলিভারি',  date: '১০ জুন', status: 'in_progress', lastReply: '১ দিন আগে' },
  { id: 'TKT-3198', subject: 'রিফান্ড এখনো পাইনি',              category: 'পেমেন্ট',    date: '২ জুন',  status: 'resolved',    lastReply: '৫ দিন আগে' },
  { id: 'TKT-3050', subject: 'পণ্য ক্ষতিগ্রস্ত অবস্থায় পেয়েছি', category: 'পণ্যের মান', date: '১৫ মে',  status: 'closed',      lastReply: '২২ দিন আগে' },
];

const STATUS_META: Record<TicketStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  open:        { label: 'খোলা',         icon: AlertCircle,  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  in_progress: { label: 'প্রক্রিয়াধীন', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  resolved:    { label: 'সমাধান হয়েছে', icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  closed:      { label: 'বন্ধ',          icon: CheckCircle,  color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
};

const FAQS = [
  { q: 'অর্ডার ট্র্যাক কীভাবে করবো?', a: '/track-order পেজে অর্ডার নম্বর দিয়ে ট্র্যাক করুন।' },
  { q: 'রিটার্ন পলিসি কী?', a: 'ডেলিভারির ৭ দিনের মধ্যে ক্ষতিগ্রস্ত বা ভুল পণ্য ফেরত দেওয়া যাবে।' },
  { q: 'পেমেন্ট কোন পদ্ধতিতে করা যায়?', a: 'bKash, Nagad, কার্ড ও ক্যাশ অন ডেলিভারি।' },
  { q: 'ডেলিভারিতে কতদিন লাগে?', a: 'ঢাকায় ১-২ দিন, সারাদেশে ২-৫ কার্যদিবস।' },
];

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">সাহায্য ও সাপোর্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">আমরা সাহায্য করতে সদা প্রস্তুত</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-3.5 h-3.5" /> নতুন টিকিট
        </button>
      </div>

      {/* Contact options */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: MessageCircle, label: 'লাইভ চ্যাট',    sub: 'এখনই কথা বলুন',  color: 'text-green-600 bg-green-50', available: true },
          { icon: Phone,         label: 'ফোন সাপোর্ট',   sub: '9AM–6PM শনি–বৃহ', color: 'text-blue-600 bg-blue-50',   available: true },
          { icon: Mail,          label: 'ইমেইল',          sub: '২৪ ঘণ্টার মধ্যে', color: 'text-purple-600 bg-purple-50',available: true },
        ].map(c => {
          const Icon = c.icon;
          return (
            <button key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all text-left group">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{c.label}</p>
                <p className="text-[11px] text-gray-400">{c.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active tickets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">আমার টিকিট</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {TICKETS.map(t => {
            const meta = STATUS_META[t.status];
            const Icon = meta.icon;
            return (
              <div key={t.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                      <Icon className="w-2.5 h-2.5" /> {meta.label}
                    </span>
                    <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{t.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{t.id} · {t.date} · সর্বশেষ উত্তর: {t.lastReply}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-primary" /> সাধারণ প্রশ্ন
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                <p className="text-sm font-semibold text-gray-900">{faq.q}</p>
                <ChevronRight className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', openFaq === i && 'rotate-90')} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">নতুন সাপোর্ট টিকিট</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">বিষয়</label>
              <input placeholder="সমস্যার সংক্ষিপ্ত বিবরণ" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">বিভাগ</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>ডেলিভারি সমস্যা</option>
                <option>পেমেন্ট সমস্যা</option>
                <option>পণ্যের মান</option>
                <option>রিটার্ন ও রিফান্ড</option>
                <option>অ্যাকাউন্ট সমস্যা</option>
                <option>অন্যান্য</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">বিস্তারিত</label>
              <textarea rows={4} placeholder="সমস্যার বিস্তারিত লিখুন..." className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <button className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              টিকিট সাবমিট করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
