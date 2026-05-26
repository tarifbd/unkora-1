'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, AlertTriangle, Phone, MapPin, Clock, Ban,
  CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp,
  Search, Shield, Zap, Activity, User, Package, CreditCard,
  ShieldCheck, Eye, TrendingUp, AlertCircle, X, Moon,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total?: string;
  totalAmount?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
    createdAt: string;
    _count?: { orders: number };
  };
  guestPhone?: string;
  guestEmail?: string;
  guestName?: string;
  shippingAddress?: {
    phone?: string;
    address?: string;
    street?: string;
    city?: string;
    district?: string;
    area?: string;
  };
  items?: Array<{
    productId: string;
    quantity: number;
    price: string;
    productName?: string;
    product?: { name?: string };
  }>;
}

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface FraudFlag {
  type: string;
  severity: Severity;
  label: string;
  detail: string;
  points: number;
}

// ─── Detection Engine ─────────────────────────────────────────────────────────

const BD_FAKE_PHONE = [
  /^01{5,}/,
  /^01234/,
  /^09999/,
  /^01111111/,
  /^01000000/,
  /^(\d)\1{9,}/,
  /^01[^3-9]/,
];

function isFakePhone(phone?: string): boolean {
  if (!phone) return false;
  const p = phone.replace(/[\s\-+()]/g, '');
  return BD_FAKE_PHONE.some(r => r.test(p));
}

function orderAmount(o: Order): number {
  return Number(o.total ?? o.totalAmount ?? 0);
}

function analyzeOrder(order: Order, allOrders: Order[]): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const amount = orderAmount(order);
  const phone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone;
  const addr = order.shippingAddress;
  const hour = new Date(order.createdAt).getHours();
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  // ── CRITICAL flags ──────────────────────────────────────────────────────────

  if (isFakePhone(phone)) {
    flags.push({
      type: 'fake_phone',
      severity: 'critical',
      label: 'Fake Phone Number',
      detail: `Pattern matches known fake BD numbers: ${phone}`,
      points: 40,
    });
  }

  if (order.user) {
    const ageDays = (Date.now() - new Date(order.user.createdAt).getTime()) / 86400000;
    if (ageDays < 1 && amount > 1500) {
      flags.push({
        type: 'same_day_account',
        severity: 'critical',
        label: 'Same-day Account + High Order',
        detail: `Account created today, order ৳${amount.toLocaleString()}`,
        points: 45,
      });
    }
  }

  // ── HIGH flags ───────────────────────────────────────────────────────────────

  if (order.paymentMethod === 'COD' && amount > 8000) {
    flags.push({
      type: 'very_high_cod',
      severity: 'high',
      label: 'Very High COD (>৳8K)',
      detail: `৳${amount.toLocaleString()} cash-on-delivery — very high risk`,
      points: 30,
    });
  } else if (order.paymentMethod === 'COD' && amount > 3000) {
    flags.push({
      type: 'high_cod',
      severity: 'medium',
      label: 'High Value COD',
      detail: `৳${amount.toLocaleString()} cash-on-delivery`,
      points: 18,
    });
  }

  if (order.user) {
    const ageDays = (Date.now() - new Date(order.user.createdAt).getTime()) / 86400000;
    if (ageDays < 3 && amount > 2000) {
      flags.push({
        type: 'new_account_large',
        severity: 'high',
        label: 'New Account Large Order',
        detail: `Account only ${Math.floor(ageDays)}d old, order ৳${amount.toLocaleString()}`,
        points: 28,
      });
    }
  }

  if (order.user) {
    const recentSameUser = allOrders.filter(o => {
      if (o.id === order.id || o.user?.id !== order.user?.id) return false;
      return Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime()) < 30 * 60 * 1000;
    });
    if (recentSameUser.length >= 2) {
      flags.push({
        type: 'rapid_orders',
        severity: 'high',
        label: 'Rapid Order Burst',
        detail: `${recentSameUser.length + 1} orders in 30 min from same account`,
        points: 25,
      });
    }
  }

  // ── MEDIUM flags ─────────────────────────────────────────────────────────────

  if (hour >= 1 && hour <= 4) {
    flags.push({
      type: 'night_order',
      severity: 'medium',
      label: 'Late Night Order',
      detail: `Placed at ${hour}:00 AM — higher fraud window`,
      points: 15,
    });
  }

  if (totalItems > 10) {
    flags.push({
      type: 'bulk_quantity',
      severity: 'medium',
      label: 'Bulk Quantity',
      detail: `${totalItems} items — possible reselling or fake order`,
      points: 15,
    });
  }

  if (addr?.street) {
    const cancelled = allOrders.filter(o =>
      o.id !== order.id &&
      o.shippingAddress?.street === addr.street &&
      o.shippingAddress?.city === addr.city &&
      o.status === 'CANCELLED'
    );
    if (cancelled.length >= 2) {
      flags.push({
        type: 'repeat_cancel_addr',
        severity: 'medium',
        label: 'Repeat Cancelled Address',
        detail: `${cancelled.length} previous cancellations to this address`,
        points: 20,
      });
    }
  }

  if (!phone || phone.length < 10) {
    flags.push({
      type: 'missing_phone',
      severity: 'medium',
      label: 'Missing / Short Phone',
      detail: 'No valid contact number provided',
      points: 12,
    });
  }

  // ── LOW flags ────────────────────────────────────────────────────────────────

  if (!order.user && amount > 1500) {
    flags.push({
      type: 'guest_high_value',
      severity: 'low',
      label: 'Guest + High Value',
      detail: `Guest order of ৳${amount.toLocaleString()} — no account to track`,
      points: 10,
    });
  }

  if (order.user && (order.user._count?.orders ?? 0) === 0 && amount > 2500) {
    flags.push({
      type: 'first_order_large',
      severity: 'low',
      label: 'First-Ever Order, Large Value',
      detail: `No previous orders, immediately placed ৳${amount.toLocaleString()}`,
      points: 10,
    });
  }

  return flags;
}

