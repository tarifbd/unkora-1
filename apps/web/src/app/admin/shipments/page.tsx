'use client';

import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, X, Loader2, ExternalLink, ChevronDown } from 'lucide-react';
import { shipmentsApi, type Shipment } from '@/lib/api/shipments';

const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'Sundarban', 'SA Paribahan', 'Other'];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700' },
  PICKED_UP:        { label: 'Picked Up',        color: 'bg-blue-100 text-blue-700' },
  IN_TRANSIT:       { label: 'In Transit',       color: 'bg-purple-100 text-purple-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
  DELIVERED:        { label: 'Delivered',        color: 'bg-green-100 text-green-700' },
  FAILED:           { label: 'Failed',           color: 'bg-destructive/10 text-destructive' },
  RETURNED:         { label: 'Returned',         color: 'bg-muted text-muted-foreground' },
};

const STATUS_FLOW = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

interface CreateForm {
  orderId: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedAt: string;
  notes: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

export default function AdminShipmentsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    orderId: '',
    courier: 'Pathao',
    trackingNumber: '',
    trackingUrl: '',
    estimatedAt: '',
    notes: '',
  });
  const [createError, setCreateError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newTracking, setNewTracking] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shipments'],
    queryFn: () => shipmentsApi.getAll(1, 50),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      shipmentsApi.create({
        orderId: form.orderId.trim(),
        courier: form.courier,
        trackingNumber: form.trackingNumber || undefined,
        trackingUrl: form.trackingUrl || undefined,
        estimatedAt: form.estimatedAt || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-shipments'] });
      setShowCreate(false);
      setForm({ orderId: '', courier: 'Pathao', trackingNumber: '', trackingUrl: '', estimatedAt: '', notes: '' });
      setCreateError('');
    },
    onError: (e: ApiError) =>
      setCreateError(e.response?.data?.message ?? 'Failed to create shipment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: { status?: string; trackingNumber?: string } }) =>
      shipmentsApi.update(id, updateData),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-shipments'] });
      setUpdatingId(null);
    },
  });

  const shipments: Shipment[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const inputCls =
    'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Shipments</h1>
        <button
          onClick={() => {
            setShowCreate(s => !s);
            setCreateError('');
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? 'Cancel' : 'New Shipment'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4" /> Create Shipment
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Order ID <span className="text-destructive">*</span>
              </label>
              <input
                value={form.orderId}
                onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                placeholder="Paste order ID"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Courier <span className="text-destructive">*</span>
              </label>
              <select
                value={form.courier}
                onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}
                className={inputCls}
              >
                {COURIERS.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tracking Number</label>
              <input
                value={form.trackingNumber}
                onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                placeholder="e.g. PTH-123456"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tracking URL</label>
              <input
                value={form.trackingUrl}
                onChange={e => setForm(f => ({ ...f, trackingUrl: e.target.value }))}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estimated Delivery</label>
              <input
                type="datetime-local"
                value={form.estimatedAt}
                onChange={e => setForm(f => ({ ...f, estimatedAt: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className={inputCls}
              />
            </div>
            {createError && <p className="sm:col-span-2 text-xs text-destructive">{createError}</p>}
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!form.orderId.trim()) {
                    setCreateError('Order ID is required');
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Truck className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold">No shipments yet</p>
          <p className="text-sm text-muted-foreground">Create a shipment for a placed order</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order / Customer</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Courier
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Tracking
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map(shipment => (
                <Fragment key={shipment.id}>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-muted-foreground">{shipment.orderId.slice(-8)}</p>
                      {shipment.order?.user && (
                        <p className="text-sm font-medium">
                          {shipment.order.user.firstName} {shipment.order.user.lastName}
                        </p>
                      )}
                      {shipment.order?.address && (
                        <p className="text-xs text-muted-foreground">
                          {shipment.order.address.city}, {shipment.order.address.district}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell font-medium">{shipment.courier}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {shipment.trackingNumber ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{shipment.trackingNumber}</span>
                          {shipment.trackingUrl && (
                            <a
                              href={shipment.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setUpdatingId(updatingId === shipment.id ? null : shipment.id);
                          setNewStatus(shipment.status);
                          setNewTracking(shipment.trackingNumber ?? '');
                        }}
                        className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors ml-auto"
                      >
                        Update <ChevronDown className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                  {updatingId === shipment.id && (
                    <tr key={`${shipment.id}-update`}>
                      <td colSpan={5} className="px-4 pb-3">
                        <div className="mt-2 rounded-lg border bg-muted/20 p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">New Status</label>
                              <select
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value)}
                                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                {STATUS_FLOW.map(s => (
                                  <option key={s} value={s}>
                                    {STATUS_LABELS[s]?.label ?? s}
                                  </option>
                                ))}
                                <option value="FAILED">Failed</option>
                                <option value="RETURNED">Returned</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Tracking Number</label>
                              <input
                                value={newTracking}
                                onChange={e => setNewTracking(e.target.value)}
                                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setUpdatingId(null)}
                              className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  id: shipment.id,
                                  data: {
                                    status: newStatus,
                                    trackingNumber: newTracking || undefined,
                                  },
                                })
                              }
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
