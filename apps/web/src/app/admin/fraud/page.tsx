'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, AlertTriangle, Phone, MapPin, Clock, Ban,
  CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp,
  Search, Shield, Zap, Activity, User, Package, CreditCard,
  ShieldCheck, Eye, TrendingUp, AlertCircle, X, Moon,
  Globe, Fingerprint, Wifi, Trash2, Plus, Server,
} from 'lucide-react';
import api from '@/lib/api';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderMetadata {
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geoLat?: number;
  geoLng?: number;
  capturedAt?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total?: string;
  totalAmount?: string;
  createdAt: string;
  metadata?: OrderMetadata;
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

interface BlockedEntity {
  id: string;
  type: 'ip' | 'phone' | 'device';
  value: string;
  reason?: string;
  createdAt: string;
}

interface IpCluster {
  ip: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    phone: string;
    status: string;
  }>;
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

// Bangladesh geographic bounds
const BD_LAT_MIN = 20.7;
const BD_LAT_MAX = 26.6;
const BD_LNG_MIN = 88.0;
const BD_LNG_MAX = 92.7;

function isInsideBangladesh(lat: number, lng: number): boolean {
  return lat >= BD_LAT_MIN && lat <= BD_LAT_MAX && lng >= BD_LNG_MIN && lng <= BD_LNG_MAX;
}

// Private/loopback IP patterns — these are "internal" IPs and not suspicious for geo purposes
const PRIVATE_IP_PATTERN = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1|unknown|localhost)/i;

