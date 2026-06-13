'use client';

import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  BookOpen, ShoppingBag, TrendingUp, Wallet,
  AlertCircle, CheckCircle, Clock, ArrowRight, Plus,
  Package, RotateCcw, Star, Zap, Tag, BarChart2,
  ChevronRight, AlertTriangle, Truck, Eye,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

/* ── sparkline data (static placeholder until real API) ── */
const SPARKLINE = [
  { d: 'জানু', v: 28000 }, { d: 'ফেব্রু', v: 35000 }, { d: 'মার্চ', v: 31000 },
  { d: 'এপ্রি', v: 42000 }, { d: 'মে', v: 38000 },   { d: 'জুন', v: 51000 },
];

const ALERTS = [
  { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-200', label: '৩টি পণ্যের স্টক কম', href: '/seller/inventory' },
  { icon: RotateCcw,     color: 'text-blue-500 bg-blue-50 border-blue-200',   label: '১টি রিটার্ন পর্যালোচনা বাকি', href: '/seller/returns' },
  { icon: Star,          color: 'text-purple-500 bg-purple-50 border-purple-200', label: '২টি রিভিউ উত্তর বাকি', href: '/seller/reviews' },
];

const QUICK_ACTIONS = [
  { href: '/seller/products/new', icon: Plus,       label: 'নতুন পণ্য',  color: 'bg-primary text-white',                     shadow: 'shadow-primary/20' },
  { href: '/seller/orders',       icon: ShoppingBag,label: 'অর্ডার',     color: 'bg-blue-50 text-blue-600 border border-blue-100',   shadow: '' },
  { href: '/seller/analytics',    icon: BarChart2,  label: 'বিশ্লেষণ',  color: 'bg-purple-50 text-purple-600 border border-purple-100', shadow: '' },
  { href: '/seller/promotions',   icon: Zap,        label: 'প্রমোশন',   color: 'bg-amber-50 text-amber-600 border border-amber-100',  shadow: '' },
  { href: '/seller/coupons',      icon: Tag,        label: 'কুপন',       color: 'bg-green-50 text-green-600 border border-green-100',  shadow: '' },
  { href: '/seller/inventory',    icon: Package,    label: 'ইনভেন্টরি',  color: 'bg-orange-50 text-orange-600 border border-orange-100',shadow: '' },
  { href: '/seller/tools',        icon: Eye,        label: 'টুলস',       color: 'bg-rose-50 text-rose-600 border border-rose-100',    shadow: '' },
  { href: '/seller/shipping',     icon: Truck,      label: 'শিপিং',      color: 'bg-indigo-50 text-indigo-600 border border-indigo-100',shadow: '' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE:    { label: 'সক্রিয়',       cls: 'bg-green-100 text-green-700 border-green-200' },
    PENDING:   { label: 'অপেক্ষমাণ',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    SUSPENDED: { label: 'স্থগিত',        cls: 'bg-red-100 text-red-700 border-red-200' },
    REJECTED:  { label: 'প্রত্যাখ্যাত', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>;
}

function SubmissionStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:      { label: 'অপেক্ষমাণ',    cls: 'bg-yellow-100 text-yellow-700' },
    UNDER_REVIEW: { label: 'পর্যালোচনায়',  cls: 'bg-blue-100 text-blue-700' },
    APPROVED:     { label: 'অনুমোদিত',     cls: 'bg-green-100 text-green-700' },
    REJECTED:     { label: 'প্রত্যাখ্যাত', cls: 'bg-red-100 text-red-700' },
    PUBLISHED:    { label: 'প্রকাশিত',     cls: 'bg-emerald-100 text-emerald-700' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

export default function SellerDashboardPage() {
  const { user } = useAuthStore();

  const { data: seller, isLoading: loadingSeller } = useQuery({
    queryKey: ['seller', 'me'],
    queryFn: sellerApi.getMe,
    retry: 1,
  });

  const { data: earnings, isLoading: loadingEarnings } = useQuery({
    queryKey: ['seller', 'earnings'],
    queryFn: sellerApi.myEarnings,
    enabled: seller?.status === 'ACTIVE',
    retry: 1,
  });

  const { data: submissionsData } = useQuery({
    queryKey: ['seller', 'submissions', 1],
    queryFn: () => sellerApi.mySubmissions(1),
    enabled: !!seller,
    retry: 1,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['seller', 'orders', 1],
    queryFn: () => sellerApi.myOrders(1),
    enabled: seller?.status === 'ACTIVE',
    retry: 1,
  });

  if (loadingSeller) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">সেলার হিসেবে আবেদন করুন</h2>
        <p className="text-gray-500 mb-2">আপনার এখনো কোনো সেলার প্রোফাইল নেই।</p>
        <p className="text-sm text-gray-400 mb-8">UNKORA-তে বই বিক্রি শুরু করতে প্রথমে সেলার হিসেবে নিবন্ধন করুন।</p>
        <Link href="/seller/apply"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5" /> সেলার হিসেবে আবেদন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900">{seller.shopName}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={seller.status} />
            {seller.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                <CheckCircle className="w-3 h-3" /> যাচাইকৃত
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">@{seller.shopSlug}</span>
          </div>
        </div>
        <Link href="/publish/submit"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" /> বই জমা দিন
        </Link>
      </div>

      {/* Status notices */}
      {seller.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 items-start">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">আবেদন পর্যালোচনাধীন</p>
            <p className="text-sm text-amber-700 mt-0.5">আপনার সেলার আবেদনটি টিম পর্যালোচনা করছে। সাধারণত ৩-৫ কার্যদিবস লাগে।</p>
          </div>
        </div>
      )}
      {seller.status === 'SUSPENDED' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">অ্যাকাউন্ট স্থগিত</p>
            <p className="text-sm text-red-700 mt-0.5">support@unkora.com-এ যোগাযোগ করুন।</p>
          </div>
        </div>
      )}

      {seller.status === 'ACTIVE' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: BookOpen,   color: 'text-blue-600 bg-blue-50',    label: 'মোট পণ্য',        value: String(earnings?.totalProducts ?? submissionsData?.meta.total ?? 0), link: '/seller/products',   trend: null },
              { icon: ShoppingBag,color: 'text-orange-600 bg-orange-50',label: 'মোট অর্ডার',      value: String(ordersData?.meta.total ?? 0),                                link: '/seller/orders',     trend: '+12%' },
              { icon: TrendingUp, color: 'text-green-600 bg-green-50',  label: 'মোট আয়',          value: formatCurrency(earnings?.totalEarned ?? 0),                         link: '/seller/earnings',   trend: '+18%' },
              { icon: Wallet,     color: 'text-purple-600 bg-purple-50',label: 'উপলব্ধ ব্যালেন্স',value: formatCurrency(earnings?.available ?? 0),                           link: '/seller/withdrawals',trend: null },
            ].map(stat => (
              <Link key={stat.label} href={stat.link}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-primary/20 transition-all shadow-sm group">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', stat.color)}>
                    <stat.icon className="w-4.5 h-4.5" />
                  </div>
                  {stat.trend && (
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-xl font-black text-gray-900 leading-none">{loadingEarnings ? '…' : stat.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{stat.label}</p>
                <p className="text-[11px] text-primary mt-2 group-hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  বিস্তারিত <ArrowRight className="w-2.5 h-2.5" />
                </p>
              </Link>
            ))}
          </div>

          {/* Revenue sparkline + alerts */}
          <div className="grid sm:grid-cols-[1fr_280px] gap-4">

            {/* Sparkline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">রাজস্ব ট্রেন্ড</h2>
                  <p className="text-xs text-gray-400">গত ৬ মাস</p>
                </div>
                <Link href="/seller/analytics" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  বিস্তারিত <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={SPARKLINE} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`৳${v.toLocaleString()}`, 'আয়']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} fill="url(#dashGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Alert items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <h2 className="font-bold text-gray-900">মনোযোগ প্রয়োজন</h2>
              {ALERTS.map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.href} href={a.href}
                    className={cn('flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold hover:opacity-80 transition-opacity', a.color)}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 leading-tight">{a.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-60 flex-shrink-0" />
                  </Link>
                );
              })}
              <Link href="/seller/analytics"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all mt-auto">
                <BarChart2 className="w-3.5 h-3.5" /> পূর্ণ বিশ্লেষণ দেখুন
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> দ্রুত একশন
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {QUICK_ACTIONS.map(qa => {
                const Icon = qa.icon;
                return (
                  <Link key={qa.href} href={qa.href}
                    className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all hover:scale-105', qa.color, qa.shadow && `shadow-sm ${qa.shadow}`)}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold leading-tight">{qa.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Recent submissions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">সাম্প্রতিক বই জমা</h2>
          <Link href="/seller/products" className="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
            সব দেখুন <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {submissionsData?.data.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">এখনো কোনো বই জমা দেওয়া হয়নি।</p>
            <Link href="/publish/submit" className="mt-3 inline-block text-primary text-sm font-bold hover:underline">
              প্রথম বই জমা দিন →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {submissionsData?.data.slice(0, 5).map(sub => (
              <div key={sub.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {sub.product?.images?.[0]?.url ? (
                    <img src={sub.product.images[0].url} alt={sub.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{sub.title}</p>
                  <p className="text-xs text-gray-400">{sub.authorName}</p>
                </div>
                <SubmissionStatus status={sub.status} />
                <p className="text-sm font-black text-gray-800 flex-shrink-0">৳{sub.suggestedPrice}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission info */}
      <div className="bg-gradient-to-r from-primary/8 to-emerald-50 rounded-2xl border border-primary/15 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-gray-900">আপনার কমিশন রেট</p>
              <p className="text-xs text-gray-500">প্রতিটি বিক্রয়ে আপনি পান</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-primary">{seller.commissionRate}%</p>
            <Link href="/seller/earnings" className="text-xs text-primary hover:underline font-semibold">আয় দেখুন →</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
