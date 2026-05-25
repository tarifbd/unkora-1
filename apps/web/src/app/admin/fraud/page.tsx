'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, AlertTriangle, Phone, MapPin, Clock, TrendingUp,
  Ban, CheckCircle, Loader2, RefreshCw, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
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
    street?: string;
    city?: string;
    district?: string;
  };
  items?: Array<{ productId: string; quantity: number; price: string }>;
}

interface FraudFlag {
  type: 'high_value_cod' | 'new_user_large_order' | 'duplicate_address' | 'suspicious_phone' | 'rapid_orders' | 'multiple_failed';
  severity: 'high' | 'medium' | 'low';
  label: string;
  detail: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-yellow-500',
};

// BD fake phone patterns
const FAKE_PHONE_PATTERNS = [
  /^01{5,}/,       // 011111...
  /^0(1[0-9])\1+/, // repeating digits
  /^01234/,
  /^09999/,
  /^01111111/,
  /^01000000/,
];

function isSuspiciousPhone(phone?: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-+]/g, '');
  return FAKE_PHONE_PATTERNS.some(r => r.test(cleaned));
}

function analyzeOrder(order: Order, allOrders: Order[]): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const amount = Number(order.totalAmount);
  const phone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone;
  const address = order.shippingAddress;

  // High value COD
  if (order.paymentMethod === 'CASH_ON_DELIVERY' && amount > 3000) {
    flags.push({
      type: 'high_value_cod',
      severity: amount > 8000 ? 'high' : 'medium',
      label: 'High Value COD',
      detail: `৳${amount.toLocaleString()} cash on delivery order`,
    });
  }

  // New user large order
  if (order.user) {
    const accountAge = Date.now() - new Date(order.user.createdAt).getTime();
    const daysSinceJoin = accountAge / (1000 * 60 * 60 * 24);
    if (daysSinceJoin < 3 && amount > 2000) {
      flags.push({
        type: 'new_user_large_order',
        severity: 'high',
        label: 'New Account Large Order',
        detail: `Account created ${Math.floor(daysSinceJoin)}d ago, order ৳${amount.toLocaleString()}`,
      });
    }
  }

  // Suspicious phone number
  if (isSuspiciousPhone(phone)) {
    flags.push({
      type: 'suspicious_phone',
      severity: 'high',
      label: 'Suspicious Phone',
      detail: `Phone pattern matches fake number: ${phone}`,
    });
  }

  // Duplicate address with multiple orders
  if (address?.street) {
    const sameAddr = allOrders.filter(o =>
      o.id !== order.id &&
      o.shippingAddress?.street === address.street &&
      o.shippingAddress?.city === address.city &&
      o.status === 'CANCELLED'
    );
    if (sameAddr.length >= 2) {
      flags.push({
        type: 'duplicate_address',
        severity: 'medium',
        label: 'Repeat Cancelled Address',
        detail: `${sameAddr.length} previous cancelled orders to this address`,
      });
    }
  }

  // Rapid orders from same user
  if (order.user) {
    const recent = allOrders.filter(o => {
      if (o.id === order.id || o.user?.id !== order.user?.id) return false;
      const diff = Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime());
      return diff < 1000 * 60 * 30; // within 30 min
    });
    if (recent.length >= 2) {
      flags.push({
        type: 'rapid_orders',
        severity: 'medium',
        label: 'Rapid Order Placement',
        detail: `${recent.length + 1} orders placed within 30 minutes`,
      });
    }
  }

  return flags;
}