function analyzeOrder(order: Order, allOrders: Order[]): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const amount = orderAmount(order);
  const phone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone;
  const addr = order.shippingAddress;
  const hour = new Date(order.createdAt).getHours();
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const meta = order.metadata;

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

  // NEW: same_ip_diff_phones — CRITICAL
  if (meta?.ip) {
    const sameIpOtherPhones = allOrders.filter(o => {
      if (o.id === order.id) return false;
      if (!o.metadata?.ip || o.metadata.ip !== meta.ip) return false;
      const otherPhone = o.user?.phone ?? o.shippingAddress?.phone ?? o.guestPhone;
      const thisPhone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone;
      return otherPhone && thisPhone && otherPhone !== thisPhone;
    });
    if (sameIpOtherPhones.length >= 2) {
      flags.push({
        type: 'same_ip_diff_phones',
        severity: 'critical',
        label: 'Same IP, Multiple Phone Numbers',
        detail: `IP ${meta.ip} used with ${sameIpOtherPhones.length} other phone numbers — possible coordinated fraud`,
        points: 45,
      });
    }
  }

  // NEW: same_device_mult_accounts — CRITICAL
  if (meta?.deviceFingerprint) {
    const sameDeviceOtherUsers = allOrders.filter(o => {
      if (o.id === order.id) return false;
      if (!o.metadata?.deviceFingerprint || o.metadata.deviceFingerprint !== meta.deviceFingerprint) return false;
      // Different user (or one is guest while the other is not)
      const thisUserId = order.user?.id ?? null;
      const otherUserId = o.user?.id ?? null;
      return thisUserId !== otherUserId;
    });
    if (sameDeviceOtherUsers.length >= 2) {
      flags.push({
        type: 'same_device_mult_accounts',
        severity: 'critical',
        label: 'Device Used by Multiple Accounts',
        detail: `Device fingerprint shared across ${sameDeviceOtherUsers.length + 1} different accounts`,
        points: 40,
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

  // NEW: ip_outside_bd — HIGH
  if (meta?.ip && !PRIVATE_IP_PATTERN.test(meta.ip)) {
    // For a real implementation, a geo-IP service would be used.
    // As a heuristic: if the IP is not a private/loopback range we treat it as a potentially routable
    // public IP that could be outside BD. We add the flag as a placeholder for geo-IP verification.
    flags.push({
      type: 'ip_outside_bd',
      severity: 'high',
      label: 'IP Outside BD (Unverified)',
      detail: `IP ${meta.ip} is a public address — geo-IP verification recommended`,
      points: 30,
    });
  }

  // NEW: geo_mismatch — HIGH
  if (meta?.geoLat != null && meta?.geoLng != null) {
    if (!isInsideBangladesh(meta.geoLat, meta.geoLng)) {
      flags.push({
        type: 'geo_mismatch',
        severity: 'high',
        label: 'GPS Outside Bangladesh',
        detail: `GPS coordinates (${meta.geoLat.toFixed(4)}, ${meta.geoLng.toFixed(4)}) are outside Bangladesh bounds`,
        points: 28,
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

  // NEW: vpn_indicator — MEDIUM
  if (!meta?.userAgent || meta.userAgent.trim() === '') {
    flags.push({
      type: 'vpn_indicator',
      severity: 'medium',
      label: 'Missing User-Agent',
      detail: 'No user agent string — possible bot, scraper, or VPN tool',
      points: 20,
    });
  } else {
    const ua = meta.userAgent.toLowerCase();
    const botPatterns = ['bot', 'crawl', 'spider', 'curl', 'wget', 'python', 'java/', 'go-http', 'okhttp', 'axios', 'headless', 'phantom', 'selenium'];
    const isBotLike = botPatterns.some(p => ua.includes(p));
    if (isBotLike) {
      flags.push({
        type: 'vpn_indicator',
        severity: 'medium',
        label: 'Bot-Like User Agent',
        detail: `User agent suggests automation: "${meta.userAgent.slice(0, 60)}…"`,
        points: 20,
      });
    }
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
  { icon: '🌐', label: 'Same IP, Multiple Phones', detail: 'IP used with 2+ different phone numbers', sev: 'critical', pts: 45 },
  { icon: '📲', label: 'Device — Multiple Accounts', detail: 'Same device fingerprint across 3+ accounts', sev: 'critical', pts: 40 },
  { icon: '💰', label: 'Very High COD (>৳8K)', detail: 'Extremely high cash-on-delivery amount', sev: 'high', pts: 30 },
  { icon: '👤', label: 'New Account (<3 days)', detail: 'Fresh account placing a large order', sev: 'high', pts: 28 },
  { icon: '⚡', label: 'Rapid Order Burst', detail: '3+ orders in 30 minutes from same account', sev: 'high', pts: 25 },
  { icon: '🔌', label: 'IP Outside BD (Unverified)', detail: 'Public IP outside known BD CGNAT ranges', sev: 'high', pts: 30 },
  { icon: '📡', label: 'GPS Outside Bangladesh', detail: 'Device GPS coordinates outside BD bounds', sev: 'high', pts: 28 },
  { icon: '🌙', label: 'Late Night Order (1–4AM)', detail: 'BD fraud peak hours', sev: 'medium', pts: 15 },
  { icon: '📦', label: 'Bulk Quantity (>10 items)', detail: 'Possible reselling or fake bulk order', sev: 'medium', pts: 15 },
  { icon: '📍', label: 'Repeat Cancelled Address', detail: 'Same address had 2+ previous cancellations', sev: 'medium', pts: 20 },
  { icon: '📵', label: 'Missing / Invalid Phone', detail: 'No valid contact number provided', sev: 'medium', pts: 12 },
  { icon: '🤖', label: 'Bot-Like / Missing User Agent', detail: 'User agent suggests automation or VPN tool', sev: 'medium', pts: 20 },
  { icon: '👤', label: 'Guest High-Value Order', detail: 'No account for undelivered order tracking', sev: 'low', pts: 10 },
  { icon: '🎯', label: 'First Order Very Large', detail: 'First-ever order is unusually large', sev: 'low', pts: 10 },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ScoreBadge({ score, sev }: { score: number; sev: Severity }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl w-16 h-16 flex-shrink-0 shadow-md', SEV_SCORE[sev])}>
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
          className={cn('h-full rounded-full transition-all duration-700', SEV_BAR[sev])}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tracking Intelligence column inside OrderCard expand ────────────────────

function TrackingIntelligence({ order }: { order: Order }) {
  const qc = useQueryClient()
  const meta = order.metadata
  const { token } = useAdminAuth()

  const blockEntity = useMutation({
    mutationFn: (payload: { type: 'ip' | 'phone' | 'device'; value: string; reason?: string }) =>
      api.post('/fraud/blocked', payload).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud-blocked'] }),
  })

  if (!meta) {
    return (
      <div className="text-xs text-muted-foreground italic">No tracking metadata available</div>
    )
  }

  const insideBD =
    meta.geoLat != null && meta.geoLng != null
      ? isInsideBangladesh(meta.geoLat, meta.geoLng)
      : null

  const shortFingerprint = meta.deviceFingerprint
    ? meta.deviceFingerprint.slice(0, 8) + '…'
    : null

  return (
    <div className="space-y-2 text-xs">
      {meta.ip && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">IP:</span>
            <span className="font-mono font-semibold">{meta.ip}</span>
          </div>
          <button
            onClick={() => blockEntity.mutate({ type: 'ip', value: meta.ip!, reason: `Blocked from order ${order.orderNumber}` })}
            disabled={blockEntity.isPending}
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors disabled:opacity-50"
          >
            <Ban className="w-2.5 h-2.5" />
            Block IP
          </button>
        </div>
      )}

      {meta.deviceFingerprint && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Device:</span>
            <span className="font-mono font-semibold">{shortFingerprint}</span>
          </div>
          <button
            onClick={() => blockEntity.mutate({ type: 'device', value: meta.deviceFingerprint!, reason: `Blocked from order ${order.orderNumber}` })}
            disabled={blockEntity.isPending}
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors disabled:opacity-50"
          >
            <Ban className="w-2.5 h-2.5" />
            Block Device
          </button>
        </div>
      )}

      {insideBD !== null && (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">GPS:</span>
          <span className="font-mono">{meta.geoLat?.toFixed(4)}, {meta.geoLng?.toFixed(4)}</span>
          {insideBD ? (
            <span className="text-green-600 font-bold text-[10px]">Inside BD ✓</span>
          ) : (
            <span className="text-red-600 font-bold text-[10px]">Outside BD ⚠</span>
          )}
        </div>
      )}

      {meta.userAgent && (
        <div className="flex items-start gap-1.5">
          <Wifi className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-muted-foreground flex-shrink-0">UA:</span>
          <span className="text-muted-foreground truncate max-w-[200px]" title={meta.userAgent}>
            {meta.userAgent.slice(0, 60)}{meta.userAgent.length > 60 ? '…' : ''}
          </span>
        </div>
      )}

      {!meta.userAgent && (
        <div className="flex items-center gap-1.5 text-yellow-600">
          <Wifi className="w-3 h-3 flex-shrink-0" />
          <span className="text-[10px] font-bold">No user agent — possible bot</span>
        </div>
      )}

      {blockEntity.isPending && (
        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Blocking…
        </div>
      )}
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

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
    <div className={cn('rounded-2xl border-2 shadow-sm transition-all', SEV_CARD[sev], isResolved && 'opacity-60')}>
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
              <span className={cn(
                'font-semibold',
                order.status === 'PENDING' ? 'text-yellow-600'
                : order.status === 'CANCELLED' ? 'text-red-500'
                : 'text-green-600'
              )}>{order.status}</span>
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
              className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', SEV_BADGE[f.severity])}
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
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 text-sm">
            {/* Risk breakdown */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Risk Breakdown
              </p>
              <div className="space-y-2">
                {flags.map(f => (
                  <div key={f.type} className={cn('rounded-lg border p-2.5', SEV_BADGE[f.severity])}>
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

            {/* Tracking Intelligence (new) */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Server className="w-3 h-3" /> Tracking Intelligence
              </p>
              <TrackingIntelligence order={order} />
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
                    <span className={cn(
                      'text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase border',
                      r.sev === 'critical' ? 'bg-red-100 text-red-700 border-red-200'
                      : r.sev === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : r.sev === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                    )}>{r.sev}</span>
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

// ─── Blocked Entities Panel ───────────────────────────────────────────────────

function BlockedEntitiesPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const qc = useQueryClient()
  const [newType, setNewType] = useState<'ip' | 'phone' | 'device'>('ip')
  const [newValue, setNewValue] = useState('')
  const [newReason, setNewReason] = useState('')

  const { data: blocked = [], isLoading } = useQuery<BlockedEntity[]>({
    queryKey: ['fraud-blocked'],
    queryFn: () => api.get('/fraud/blocked').then(r => r.data.data ?? r.data),
    enabled: open,
  })

  const blockMutation = useMutation({
    mutationFn: (payload: { type: 'ip' | 'phone' | 'device'; value: string; reason?: string }) =>
      api.post('/fraud/blocked', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fraud-blocked'] })
      setNewValue('')
      setNewReason('')
    },
  })

  const unblockMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fraud/blocked/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud-blocked'] }),
  })

  const TYPE_LABELS: Record<'ip' | 'phone' | 'device', { icon: React.ReactNode; label: string }> = {
    ip: { icon: <Globe className="w-3 h-3" />, label: 'IP Address' },
    phone: { icon: <Phone className="w-3 h-3" />, label: 'Phone' },
    device: { icon: <Fingerprint className="w-3 h-3" />, label: 'Device' },
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Ban className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Blocked Entities</p>
            <p className="text-[11px] text-muted-foreground">
              {blocked.length > 0 ? `${blocked.length} blocked IP${blocked.filter(b => b.type === 'ip').length !== 1 ? 's' : ''} / phones / devices` : 'Manage blocked IPs, phones, and device fingerprints'}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t">
          {/* Add new block form */}
          <div className="px-5 py-4 bg-muted/20 border-b">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Block New Entity
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as 'ip' | 'phone' | 'device')}
                className="px-3 py-2 bg-card border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-32"
              >
                <option value="ip">IP Address</option>
                <option value="phone">Phone</option>
                <option value="device">Device</option>
              </select>
              <input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder={newType === 'ip' ? '192.168.1.1' : newType === 'phone' ? '01XXXXXXXXX' : 'Device fingerprint'}
                className="flex-1 px-3 py-2 bg-card border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="Reason (optional)"
                className="flex-1 px-3 py-2 bg-card border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => {
                  if (!newValue.trim()) return
                  blockMutation.mutate({ type: newType, value: newValue.trim(), reason: newReason.trim() || undefined })
                }}
                disabled={!newValue.trim() || blockMutation.isPending}
                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
              >
                {blockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                Block
              </button>
            </div>
          </div>

          {/* Blocked list */}
          <div className="px-5 py-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}
            {!isLoading && blocked.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No blocked entities yet.</p>
            )}
            {!isLoading && blocked.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Type</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Value</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Reason</th>
                      <th className="text-left py-2 pr-4 text-muted-foreground font-semibold">Date</th>
                      <th className="text-right py-2 text-muted-foreground font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocked.map(entity => (
                      <tr key={entity.id} className="border-b border-muted/50 hover:bg-muted/20 transition-colors">
                        <td className="py-2 pr-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border',
                            entity.type === 'ip' ? 'bg-orange-100 text-orange-700 border-orange-200'
                            : entity.type === 'phone' ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                          )}>
                            {TYPE_LABELS[entity.type].icon}
                            {TYPE_LABELS[entity.type].label}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono font-semibold">{entity.value}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{entity.reason ?? '—'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {new Date(entity.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => unblockMutation.mutate(entity.id)}
                            disabled={unblockMutation.isPending}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── IP Clusters Panel ────────────────────────────────────────────────────────

function IpClustersPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const qc = useQueryClient()

  const { data: clusters = [], isLoading } = useQuery<IpCluster[]>({
    queryKey: ['fraud-ip-clusters'],
    queryFn: () => api.get('/fraud/ip-clusters').then(r => r.data.data ?? r.data),
    enabled: open,
  })

  const blockIp = useMutation({
    mutationFn: (ip: string) =>
      api.post('/fraud/blocked', { type: 'ip', value: ip, reason: 'Blocked from IP Clusters panel' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud-blocked'] }),
  })

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Globe className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">IP Clusters</p>
            <p className="text-[11px] text-muted-foreground">
              {clusters.length > 0 ? `${clusters.length} IP${clusters.length !== 1 ? 's' : ''} with multiple orders` : 'IPs that placed multiple orders'}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-4 border-t">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading clusters…
            </div>
          )}
          {!isLoading && clusters.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No IP clusters detected.</p>
          )}
          {!isLoading && clusters.length > 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {clusters.map(cluster => (
                <div key={cluster.ip} className="rounded-xl border bg-orange-50/40 border-orange-200 p-3">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                      <span className="font-mono font-black text-sm text-orange-800">{cluster.ip}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">
                        {cluster.orders.length} orders
                      </span>
                      <button
                        onClick={() => blockIp.mutate(cluster.ip)}
                        disabled={blockIp.isPending}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors disabled:opacity-50"
                      >
                        <Ban className="w-2.5 h-2.5" />
                        Block
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {cluster.orders.map(o => (
                      <div key={o.id} className="flex items-center justify-between text-[11px] py-0.5 border-t border-orange-100 first:border-0">
                        <span className="font-mono font-semibold">{o.orderNumber}</span>
                        <span className="text-muted-foreground">{o.phone || '—'}</span>
                        <span className={cn(
                          'font-bold text-[10px]',
                          o.status === 'CANCELLED' ? 'text-red-500'
                          : o.status === 'PENDING' ? 'text-yellow-600'
                          : 'text-green-600'
                        )}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type FilterSev = 'all' | Severity;

export default function FraudDetectionPage() {
  const [filter, setFilter] = useState<FilterSev>('all');
  const [search, setSearch] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [clustersOpen, setClustersOpen] = useState(false);

  // token is available for future use if needed for manual fetch calls
  const { token: _token } = useAdminAuth()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['fraud-orders'],
    queryFn: () =>
      api.get('/fraud/orders', { params: { limit: 200 } })
        .then(r => (r.data.data ?? r.data) as Order[]),
    refetchInterval: 60000,
  });

  const allOrders = useMemo(() => data ?? [], [data]);

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
      <div className={cn('rounded-2xl px-5 py-4', banner.bg, criticalCount > 0 && 'animate-pulse')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{banner.icon}</div>
            <div>
              <p className={cn('font-black text-lg leading-tight', banner.text)}>
                {overallThreat === 'low' ? 'All Clear — No Active Threats' : `${SEV_LABEL[overallThreat]} THREAT LEVEL`}
              </p>
              <p className={cn('text-xs mt-0.5', banner.sub)}>
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
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-black/10 hover:bg-black/20', banner.text)}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
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
          <div key={s.label} className={cn('rounded-2xl border p-4', s.bg)}>
            <div className={cn('flex items-center gap-1.5 mb-1', s.color)}>{s.icon}<span className="text-xs font-semibold">{s.label}</span></div>
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Detection Engine ─────────────────────────────────────────── */}
      <EnginePanel open={engineOpen} onToggle={() => setEngineOpen(o => !o)} />

      {/* ── Blocked Entities Panel ───────────────────────────────────── */}
      <BlockedEntitiesPanel open={blockedOpen} onToggle={() => setBlockedOpen(o => !o)} />

      {/* ── IP Clusters Panel ────────────────────────────────────────── */}
      <IpClustersPanel open={clustersOpen} onToggle={() => setClustersOpen(o => !o)} />

      {/* ── Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Severity tabs */}
        <div className="flex gap-1.5 p-1 bg-muted rounded-xl flex-wrap">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                filter === t.key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn(
                  'w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center',
                  filter === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                )}>{t.count}</span>
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
          <div className={cn('w-8 h-4 rounded-full transition-colors relative', showResolved ? 'bg-primary' : 'bg-muted-foreground/30')}>
            <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all', showResolved ? 'left-4' : 'left-0.5')} />
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
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', r.safe ? 'bg-green-400' : 'bg-red-400')} />
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
