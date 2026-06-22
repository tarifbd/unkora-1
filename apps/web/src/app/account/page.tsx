'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Package, ShoppingBag, ArrowRight, Clock, Heart,
  Search, CalendarClock, Wallet, Star, Gift,
  RotateCcw, Eye, Bell, Shield, LifeBuoy,
  TrendingUp, MapPin, ChevronRight, Sparkles,
} from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const STATUS_BN: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:          { label: 'অপেক্ষমাণ',      cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
  CONFIRMED:        { label: 'নিশ্চিত',          cls: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
  PROCESSING:       { label: 'প্রক্রিয়াধীন',     cls: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  SHIPPED:          { label: 'পাঠানো হয়েছে',     cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400' },
  OUT_FOR_DELIVERY: { label: 'ডেলিভারিতে',       cls: 'bg-cyan-100 text-cyan-700 border-cyan-200',       dot: 'bg-cyan-400' },
  DELIVERED:        { label: 'ডেলিভারি হয়েছে',   cls: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-400' },
  CANCELLED:        { label: 'বাতিল',             cls: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400' },
};

const QUICK_LINKS = [
  { href: '/account/orders',          icon: Package,       label: 'অর্ডার',          en: 'Orders',         color: 'text-blue-600',   bg: 'bg-blue-50',   ring: 'ring-blue-100' },
  { href: '/account/returns',         icon: RotateCcw,     label: 'রিটার্ন',         en: 'Returns',        color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-100' },
  { href: '/account/wallet',          icon: Wallet,        label: 'ওয়ালেট',          en: 'Wallet',         color: 'text-emerald-600',bg: 'bg-emerald-50',ring: 'ring-emerald-100' },
  { href: '/account/points',          icon: Star,          label: 'পয়েন্ট',          en: 'Points',         color: 'text-amber-600',  bg: 'bg-amber-50',  ring: 'ring-amber-100' },
  { href: '/account/wishlist',        icon: Heart,         label: 'উইশলিস্ট',         en: 'Wishlist',       color: 'text-pink-600',   bg: 'bg-pink-50',   ring: 'ring-pink-100' },
  { href: '/account/recently-viewed', icon: Eye,           label: 'সাম্প্রতিক',       en: 'Recent',         color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-100' },
  { href: '/account/preorders',       icon: CalendarClock, label: 'প্রি-অর্ডার',      en: 'Pre-orders',     color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-100' },
  { href: '/account/referrals',       icon: Gift,          label: 'রেফারেল',          en: 'Referrals',      color: 'text-rose-600',   bg: 'bg-rose-50',   ring: 'ring-rose-100' },
  { href: '/account/notifications',   icon: Bell,          label: 'নোটিফিকেশন',      en: 'Alerts',         color: 'text-sky-600',    bg: 'bg-sky-50',    ring: 'ring-sky-100' },
  { href: '/account/security',        icon: Shield,        label: 'নিরাপত্তা',        en: 'Security',       color: 'text-gray-600',   bg: 'bg-gray-100',  ring: 'ring-gray-200' },
  { href: '/account/addresses',       icon: MapPin,        label: 'ঠিকানা',           en: 'Addresses',      color: 'text-green-600',  bg: 'bg-green-50',  ring: 'ring-green-100' },
  { href: '/account/support',         icon: LifeBuoy,      label: 'সাপোর্ট',          en: 'Support',        color: 'text-teal-600',   bg: 'bg-teal-50',   ring: 'ring-teal-100' },
];

export default function AccountDashboard() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders({ limit: 5 }),
  });

  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? 'ব্যবহারকারী';
  const totalOrders = data?.meta?.total ?? 0;
  const totalSpent  = data?.data?.reduce((s: number, o: { total: string }) => s + Number(o.total), 0) ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'শুভ সকাল' : hour < 17 ? 'শুভ অপরাহ্ন' : 'শুভ সন্ধ্যা';

  return (
    <div className="space-y-5">

      {/* Welcome hero */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-emerald-500 rounded-2xl px-6 py-6 text-white overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-4 bottom-0 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative">
          <p className="text-sm text-white/70 font-medium mb-0.5">{greeting} 👋</p>
          <h1 className="text-2xl font-black">{firstName}</h1>
          <p className="text-sm text-white/70 mt-1.5">আপনার অ্যাকাউন্টে স্বাগতম</p>
          <div className="flex items-center gap-3 mt-4">
            <Link href="/account/orders"
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Package className="w-3.5 h-3.5" /> অর্ডার দেখুন
            </Link>
            <Link href="/track-order"
              className="flex items-center gap-1.5 bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-sm">
              <Search className="w-3.5 h-3.5" /> ট্র্যাক করুন
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট অর্ডার',  value: totalOrders,                   icon: Package,    color: 'text-blue-600 bg-blue-50',    href: '/account/orders'  },
          { label: 'মোট ক্রয়',    value: `৳${totalSpent.toLocaleString()}`, icon: ShoppingBag,color: 'text-emerald-600 bg-emerald-50', href: '/account/orders'  },
          { label: 'ওয়ালেট',      value: '৳4,140',                      icon: Wallet,     color: 'text-purple-600 bg-purple-50', href: '/account/wallet'  },
          { label: 'ক্লাব পয়েন্ট',value: '480 pts',                    icon: Star,       color: 'text-amber-600 bg-amber-50',  href: '/account/points'  },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-primary/20 transition-all shadow-sm group">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', s.color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-lg font-black text-gray-900 leading-none">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-medium">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-black text-gray-900">সাম্প্রতিক অর্ডার</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            সব দেখুন <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!data?.data?.length ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-bold text-gray-700">এখনো কোনো অর্ডার নেই</p>
            <p className="text-sm text-gray-400 mt-1">কেনাকাটা শুরু করুন!</p>
            <Link href="/"
              className="mt-4 inline-flex items-center gap-2 bg-primary text-white font-bold py-2 px-5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
              পণ্য দেখুন <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.data.map((order: { id: string; orderNumber: string; status: string; total: string; createdAt: string }) => {
              const s = STATUS_BN[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
              return (
                <Link key={order.id} href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">#{order.orderNumber}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(order.createdAt).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border hidden sm:inline-flex', s.cls)}>{s.label}</span>
                    </div>
                    <span className="font-black text-sm text-gray-900">৳{Number(order.total).toLocaleString()}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-black text-gray-900">দ্রুত নেভিগেশন</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
          {QUICK_LINKS.map(q => {
            const Icon = q.icon;
            return (
              <Link key={q.href} href={q.href}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl hover:shadow-sm transition-all text-center group border border-transparent hover:border-gray-100',
                )}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-4 transition-all group-hover:scale-110', q.bg, q.ring)}>
                  <Icon className={cn('w-4.5 h-4.5', q.color)} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 leading-tight">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Rewards & Wallet summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/account/wallet"
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white hover:opacity-95 transition-opacity shadow-md shadow-emerald-100 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <Wallet className="w-5 h-5 text-white/70 mb-2" />
          <p className="text-2xl font-black">৳4,140</p>
          <p className="text-sm text-white/70 mt-0.5">ওয়ালেট ব্যালেন্স</p>
          <div className="flex items-center gap-1 mt-3 text-xs font-bold text-white/80">
            টপ-আপ বা ব্যবহার করুন <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link href="/account/points"
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white hover:opacity-95 transition-opacity shadow-md shadow-amber-100 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <Star className="w-5 h-5 text-white/70 mb-2" />
          <p className="text-2xl font-black">480 pts</p>
          <p className="text-sm text-white/70 mt-0.5">ক্লাব পয়েন্ট · Bronze</p>
          <div className="flex items-center gap-1 mt-3 text-xs font-bold text-white/80">
            পুরস্কার রিডিম করুন <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Promo strip */}
      <div className="bg-gradient-to-r from-primary/10 via-emerald-50 to-primary/5 rounded-2xl border border-primary/20 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">বন্ধু রেফার করুন — ৳200 পান</p>
            <p className="text-xs text-gray-500">প্রতিটি সফল রেফারেলে ২০০ পয়েন্ট আপনার জন্য</p>
          </div>
        </div>
        <Link href="/account/referrals"
          className="flex-shrink-0 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
          রেফার করুন
        </Link>
      </div>

    </div>
  );
}