function calcScore(flags: FraudFlag[]): number {
  const raw = flags.reduce((s, f) => s + f.points, 0);
  return Math.min(100, raw);
}

function scoreThreat(score: number): Severity {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

// ─── Style maps ────────────────────────────────────────────────────────────────

const SEV_BADGE: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-blue-100 text-blue-700 border-blue-300',
};

const SEV_SCORE: Record<Severity, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-blue-500 text-white',
};

const SEV_CARD: Record<Severity, string> = {
  critical: 'border-red-300 bg-red-50/40 shadow-red-100',
  high: 'border-orange-300 bg-orange-50/30 shadow-orange-100',
  medium: 'border-yellow-300 bg-yellow-50/20 shadow-yellow-100',
  low: 'border-border bg-card shadow-sm',
};

const SEV_BAR: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400',
};

const SEV_LABEL: Record<Severity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const THREAT_BANNER: Record<Severity, { bg: string; text: string; sub: string; icon: string }> = {
  critical: { bg: 'bg-red-600', text: 'text-white', sub: 'text-red-100', icon: '🚨' },
  high: { bg: 'bg-orange-500', text: 'text-white', sub: 'text-orange-100', icon: '⚠️' },
  medium: { bg: 'bg-yellow-400', text: 'text-yellow-900', sub: 'text-yellow-800', icon: '⚡' },
  low: { bg: 'bg-green-500', text: 'text-white', sub: 'text-green-100', icon: '✅' },
};

// ─── Detection rules (for info panel) ─────────────────────────────────────────

