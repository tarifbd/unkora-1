'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, DollarSign, X, ArrowRightCircle,
  MessageSquare, CheckCircle, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { preordersApi, PreorderOrderStatus, PreorderOrder } from '@/lib/api/preorders';

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  WAITING_FOR_STOCK: 'bg-orange-100 text-orange-800',
  READY_TO_FULFILL: 'bg-green-100 text-green-800',
  CONVERTED_TO_ORDER: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
};

const EVENT_COLORS: Record<string, string> = {
  CREATED: 'bg-gray-400',
  PAYMENT_RECEIVED: 'bg-green-500',
  CONFIRMED: 'bg-blue-500',
  STOCK_AVAILABLE: 'bg-orange-500',
  READY_TO_FULFILL: 'bg-emerald-500',
  CONVERTED_TO_ORDER: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
  REFUNDED: 'bg-gray-500',
  STATUS_CHANGED: 'bg-indigo-400',
  ADMIN_NOTE_ADDED: 'bg-yellow-500',
  CUSTOMER_NOTIFIED: 'bg-teal-400',
  default: 'bg-gray-400',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  );
}

export default function PreorderOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [noteText, setNoteText] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [newStatus, setNewStatus] = useState<PreorderOrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['preorder-order', id],
    queryFn: () => preordersApi.getOrder(id),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['preorder-order', id] });

  const noteMut = useMutation({
    mutationFn: () => preordersApi.addNote(id, noteText),
    onSuccess: () => { invalidate(); setNoteText(''); toast.success('Note added'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const paymentMut = useMutation({
    mutationFn: () => preordersApi.recordPayment(id, Number(paymentAmount)),
    onSuccess: () => { invalidate(); setPaymentAmount(''); toast.success('Payment recorded'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: () => preordersApi.updateOrderStatus(id, newStatus as PreorderOrderStatus, statusNote || undefined),
    onSuccess: () => { invalidate(); setNewStatus(''); setStatusNote(''); toast.success('Status updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: () => preordersApi.adminCancelOrder(id, cancelReason || 'Cancelled by admin'),
    onSuccess: () => { invalidate(); setCancelReason(''); toast.success('Order cancelled'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMut = useMutation({
    mutationFn: () => preordersApi.convertToOrder(id),
    onSuccess: (data) => {
      invalidate();
      if (data.alreadyConverted) {
        toast.info('Already converted to an order');
      } else {
        toast.success(`Converted! Order: ${data.orderNumber}`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!order) return <div className="p-6 text-red-500 flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Order not found</div>;

  const terminal = ['CONVERTED_TO_ORDER', 'CANCELLED', 'REFUNDED', 'COMPLETED'].includes(order.preorderStatus);
  const availableStatuses: PreorderOrderStatus[] = [
    'CONFIRMED', 'WAITING_FOR_STOCK', 'READY_TO_FULFILL', 'COMPLETED', 'REFUNDED',
  ].filter(s => s !== order.preorderStatus) as PreorderOrderStatus[];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{order.preorderNumber}</h1>
            <p className="text-sm text-gray-500">{order.config?.product?.name}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[order.preorderStatus] ?? 'bg-gray-100 text-gray-700'}`}>
          {order.preorderStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order details */}
          <Section title="Order Details">
            <Row label="Product" value={order.config?.product?.name} />
            <Row label="Quantity" value={order.quantity} />
            <Row label="Unit Price" value={`৳${Number(order.unitPrice).toLocaleString()}`} />
            <Row label="Total" value={<span className="font-bold text-orange-600">৳{Number(order.totalAmount).toLocaleString()}</span>} />
            <Row label="Prepayment" value={`৳${Number(order.prepaymentAmount).toLocaleString()}`} />
            <Row label="Remaining" value={`৳${Number(order.remainingAmount).toLocaleString()}`} />
            <Row label="Payment Status" value={
              <span className={`font-medium ${
                order.paymentStatus === 'PAID' ? 'text-green-600' :
                order.paymentStatus === 'PARTIALLY_PAID' ? 'text-yellow-600' : 'text-red-500'
              }`}>{order.paymentStatus.replace(/_/g, ' ')}</span>
            } />
            {order.expectedDeliveryDate && (
              <Row label="Expected Delivery" value={new Date(order.expectedDeliveryDate).toLocaleDateString()} />
            )}
            {order.orderId && (
              <Row label="Converted Order" value={
                <Link href={`/admin/orders/${order.orderId}`} className="text-blue-500 hover:underline text-xs">
                  View order →
                </Link>
              } />
            )}
          </Section>

          {/* Customer */}
          <Section title="Customer">
            <Row label="Name" value={order.customerName} />
            {order.customerEmail && <Row label="Email" value={order.customerEmail} />}
            <Row label="Phone" value={order.customerPhone} />
            {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
                <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  {Object.entries(order.shippingAddress).map(([k, v]) => (
                    <span key={k} className="mr-2">{v}</span>
                  ))}
                </div>
              </div>
            )}
            {order.note && <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300">{order.note}</div>}
          </Section>

          {/* Event timeline */}
          <Section title="Timeline">
            {(order.events?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400">No events yet</p>
            ) : (
              <div className="space-y-4">
                {order.events!.map(ev => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${EVENT_COLORS[ev.eventType] ?? EVENT_COLORS.default}`} />
                      <div className="flex-1 w-px bg-gray-100 dark:bg-gray-700 mt-1" />
                    </div>
                    <div className="pb-4 min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{ev.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.createdAt).toLocaleString()}
                        {ev.createdBy && ` · by ${ev.createdBy}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column — actions */}
        <div className="space-y-4">
          {/* Record payment */}
          {!terminal && order.paymentStatus !== 'PAID' && (
            <Section title="Record Payment">
              <input
                type="number"
                step="0.01"
                min={0.01}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="Amount (৳)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white mb-2"
              />
              <button
                onClick={() => paymentMut.mutate()}
                disabled={paymentMut.isPending || !paymentAmount}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {paymentMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                Record Payment
              </button>
            </Section>
          )}

          {/* Change status */}
          {!terminal && (
            <Section title="Change Status">
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as PreorderOrderStatus)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white mb-2"
              >
                <option value="">Select status...</option>
                {availableStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <input
                type="text"
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white mb-2"
              />
              <button
                onClick={() => statusMut.mutate()}
                disabled={statusMut.isPending || !newStatus}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {statusMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Update Status
              </button>
            </Section>
          )}

          {/* Convert to order */}
          {!order.orderId && !terminal && (
            <Section title="Convert to Order">
              <p className="text-xs text-gray-500 mb-3">Creates a regular order and deducts stock. Idempotent — safe to run twice.</p>
              <button
                onClick={() => {
                  if (confirm('Convert this preorder to a regular order?')) convertMut.mutate();
                }}
                disabled={convertMut.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
              >
                {convertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightCircle className="h-4 w-4" />}
                Convert to Order
              </button>
            </Section>
          )}

          {/* Add note */}
          <Section title="Add Note">
            <textarea
              rows={3}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Internal note..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white mb-2"
            />
            <button
              onClick={() => noteMut.mutate()}
              disabled={noteMut.isPending || !noteText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
            >
              {noteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              Add Note
            </button>
          </Section>

          {/* Cancel */}
          {!terminal && (
            <Section title="Cancel Order">
              <input
                type="text"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white mb-2"
              />
              <button
                onClick={() => {
                  if (confirm('Cancel this preorder?')) cancelMut.mutate();
                }}
                disabled={cancelMut.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {cancelMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Cancel Order
              </button>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
