'use client';

import { useQuery } from '@tanstack/react-query';
import { sellerApi } from '@/lib/api/seller';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import {
  BookOpen, ShoppingBag, TrendingUp, Wallet,
  AlertCircle, CheckCircle, Clock, ArrowRight, Plus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE:    { label: 'সক্রিয়',    cls: 'bg-green-100 text-green-700 border-green-200' },
    PENDING:   { label: 'অপেক্ষমাণ', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    SUSPENDED: { label: 'স্থগিত',    cls: 'bg-red-100 text-red-700 border-red-200' },
    REJECTED:  { label: 'প্রত্যাখ্যাত', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>;
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
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  // Not a seller yet
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
          className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" /> সেলার হিসেবে আবেদন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{seller.shopName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={seller.status} />
            {seller.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            <span className="text-xs text-gray-400">@{seller.shopSlug}</span>
          </div>
        </div>
        <Link href="/publish/submit"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> বই জমা দিন
        </Link>
      </div>

      {/* Pending status notice */}
      {seller.status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex gap-4">
          <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-800 mb-1">আবেদন পর্যালোচনাধীন</h3>
            <p className="text-sm text-yellow-700">আপনার সেলার আবেদনটি আমাদের টিম পর্যালোচনা করছে। সাধারণত ৩-৫ কার্যদিবস সময় লাগে। অনুমোদনের পর আপনাকে ইমেইলে জানানো হবে।</p>
          </div>
        </div>
      )}

      {seller.status === 'SUSPENDED' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 mb-1">অ্যাকাউন্ট স্থগিত</h3>
            <p className="text-sm text-red-700">আপনার সেলার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। বিস্তারিত জানতে support@unkora.com-এ যোগাযোগ করুন।</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      {seller.status === 'ACTIVE' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: BookOpen, color: 'bg-blue-50 text-blue-600',
              label: 'মোট বই', value: String(earnings?.totalProducts ?? submissionsData?.meta.total ?? 0),
              link: '/seller/products',
            },
            {
              icon: ShoppingBag, color: 'bg-orange-50 text-orange-600',
              label: 'মোট অর্ডার', value: String(ordersData?.meta.total ?? 0),
              link: '/seller/orders',
            },
            {
              icon: TrendingUp, color: 'bg-green-50 text-green-600',
              label: 'মোট আয়', value: formatCurrency(earnings?.totalEarned ?? 0),
              link: '/seller/earnings',
            },
            {
              icon: Wallet, color: 'bg-purple-50 text-purple-600',
              label: 'উপলব্ধ ব্যালেন্স', value: formatCurrency(earnings?.available ?? 0),
              link: '/seller/withdrawals',
            },
          ].map(stat => (
            <Link key={stat.label} href={stat.link}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group shadow-sm"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-xl font-black text-gray-900 mt-0.5">{loadingEarnings ? '...' : stat.value}</p>
              <p className="text-xs text-primary mt-2 group-hover:underline flex items-center gap-1">
                দেখুন <ArrowRight className="w-3 h-3" />
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Recent submissions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">সাম্প্রতিক বই জমা</h2>
          <Link href="/seller/products" className="text-xs text-primary hover:underline flex items-center gap-1">
            সব দেখুন <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {submissionsData?.data.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">এখনো কোনো বই জমা দেওয়া হয়নি।</p>
            <Link href="/publish/submit" className="mt-3 inline-block text-primary text-sm font-semibold hover:underline">
              প্রথম বই জমা দিন →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {submissionsData?.data.slice(0, 5).map(sub => (
              <div key={sub.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                <div className="flex-shrink-0">
                  <SubmissionStatus status={sub.status} />
                </div>
                <div className="text-sm font-bold text-gray-700 flex-shrink-0">
                  ৳{sub.suggestedPrice}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission info */}
      <div className="bg-gradient-to-r from-primary/5 to-green-50 rounded-2xl border border-primary/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">আপনার কমিশন রেট</h3>
            <p className="text-sm text-gray-500">প্রতিটি বিক্রয়ে আপনি পাবেন</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-primary">{seller.commissionRate}%</p>
            <p className="text-xs text-gray-400">per sale</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:      { label: 'অপেক্ষমাণ',    cls: 'bg-yellow-100 text-yellow-700' },
    UNDER_REVIEW: { label: 'পর্যালোচনায়', cls: 'bg-blue-100 text-blue-700' },
    APPROVED:     { label: 'অনুমোদিত',     cls: 'bg-green-100 text-green-700' },
    REJECTED:     { label: 'প্রত্যাখ্যাত', cls: 'bg-red-100 text-red-700' },
    PUBLISHED:    { label: 'প্রকাশিত',     cls: 'bg-emerald-100 text-emerald-700' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}