function FraudOrderRow({ order, flags }: { order: Order; flags: FraudFlag[] }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/orders/admin/${order.id}/status`, { status }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud-orders'] }),
  });

  const maxSeverity = flags.some(f => f.severity === 'high') ? 'high'
    : flags.some(f => f.severity === 'medium') ? 'medium' : 'low';

  const name = order.user?.name ?? order.guestName ?? 'Guest';
  const phone = order.user?.phone ?? order.shippingAddress?.phone ?? order.guestPhone ?? '—';

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[maxSeverity]}`} />
            <div>
              <p className="font-semibold text-sm">{order.orderNumber}</p>
              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{phone}</p>
        </td>
        <td className="px-4 py-3 font-bold">৳{Number(order.totalAmount).toLocaleString()}</td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
            {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'COD' : order.paymentMethod}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {flags.map(f => (
              <span key={f.type} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLOR[f.severity]}`}>
                {f.label}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {order.status !== 'CANCELLED' && (
              <button
                onClick={() => updateStatus.mutate('CANCELLED')}
                disabled={updateStatus.isPending}
                className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                {updateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                Cancel
              </button>
            )}
            {order.status === 'CANCELLED' && (
              <span className="flex items-center gap-1 text-xs text-gray-400"><CheckCircle className="w-3 h-3" /> Resolved</span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-orange-50/40">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Risk Flags</p>
                <div className="space-y-2">
                  {flags.map(f => (
                    <div key={f.type} className={`flex items-start gap-2 p-2.5 rounded-lg border ${SEVERITY_COLOR[f.severity]}`}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">{f.label}</p>
                        <p className="text-xs opacity-80">{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Order Details</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium">Status:</span> {order.status}</p>
                  <p><span className="font-medium">Payment:</span> {order.paymentMethod}</p>
                  {order.shippingAddress && (
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.district].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {order.user && (
                    <>
                      <p><span className="font-medium">Email:</span> {order.user.email}</p>
                      <p><span className="font-medium">Account age:</span> {Math.floor((Date.now() - new Date(order.user.createdAt).getTime()) / 86400000)} days</p>
                      <p><span className="font-medium">Total orders:</span> {order.user._count?.orders ?? '?'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type FilterType = 'all' | 'high' | 'medium' | 'low';

export default function FraudDetectionPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fraud-orders'],
    queryFn: () => api.get('/orders/admin/all', { params: { limit: 200, page: 1 } }).then(r => r.data.data.data as Order[]),
    refetchInterval: 60000,
  });

  const allOrders = data ?? [];

  const flaggedOrders = useMemo(() => {
    return allOrders
      .map(order => ({ order, flags: analyzeOrder(order, allOrders) }))
      .filter(({ flags }) => flags.length > 0)
      .filter(({ order }) => showResolved || order.status !== 'CANCELLED')
      .sort((a, b) => {
        const aMax = a.flags.some(f => f.severity === 'high') ? 2 : a.flags.some(f => f.severity === 'medium') ? 1 : 0;
        const bMax = b.flags.some(f => f.severity === 'high') ? 2 : b.flags.some(f => f.severity === 'medium') ? 1 : 0;
        return bMax - aMax;
      });
  }, [allOrders, showResolved]);

  const filtered = flaggedOrders.filter(({ flags }) => {
    if (filter === 'all') return true;
    return flags.some(f => f.severity === filter);
  });

  const highCount = flaggedOrders.filter(({ flags }) => flags.some(f => f.severity === 'high')).length;
  const medCount = flaggedOrders.filter(({ flags }) => flags.some(f => f.severity === 'medium') && !flags.some(f => f.severity === 'high')).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" /> Fraud Detection
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time order risk analysis for Bangladesh market</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 text-sm font-bold hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'High Risk', value: highCount, color: 'bg-red-500', bg: 'bg-red-50 border-red-200' },
          { label: 'Medium Risk', value: medCount, color: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200' },
          { label: 'Total Flagged', value: flaggedOrders.length, color: 'bg-yellow-500', bg: 'bg-yellow-50 border-yellow-200' },
          { label: 'Total Analysed', value: allOrders.length, color: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Detection Rules Info */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Active Detection Rules
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { icon: '💵', label: 'High value COD (>৳3,000)', sev: 'medium/high' },
            { icon: '🆕', label: 'New account + large order (<3 days)', sev: 'high' },
            { icon: '📱', label: 'Suspicious BD phone patterns', sev: 'high' },
            { icon: '📍', label: 'Repeated cancelled address', sev: 'medium' },
            { icon: '⚡', label: 'Rapid order placement (<30 min)', sev: 'medium' },
            { icon: '🔄', label: 'Multiple failed payments', sev: 'low' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-base">{r.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-700">{r.label}</p>
                <p className="text-[10px] text-gray-400">Severity: {r.sev}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-white border hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'All Flags' : `${f.charAt(0).toUpperCase() + f.slice(1)} Risk`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} className="rounded" />
          Show resolved
        </label>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-bold text-gray-700">No suspicious orders detected</p>
          <p className="text-sm text-gray-400 mt-1">All orders look normal based on current rules</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-bold text-red-700">{filtered.length} suspicious orders require review</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Risk Flags</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(({ order, flags }) => (
                  <FraudOrderRow key={order.id} order={order} flags={flags} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BD-specific Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1.5"><Eye className="w-4 h-4" /> Bangladesh Market Tips</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>COD orders above ৳5,000 should be verified by phone call before shipping</li>
          <li>New Dhaka addresses with no landmark detail are higher risk</li>
          <li>Orders placed between 1AM-4AM have higher fraud rates</li>
          <li>Phone numbers starting with 015, 016, 018, 019 are Bangladeshi mobile — always verify 011 numbers</li>
          <li>Grameenphone (017/013), Robi (018/016), Banglalink (019/014), Airtel (016), Teletalk (015)</li>
        </ul>
      </div>
    </div>
  );
}
