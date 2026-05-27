'use client';

import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import Link from 'next/link';
import { TrendingUp, Wallet, CheckCircle, Clock, ArrowRight, Loader2, BookOpen, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function SellerEarningsPage() {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['seller', 'earnings'],
    queryFn: sellerApi.myEarnings,
  });

  const { data: seller } = useQuery({
    queryKey: ['seller', 'me'],
    queryFn: sellerApi.getMe,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!earnings) return null;

  const cards = [
    {
      icon: TrendingUp, color: 'bg-blue-50 text-blue-600',
      label: 'মোট বিক্রয় (গ্রস)',
      sublabel: 'Total Gross Sales',
      value: formatCurrency(earnings.totalGross),
      note: `${earnings.deliveredOrders} টি ডেলিভার হওয়া অর্ডার`,
    },
    {
      icon: CheckCircle, color: 'bg-green-50 text-green-600',
      label: 'মোট আয়',
      sublabel: `${earnings.commissionRate}% কমিশন`,
      value: formatCurrency(earnings.totalEarned),
      note: 'ডেলিভারি সম্পন্ন অর্ডার থেকে',
    },
    {
      icon: Wallet, color: 'bg-purple-50 text-purple-600',
      label: 'উত্তোলন করা হয়েছে',
      sublabel: 'Total Withdrawn',
      value: formatCurrency(earnings.withdrawn),
      note: 'অনুমোদিত উত্তোলন',
    },
    {
      icon: Clock, color: 'bg-orange-50 text-orange-600',
      label: 'অপেক্ষমাণ উত্তোলন',
      sublabel: 'Pending Withdrawal',
      value: formatCurrency(earnings.pendingWithdrawal),
      note: 'প্রক্রিয়াধীন',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">আয়</h1>
        <p className="text-sm text-gray-500">Earnings Overview</p>
      </div>

      {/* Available balance hero */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative">
          <p className="text-gray-400 text-sm mb-1">উপলব্ধ ব্যালেন্স</p>
          <p className="text-4xl font-black text-white mb-4">{formatCurrency(earnings.available)}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {earnings.available >= 100 ? (
              <Link href="/seller/withdrawals"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                <Wallet className="w-4 h-4" /> উত্তোলন করুন <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/60 font-semibold py-2.5 px-6 rounded-xl text-sm">
                সর্বনিম্ন ৳100 প্রয়োজন
              </div>
            )}
            <Link href="/seller/withdrawals"
              className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold py-2.5 px-6 rounded-xl text-sm hover:bg-white/10 transition-colors"
            >
              উত্তোলন ইতিহাস
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            <p className="text-xs text-gray-400">{card.sublabel}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.note}</p>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">দ্রুত পরিসংখ্যান</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900">{earnings.totalProducts}</p>
            <p className="text-xs text-gray-500">প্রকাশিত বই</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900">{earnings.deliveredOrders + earnings.pendingOrders}</p>
            <p className="text-xs text-gray-500">মোট অর্ডার</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-black text-gray-900">{earnings.commissionRate}%</p>
            <p className="text-xs text-gray-500">কমিশন রেট</p>
          </div>
        </div>
      </div>

      {/* Breakdown explanation */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-bold text-blue-900 mb-3 text-sm">আয় হিসাব কিভাবে হয়?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex justify-between">
            <span>মোট বিক্রয় (ডেলিভার হওয়া)</span>
            <span className="font-bold">{formatCurrency(earnings.totalGross)}</span>
          </div>
          <div className="flex justify-between">
            <span>× কমিশন রেট ({earnings.commissionRate}%)</span>
            <span className="font-bold">= {formatCurrency(earnings.totalEarned)}</span>
          </div>
          <div className="flex justify-between border-t border-blue-200 pt-2">
            <span>- উত্তোলন করা হয়েছে</span>
            <span className="font-bold text-red-600">- {formatCurrency(earnings.withdrawn)}</span>
          </div>
          <div className="flex justify-between">
            <span>- অপেক্ষমাণ উত্তোলন</span>
            <span className="font-bold text-orange-600">- {formatCurrency(earnings.pendingWithdrawal)}</span>
          </div>
          <div className="flex justify-between border-t border-blue-300 pt-2 font-black text-blue-900">
            <span>= উপলব্ধ ব্যালেন্স</span>
            <span>{formatCurrency(earnings.available)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
