'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, ArrowRight, Loader2, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLanguage } from '@/lib/i18n/language-context';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { isAuthenticated } = useAuthStore();
  const { lang } = useLanguage();

  return (
    <div className="max-w-md mx-auto text-center px-4 py-12">
      {/* Animated checkmark */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-24 h-24">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce-once">
            <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2} />
          </div>
          <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-30" />
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2">
        {lang === 'bn' ? 'অর্ডার সফল হয়েছে! 🎉' : 'Order Placed! 🎉'}
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        {lang === 'bn'
          ? 'আপনার অর্ডার পেয়েছি। শীঘ্রই ডেলিভারি দেওয়া হবে।'
          : 'We received your order and will deliver it soon.'}
      </p>

      {/* Next steps */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 text-left space-y-4 mb-6 shadow-sm">
        <h3 className="font-black text-gray-900 text-sm">{lang === 'bn' ? 'পরবর্তী ধাপ' : 'What happens next'}</h3>
        {[
          { icon: Phone,   label: lang === 'bn' ? 'আমরা শীঘ্রই কনফার্ম করার জন্য ফোন করব' : 'We\'ll call to confirm your order shortly' },
          { icon: Package, label: lang === 'bn' ? 'পণ্য প্যাকেজিং ও পাঠানো হবে' : 'Your order will be packed and shipped' },
          { icon: Truck,   label: lang === 'bn' ? 'ডেলিভারি হওয়ার সময় ফোন করা হবে' : 'We\'ll call when your order is out for delivery' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <Link
          href="/track-order"
          className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <Truck className="w-4 h-4" />
          {lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
        </Link>
        <Link
          href="/products"
          className="flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-primary hover:text-primary transition-colors"
        >
          {lang === 'bn' ? 'আরও কেনাকাটা করুন' : 'Continue Shopping'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        {lang === 'bn' ? 'সাহায্যের জন্য: ' : 'Need help? '}
        <a href="tel:+8801911369686" className="text-primary font-bold">+880 1911-369686</a>
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={
        <div className="min-h-[60vh] flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
