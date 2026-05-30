'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, Tag, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { couponsApi, type Coupon } from '@/lib/api/coupons';
import { formatCurrency } from '@/lib/utils';

interface CouponForm {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
}

const defaultForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderValue: '',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
};

interface EditCouponForm {
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
}

function EditCouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<EditCouponForm>({
    description: coupon.description ?? '',
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
    maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
    usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
    expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
    isActive: coupon.isActive,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const editMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(`/coupons/admin/${coupon.id}`, data).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon updated successfully');
      onClose();
    },
    onError: () => setFormError('Failed to update coupon. Please check your inputs.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }
    const payload: Record<string, unknown> = {
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      isActive: form.isActive,
    };
    if (form.description !== undefined) payload.description = form.description;
    if (form.minOrderValue) payload.minOrderValue = Number(form.minOrderValue);
    if (form.maxDiscount) payload.maxDiscount = Number(form.maxDiscount);
    if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
    editMutation.mutate(payload);
  };

  const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
          <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Edit Coupon: {coupon.code}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional description"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Discount Type <span className="text-destructive">*</span></label>
            <select
              value={form.discountType}
              onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))}
              className={inputCls}
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (৳)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Discount Value <span className="text-destructive">*</span>
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                {form.discountType === 'PERCENTAGE' ? '(%)' : '(৳)'}
              </span>
            </label>
            <input
              type="number"
              min="0"
              step={form.discountType === 'PERCENTAGE' ? '1' : '0.01'}
              max={form.discountType === 'PERCENTAGE' ? '100' : undefined}
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Min Order Value <span className="text-muted-foreground text-xs font-normal">(optional ৳)</span></label>
            <input
              type="number"
              min="0"
              value={form.minOrderValue}
              onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
              placeholder="e.g. 500"
              className={inputCls}
            />
          </div>

          {form.discountType === 'PERCENTAGE' && (
            <div>
              <label className="mb-1 block text-sm font-medium">Max Discount <span className="text-muted-foreground text-xs font-normal">(optional ৳)</span></label>
              <input
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                placeholder="e.g. 200"
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Usage Limit <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
            <input
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
              placeholder="Unlimited if blank"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Expires At <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <label className="text-sm font-medium">Active</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs text-muted-foreground">{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>

          {formError && (
            <div className="sm:col-span-2">
              <p className="text-xs text-destructive">{formError}</p>
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CouponForm>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: () => couponsApi.adminGetAll() as Promise<Coupon[]>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => couponsApi.adminCreate(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false);
      setForm(defaultForm);
      setFormError(null);
    },
    onError: () => setFormError('Failed to create coupon. Please check your inputs.'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => couponsApi.adminToggle(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.adminDelete(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.code.trim()) { setFormError('Coupon code is required.'); return; }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setFormError('Discount value must be greater than 0.'); return; }

    const payload: Record<string, unknown> = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: form.discountValue,
    };
    if (form.description) payload.description = form.description;
    if (form.minOrderValue) payload.minOrderValue = form.minOrderValue;
    if (form.maxDiscount) payload.maxDiscount = form.maxDiscount;
    if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();

    createMutation.mutate(payload);
  };

  const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}%`;
    return formatCurrency(Number(coupon.discountValue));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Coupons</h1>
        <button
          onClick={() => { setShowForm(s => !s); setFormError(null); if (showForm) setForm(defaultForm); }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Tag className="h-4 w-4" /> Create New Coupon
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Code <span className="text-destructive">*</span></label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Discount Type <span className="text-destructive">*</span></label>
              <select
                value={form.discountType}
                onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' }))}
                className={inputCls}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Discount Value <span className="text-destructive">*</span>
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  {form.discountType === 'PERCENTAGE' ? '(%)' : '(৳)'}
                </span>
              </label>
              <input
                type="number"
                min="0"
                step={form.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                max={form.discountType === 'PERCENTAGE' ? '100' : undefined}
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'PERCENTAGE' ? '20' : '100'}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Min Order Value <span className="text-muted-foreground text-xs font-normal">(optional ৳)</span></label>
              <input
                type="number"
                min="0"
                value={form.minOrderValue}
                onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))}
                placeholder="e.g. 500"
                className={inputCls}
              />
            </div>

            {form.discountType === 'PERCENTAGE' && (
              <div>
                <label className="mb-1 block text-sm font-medium">Max Discount <span className="text-muted-foreground text-xs font-normal">(optional ৳)</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                  placeholder="e.g. 200"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Usage Limit <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
              <input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                placeholder="Unlimited if blank"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Expires At <span className="text-muted-foreground text-xs font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className={inputCls}
              />
            </div>

            {formError && (
              <div className="sm:col-span-2">
                <p className="text-xs text-destructive">{formError}</p>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(defaultForm); setFormError(null); }}
                className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !coupons || coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Tag className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold">No coupons yet</p>
          <p className="text-sm text-muted-foreground">Create your first coupon to offer discounts</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Discount</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Min Order</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Usage</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono font-semibold text-brand-600">{coupon.code}</p>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{coupon.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="font-medium">{formatDiscount(coupon)}</span>
                    {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscount && (
                      <p className="text-xs text-muted-foreground">max {formatCurrency(Number(coupon.maxDiscount))}</p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell text-muted-foreground">
                    {coupon.minOrderValue ? formatCurrency(Number(coupon.minOrderValue)) : '—'}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell text-muted-foreground">
                    {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / ∞'}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell text-muted-foreground">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleMutation.mutate(coupon.id)}
                        disabled={toggleMutation.isPending}
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete coupon "${coupon.code}"?`)) {
                            deleteMutation.mutate(coupon.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
