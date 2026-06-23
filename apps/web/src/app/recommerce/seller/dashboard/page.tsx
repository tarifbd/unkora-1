'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  RefreshCw, Plus, Package, Eye, MessageSquare, TrendingUp,
  Tag, CheckCircle, Clock, XCircle, Star, BarChart2, Settings,
  ChevronRight, ArrowUpRight, Pencil, Trash2,
} from 'lucide-react';

const STATS = [
  { label: 'সক্রিয় তালিকা',     labelEn: 'Active Listings',   value: '12',   sub: '৩টি নতুন',       subEn: '3 new',       icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50' },
  { label: 'মোট বার্তা',         labelEn: 'Total Messages',   value: '47',   sub: 'আজকে ৮টি',       subEn: '8 today',     icon: MessageSquare, color: 'text-green-600',  bg: 'bg-green-50' },
  { label: 'মোট ভিউ',            labelEn: 'Total Views',      value: '1,240',sub: 'এই সপ্তাহে',     subEn: 'This week',   icon: Eye,           color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'বিক্রয় সম্পন্ন',   labelEn: 'Completed Sales',  value: '8',    sub: 'মোট বিক্রয়',     subEn: 'All time',    icon: TrendingUp,    color: 'text-amber-600',  bg: 'bg-amber-50' },
];

const LISTINGS = [
  { id: 1, title: 'Samsung Galaxy S21 — ভালো অবস্থা',        price: '৳ ২৮,০০০', grade: 'A', status: 'active',  views: 89,  msgs: 4 },
  { id: 2, title: 'Dell Laptop Core i5 — ব্যবহারযোগ্য',       price: '৳ ৩৫,০০০', grade: 'B', status: 'pending', views: 45,  msgs: 2 },
  { id: 3, title: 'Sony Smart TV 43" — প্রায় নতুন',          price: '৳ ২২,০০০', grade: 'A+',status: 'active',  views: 134, msgs: 7 },
  { id: 4, title: 'Wooden Dining Table Set — ঠিকঠাক',        price: '৳ ১২,০০০', grade: 'B', status: 'sold',    views: 210, msgs: 15 },
];

const STATUS_META: Record<string, { label: string; labelEn: string; color: string; icon: typeof CheckCircle }> = {
  active:  { label: 'সক্রিয়',    labelEn: 'Active',   color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  pending: { label: 'অপেক্ষায়', labelEn: 'Pending',  color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  sold:    { label: 'বিক্রিত',   labelEn: 'Sold',     color: 'bg-gray-100 text-gray-600',    icon: XCircle },
};

const GRADE_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'A':  'bg-green-100 text-green-700 border-green-300',
  'B':  'bg-yellow-100 text-yellow-700 border-yellow-300',
  'C':  'bg-orange-100 text-orange-700 border-orange-300',
};

export default function SellerDashboard() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [tab, setTab] = useState<'listings' | 'messages' | 'analytics'>('listings');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/recommerce" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900">{lang === 'bn' ? 'সালভেজ ইয়ার্ড' : 'Salvage Yard'}</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-1">
              {lang === 'bn' ? 'বিক্রেতা' : 'Seller'}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
              className="text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1 hover:text-amber-600 transition-colors"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <Link href="/recommerce/seller/new-listing"
              className="flex items-center gap-1.5 bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
              <Plus className="w-4 h-4" />
              {lang === 'bn' ? 'পণ্য যোগ করুন' : 'Post Listing'}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs font-semibold text-gray-600">{lang === 'bn' ? s.label : s.labelEn}</p>
                <p className="text-[11px] text-gray-400">{lang === 'bn' ? s.sub : s.subEn}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="flex border-b">
            {([
              { key: 'listings',  label: 'আমার তালিকা',  labelEn: 'My Listings',  icon: Package },
              { key: 'messages',  label: 'বার্তা',        labelEn: 'Messages',     icon: MessageSquare },
              { key: 'analytics', label: 'বিশ্লেষণ',     labelEn: 'Analytics',    icon: BarChart2 },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                  tab === t.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <t.icon className="w-4 h-4" />
                {lang === 'bn' ? t.label : t.labelEn}
              </button>
            ))}
          </div>

          {/* Listings tab */}
          {tab === 'listings' && (
            <div>
              <div className="divide-y">
                {LISTINGS.map(item => {
                  const sm = STATUS_META[item.status]!;
                  return (
                    <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-amber-600">{item.price}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${GRADE_COLOR[item.grade] ?? ''}`}>{item.grade}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sm.color}`}>
                            {lang === 'bn' ? sm.label : sm.labelEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.views}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {item.msgs}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center">
                <p className="text-xs text-gray-400">{lang === 'bn' ? `${LISTINGS.length}টি তালিকা` : `${LISTINGS.length} listings`}</p>
                <Link href="/recommerce/seller/listings" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
                  {lang === 'bn' ? 'সব দেখুন' : 'View all'} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Messages tab */}
          {tab === 'messages' && (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">{lang === 'bn' ? 'এখনো কোনো বার্তা নেই' : 'No messages yet'}</p>
              <p className="text-xs mt-1">{lang === 'bn' ? 'ক্রেতারা যোগাযোগ করলে এখানে দেখাবে' : 'Buyer inquiries will appear here'}</p>
            </div>
          )}

          {/* Analytics tab */}
          {tab === 'analytics' && (
            <div className="p-8 text-center text-gray-400">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">{lang === 'bn' ? 'বিশ্লেষণ আসছে' : 'Analytics coming soon'}</p>
              <p className="text-xs mt-1">{lang === 'bn' ? 'আপনার তালিকার পারফরম্যান্স দেখুন' : 'Track your listing performance'}</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Plus,          label: 'পণ্য যোগ',    labelEn: 'Post Item',      href: '/recommerce/seller/new-listing', color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { icon: Tag,           label: 'মূল্য নির্ধারণ', labelEn: 'Price Guide', href: '/recommerce/pricing',           color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { icon: Star,          label: 'রেটিং',         labelEn: 'My Ratings',   href: '/recommerce/seller/ratings',    color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
            { icon: Settings,      label: 'সেটিংস',        labelEn: 'Settings',     href: '/recommerce/seller/settings',   color: 'text-gray-600 bg-gray-50 border-gray-200' },
          ].map(a => (
            <Link key={a.label} href={a.href}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border font-semibold text-sm transition-all hover:shadow-sm ${a.color}`}>
              <a.icon className="w-4 h-4 flex-shrink-0" />
              <span>{lang === 'bn' ? a.label : a.labelEn}</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-50" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
