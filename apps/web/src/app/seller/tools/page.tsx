'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MousePointerClick, ShieldAlert, ShieldX,
  ScanBarcode, ScanSearch, Printer,
  ChevronRight, Zap, CheckCircle, ArrowRight,
  TrendingUp, Users, Clock, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   Feature data
───────────────────────────────────────────── */
type FeatureId =
  | 'order-trap'
  | 'fraud-detector'
  | 'fraud-blocker'
  | 'duplicate-finder'
  | 'order-scanner'
  | 'invoice-print';

interface Feature {
  id: FeatureId;
  title: string;
  subtitle?: string;
  desc: string;
  icon: React.ElementType | null;
  row: 'top' | 'bottom';
  stats: { label: string; value: string }[];
  benefits: string[];
  cta: string;
  href?: string;
}

const FEATURES: Feature[] = [
  {
    id: 'order-trap',
    title: 'অর্ডার ট্র্যাপ',
    subtitle: '(ইনকমপ্লিট অর্ডার)',
    desc: 'ইনকমপ্লিট অর্ডার ফিচার দিয়ে আপনি জানতে পারবেন কোন ভিজিটর অর্ডার শুরু করে মাঝ পথে থেমে গেছে। এই তথ্য ব্যবহার করে সহজেই ফলোআপ করা যায়, যা বিক্রি বাড়াতে সাহায্য করে এবং ব্যবসার গ্রোথ ও ডেটা-ভিত্তিক সিদ্ধান্ত নিশ্চিত করে।',
    icon: MousePointerClick,
    row: 'top',
    stats: [
      { label: 'রিকভারি রেট', value: '৩২%' },
      { label: 'অতিরিক্ত আয়', value: '৳৪৮,০০০+' },
      { label: 'ফলোআপ সময়', value: '< ২ মিনিট' },
    ],
    benefits: [
      'কে কোথায় ড্রপ করেছে সরাসরি দেখুন',
      'অটোমেটিক SMS / WhatsApp ফলোআপ',
      'রিয়েল-টাইম ড্রপ-অফ ফানেল চার্ট',
      'কাস্টম ফলোআপ টেমপ্লেট',
    ],
    cta: 'ফলোআপ শুরু করুন',
  },
  {
    id: 'fraud-detector',
    title: 'ফড কাস্টমার ডিটেক্টর',
    desc: 'ফেইক কাস্টমার চিহ্নিত করে অ্যাড খরচ ও সময় বাঁচান। প্রকৃত ক্রেতাদের কাছে পৌঁছান অর্ডার বাড়ান।',
    icon: ShieldAlert,
    row: 'top',
    stats: [
      { label: 'ফেইক ডিটেকশন', value: '৯৭%' },
      { label: 'খরচ সাশ্রয়', value: '৪২%' },
      { label: 'রেসপন্স টাইম', value: '< ১ সেক' },
    ],
    benefits: [
      'AI-চালিত রিস্ক স্কোরিং',
      'OTP ফোন ভেরিফিকেশন',
      'IP ট্র্যাকিং ও VPN/প্রক্সি ডিটেকশন',
      'ডিভাইস ফিঙ্গারপ্রিন্ট + ব্ল্যাকলিস্ট চেক',
    ],
    cta: 'ডিটেক্টর চালু করুন',
    href: '/seller/fraud-detection',
  },
  {
    id: 'fraud-blocker',
    title: 'ফড কাস্টমার ব্লকার',
    desc: 'ফেইক অর্ডার ফিল্টার ফিচার ব্যবহার করলে ভুয়া অর্ডারের ঝামেলা প্রায় শূন্য নামিয়ে আনা যায়। এতে এড খরচ কমে, ডেলিভারি ও কাস্টমার হ্যান্ডলিং সহজ হয়।',
    icon: ShieldX,
    row: 'top',
    stats: [
      { label: 'ফেইক ব্লক', value: '৯৮.৫%' },
      { label: 'ডেলিভারি সাফল্য', value: '+২৮%' },
      { label: 'টিম সময় সাশ্রয়', value: '৩ ঘণ্টা/দিন' },
    ],
    benefits: [
      'অটো-ব্লক রুলস ইঞ্জিন',
      'এরিয়া / পিন-কোড ফিল্টার',
      'রিপিট ফেইক নম্বর ব্লকলিস্ট',
      'বাল্ক একশনসহ ম্যানুয়াল রিভিউ কিউ',
    ],
    cta: 'ব্লকার সেটআপ করুন',
    href: '/seller/fraud-detection',
  },
  {
    id: 'duplicate-finder',
    title: 'ডুপ্লিকেট অর্ডার ফাইন্ডার',
    desc: 'ডুপ্লিকেট অর্ডার ফাইন্ডার একই কাস্টমারের ভুলবশত করা রিপিট অর্ডার অটো ডিটেক্ট করে। ক্রেতাকে বারবার কল না করেও কাস্টমার স্যাটিসফেকশন বজায় রেখে ব্যবসায় জামেলা ও খরচ অনেকাংশেই কমানো যায়।',
    icon: ScanBarcode,
    row: 'bottom',
    stats: [
      { label: 'ডুপ্লিকেট ধরা', value: '১০০%' },
      { label: 'অর্ডার সাশ্রয়', value: '৮-১২%' },
      { label: 'কল কমানো', value: '৬৫%' },
    ],
    benefits: [
      'ফোন + ঠিকানা মিলিয়ে ডিটেকশন',
      '২৪ ঘণ্টার মধ্যে ডুপ্লিকেট মার্জ',
      'কাস্টমার নোটিফিকেশন অটোমেশন',
      'ডুপ্লিকেট হিস্ট্রি ড্যাশবোর্ড',
    ],
    cta: 'ফাইন্ডার চালু করুন',
  },
  {
    id: 'order-scanner',
    title: 'অর্ডার স্ক্যানার',
    desc: 'হাজারো অর্ডার ও রিটার্ন প্রোডাক্ট ম্যানুয়ালি না করে, এক ক্লিকে মুহূর্তে কুরিয়ার বুকিং ও রিটার্ন এন্ট্রি সম্পূর্ণ করুন।',
    icon: ScanSearch,
    row: 'bottom',
    stats: [
      { label: 'প্রসেসিং স্পিড', value: '১০x দ্রুত' },
      { label: 'ম্যানুয়াল এন্ট্রি', value: '০%' },
      { label: 'ত্রুটি কমানো', value: '৯৯%' },
    ],
    benefits: [
      'বারকোড স্ক্যান দিয়ে তাৎক্ষণিক বুকিং',
      'Pathao / RedX / Sundarban ইন্টিগ্রেশন',
      'বাল্ক রিটার্ন প্রসেসিং',
      'শিপমেন্ট ট্র্যাকিং অটো-আপডেট',
    ],
    cta: 'স্ক্যানার ব্যবহার করুন',
  },
  {
    id: 'invoice-print',
    title: 'ওয়ান ক্লিক মাল্টিপল ইনভয়স প্রিন্ট',
    desc: 'এক ক্লিকে একাধিক ইনভয়স প্রিন্ট করতে পারায় সময়, শ্রম ও খরচ বাঁচে। ম্যানুয়াল এন্ট্রির ভুল প্রায় শূন্যে নেমে আসে এবং টিমের অপারেশনাল এফিশিয়েন্সি বাড়ে।',
    icon: Printer,
    row: 'bottom',
    stats: [
      { label: 'ইনভয়স/মিনিট', value: '৫০০+' },
      { label: 'সময় সাশ্রয়', value: '৯২%' },
      { label: 'পেপার সাশ্রয়', value: '৩৫%' },
    ],
    benefits: [
      'কাস্টমাইজেবল ইনভয়স টেমপ্লেট',
      'A4 / A5 / থার্মাল প্রিন্ট সাপোর্ট',
      'বাল্ক PDF এক্সপোর্ট',
      'ব্র্যান্ড লোগো ও সিল সহ প্রিন্ট',
    ],
    cta: 'প্রিন্ট শুরু করুন',
  },
];

