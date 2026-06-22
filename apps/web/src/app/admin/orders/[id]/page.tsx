'use client';

import { use, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Package, User, MapPin, CreditCard, Clock, Sparkles, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { ordersApi, type Order } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

function AiRiskCard({ order }: { order: Order }) {
  const [risk, setRisk] = useState<{ level: 'LOW' | 'MEDIUM' | 'HIGH'; summary: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    const prompt = `You are an eCommerce fraud and risk analyst for UNKORA, a Bangladeshi online store.
Analyze this order and return ONLY a JSON object with keys "level" (LOW/MEDIUM/HIGH) and "summary" (1-2 sentences max, plain text, no markdown).

Order data:
- Order #: ${order.orderNumber}
- Total: ৳${order.total}
- Payment method: ${order.paymentMethod}
- Payment status: ${order.paymentStatus}
- Items: ${order.items?.length ?? 0}
- Customer: ${order.user ? 'registered user' : 'guest'}
- Shipping city: ${order.shippingAddress?.city ?? 'unknown'}

Return ONLY valid JSON. Example: {"level":"LOW","summary":"Payment confirmed, no risk indicators."}`;

    try {
      const { data } = await api.post('/admin/ai/generate/custom', { prompt, outputFormat: 'json' });
      const raw = data?.data?.generatedContent ?? data?.data?.content ?? '{}';
      const cleaned = String(raw).replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setRisk({ level: parsed.level ?? 'MEDIUM', summary: parsed.summary ?? 'Risk assessment complete.' });
    } catch {
      setRisk({ level: 'MEDIUM', summary: 'Could not complete AI risk assessment. Check AI provider configuration.' });
    } finally {
      setLoading(false);
    }
  }, [order]);

  const icon = risk?.level === 'LOW' ? ShieldCheck : risk?.level === 'HIGH' ? ShieldX : ShieldAlert;
  const Icon = icon;
  const color = risk?.level === 'LOW' ? 'text-green-600 bg-green-50 border-green-200' : risk?.level === 'HIGH' ? 'text-red-600 bg-red-50 border-red-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200';

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">AI Risk Score</h2>
        </div>
        {!risk && (
          <button onClick={() => void analyze()} disabled={loading}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        )}
      </div>
      {risk ? (
        <div className={`flex items-start gap-3 rounded-lg border p-3 ${color}`}>
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">{risk.level} RISK</p>
            <p className="text-xs mt-0.5 opacity-80">{risk.summary}</p>
            <button onClick={() => setRisk(null)} className="text-[10px] underline mt-1 opacity-60">Re-analyze</button>
          </div>
        </div>
      ) : !loading ? (
        <p className="text-xs text-muted-foreground">Click Analyze to get an AI-powered fraud and risk assessment for this order.</p>
      ) : null}
    </div>
  );
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['admin-order-detail', id],
    queryFn: () => ordersApi.adminGetById(id),
    select: data => {
      if (!selectedStatus) setSelectedStatus(data.status);
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: () => ordersApi.adminUpdateStatus(id, selectedStatus, statusNote || undefined),
    onSuccess: updated => {
      qc.setQueryData(['admin-order-detail', id], updated);
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setStatusNote('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Order not found.</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] ?? 'bg-muted'}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Status Update */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">Update Status</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">New Status</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Note (optional)</label>
            <input
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder="e.g. Dispatched via Pathao"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => updateStatus.mutate()}
            disabled={updateStatus.isPending || selectedStatus === order.status}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {updateStatus.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Update Status
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Items + Summary */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="border-b bg-muted/30 px-5 py-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Order Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/20">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Unit Price</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items?.map(item => {
                  const img = item.product?.images?.[0]?.url;
                  const name = item.product?.name ?? item.productName;
                  return (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted border">
                              <Image src={img} alt={name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="h-12 w-10 flex-shrink-0 rounded-md bg-muted flex items-center justify-center text-lg">
                              📦
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{name}</p>
                            {item.product?.bookDetail?.author && (
                              <p className="text-xs text-muted-foreground">{item.product.bookDetail.author}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(Number(item.price))}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(Number(order.shippingCost))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Order Timeline</h2>
              </div>
              <ol className="relative ml-2 border-l border-muted">
                {order.timeline.map((event, i) => (
                  <li key={i} className="mb-4 ml-4">
                    <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[event.status] ?? 'bg-muted'}`}>
                          {event.status.replace(/_/g, ' ')}
                        </span>
                        {event.note && <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>}
                      </div>
                      <p className="flex-shrink-0 text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right column: Customer, Address, Payment */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Customer</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : order.customer?.name ?? '—'}
              </p>
              <p className="text-muted-foreground">{order.user?.email ?? order.customer?.email ?? '—'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Shipping Address</h2>
            </div>
            {addr ? (
              <address className="text-sm not-italic space-y-0.5 text-muted-foreground">
                {addr.name && <p className="font-medium text-foreground">{addr.name}</p>}
                {addr.phone && <p>{addr.phone}</p>}
                {addr.street && <p>{addr.street}</p>}
                {addr.area && <p>{addr.area}</p>}
                <p>
                  {[addr.city, addr.district, addr.state].filter(Boolean).join(', ')}
                  {addr.postalCode && ` ${addr.postalCode}`}
                </p>
                {addr.country && <p>{addr.country}</p>}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">No address info</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Payment</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus] ?? 'bg-muted'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* AI Risk Scoring */}
          <AiRiskCard order={order} />

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
