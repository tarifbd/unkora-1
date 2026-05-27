'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Clock, Zap, Package, CalendarClock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

interface PreorderData {
  id: string;
  productId: string;
  prepaymentPct: number;
  expectedDelivery?: string;
  finalPaymentDueDate?: string;
  stockLimit?: number;
  isActive: boolean;
  _count?: { orders: number };
  product?: { name: string; basePrice: number; salePrice?: number };
}

interface PreorderCTAProps {
  productId: string;
  productName: string;
  basePrice: number;
  salePrice?: number;
  qty?: number;
}

function useCountdownTo(target?: string) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setLeft({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

export function PreorderCTA({ productId, productName, basePrice, salePrice, qty = 1 }: PreorderCTAProps) {
  const { isAuthenticated } = useAuthStore();
  const price = Number(salePrice ?? basePrice);

  const { data: preorder, isLoading } = useQuery<PreorderData>({
    queryKey: ['preorder', productId],
    queryFn: () => fetch(`${API}/preorders/product/${productId}`).then(r => r.ok ? r.json() : null).catch(() => null),
    retry: false,
    staleTime: 60000,
  });

  const countdown = useCountdownTo(preorder?.expectedDelivery ?? undefined);

  if (isLoading) return (
    <div className="preorder-skeleton rounded-2xl h-48 animate-pulse bg-gradient-to-r from-violet-100 to-purple-100" />
  );

  if (!preorder?.isActive) return null;

  const prepayAmt = Math.ceil(price * qty * (preorder.prepaymentPct / 100));
  const remaining = preorder.stockLimit != null
    ? preorder.stockLimit - (preorder._count?.orders ?? 0)
    : null;
  const isSoldOut = remaining !== null && remaining <= 0;

  return (
    <div className="preorder-cta-wrapper">
      {/* CSS styles */}
      <style>{`
        @keyframes preorder-aurora {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes preorder-pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes preorder-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes preorder-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes preorder-countdown-pop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .preorder-aurora {
          background: linear-gradient(135deg, #4c1d95, #7c3aed, #a855f7, #ec4899, #8b5cf6, #4c1d95);
          background-size: 300% 300%;
          animation: preorder-aurora 4s ease infinite;
        }
        .preorder-btn {
          background: linear-gradient(90deg, #fbbf24, #f97316, #ef4444, #f97316, #fbbf24);
          background-size: 300% 100%;
          animation: preorder-shimmer 2.5s linear infinite;
          position: relative;
          overflow: hidden;
        }
        .preorder-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
          transform: translateX(-100%);
          animation: preorder-shimmer 2.5s linear infinite;
        }
        .preorder-float { animation: preorder-float 3s ease-in-out infinite; }
        .preorder-ring {
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          border: 2px solid rgba(167, 139, 250, 0.6);
          animation: preorder-pulse-ring 2s ease-out infinite;
        }
        .preorder-ring-2 {
          animation-delay: 0.7s;
        }
        .countdown-digit {
          animation: preorder-countdown-pop 1s ease-in-out;
        }
      `}</style>

      <div className="relative rounded-2xl overflow-hidden">
        {/* Animated gradient background */}
        <div className="preorder-aurora absolute inset-0 opacity-90" />

        {/* Content */}
        <div className="relative z-10 p-5 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="preorder-float relative">
                <div className="preorder-ring" />
                <div className="preorder-ring preorder-ring-2" />
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CalendarClock className="h-5 w-5 text-yellow-300" />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-200">প্রি-অর্ডার</div>
                <div className="text-lg font-black leading-tight">Pre-Order Available!</div>
              </div>
            </div>
            {remaining !== null && (
              <div className="text-right">
                <div className="text-2xl font-black text-yellow-300">{remaining}</div>
                <div className="text-[10px] text-purple-200">slots left</div>
              </div>
            )}
          </div>

          {/* Countdown to delivery */}
          {preorder.expectedDelivery && !countdown.expired && (
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Delivery countdown
              </div>
              <div className="flex gap-2">
                {[
                  { v: countdown.d, l: 'Days' },
                  { v: countdown.h, l: 'Hrs' },
                  { v: countdown.m, l: 'Min' },
                  { v: countdown.s, l: 'Sec' },
                ].map(({ v, l }) => (
                  <div key={l} className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl py-2 text-center">
                    <div className="countdown-digit text-xl font-black tabular-nums">{String(v).padStart(2, '0')}</div>
                    <div className="text-[9px] text-purple-200 font-bold">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {preorder.expectedDelivery && countdown.expired && (
            <div className="mb-4 flex items-center gap-2 bg-green-500/30 rounded-xl px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-300" />
              <span className="text-sm font-bold text-green-200">Delivery date reached — shipping soon!</span>
            </div>
          )}

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-xs font-bold">Pay only {preorder.prepaymentPct}% now</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Package className="h-3.5 w-3.5 text-green-300" />
              <span className="text-xs font-bold">
                ৳{prepayAmt.toLocaleString('en-BD')} prepayment
              </span>
            </div>
            {preorder.expectedDelivery && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-blue-300" />
                <span className="text-xs font-bold">
                  Ships {new Date(preorder.expectedDelivery).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {isSoldOut ? (
            <div className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/20 text-white/60 font-bold text-sm">
              <AlertCircle className="h-4 w-4" />
              Pre-order slots sold out
            </div>
          ) : isAuthenticated ? (
            <Link
              href={`/checkout?productId=${productId}&qty=${qty}&preorder=1`}
              className="preorder-btn flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-black text-sm shadow-lg shadow-orange-900/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <CalendarClock className="h-4 w-4" />
              প্রি-অর্ডার করুন — ৳{prepayAmt.toLocaleString('en-BD')} এখন দিন
            </Link>
          ) : (
            <Link
              href={`/login?redirect=/products/${productId}`}
              className="preorder-btn flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-black text-sm shadow-lg shadow-orange-900/30 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <CalendarClock className="h-4 w-4" />
              লগইন করে প্রি-অর্ডার করুন
            </Link>
          )}

          {/* Fine print */}
          <p className="text-[10px] text-purple-200 text-center mt-2">
            বাকি {100 - preorder.prepaymentPct}% পণ্য ডেলিভারির সময় দিতে হবে
          </p>
        </div>
      </div>
    </div>
  );
}
