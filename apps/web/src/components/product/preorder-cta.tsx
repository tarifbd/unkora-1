'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { CalendarClock, AlertCircle, CheckCircle2, Sparkles, Clock3, Package2, Zap, Lock } from 'lucide-react';
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
      setLeft({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000), expired: false });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);
  return left;
}

/* ── Hyper-modern countdown digit ───────────────────────── */
function CountdownDigit({ value, label }: { value: number; label: string }) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (prev.current !== value) { setFlip(true); prev.current = value; setTimeout(() => setFlip(false), 300); }
  }, [value]);
  const display = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {/* Neon container */}
        <div className={`
          relative w-14 h-14 rounded-2xl overflow-hidden
          bg-black/40 border border-white/10
          flex items-center justify-center
          shadow-[0_0_20px_rgba(167,243,208,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]
          ${flip ? 'scale-95' : 'scale-100'} transition-transform duration-150
        `}>
          {/* Top reflection */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
          {/* Number */}
          <span className="font-black text-2xl tabular-nums text-white" style={{
            textShadow: '0 0 20px rgba(134,239,172,0.8), 0 0 40px rgba(134,239,172,0.4)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {display}
          </span>
          {/* Bottom separator line */}
          <div className="absolute inset-x-3 top-1/2 h-px bg-black/60 pointer-events-none" />
        </div>
        {/* Neon glow behind */}
        <div className="absolute inset-0 rounded-2xl blur-lg opacity-25 bg-emerald-400 -z-10 scale-75" />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">{label}</span>
    </div>
  );
}

/* ── Main PreorderCTA ───────────────────────────────────── */
export function PreorderCTA({ productId, productName, basePrice, salePrice, qty = 1 }: PreorderCTAProps) {
  const { isAuthenticated } = useAuthStore();
  const price = Number(salePrice ?? basePrice);
  const [hovered, setHovered] = useState(false);

  const { data: preorder, isLoading } = useQuery<PreorderData>({
    queryKey: ['preorder', productId],
    queryFn: () => fetch(`${API}/preorders/product/${productId}`).then(r => r.ok ? r.json() : null).catch(() => null),
    retry: false,
    staleTime: 60000,
  });

  const countdown = useCountdownTo(preorder?.expectedDelivery ?? undefined);

  if (isLoading) return (
    <div className="h-52 rounded-3xl skeleton" />
  );
  if (!preorder?.isActive) return null;

  const prepayAmt   = Math.ceil(price * qty * (preorder.prepaymentPct / 100));
  const remaining   = preorder.stockLimit != null ? preorder.stockLimit - (preorder._count?.orders ?? 0) : null;
  const isSoldOut   = remaining !== null && remaining <= 0;
  const urgency     = remaining !== null && remaining <= 10;
  const checkoutHref = isAuthenticated
    ? `/checkout?productId=${productId}&qty=${qty}&preorder=1`
    : `/login?redirect=/products/${productId}`;

  return (
    <div className="preorder-cta-root">
      <style>{`
        @keyframes po-aurora   { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes po-shimmer  { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes po-orbit    { from{transform:rotate(0deg) translateX(28px) rotate(0deg)} to{transform:rotate(360deg) translateX(28px) rotate(-360deg)} }
        @keyframes po-pulse-ring { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.8);opacity:0} }
        @keyframes po-badge-pop  { 0%{transform:scale(0.8) translateY(4px);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes po-float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes po-glow-btn   { 0%,100%{box-shadow:0 0 24px rgba(52,211,153,.4),0 8px 32px rgba(52,211,153,.2)} 50%{box-shadow:0 0 40px rgba(52,211,153,.6),0 8px 48px rgba(52,211,153,.3)} }

        .po-aurora-bg {
          background: linear-gradient(135deg, #064e3b, #065f46, #047857, #0d9488, #0e7490, #065f46, #064e3b);
          background-size: 400% 400%;
          animation: po-aurora 6s ease infinite;
        }
        .po-main-btn {
          background: linear-gradient(135deg, #10b981, #059669, #047857);
          transition: all .25s ease;
          animation: po-glow-btn 3s ease-in-out infinite;
        }
        .po-main-btn:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.1); }
        .po-main-btn:active { transform: scale(.97); }
        .po-shimmer-line::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.15) 50%,transparent 100%);
          animation: po-shimmer 2.5s ease-in-out infinite;
        }
        .po-orbit-dot { animation: po-orbit 4s linear infinite; }
        .po-float     { animation: po-float 3s ease-in-out infinite; }
        .po-pulse-ring{ animation: po-pulse-ring 2s ease-out infinite; }
        .po-badge-anim{ animation: po-badge-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
        .po-sold-out  { background: linear-gradient(135deg,#1f2937,#111827); }
      `}</style>

      <div
        className="relative rounded-3xl overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Layered background ── */}
        <div className="po-aurora-bg absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
        {/* Grid texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* ── Content ── */}
        <div className="relative z-10 p-5 sm:p-6 space-y-4">

          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Animated icon */}
              <div className="po-float relative w-12 h-12 flex-shrink-0">
                {/* Orbiting dot */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="po-orbit-dot w-2 h-2 rounded-full bg-emerald-300/80 shadow-[0_0_6px_rgba(134,239,172,0.9)]" />
                </div>
                {/* Pulse rings */}
                <div className="po-pulse-ring absolute inset-0 rounded-full border-2 border-emerald-400/40" />
                <div className="po-pulse-ring absolute inset-0 rounded-full border-2 border-emerald-400/20" style={{animationDelay:'.8s'}} />
                {/* Core circle */}
                <div className="absolute inset-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <CalendarClock className="w-4 h-4 text-emerald-300" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300/80">প্রি-অর্ডার ওপেন</span>
                </div>
                <div className="text-xl font-black text-white leading-tight">Pre-Order Available</div>
              </div>
            </div>

            {/* Slots badge */}
            {remaining !== null && (
              <div className={`po-badge-anim flex-shrink-0 text-center px-3 py-1.5 rounded-2xl border backdrop-blur-sm
                ${urgency ? 'bg-red-500/20 border-red-400/40' : 'bg-white/10 border-white/15'}`}>
                <div className={`text-xl font-black leading-none ${urgency ? 'text-red-300' : 'text-yellow-300'}`}>{remaining}</div>
                <div className={`text-[8px] font-bold mt-0.5 ${urgency ? 'text-red-400' : 'text-white/50'}`}>
                  {urgency ? '⚡ শেষ হচ্ছে' : 'slots left'}
                </div>
              </div>
            )}
          </div>

          {/* Countdown */}
          {preorder.expectedDelivery && !countdown.expired && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Clock3 className="w-3 h-3 text-white/40" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Delivery Countdown</span>
              </div>
              <div className="flex gap-2">
                <CountdownDigit value={countdown.d} label="Days" />
                <div className="flex items-center pb-5 text-white/30 font-black text-xl">:</div>
                <CountdownDigit value={countdown.h} label="Hours" />
                <div className="flex items-center pb-5 text-white/30 font-black text-xl">:</div>
                <CountdownDigit value={countdown.m} label="Mins" />
                <div className="flex items-center pb-5 text-white/30 font-black text-xl">:</div>
                <CountdownDigit value={countdown.s} label="Secs" />
              </div>
            </div>
          )}
          {preorder.expectedDelivery && countdown.expired && (
            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <span className="text-sm font-bold text-emerald-200">Delivery date reached — shipping soon!</span>
            </div>
          )}

          {/* Info pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Zap,      color: 'text-yellow-300', text: `মাত্র ${preorder.prepaymentPct}% এখন দিন` },
              { icon: Package2, color: 'text-blue-300',   text: `৳${prepayAmt.toLocaleString('en-BD')} prepay` },
              ...(preorder.expectedDelivery ? [{ icon: CalendarClock, color: 'text-purple-300', text: new Date(preorder.expectedDelivery).toLocaleDateString('en-BD', { day:'numeric', month:'short' }) + ' delivery' }] : []),
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <Icon className={`h-3 w-3 flex-shrink-0 ${color}`} />
                <span className="text-xs font-semibold text-white/90">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          {isSoldOut ? (
            <div className="po-sold-out flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white/40 font-bold text-sm border border-white/10">
              <AlertCircle className="h-4 w-4" />
              Pre-order slots sold out
            </div>
          ) : (
            <Link
              href={checkoutHref}
              className="po-main-btn po-shimmer-line relative flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-black text-sm overflow-hidden"
            >
              {isAuthenticated ? (
                <>
                  <CalendarClock className="h-4 w-4 flex-shrink-0" />
                  প্রি-অর্ডার করুন — ৳{prepayAmt.toLocaleString('en-BD')} এখন দিন
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  লগইন করে প্রি-অর্ডার করুন
                </>
              )}
            </Link>
          )}

          {/* Fine print */}
          <p className="text-center text-[10px] text-white/30 leading-relaxed">
            বাকি {100 - preorder.prepaymentPct}% পণ্য ডেলিভারির সময় পেমেন্ট করতে হবে
          </p>
        </div>

        {/* Bottom glow bar */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   COMPACT inline preorder badge — for product cards / grids
──────────────────────────────────────────────────────────── */
export function PreorderBadge({ productId, basePrice, salePrice }: {
  productId: string; basePrice: number; salePrice?: number;
}) {
  const { data: preorder } = useQuery<PreorderData>({
    queryKey: ['preorder', productId],
    queryFn: () => fetch(`${API}/preorders/product/${productId}`).then(r => r.ok ? r.json() : null).catch(() => null),
    retry: false, staleTime: 60000,
  });

  if (!preorder?.isActive) return null;
  const price = Number(salePrice ?? basePrice);
  const prepay = Math.ceil(price * (preorder.prepaymentPct / 100));

  return (
    <Link
      href={`/checkout?productId=${productId}&qty=1&preorder=1`}
      onClick={e => e.stopPropagation()}
      className="group relative flex items-center justify-center gap-1.5 w-full py-2 rounded-xl overflow-hidden font-black text-xs text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg, #047857, #0d9488)', boxShadow: '0 4px 12px rgba(4,120,87,0.35)' }}
    >
      {/* Shimmer */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Pre-order · ৳{prepay.toLocaleString('en-BD')}</span>
    </Link>
  );
}
