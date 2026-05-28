'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { preordersApi, PrepaymentType, PreorderConfigStatus } from '@/lib/api/preorders';

export default function EditPreorderConfigPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: config, isLoading } = useQuery({
    queryKey: ['preorder-config', id],
    queryFn: () => preordersApi.getConfig(id),
  });

  const [form, setForm] = useState({
    isEnabled: true,
    preorderTitle: '',
    preorderDescription: '',
    expectedReleaseDate: '',
    expectedDeliveryStart: '',
    expectedDeliveryEnd: '',
    preorderStartDate: '',
    preorderEndDate: '',
    stockLimit: '',
    maxQtyPerCustomer: '',
    prepaymentRequired: false,
    prepaymentType: 'NONE' as PrepaymentType,
    prepaymentAmount: '',
    preorderPrice: '',
    allowCancellation: true,
    cancellationDeadline: '',
    autoConvertToOrder: false,
    status: 'DRAFT' as PreorderConfigStatus,
  });

  useEffect(() => {
    if (!config) return;
    setForm({
      isEnabled: config.isEnabled,
      preorderTitle: config.preorderTitle ?? '',
      preorderDescription: config.preorderDescription ?? '',
      expectedReleaseDate: config.expectedReleaseDate?.split('T')[0] ?? '',
      expectedDeliveryStart: config.expectedDeliveryStart?.split('T')[0] ?? '',
      expectedDeliveryEnd: config.expectedDeliveryEnd?.split('T')[0] ?? '',
      preorderStartDate: config.preorderStartDate?.split('T')[0] ?? '',
      preorderEndDate: config.preorderEndDate?.split('T')[0] ?? '',
      stockLimit: config.stockLimit?.toString() ?? '',
      maxQtyPerCustomer: config.maxQtyPerCustomer?.toString() ?? '',
      prepaymentRequired: config.prepaymentRequired,
      prepaymentType: config.prepaymentType,
      prepaymentAmount: config.prepaymentAmount?.toString() ?? '',
      preorderPrice: config.preorderPrice?.toString() ?? '',
      allowCancellation: config.allowCancellation,
      cancellationDeadline: config.cancellationDeadline?.split('T')[0] ?? '',
      autoConvertToOrder: config.autoConvertToOrder,
      status: config.status,
    });
  }, [config]);

  const updateMut = useMutation({
    mutationFn: () =>
      preordersApi.updateConfig(id, {
        isEnabled: form.isEnabled,
        preorderTitle: form.preorderTitle || undefined,
        preorderDescription: form.preorderDescription || undefined,
        expectedReleaseDate: form.expectedReleaseDate || undefined,
        expectedDeliveryStart: form.expectedDeliveryStart || undefined,
        expectedDeliveryEnd: form.expectedDeliveryEnd || undefined,
        preorderStartDate: form.preorderStartDate || undefined,
        preorderEndDate: form.preorderEndDate || undefined,
        stockLimit: form.stockLimit ? Number(form.stockLimit) : undefined,
        maxQtyPerCustomer: form.maxQtyPerCustomer ? Number(form.maxQtyPerCustomer) : undefined,
        prepaymentRequired: form.prepaymentRequired,
        prepaymentType: form.prepaymentType,
        prepaymentAmount: form.prepaymentAmount ? Number(form.prepaymentAmount) : undefined,
        preorderPrice: form.preorderPrice ? Number(form.preorderPrice) : undefined,
        allowCancellation: form.allowCancellation,
        cancellationDeadline: form.cancellationDeadline || undefined,
        autoConvertToOrder: form.autoConvertToOrder,
        status: form.status,
      } as Parameters<typeof preordersApi.updateConfig>[1]),
    onSuccess: () => {
      toast.success('Configuration updated');
      router.push('/admin/preorders/configurations');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));
  const check = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.checked }));

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/preorders/configurations" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Configuration</h1>
          <p className="text-sm text-gray-500">{config?.product?.name}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Status & enabled */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={form.status} onChange={f('status')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
              {['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="isEnabled" checked={form.isEnabled} onChange={check('isEnabled')} className="h-4 w-4 rounded text-orange-500" />
            <label htmlFor="isEnabled" className="text-sm text-gray-700 dark:text-gray-300">Enabled</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preorder Title</label>
          <input type="text" value={form.preorderTitle} onChange={f('preorderTitle')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea rows={3} value={form.preorderDescription} onChange={f('preorderDescription')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Preorder Start', 'preorderStartDate'],
            ['Preorder End', 'preorderEndDate'],
            ['Expected Release', 'expectedReleaseDate'],
            ['Delivery Start', 'expectedDeliveryStart'],
            ['Delivery End', 'expectedDeliveryEnd'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <input type="date" value={(form as unknown as Record<string, string>)[key!] ?? ''} onChange={f(key ?? '')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
            </div>
          ))}
        </div>

        {/* Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Limit</label>
            <input type="number" min={1} value={form.stockLimit} onChange={f('stockLimit')} placeholder="Unlimited" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Qty / Customer</label>
            <input type="number" min={1} value={form.maxQtyPerCustomer} onChange={f('maxQtyPerCustomer')} placeholder="No limit" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preorder Price Override</label>
            <input type="number" step="0.01" value={form.preorderPrice} onChange={f('preorderPrice')} placeholder="Use product price" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        {/* Prepayment */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="prepaymentRequired" checked={form.prepaymentRequired} onChange={check('prepaymentRequired')} className="h-4 w-4 rounded text-orange-500" />
            <label htmlFor="prepaymentRequired" className="text-sm font-medium text-gray-700 dark:text-gray-300">Require Prepayment</label>
          </div>
          {form.prepaymentRequired && (
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select value={form.prepaymentType} onChange={f('prepaymentType')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FULL_PAYMENT">Full Payment</option>
                </select>
              </div>
              {form.prepaymentType !== 'FULL_PAYMENT' && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {form.prepaymentType === 'PERCENTAGE' ? '%' : '৳'}
                  </label>
                  <input type="number" value={form.prepaymentAmount} onChange={f('prepaymentAmount')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cancellation */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="allowCancellation" checked={form.allowCancellation} onChange={check('allowCancellation')} className="h-4 w-4 rounded text-orange-500" />
            <label htmlFor="allowCancellation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Customer Cancellation</label>
          </div>
          {form.allowCancellation && (
            <div className="pl-7">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Cancellation Deadline</label>
              <input type="date" value={form.cancellationDeadline} onChange={f('cancellationDeadline')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="autoConvert" checked={form.autoConvertToOrder} onChange={check('autoConvertToOrder')} className="h-4 w-4 rounded text-orange-500" />
          <label htmlFor="autoConvert" className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-convert to order when stock arrives</label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/preorders/configurations" className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </Link>
          <button
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