/* ─────────────────────────────────────────────
   Icon illustration for bottom row
───────────────────────────────────────────── */
function FeatureIllustration({ icon: Icon, active }: { icon: React.ElementType; active: boolean }) {
  return (
    <div className={cn(
      'relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
      active
        ? 'bg-amber-100 shadow-md shadow-amber-200'
        : 'bg-red-50 group-hover:bg-red-100 group-hover:shadow-sm group-hover:shadow-red-100'
    )}>
      <Icon className={cn(
        'w-7 h-7 transition-all duration-300',
        active ? 'text-amber-500' : 'text-red-500 group-hover:scale-110'
      )} />
      {/* Decorative dots */}
      <span className={cn(
        'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white transition-colors',
        active ? 'bg-amber-400' : 'bg-red-400'
      )} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat pill
───────────────────────────────────────────── */
function StatPill({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={cn(
      'flex flex-col items-center rounded-2xl px-4 py-3 border transition-all duration-300',
      active
        ? 'bg-amber-50 border-amber-200'
        : 'bg-gray-50 border-gray-100 group-hover:bg-white group-hover:border-gray-200'
    )}>
      <span className={cn('text-lg font-black leading-none', active ? 'text-amber-600' : 'text-gray-900')}>{value}</span>
      <span className="text-[10px] font-semibold text-gray-400 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature card — top row (text-only style)
───────────────────────────────────────────── */
function TopCard({ feature, active, onClick }: { feature: Feature; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      'group relative text-left rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg',
      active
        ? 'border-amber-400 bg-amber-50/60 shadow-md shadow-amber-100'
        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
    )}>
      {active && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          <Zap className="w-2.5 h-2.5" /> সক্রিয়
        </span>
      )}
      <h3 className={cn(
        'text-lg font-black leading-tight mb-0.5 transition-colors',
        active ? 'text-amber-700' : 'text-gray-900 group-hover:text-amber-700'
      )}>
        {feature.title}
      </h3>
      {feature.subtitle && (
        <p className={cn('text-sm font-semibold mb-3', active ? 'text-amber-500' : 'text-gray-400')}>{feature.subtitle}</p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{feature.desc}</p>

      <div className={cn(
        'mt-4 flex items-center gap-1.5 text-xs font-bold transition-colors',
        active ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
      )}>
        বিস্তারিত দেখুন <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Feature card — bottom row (icon style)
───────────────────────────────────────────── */
function BottomCard({ feature, active, onClick }: { feature: Feature; active: boolean; onClick: () => void }) {
  const Icon = feature.icon!;
  return (
    <button onClick={onClick} className={cn(
      'group relative text-left rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg',
      active
        ? 'border-amber-400 bg-amber-50/60 shadow-md shadow-amber-100'
        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
    )}>
      {active && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          <Zap className="w-2.5 h-2.5" /> সক্রিয়
        </span>
      )}
      <FeatureIllustration icon={Icon} active={active} />
      <h3 className={cn(
        'text-base font-black mt-4 mb-2 leading-tight transition-colors',
        active ? 'text-amber-700' : 'text-gray-900 group-hover:text-amber-700'
      )}>
        {feature.title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{feature.desc}</p>

      <div className={cn(
        'mt-4 flex items-center gap-1.5 text-xs font-bold transition-colors',
        active ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'
      )}>
        বিস্তারিত দেখুন <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Detail panel (shown when a card is selected)
───────────────────────────────────────────── */
function DetailPanel({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-lg shadow-amber-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-5 flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-amber-600" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-black text-gray-900">{feature.title}</h2>
          {feature.subtitle && <p className="text-sm text-amber-500 font-semibold">{feature.subtitle}</p>}
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" /> ব্যবহারের জন্য প্রস্তুত
        </span>
      </div>

      <div className="p-6 grid sm:grid-cols-[1fr_auto] gap-6">
        {/* Left: benefits */}
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">মূল সুবিধাসমূহ</p>
          <ul className="space-y-2.5">
            {feature.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-sm text-gray-700">{b}</span>
              </li>
            ))}
          </ul>
          {feature.href ? (
            <Link href={feature.href} className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-amber-200">
              {feature.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button className="mt-5 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-amber-200">
              {feature.cta} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
          {feature.stats.map(s => (
            <StatPill key={s.label} label={s.label} value={s.value} active />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function SellerToolsPage() {
  const [selected, setSelected] = useState<FeatureId>('order-trap');

  const toggle = (id: FeatureId) => setSelected(prev => (prev === id ? 'order-trap' : id));

  const topFeatures    = FEATURES.filter(f => f.row === 'top');
  const bottomFeatures = FEATURES.filter(f => f.row === 'bottom');
  const activeFeature  = FEATURES.find(f => f.id === selected)!;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> স্মার্ট সেলার টুলস
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ব্যবসা অটোমেট করুন, আয় বাড়ান, ঝামেলা কমান</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span>সক্রিয় সেলাররা মাসে গড়ে <strong className="text-gray-900">৳১.২ লাখ</strong> বেশি আয় করেন</span>
          </div>
        </div>
      </div>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-red-400 rounded-2xl p-5 text-white flex items-center justify-between gap-4 shadow-md shadow-amber-100 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-base">সব টুলস ফ্রিতে ব্যবহার করুন</p>
            <p className="text-sm text-white/80">প্রথম ৩০ দিন — কোনো ক্রেডিট কার্ড লাগবে না</p>
          </div>
        </div>
        <button className="bg-white text-amber-600 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-white/90 transition-colors flex-shrink-0 shadow-sm">
          এখনই শুরু করুন
        </button>
      </div>

      {/* Top row cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">ফড প্রোটেকশন ও অর্ডার ইন্টেলিজেন্স</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {topFeatures.map(f => (
            <TopCard key={f.id} feature={f} active={selected === f.id} onClick={() => toggle(f.id)} />
          ))}
        </div>
      </div>

      {/* Detail panel (shown below whichever row the selected card is in) */}
      {topFeatures.some(f => f.id === selected) && (
        <DetailPanel feature={activeFeature} />
      )}

      {/* Bottom row cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ScanBarcode className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">অর্ডার অটোমেশন ও স্পিড</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {bottomFeatures.map(f => (
            <BottomCard key={f.id} feature={f} active={selected === f.id} onClick={() => toggle(f.id)} />
          ))}
        </div>
      </div>

      {/* Detail panel for bottom row */}
      {bottomFeatures.some(f => f.id === selected) && (
        <DetailPanel feature={activeFeature} />
      )}

      {/* Bottom social proof */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid sm:grid-cols-4 gap-4 text-center">
          {[
            { icon: Users,     value: '১২,০০০+', label: 'সক্রিয় সেলার' },
            { icon: TrendingUp,value: '৳৮৫ কোটি', label: 'অতিরিক্ত আয় করিয়েছি' },
            { icon: ShieldX,   value: '৯৮.৫%',   label: 'ফেইক অর্ডার ব্লক' },
            { icon: Clock,     value: '৪.৮ ঘণ্টা', label: 'দৈনিক সময় সাশ্রয়' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
                <p className="text-[11px] text-gray-400 font-semibold">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
