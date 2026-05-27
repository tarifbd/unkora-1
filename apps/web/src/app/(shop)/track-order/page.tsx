'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { useLanguage } from '@/lib/i18n/language-context';
import Link from 'next/link';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_LABELS: Record<string, { en: string; bn: string; icon: any; color: string }> = {
  PENDING:           { en: 'Order Placed',      bn: 'অর্ডার হয়েছে',      icon: Clock,        color: 'text-yellow-500' },
  CONFIRMED:         { en: 'Confirmed',          bn: 'নিশ্চিত হয়েছে',     icon: CheckCircle,  color: 'text-blue-500' },
  PROCESSING:        { en: 'Processing',         bn: 'প্রক্রিয়াধীন',      icon: Package,      color: 'text-purple-500' },
  SHIPPED:           { en: 'Shipped',            bn: 'পাঠানো হয়েছে',      icon: Truck,        color: 'text-indigo-500' },
  OUT_FOR_DELIVERY:  { en: 'Out for Delivery',   bn: 'ডেলিভারিতে',         icon: Truck,        color: 'text-orange-500' },
  DELIVERED:         { en: 'Delivered',          bn: 'ডেলিভারি হয়েছে',    icon: CheckCircle,  color: 'text-green-500' },
  CANCELLED:         { en: 'Cancelled',          bn: 'বাতিল',              icon: XCircle,      color: 'text-red-500' },
  REFUNDED:          { en: 'Refunded',           bn: 'ফেরত দেওয়া হয়েছে', icon: AlertTriangle, color: 'text-gray-500' },
};

export default function TrackOrderPage() {
  const { lang } = useLanguage();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const result = await ordersApi.trackPublic(orderNumber.trim(), phone.trim());
      setOrder(result);
    } catch {
      setError(lang === 'bn' ? 'অর্ডার পাওয়া যায়নি। অর্ডার নম্বর ও ফোন নম্বর চেক করুন।' : 'Order not found. Please check your order number and phone number.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const statusMeta = order ? STATUS_LABELS[order.status] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-1">
        {lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {lang === 'bn' ? 'আপনার অর্ডার নম্বর ও ফোন নম্বর দিয়ে ট্র্যাক করুন।' : 'Enter your order number and phone number to track your order.'}
      </p>

      <form onSubmit={handleTrack} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            {lang === 'bn' ? 'অর্ডার নম্বর' : 'Order Number'}
          </label>
          <input
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            placeholder="UNK-250527-XXXXX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            {lang === 'bn' ? 'ফোন নম্বর (অর্ডারের সময় দেওয়া)' : 'Phone Number (used during checkout)'}
          </label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Search className="w-4 h-4" />
          {loading ? (lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...') : (lang === 'bn' ? 'ট্র্যাক করুন' : 'Track Order')}
        </button>
      </form>

      {order && (
        <div className="space-y-4">
          {/* Status header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{lang === 'bn' ? 'অর্ডার নম্বর' : 'Order Number'}</p>
                <p className="font-black text-gray-900 font-mono">{order.orderNumber}</p>
              </div>
              {statusMeta && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 font-bold text-sm ${statusMeta.color}`}>
                  <statusMeta.icon className="w-4 h-4" />
                  {lang === 'bn' ? statusMeta.bn : statusMeta.en}
                </div>
              )}
            </div>

            {/* Progress bar — only for active statuses */}
            {currentStep >= 0 && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <div className="mt-4">
                <div className="flex items-center gap-0">
                  {STATUS_STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black transition-all ${
                          done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                        } ${active ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`}>
                          {i + 1}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-0.5 ${i < currentStep ? 'bg-primary' : 'bg-gray-100'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  {STATUS_STEPS.map((step, i) => (
                    <span key={step} className={`text-[8px] font-bold text-center flex-1 ${i <= currentStep ? 'text-primary' : 'text-gray-300'}`}>
                      {lang === 'bn' ? STATUS_LABELS[step]?.bn : STATUS_LABELS[step]?.en}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {order.timeline?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4">{lang === 'bn' ? 'অর্ডারের ইতিহাস' : 'Order Timeline'}</h3>
              <div className="space-y-3">
                {[...order.timeline].reverse().map((t: any, i: number) => {
                  const meta = STATUS_LABELS[t.status];
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      {meta && <meta.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${meta.color}`} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{lang === 'bn' ? meta?.bn : meta?.en}</p>
                        {t.note && <p className="text-xs text-gray-500">{t.note}</p>}
                        <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleString('en-BD')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          {order.items?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4">{lang === 'bn' ? 'অর্ডার আইটেম' : 'Order Items'}</h3>
              <div className="space-y-2">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover bg-gray-50" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl">📚</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-black text-primary">৳{(Number(item.unitPrice) * item.quantity).toLocaleString('en-BD')}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-1">
                <span className="text-sm font-bold text-gray-600">{lang === 'bn' ? 'মোট' : 'Total'}</span>
                <span className="text-base font-black text-primary">৳{Number(order.total).toLocaleString('en-BD')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        {lang === 'bn' ? 'সাহায্যের জন্য ' : 'Need help? '}
        <Link href="/support" className="text-primary font-bold hover:underline">
          {lang === 'bn' ? 'সাপোর্টে যোগাযোগ করুন' : 'Contact Support'}
        </Link>
      </p>
    </div>
  );
}
