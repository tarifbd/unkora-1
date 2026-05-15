'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, Truck, ExternalLink } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { shipmentsApi, type Shipment } from '@/lib/api/shipments';
import { formatCurrency } from '@/lib/utils';

const SHIPMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700' },
  PICKED_UP:        { label: 'Picked Up',        color: 'bg-blue-100 text-blue-700' },
  IN_TRANSIT:       { label: 'In Transit',       color: 'bg-purple-100 text-purple-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
  DELIVERED:        { label: 'Delivered',        color: 'bg-green-100 text-green-700' },
  FAILED:           { label: 'Failed',           color: 'bg-red-100 text-red-700' },
  RETURNED:         { label: 'Returned',         color: 'bg-muted text-muted-foreground' },
};

const SHIPMENT_STATUS_FLOW = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function ShipmentTracker({ orderId }: { orderId: string }) {
  const { data: shipment, isLoading } = useQuery<Shipment | null>({
    queryKey: ['shipment', orderId],
    queryFn: () => shipmentsApi.getMyShipment(orderId).catch(() => null),
    retry: false,
  });

  if (isLoading) return null;
  if (!shipment) return null;

  const currentIndex = SHIPMENT_STATUS_FLOW.indexOf(shipment.status);
  const statusInfo = SHIPMENT_STATUS_LABELS[shipment.status] ?? { label: shipment.status, color: 'bg-muted text-muted-foreground' };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b font-semibold text-sm">
        <Truck className="h-4 w-4" /> Shipment Tracking
      </div>
      <div className="p-4 space-y-4">
        {/* Courier + tracking */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">{shipment.courier}</span>
          {shipment.trackingNumber && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              {shipment.trackingNumber}
              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Status timeline */}
        {!['FAILED', 'RETURNED'].includes(shipment.status) && (
          <div className="flex items-center gap-0">
            {SHIPMENT_STATUS_FLOW.map((step, i) => {
              const done = i <= currentIndex;
              const isLast = i === SHIPMENT_STATUS_FLOW.length - 1;
              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full border-2 ${
                        done ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-background'
                      }`}
                    />
                    <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
                      {SHIPMENT_STATUS_LABELS[step]?.label ?? step}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 ${i < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Estimated delivery */}
        {shipment.estimatedAt && !shipment.deliveredAt && (
          <p className="text-xs text-muted-foreground">
            Estimated delivery:{' '}
            <span className="font-medium text-foreground">
              {new Date(shipment.estimatedAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })}
            </span>
          </p>
        )}
        {shipment.deliveredAt && (
          <p className="text-xs text-muted-foreground">
            Delivered on:{' '}
            <span className="font-medium text-green-600">
              {new Date(shipment.deliveredAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
  });

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  );

  if (!order) return <div className="text-center text-muted-foreground py-12">Order not found</div>;

  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-BD', { dateStyle: 'long' })}</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-muted'}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b font-semibold text-sm">
          <Package className="h-4 w-4" /> Order Items
        </div>
        <div className="divide-y">
          {order.items?.map((item: { id: string; product?: { images?: Array<{ url: string }>; slug?: string; bookDetail?: { author?: string }; name?: string }; productName?: string; quantity: number; price: string }) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {item.product?.images?.[0] ? (
                  <Image src={item.product.images[0].url} alt={item.productName ?? ''} fill className="object-cover" />
                ) : <div className="flex h-full items-center justify-center text-xl">📦</div>}
              </div>
              <div className="flex flex-1 justify-between">
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  {item.product?.bookDetail?.author && (
                    <p className="text-xs text-muted-foreground">by {item.product.bookDetail.author}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">{formatCurrency(Number(item.price) * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 p-4 border-t text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span><span>{Number(order.shippingCost) === 0 ? 'Free' : formatCurrency(Number(order.shippingCost))}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span><span className="text-brand-600">{formatCurrency(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <ShipmentTracker orderId={id} />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Shipping Address */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-sm">
            <MapPin className="h-4 w-4" /> Shipping Address
          </div>
          {order.shippingAddress && (
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.district}</p>
              <p>{order.shippingAddress.division}</p>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-sm">
            <CreditCard className="h-4 w-4" /> Payment
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{order.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {canCancel && (
        <div className="flex justify-end">
          <button onClick={() => cancel.mutate()} disabled={cancel.isPending}
            className="flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors">
            {cancel.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Cancel Order
          </button>
        </div>
      )}
    </div>
  );
}