const RULES = [
  { icon: '📱', label: 'Fake Phone Pattern', detail: 'Known BD fake number formats (01111..., 01234...)', sev: 'critical', pts: 40 },
  { icon: '🆕', label: 'Same-day Account + Order', detail: 'Account & order created on same day', sev: 'critical', pts: 45 },
  { icon: '💰', label: 'Very High COD (>৳8K)', detail: 'Extremely high cash-on-delivery amount', sev: 'high', pts: 30 },
  { icon: '👤', label: 'New Account (<3 days)', detail: 'Fresh account placing a large order', sev: 'high', pts: 28 },
  { icon: '⚡', label: 'Rapid Order Burst', detail: '3+ orders in 30 minutes from same account', sev: 'high', pts: 25 },
  { icon: '🌙', label: 'Late Night Order (1–4AM)', detail: 'BD fraud peak hours', sev: 'medium', pts: 15 },
  { icon: '📦', label: 'Bulk Quantity (>10 items)', detail: 'Possible reselling or fake bulk order', sev: 'medium', pts: 15 },
  { icon: '📍', label: 'Repeat Cancelled Address', detail: 'Same address had 2+ previous cancellations', sev: 'medium', pts: 20 },
  { icon: '📵', label: 'Missing / Invalid Phone', detail: 'No valid contact number provided', sev: 'medium', pts: 12 },
  { icon: '👤', label: 'Guest High-Value Order', detail: 'No account for undelivered order tracking', sev: 'low', pts: 10 },
  { icon: '🎯', label: 'First Order Very Large', detail: 'First-ever order is unusually large', sev: 'low', pts: 10 },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({ score, sev }: { score: number; sev: Severity }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl w-16 h-16 flex-shrink-0 ${SEV_SCORE[sev]} shadow-md`}>
      <span className="text-xl font-black leading-none">{score}</span>
      <span className="text-[9px] font-bold opacity-90 tracking-wide">{SEV_LABEL[sev]}</span>
    </div>
  );
}

function ScoreBar({ score, sev }: { score: number; sev: Severity }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-semibold text-muted-foreground">Risk Score</span>
        <span className="text-[10px] font-black">{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${SEV_BAR[sev]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function OrderCard({ order, flags, score, sev }: {
  order: Order;
  flags: FraudFlag[];
  score: number;
  sev: Severity;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/orders/admin/${order.id}/status`, { status }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud-orders'] }),
  });

  const amount = orderAmount(order);
  const name = order.user
    ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim() || order.user.name || order.user.email
    : order.guestName ?? 'Guest';
  const phone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone ?? '—';
  const isResolved = order.status === 'CANCELLED';
  const timeAgo = (() => {
    const diff = Date.now() - new Date(order.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className={`rounded-2xl border-2 shadow-sm transition-all ${SEV_CARD[sev]} ${isResolved ? 'opacity-60' : ''}`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Score badge */}
          <ScoreBadge score={score} sev={sev} />

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm">{order.orderNumber}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{timeAgo}
                </span>
                {isResolved && (
                  <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-bold">
                    Resolved
                  </span>
                )}
              </div>
              <span className="font-black text-base">৳{amount.toLocaleString()}</span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{name}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{phone}</span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {order.paymentMethod === 'COD' || order.paymentMethod === 'CASH_ON_DELIVERY' ? (
                  <span className="text-orange-600 font-semibold">COD</span>
                ) : order.paymentMethod}
              </span>
              <span className={`font-semibold ${
                order.status === 'PENDING' ? 'text-yellow-600'
                : order.status === 'CANCELLED' ? 'text-red-500'
                : 'text-green-600'
              }`}>{order.status}</span>
            </div>

            {/* Score bar */}
            <div className="mt-2.5">
              <ScoreBar score={score} sev={sev} />
            </div>
          </div>
        </div>

        {/* Flag badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {flags.map(f => (
            <span
              key={f.type}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_BADGE[f.severity]}`}
            >
              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div className="px-4 py-3 border-t border-current/10 flex items-center gap-2 flex-wrap">
        {!isResolved && (
          <>
            <button
              onClick={() => updateStatus.mutate('CANCELLED')}
              disabled={updateStatus.isPending}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {updateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
              Cancel Order
            </button>
            <button
              onClick={() => updateStatus.mutate('CONFIRMED')}
              disabled={updateStatus.isPending}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              Mark Safe
            </button>
          </>
        )}
        {isResolved && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-green-500" /> Order cancelled / resolved
          </span>
        )}
        <button
          onClick={() => setExpanded(e => !e)}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <><ChevronUp className="w-4 h-4" /> Hide</> : <><ChevronDown className="w-4 h-4" /> Investigate</>}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-current/10">
          <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
            {/* Risk breakdown */}
            <div className="sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Risk Breakdown
              </p>
              <div className="space-y-2">
                {flags.map(f => (
                  <div key={f.type} className={`rounded-lg border p-2.5 ${SEV_BADGE[f.severity]}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-black">{f.label}</span>
                      <span className="text-[10px] font-black">+{f.points}pts</span>
                    </div>
                    <p className="text-[10px] opacity-80">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer info */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <User className="w-3 h-3" /> Customer Profile
              </p>
              <div className="space-y-1.5 text-xs">
                {order.user ? (
                  <>
                    <p><span className="text-muted-foreground">Name:</span> {name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {order.user.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {phone}</p>
                    <p><span className="text-muted-foreground">Account age:</span>{' '}
                      {Math.floor((Date.now() - new Date(order.user.createdAt).getTime()) / 86400000)} days
                    </p>
                    <p><span className="text-muted-foreground">Total orders:</span> {order.user._count?.orders ?? '?'}</p>
                  </>
                ) : (
                  <>
                    <p><span className="text-muted-foreground">Type:</span> <span className="text-orange-600 font-semibold">Guest Order</span></p>
                    <p><span className="text-muted-foreground">Name:</span> {order.guestName ?? '—'}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {order.guestPhone ?? '—'}</p>
                    <p><span className="text-muted-foreground">Email:</span> {order.guestEmail ?? '—'}</p>
                  </>
                )}
              </div>
            </div>

            {/* Order info */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Order Details
              </p>
              <div className="space-y-1.5 text-xs">
                <p><span className="text-muted-foreground">Order #:</span> {order.orderNumber}</p>
                <p><span className="text-muted-foreground">Amount:</span> ৳{amount.toLocaleString()}</p>
                <p><span className="text-muted-foreground">Payment:</span> {order.paymentMethod}</p>
                <p><span className="text-muted-foreground">Status:</span> {order.status}</p>
                <p><span className="text-muted-foreground">Items:</span> {order.items?.length ?? 0} product(s), {order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} qty</p>
                {order.shippingAddress && (
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                    {[
                      order.shippingAddress.street ?? order.shippingAddress.address,
                      order.shippingAddress.area,
                      order.shippingAddress.city,
                      order.shippingAddress.district,
                    ].filter(Boolean).join(', ') || '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detection Engine Info Panel ──────────────────────────────────────────────

function EnginePanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Detection Engine</p>
            <p className="text-[11px] text-muted-foreground">{RULES.length} active rules · BD-market optimized</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 mt-3">
            {RULES.map(r => (
              <div key={r.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border">
                <span className="text-lg leading-none flex-shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold">{r.label}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase border ${
                      r.sev === 'critical' ? 'bg-red-100 text-red-700 border-red-200'
                      : r.sev === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : r.sev === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>{r.sev}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{r.detail}</p>
                  <p className="text-[10px] font-bold text-primary mt-0.5">+{r.pts} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type FilterSev = 'all' | Severity;

export default function FraudDetectionPage() {
  const [filter, setFilter] = useState<FilterSev>('all');
  const [search, setSearch] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['fraud-orders'],
    queryFn: () =>
      api.get('/orders/admin/all', { params: { limit: 200, page: 1 } })
        .then(r => r.data.data.data as Order[]),
    refetchInterval: 60000,
  });

  const allOrders = data ?? [];

  const analyzed = useMemo(() => {
    return allOrders
      .map(order => {
        const flags = analyzeOrder(order, allOrders);
        const score = calcScore(flags);
        const sev = scoreThreat(score);
        return { order, flags, score, sev };
      })
      .filter(({ flags }) => flags.length > 0);
  }, [allOrders]);

  const filtered = useMemo(() => {
    return analyzed
      .filter(({ order }) => showResolved || order.status !== 'CANCELLED')
      .filter(({ sev }) => filter === 'all' || sev === filter)
      .filter(({ order }) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const phone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone ?? '';
        const name = order.user
          ? `${order.user.firstName ?? ''} ${order.user.lastName ?? ''}`.trim()
          : order.guestName ?? '';
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          phone.includes(q) ||
          name.toLowerCase().includes(q) ||
          (order.user?.email ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.score - a.score);
  }, [analyzed, filter, showResolved, search]);

  // Stats
  const criticalCount = analyzed.filter(x => x.sev === 'critical' && x.order.status !== 'CANCELLED').length;
  const highCount = analyzed.filter(x => x.sev === 'high' && x.order.status !== 'CANCELLED').length;
  const medCount = analyzed.filter(x => x.sev === 'medium' && x.order.status !== 'CANCELLED').length;
  const resolvedCount = analyzed.filter(x => x.order.status === 'CANCELLED').length;
  const atRisk = analyzed
    .filter(x => x.order.status !== 'CANCELLED')
    .reduce((s, x) => s + orderAmount(x.order), 0);

  const overallThreat: Severity =
    criticalCount > 0 ? 'critical'
    : highCount > 0 ? 'high'
    : medCount > 0 ? 'medium'
    : 'low';

  const banner = THREAT_BANNER[overallThreat];

  const FILTER_TABS: { key: FilterSev; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: analyzed.filter(x => showResolved || x.order.status !== 'CANCELLED').length },
    { key: 'critical', label: 'Critical', count: criticalCount },
    { key: 'high', label: 'High', count: highCount },
    { key: 'medium', label: 'Medium', count: medCount },
    { key: 'low', label: 'Low', count: analyzed.filter(x => x.sev === 'low' && x.order.status !== 'CANCELLED').length },
  ];

  return (
    <div className="space-y-5">

      {/* ── Threat Level Banner ───────────────────────────────────────── */}
      <div className={`rounded-2xl px-5 py-4 ${banner.bg} ${criticalCount > 0 ? 'animate-pulse' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{banner.icon}</div>
            <div>
              <p className={`font-black text-lg leading-tight ${banner.text}`}>
                {overallThreat === 'low' ? 'All Clear — No Active Threats' : `${SEV_LABEL[overallThreat]} THREAT LEVEL`}
              </p>
              <p className={`text-xs mt-0.5 ${banner.sub}`}>
                {criticalCount > 0
                  ? `${criticalCount} critical order${criticalCount > 1 ? 's' : ''} require immediate action`
                  : highCount > 0
                  ? `${highCount} high-risk order${highCount > 1 ? 's' : ''} need review`
                  : medCount > 0
                  ? `${medCount} medium-risk order${medCount > 1 ? 's' : ''} flagged`
                  : 'All recent orders look clean'}
                {' '}· Monitoring {allOrders.length} orders
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${banner.text} bg-black/10 hover:bg-black/20`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: <ShieldAlert className="w-4 h-4" />, label: 'Critical', value: criticalCount, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { icon: <AlertTriangle className="w-4 h-4" />, label: 'High Risk', value: highCount, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
          { icon: <Zap className="w-4 h-4" />, label: 'Medium Risk', value: medCount, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
          { icon: <CheckCircle className="w-4 h-4" />, label: 'Resolved', value: resolvedCount, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { icon: <TrendingUp className="w-4 h-4" />, label: 'COD At Risk', value: `৳${(atRisk / 1000).toFixed(1)}K`, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}<span className="text-xs font-semibold">{s.label}</span></div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Detection Engine ─────────────────────────────────────────── */}
      <EnginePanel open={engineOpen} onToggle={() => setEngineOpen(o => !o)} />

      {/* ── Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Severity tabs */}
        <div className="flex gap-1.5 p-1 bg-muted rounded-xl flex-wrap">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === t.key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                  filter === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, phone, name, email..."
            className="w-full pl-9 pr-9 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Show resolved toggle */}
        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-card border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors select-none">
          <div className={`w-8 h-4 rounded-full transition-colors relative ${showResolved ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${showResolved ? 'left-4' : 'left-0.5'}`} />
          </div>
          Show resolved
        </label>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analysing orders...</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl border bg-card py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-green-500" />
          </div>
          <p className="font-black text-lg text-foreground">No Suspicious Orders</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {search ? `No flagged orders matching "${search}"` : 'All orders are clean based on current detection rules.'}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-bold">
              {filtered.length} suspicious order{filtered.length !== 1 ? 's' : ''} detected
            </p>
            <span className="text-xs text-muted-foreground ml-auto">Sorted by risk score ↓</span>
          </div>
          <div className="space-y-3">
            {filtered.map(({ order, flags, score, sev }) => (
              <OrderCard key={order.id} order={order} flags={flags} score={score} sev={sev} />
            ))}
          </div>
        </div>
      )}

      {/* ── BD-Market Intelligence ────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/30 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <p className="font-bold text-sm">BD Market Intelligence</p>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground mb-3">Phone Number Guide</p>
            <div className="space-y-1.5 text-xs">
              {[
                { op: 'Grameenphone', prefix: '017, 013', safe: true },
                { op: 'Robi', prefix: '018, 016', safe: true },
                { op: 'Banglalink', prefix: '019, 014', safe: true },
                { op: 'Airtel', prefix: '016', safe: true },
                { op: 'Teletalk', prefix: '015', safe: true },
                { op: 'Unknown / Unallocated', prefix: '011, 012', safe: false },
              ].map(r => (
                <div key={r.op} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.safe ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="font-medium">{r.op}</span>
                  <span className="text-muted-foreground">({r.prefix})</span>
                  {!r.safe && <span className="text-red-500 font-bold text-[10px]">HIGH RISK</span>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-bold text-xs uppercase tracking-wide text-muted-foreground mb-3">Fraud Peak Patterns</p>
            <div className="space-y-2 text-xs">
              {[
                { icon: <Moon className="w-3 h-3" />, text: '1AM–4AM orders have 3× higher fraud rate in BD' },
                { icon: <MapPin className="w-3 h-3" />, text: 'COD orders above ৳5,000 must be phone-verified before shipping' },
                { icon: <Phone className="w-3 h-3" />, text: 'Call customers with new accounts before shipping high-value COD' },
                { icon: <Package className="w-3 h-3" />, text: 'Bulk COD orders (>10 items) often indicate reseller fraud' },
                { icon: <Shield className="w-3 h-3" />, text: 'Dhaka addresses with no landmark detail are higher risk' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="flex-shrink-0 mt-0.5 text-primary">{tip.icon}</span>
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
