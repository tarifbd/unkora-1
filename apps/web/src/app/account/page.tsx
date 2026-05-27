'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, ArrowRight, Clock, MapPin, Heart, Search, CalendarClock } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { useAuthStore } from '@/store/auth.store';

const STATUS_BN: Record<string, { label: string; cls: string }> = {
  PENDING:          { label: 'অপেক্ষমাণ',      cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  CONFIRMED:        { label: 'নিশ্চিত',          cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  PROCESSING:       { label: 'প্রক্রিয়াধীন',     cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  SHIPPED:          { label: 'পাঠানো হয়েছে',     cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  OUT_FOR_DELIVERY: { label: 'ডেলিভারিতে',       cls: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  DELIVERED:        { label: 'ডেলিভারি হয়েছে',   cls: 'bg-green-100 text-green-700 border-green-200' },
  CANCELLED:        { label: 'বাতিল',             cls: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AccountDashboard() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders({ limit: 5 }),
  });

  const firstName = user?.firstName ?? user?.name?.split(' ')[0] ?? 'ব্যবহারকারী';
  const totalOrders = data?.meta?.total ?? 0;
  const totalSpent = data?.data?.reduce((sum: number, o: { total: string }) => sum + Number(o.total), 0) ?? 0;

  return (
    <div className="space-y-4">

      {/* Welcome banner */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 shadow-sm">
        <h1 className="text-xl font-black text-gray-900">স্বাগতম, {firstName}! 👋</h1>
        <p className="text-sm text-gray-500 mt-1">আপনার অ্যাকাউন্ট থেকে অর্ডার ট্র্যাক করুন, ঠিকানা ম্যানেজ করুন এবং আরও অনেক কিছু।</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">মোট অর্ডার</p>
              <p className="text-3xl font-black text-gray-900 mt-0.5">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>
          <Link href="/account/orders" className="mt-3 flex items-center gap-1 text-xs font-bold text-primary hover:underline">
            সব অর্ডার দেখুন <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">মোট ক্রয়</p>
              <p className="text-3xl font-black text-gray-900 mt-0.5">৳{totalSpent.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">সর্বশেষ ৫টি অর্ডার অনুযায়ী</p>
        </div>
      </div>

      {/* Recent Orders */}
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
            <Link href="/products"
              className="mt-4 inline-flex items-center gap-2 bg-primary text-white font-bold py-2 px-5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
              পণ্য দেখুন
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.data.map((order: { id: string; orderNumber: string; status: string; total: string; createdAt: string }) => {
              const s = STATUS_BN[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
              return (
                <Link key={order.id} href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-900">#{order.orderNumber}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}>{s.label}</span>
                    <span className="font-black text-sm text-gray-900">৳{Number(order.total).toLocaleString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/account/orders',    icon: Package,       label: 'অর্ডার',          color: 'text-blue-600',   bg: 'bg-blue-50' },
          { href: '/account/wishlist',  icon: Heart,         label: 'উইশলিস্ট',         color: 'text-pink-600',   bg: 'bg-pink-50' },
          { href: '/account/preorders', icon: CalendarClock, label: 'প্রি-অর্ডার',       color: 'text-purple-600', bg: 'bg-purple-50' },
          { href: '/account/addresses', icon: MapPin,        label: 'ঠিকানা',            color: 'text-green-600',  bg: 'bg-green-50' },
          { href: '/track-order',       icon: Search,        label: 'ট্র্যাক অর্ডার',   color: 'text-orange-600', bg: 'bg-orange-50' },
          { href: '/account/profile',   icon: ShoppingBag,   label: 'প্রোফাইল',          color: 'text-gray-600',   bg: 'bg-gray-100' },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${q.bg} flex items-center justify-center`}>
              <q.icon className={`w-5 h-5 ${q.color}`} />
            </div>
            <span className="text-xs font-bold text-gray-700">{q.label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
